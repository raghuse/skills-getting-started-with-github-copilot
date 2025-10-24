from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic sanity checks
    assert "Chess Club" in data


def test_signup_duplicate_and_unregister_flow():
    activity = "Chess Club"
    email = "tester@example.com"

    # Clean up in case previous test left the email
    activities[activity]["participants"] = [p for p in activities[activity]["participants"] if p != email]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should return 400
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Unregister
    resp_del = client.delete(f"/activities/{activity}/signup?email={email}")
    assert resp_del.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should return 404
    resp_del2 = client.delete(f"/activities/{activity}/signup?email={email}")
    assert resp_del2.status_code == 404
