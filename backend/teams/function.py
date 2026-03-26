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
    db     = get_db()
    teams       = db["teams"]
    individuals = db["individuals"] #NEEDED FOR LEADER + MEMBER VALIDATION

    #VERIFY JWT - ALL ENDPOINTS REQUIRE AUTHENTICATION
    role, err = verify_token(event)
    if err:
        return err
    #VIEWERS CAN ONLY READ - BLOCK ALL MUTATIONS
    if method in ("POST", "PUT", "DELETE") and role != "admin":
        return {"statusCode": 403, "body": json.dumps({"error": "Admin access required"})}

    #LIST ALL TEAMS
    if method == "GET" and path == "/teams":
        docs = list(teams.find())
        for d in docs:
            d["_id"] = str(d["_id"])
        return {"statusCode": 200, "body": json.dumps(docs)}

    #GET SPECIFIC TEAM BY ID
    elif method == "GET" and path.startswith("/teams/"):
        id_ = path.split("/")[-1]
        doc = teams.find_one({"_id": ObjectId(id_)})
        if not doc:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        doc["_id"] = str(doc["_id"])
        return {"statusCode": 200, "body": json.dumps(doc)}

    #CREATE NEW TEAM
    elif method == "POST" and path == "/teams":
        body = json.loads(event.get("body") or "{}")
        #VALIDATE REQUIRED FIELDS
        if not body.get("name"):
            return {"statusCode": 400, "body": json.dumps({"error": "name is required"})}
        #VALIDATE LEADER EXISTS IN INDIVIDUALS COLLECTION
        leader_id = body.get("leader_id")
        if not leader_id or not individuals.find_one({"_id": ObjectId(leader_id)}):
            return {"statusCode": 400, "body": json.dumps({"error": "valid leader_id is required"})}
        #AUTO-ADD LEADER TO MEMBERS IF NOT ALREADY INCLUDED
        members = body.get("members", [])
        if leader_id not in members:
            members = [leader_id] + members
        #VALIDATE ALL MEMBERS EXIST
        for m in members:
            if not individuals.find_one({"_id": ObjectId(m)}):
                return {"statusCode": 400, "body": json.dumps({"error": f"member {m} not found"})}
        body["members"] = members
        #ADD TIMESTAMPS
        body["created_at"] = now()
        body["updated_at"] = now()
        result = teams.insert_one(body)
        body["_id"] = str(result.inserted_id)
        return {"statusCode": 201, "body": json.dumps(body)}

    #UPDATE EXISTING TEAM
    elif method == "PUT" and path.startswith("/teams/"):
        id_  = path.split("/")[-1]
        body = json.loads(event.get("body") or "{}")
        #RE-VALIDATE LEADER IF BEING UPDATED
        if "leader_id" in body:
            if not individuals.find_one({"_id": ObjectId(body["leader_id"])}):
                return {"statusCode": 400, "body": json.dumps({"error": "valid leader_id is required"})}
            #KEEP LEADER IN MEMBERS LIST
            members = body.get("members", [])
            if body["leader_id"] not in members:
                body["members"] = [body["leader_id"]] + members
        body["updated_at"] = now()
        res = teams.update_one({"_id": ObjectId(id_)}, {"$set": body})
        if res.matched_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        return {"statusCode": 200, "body": json.dumps({"updated": id_})}

    #DELETE TEAM
    elif method == "DELETE" and path.startswith("/teams/"):
        id_ = path.split("/")[-1]
        res = teams.delete_one({"_id": ObjectId(id_)})
        if res.deleted_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        return {"statusCode": 204, "body": ""}

    return {"statusCode": 400, "body": json.dumps({"error": "Bad request"})}


if __name__ == "__main__":
    fake_event = {
        "rawPath": "/teams",
        "requestContext": {"http": {"method": "GET"}}
    }
    print(handler(fake_event))
