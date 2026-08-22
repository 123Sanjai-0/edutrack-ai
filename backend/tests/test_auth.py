import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_login_failure():
    response = client.post("/api/auth/login", json={
        "username_or_email": "nonexistent@edutrack.ai",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_login_success_admin():
    response = client.post("/api/auth/login", json={
        "username_or_email": "admin@edutrack.ai",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_login_success_student():
    response = client.post("/api/auth/login", json={
        "username_or_email": "john.doe@edutrack.ai",
        "password": "Student@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"
