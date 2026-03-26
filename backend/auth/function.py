import json
import os
import jwt
from datetime import datetime, timezone, timedelta

#HARDCODED USERS - ROLE: admin (full CRUD) OR viewer (read-only)
USERS = {
    "admin":  {"password": "admin123",  "role": "admin"},   # nosec B105
    "viewer": {"password": "viewer123", "role": "viewer"},  # nosec B105
}

JWT_SECRET = os.environ.get("JWT_SECRET", "workshop-secret-key")

#HANDLER FUNCTION - LAMBDA ENTRYPOINT
def handler(event=None, context=None):
    method = event["requestContext"]["http"]["method"]
    path   = event["rawPath"]

    #LOGIN ENDPOINT - POST /auth/login
    if method == "POST" and path == "/auth/login":
        body     = json.loads(event.get("body") or "{}")
        username = body.get("username", "")
        password = body.get("password", "")

        #VALIDATE CREDENTIALS AGAINST HARDCODED USER LIST
        user = USERS.get(username)
        if not user or user["password"] != password:
            return {"statusCode": 401, "body": json.dumps({"error": "Invalid credentials"})}

        #BUILD JWT PAYLOAD - EXPIRES IN 8 HOURS
        payload = {
            "sub":  username,
            "role": user["role"],
            "exp":  datetime.now(timezone.utc) + timedelta(hours=8),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "token":    token,
                "role":     user["role"],
                "username": username,
            })
        }

    return {"statusCode": 400, "body": json.dumps({"error": "Bad request"})}


if __name__ == "__main__":
    fake_event = {
        "rawPath": "/auth/login",
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({"username": "admin", "password": "admin123"}),  # nosec B105
    }
    print(handler(fake_event))
