import json
import os
import jwt
from datetime import datetime, timezone
from urllib.parse import quote_plus
from pymongo import MongoClient
from bson import ObjectId

JWT_SECRET = os.environ.get("JWT_SECRET", "workshop-secret-key")

#DB CONNECTION FUNC
def get_db():
    host = os.environ.get("MONGO_HOST", "host.docker.internal")
    port = os.environ.get("MONGO_PORT", "27017")
    is_local = os.environ.get("IS_LOCAL", "true").lower() == "true"

    #LOCAL - NO AUTH REQUIRED
    if is_local:
        uri = f"mongodb://{host}:{port}"
    #CLOUD - AUTH + TLS REQUIRED FOR DOCUMENTDB
    else:
        user = os.environ.get("MONGO_USER", "")
        password = os.environ.get("MONGO_PASS", "")
        uri = f"mongodb://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/?tls=true&tlsAllowInvalidCertificates=true&retryWrites=false"

    return MongoClient(uri)["workshop"] #RETURNS DATABASE - NEEDS MULTIPLE COLLECTIONS

#RETURNS CURRENT UTC TIME AS ISO STRING FOR TIMESTAMPS
def now():
    return datetime.now(timezone.utc).isoformat()

#VALIDATES MONTH IS IN YYYY-MM FORMAT
def valid_month(m):
    return len(m) == 7 and m[4] == "-"

#VERIFY JWT TOKEN FROM AUTHORISATION HEADER - RETURNS (role, None) OR (None, error_response)
def verify_token(event):
    headers = event.get("headers") or {}
    auth = headers.get("authorization") or headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        return None, {"statusCode": 401, "body": json.dumps({"error": "Unauthorised - no token"})}
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("role"), None
    except jwt.ExpiredSignatureError:
        return None, {"statusCode": 401, "body": json.dumps({"error": "Token expired"})}
    except jwt.InvalidTokenError:
        return None, {"statusCode": 401, "body": json.dumps({"error": "Invalid token"})}

#HANDLER FUNCTION - LAMBDA ENTRYPOINT - ROUTES BY HTTP METHOD AND PATH
def handler(event=None, context=None):
    method  = event["requestContext"]["http"]["method"]
    path    = event["rawPath"]
    params  = event.get("queryStringParameters") or {}
    db      = get_db()
    achievements = db["achievements"]
    teams        = db["teams"] #NEEDED FOR TEAM VALIDATION

    #VERIFY JWT - ALL ENDPOINTS REQUIRE AUTHENTICATION
    role, err = verify_token(event)
    if err:
        return err
    #VIEWERS CAN ONLY READ - BLOCK ALL MUTATIONS
    if method in ("POST", "PUT", "DELETE") and role != "admin":
        return {"statusCode": 403, "body": json.dumps({"error": "Admin access required"})}

    #LIST ALL ACHIEVEMENTS - SUPPORTS FILTERING BY TEAM AND MONTH
    if method == "GET" and path == "/achievements":
        query = {}
        if params.get("team_id"):
            query["team_id"] = params["team_id"] #FILTER BY TEAM
        if params.get("month"):
            query["month"] = params["month"] #FILTER BY MONTH
        docs = list(achievements.find(query))
        for d in docs:
            d["_id"] = str(d["_id"])
        return {"statusCode": 200, "body": json.dumps(docs)}

    #GET SPECIFIC ACHIEVEMENT BY ID
    elif method == "GET" and path.startswith("/achievements/"):
        id_ = path.split("/")[-1]
        doc = achievements.find_one({"_id": ObjectId(id_)})
        if not doc:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        doc["_id"] = str(doc["_id"])
        return {"statusCode": 200, "body": json.dumps(doc)}

    #CREATE NEW ACHIEVEMENT
    elif method == "POST" and path == "/achievements":
        body = json.loads(event.get("body") or "{}")
        #VALIDATE REQUIRED FIELDS
        if not body.get("team_id"):
            return {"statusCode": 400, "body": json.dumps({"error": "team_id is required"})}
        #VALIDATE REFERENCED TEAM EXISTS
        if not teams.find_one({"_id": ObjectId(body["team_id"])}):
            return {"statusCode": 400, "body": json.dumps({"error": "team not found"})}
        #VALIDATE MONTH FORMAT
        if not body.get("month") or not valid_month(body["month"]):
            return {"statusCode": 400, "body": json.dumps({"error": "month must be YYYY-MM format"})}
        if not body.get("description"):
            return {"statusCode": 400, "body": json.dumps({"error": "description is required"})}
        #ADD TIMESTAMPS
        body["created_at"] = now()
        body["updated_at"] = now()
        result = achievements.insert_one(body)
        body["_id"] = str(result.inserted_id)
        return {"statusCode": 201, "body": json.dumps(body)}

    #UPDATE EXISTING ACHIEVEMENT
    elif method == "PUT" and path.startswith("/achievements/"):
        id_  = path.split("/")[-1]
        body = json.loads(event.get("body") or "{}")
        #RE-VALIDATE TEAM IF BEING UPDATED
        if "team_id" in body and not teams.find_one({"_id": ObjectId(body["team_id"])}):
            return {"statusCode": 400, "body": json.dumps({"error": "team not found"})}
        #RE-VALIDATE MONTH IF BEING UPDATED
        if "month" in body and not valid_month(body["month"]):
            return {"statusCode": 400, "body": json.dumps({"error": "month must be YYYY-MM format"})}
        body["updated_at"] = now()
        res = achievements.update_one({"_id": ObjectId(id_)}, {"$set": body})
        if res.matched_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        return {"statusCode": 200, "body": json.dumps({"updated": id_})}

    #DELETE ACHIEVEMENT
    elif method == "DELETE" and path.startswith("/achievements/"):
        id_ = path.split("/")[-1]
        res = achievements.delete_one({"_id": ObjectId(id_)})
        if res.deleted_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        return {"statusCode": 204, "body": ""}

    return {"statusCode": 400, "body": json.dumps({"error": "Bad request"})}


if __name__ == "__main__":
    fake_event = {
        "rawPath": "/achievements",
        "requestContext": {"http": {"method": "GET"}},
        "queryStringParameters": {}
    }
    print(handler(fake_event))
