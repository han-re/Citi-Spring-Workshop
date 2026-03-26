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

    return MongoClient(uri)["workshop"]["individuals"]

#RETURNS CURRENT UTC TIME AS ISO STRING FOR TIMESTAMPS
def now():
    return datetime.now(timezone.utc).isoformat()

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
    method = event["requestContext"]["http"]["method"]
    path   = event["rawPath"]
    #STRIP /api PREFIX ADDED BY CLOUDFRONT IN PRODUCTION (proxy handles this locally)
    if path.startswith("/api/"):
        path = path[4:]
    params = event.get("queryStringParameters") or {}
    col    = get_db()

    #VERIFY JWT - ALL ENDPOINTS REQUIRE AUTHENTICATION
    role, err = verify_token(event)
    if err:
        return err
    #VIEWERS CAN ONLY READ - BLOCK ALL MUTATIONS
    if method in ("POST", "PUT", "DELETE") and role != "admin":
        return {"statusCode": 403, "body": json.dumps({"error": "Admin access required"})}

    #LIST ALL INDIVIDUALS - SUPPORTS SEARCH, LOCATION AND EMPLOYMENT TYPE FILTERS
    if method == "GET" and path == "/individuals":
        query = {}
        if params.get("search"):
            query["name"] = {"$regex": params["search"], "$options": "i"} #CASE INSENSITIVE NAME SEARCH
        if params.get("location"):
            query["location"] = params["location"]
        if params.get("employment_type"):
            query["employment_type"] = params["employment_type"]
        docs = list(col.find(query))
        for d in docs:
            d["_id"] = str(d["_id"]) #CONVERT OBJECTID TO STRING FOR JSON SERIALISATION
        return {"statusCode": 200, "body": json.dumps(docs)}

    #GET SPECIFIC INDIVIDUAL BY ID
    elif method == "GET" and path.startswith("/individuals/"):
        id_ = path.split("/")[-1] #TAKES LAST PART OF URL AS ID
        doc = col.find_one({"_id": ObjectId(id_)})
        if not doc:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        doc["_id"] = str(doc["_id"])
        return {"statusCode": 200, "body": json.dumps(doc)}

    #CREATE NEW INDIVIDUAL
    elif method == "POST" and path == "/individuals":
        body = json.loads(event.get("body") or "{}")
        #VALIDATE REQUIRED FIELDS
        if not body.get("name"):
            return {"statusCode": 400, "body": json.dumps({"error": "name is required"})}
        if not body.get("location"):
            return {"statusCode": 400, "body": json.dumps({"error": "location is required"})}
        if not body.get("employment_type"):
            return {"statusCode": 400, "body": json.dumps({"error": "employment_type is required"})}
        #ADD TIMESTAMPS
        body["created_at"] = now()
        body["updated_at"] = now()
        result = col.insert_one(body)
        body["_id"] = str(result.inserted_id)
        return {"statusCode": 201, "body": json.dumps(body)}

    #UPDATE EXISTING INDIVIDUAL
    elif method == "PUT" and path.startswith("/individuals/"):
        id_  = path.split("/")[-1]
        body = json.loads(event.get("body") or "{}")
        #VALIDATE FIELDS IF PROVIDED
        if "name" in body and not body["name"]:
            return {"statusCode": 400, "body": json.dumps({"error": "name cannot be empty"})}
        if "location" in body and not body["location"]:
            return {"statusCode": 400, "body": json.dumps({"error": "location cannot be empty"})}
        body["updated_at"] = now() #ALWAYS UPDATE TIMESTAMP ON EDIT
        res = col.update_one({"_id": ObjectId(id_)}, {"$set": body})
        if res.matched_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        return {"statusCode": 200, "body": json.dumps({"updated": id_})}

    #DELETE INDIVIDUAL
    elif method == "DELETE" and path.startswith("/individuals/"):
        id_ = path.split("/")[-1]
        res = col.delete_one({"_id": ObjectId(id_)})
        if res.deleted_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        #CLEAN UP TEAM REFERENCES - REMOVE FROM MEMBERS ARRAY AND CLEAR LEADER IF MATCHED
        teams = col.database["teams"]
        teams.update_many({"members": id_}, {"$pull": {"members": id_}})
        teams.update_many({"leader_id": id_}, {"$set": {"leader_id": ""}})
        return {"statusCode": 204, "body": ""}

    return {"statusCode": 400, "body": json.dumps({"error": "Bad request"})}


if __name__ == "__main__":
    fake_event = {
        "rawPath": "/individuals",
        "requestContext": {"http": {"method": "GET"}},
        "queryStringParameters": {}
    }
    print(handler(fake_event))
