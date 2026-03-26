import json
import os
import pytest
import jwt
from datetime import datetime, timezone, timedelta
from bson import ObjectId

#POINT TO LOCAL MONGODB BEFORE IMPORTING HANDLER
os.environ.setdefault("MONGO_HOST", "localhost")
os.environ.setdefault("IS_LOCAL", "true")

from function import handler, get_db

JWT_SECRET = "workshop-secret-key"

#TRACK CREATED IDS SO WE CAN CLEAN UP AFTER ALL TESTS RUN
created_ids = []


#HELPER - BUILD A FAKE LAMBDA EVENT
def make_event(method, path, body=None, token=None):
    e = {
        "requestContext": {"http": {"method": method}},
        "rawPath": path,
        "queryStringParameters": {},
        "headers": {"authorization": f"Bearer {token}"} if token else {},
    }
    if body:
        e["body"] = json.dumps(body)
    return e


#HELPER - GENERATE A SIGNED JWT FOR TESTING
def make_token(role="admin"):
    return jwt.encode(
        {"sub": "test", "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        JWT_SECRET,
        algorithm="HS256"
    )


#CLEANUP FIXTURE - RUNS ONCE AFTER ALL TESTS, DELETES ANY RECORDS WE CREATED
@pytest.fixture(autouse=True, scope="session")
def cleanup():
    yield
    col = get_db()
    for id_ in created_ids:
        col.delete_one({"_id": ObjectId(id_)})
    print(f"\nCleaned up {len(created_ids)} test record(s)")


# -----------------------------------------------------------------------
# HAPPY PATH TESTS
# -----------------------------------------------------------------------

def test_create_individual_returns_201():
    res = handler(make_event(
        "POST", "/individuals",
        body={"name": "Alice Test", "location": "London", "employment_type": "full-time"},
        token=make_token("admin")
    ))
    assert res["statusCode"] == 201
    body = json.loads(res["body"])
    assert body["name"] == "Alice Test"
    assert "_id" in body
    created_ids.append(body["_id"])  #TRACK FOR CLEANUP


def test_get_individual_returns_200():
    #CREATE ONE FIRST SO WE HAVE AN ID TO FETCH
    create_res = handler(make_event(
        "POST", "/individuals",
        body={"name": "Bob Test", "location": "Manchester", "employment_type": "contractor"},
        token=make_token("admin")
    ))
    id_ = json.loads(create_res["body"])["_id"]
    created_ids.append(id_)

    res = handler(make_event("GET", f"/individuals/{id_}", token=make_token("admin")))
    assert res["statusCode"] == 200
    assert json.loads(res["body"])["name"] == "Bob Test"


# -----------------------------------------------------------------------
# VALIDATION ERROR TESTS
# -----------------------------------------------------------------------

def test_create_missing_name_returns_400():
    res = handler(make_event(
        "POST", "/individuals",
        body={"location": "London", "employment_type": "full-time"},
        token=make_token("admin")
    ))
    assert res["statusCode"] == 400
    assert "name" in json.loads(res["body"])["error"]


def test_create_missing_location_returns_400():
    res = handler(make_event(
        "POST", "/individuals",
        body={"name": "No Location", "employment_type": "full-time"},
        token=make_token("admin")
    ))
    assert res["statusCode"] == 400
    assert "location" in json.loads(res["body"])["error"]


def test_get_nonexistent_id_returns_404():
    fake_id = str(ObjectId())  #VALID FORMAT BUT DOESN'T EXIST IN DB
    res = handler(make_event("GET", f"/individuals/{fake_id}", token=make_token("admin")))
    assert res["statusCode"] == 404


# -----------------------------------------------------------------------
# AUTH TESTS
# -----------------------------------------------------------------------

def test_no_token_returns_401():
    res = handler(make_event("GET", "/individuals"))  #NO TOKEN
    assert res["statusCode"] == 401


def test_viewer_cannot_create_returns_403():
    res = handler(make_event(
        "POST", "/individuals",
        body={"name": "Blocked", "location": "London", "employment_type": "full-time"},
        token=make_token("viewer")
    ))
    assert res["statusCode"] == 403


def test_viewer_cannot_delete_returns_403():
    #CREATE A RECORD AS ADMIN FIRST
    create_res = handler(make_event(
        "POST", "/individuals",
        body={"name": "Delete Target", "location": "Leeds", "employment_type": "part-time"},
        token=make_token("admin")
    ))
    id_ = json.loads(create_res["body"])["_id"]
    created_ids.append(id_)

    #TRY TO DELETE AS VIEWER - SHOULD BE BLOCKED
    res = handler(make_event("DELETE", f"/individuals/{id_}", token=make_token("viewer")))
    assert res["statusCode"] == 403


def test_viewer_can_read_returns_200():
    #VIEWERS SHOULD BE ABLE TO LIST - READ-ONLY ACCESS IS ALLOWED
    res = handler(make_event("GET", "/individuals", token=make_token("viewer")))
    assert res["statusCode"] == 200
