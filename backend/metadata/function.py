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

    return MongoClient(uri)["workshop"]

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
    db     = get_db()
    metadata = db["metadata"]

    #VERIFY JWT - ALL ENDPOINTS REQUIRE AUTHENTICATION
    role, err = verify_token(event)
    if err:
        return err
    #VIEWERS CAN ONLY READ - BLOCK ALL MUTATIONS
    if method in ("POST", "PUT", "DELETE") and role != "admin":
        return {"statusCode": 403, "body": json.dumps({"error": "Admin access required"})}

    #LIST ALL METADATA - GROUPED BY CATEGORY
    if method == "GET" and path == "/metadata":
        docs = list(metadata.find())
        grouped = {}
        for d in docs:
            d["_id"] = str(d["_id"])
            cat = d.get("category", "uncategorised")
            grouped.setdefault(cat, []).append(d) #GROUP ENTRIES UNDER THEIR CATEGORY KEY
        return {"statusCode": 200, "body": json.dumps(grouped)}

    #GET SPECIFIC METADATA ENTRY BY ID
    elif method == "GET" and path.startswith("/metadata/"):
        id_ = path.split("/")[-1]
        doc = metadata.find_one({"_id": ObjectId(id_)})
        if not doc:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        doc["_id"] = str(doc["_id"])
        return {"statusCode": 200, "body": json.dumps(doc)}

    #CREATE NEW METADATA ENTRY
    elif method == "POST" and path == "/metadata":
        body = json.loads(event.get("body") or "{}")
        #VALIDATE ALL REQUIRED FIELDS
        if not body.get("category") or not body.get("key") or not body.get("value"):
            return {"statusCode": 400, "body": json.dumps({"error": "category, key, and value are required"})}
        #ENFORCE UNIQUENESS - CATEGORY + KEY COMBINATION MUST BE UNIQUE
        if metadata.find_one({"category": body["category"], "key": body["key"]}):
            return {"statusCode": 400, "body": json.dumps({"error": "category+key combination already exists"})}
        #ADD TIMESTAMPS
        body["created_at"] = now()
        body["updated_at"] = now()
        result = metadata.insert_one(body)
        body["_id"] = str(result.inserted_id)
        return {"statusCode": 201, "body": json.dumps(body)}

    #UPDATE EXISTING METADATA ENTRY
    elif method == "PUT" and path.startswith("/metadata/"):
        id_  = path.split("/")[-1]
        body = json.loads(event.get("body") or "{}")
        body["updated_at"] = now()
        res  = metadata.update_one({"_id": ObjectId(id_)}, {"$set": body})
        if res.matched_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        return {"statusCode": 200, "body": json.dumps({"updated": id_})}

    #DELETE METADATA ENTRY
    elif method == "DELETE" and path.startswith("/metadata/"):
        id_ = path.split("/")[-1]
        res = metadata.delete_one({"_id": ObjectId(id_)})
        if res.deleted_count == 0:
            return {"statusCode": 404, "body": json.dumps({"error": "Not found"})}
        return {"statusCode": 204, "body": ""}

    return {"statusCode": 400, "body": json.dumps({"error": "Bad request"})}


if __name__ == "__main__":
    fake_event = {
        "rawPath": "/metadata",
        "requestContext": {"http": {"method": "GET"}}
    }
    print(handler(fake_event))
