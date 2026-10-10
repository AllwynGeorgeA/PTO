"""PTO plan CRUD, validation, isolation, computed status."""

from datetime import date, timedelta

from app.schemas.pto_plan import compute_days_remaining, compute_status

URL = "/api/v1/pto-plans"


def body(start: date, end: date, **kw: object) -> dict:
    """Valid payload with overrides."""
    return {
        "employee_name": "Alice",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "backup_person": "Bob",
        "contact_email": "alice@example.com",
        **kw,
    }


def test_crud(client, auth_headers):
    t = date.today()
    r = client.post(
        URL, json=body(t + timedelta(5), t + timedelta(9), reason="Beach"), headers=auth_headers
    )
    assert r.status_code == 201
    out = r.json()
    assert out["status"] == "upcoming" and out["days_remaining"] == 5 and out["reason"] == "Beach"
    pid = out["id"]
    assert client.get(f"{URL}/{pid}", headers=auth_headers).json()["id"] == pid
    r = client.put(
        f"{URL}/{pid}", json=body(t + timedelta(6), t + timedelta(9)), headers=auth_headers
    )
    assert r.status_code == 200 and r.json()["days_remaining"] == 6
    assert client.delete(f"{URL}/{pid}", headers=auth_headers).status_code == 204
    assert client.get(f"{URL}/{pid}", headers=auth_headers).status_code == 404


def test_list_sorted_by_start(client, auth_headers):
    t = date.today()
    for off in (30, 10, 20):
        client.post(
            URL, json=body(t + timedelta(off), t + timedelta(off + 1)), headers=auth_headers
        )
    starts = [p["start_date"] for p in client.get(URL, headers=auth_headers).json()]
    assert starts == sorted(starts) and len(starts) == 3


def test_validation(client, auth_headers):
    t = date.today()
    bad = body(t + timedelta(2), t + timedelta(1))
    assert client.post(URL, json=bad, headers=auth_headers).status_code == 422
    bad = body(t, t, contact_email="nope")
    assert client.post(URL, json=bad, headers=auth_headers).status_code == 422
    assert client.post(URL, json=body(t, t), headers=auth_headers).status_code == 201


def test_requires_auth(client):
    assert client.get(URL).status_code == 401


def test_user_isolation(client, auth_headers, other_headers):
    t = date.today()
    pid = client.post(URL, json=body(t, t), headers=auth_headers).json()["id"]
    assert client.get(URL, headers=other_headers).json() == []
    assert client.get(f"{URL}/{pid}", headers=other_headers).status_code == 404
    assert client.put(f"{URL}/{pid}", json=body(t, t), headers=other_headers).status_code == 404
    assert client.delete(f"{URL}/{pid}", headers=other_headers).status_code == 404
    assert client.get(f"{URL}/{pid}", headers=auth_headers).status_code == 200


def test_status_and_days_remaining_boundaries():
    s, e = date(2026, 6, 10), date(2026, 6, 14)
    cases = [
        (date(2026, 6, 9), "upcoming", 1),
        (date(2026, 6, 10), "active", 4),  # start day
        (date(2026, 6, 12), "active", 2),
        (date(2026, 6, 14), "active", 0),  # end day
        (date(2026, 6, 15), "completed", 0),
    ]
    for today, status, days in cases:
        assert compute_status(s, e, today) == status
        assert compute_days_remaining(s, e, today) == days


def test_reason_length_cap(client, auth_headers):
    t = date.today()
    r = client.post(URL, json=body(t, t, reason="a" * 1001), headers=auth_headers)
    assert r.status_code == 422
