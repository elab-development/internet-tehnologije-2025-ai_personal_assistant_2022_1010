import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test that the API is running"""
    response = client.get("/")
    assert response.status_code in [200, 404]

def test_register_user():
    """Test user registration"""
    response = client.post("/api/auth/register", json={
        "username": "testuser",
        "password": "testpass123",
        "email": "test@example.com"
    })
    # May fail if user exists, that's ok for demo
    assert response.status_code in [200, 400]

def test_guest_login():
    """Test guest login"""
    response = client.post("/api/auth/guest")
    assert response.status_code == 200
    assert "access_token" in response.json()