import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_header(role="admin"):
    if role == "admin":
        res = client.post("/api/auth/login", json={"username_or_email": "admin@edutrack.ai", "password": "Admin@123"})
    elif role == "faculty":
        res = client.post("/api/auth/login", json={"username_or_email": "prof.smith@edutrack.ai", "password": "Faculty@123"})
    else:
        res = client.post("/api/auth/login", json={"username_or_email": "john.doe@edutrack.ai", "password": "Student@123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_list_students_as_admin():
    headers = get_auth_header("admin")
    response = client.get("/api/students?page=1&page_size=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 10
    assert data["total"] > 50

def test_student_analytics_endpoint():
    headers = get_auth_header("student")
    # Fetch demo student
    response = client.get("/api/students/1/analytics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "overall_percentage" in data
    assert "attendance_percentage" in data
    assert "predicted_final_score" in data
    assert "subject_performances" in data
    assert len(data["subject_performances"]) > 0

def test_admin_analytics_endpoint():
    headers = get_auth_header("admin")
    response = client.get("/api/analytics/admin", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_students"] > 50
    assert "department_performance" in data
    assert "risk_distribution" in data

def test_faculty_analytics_endpoint():
    headers = get_auth_header("faculty")
    response = client.get("/api/analytics/faculty", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "class_average_score" in data
    assert "subject_comparisons" in data

def test_performance_heatmap():
    headers = get_auth_header("faculty")
    response = client.get("/api/analytics/heatmap", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "subjects" in data
    assert "students" in data

def test_student_pdf_report():
    headers = get_auth_header("student")
    response = client.get("/api/reports/student/1/pdf", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000

def test_students_csv_export():
    headers = get_auth_header("admin")
    response = client.get("/api/students/export/csv", headers=headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert b"Student ID" in response.content
