import pytest
from app.services.scoring_engine import calculate_grade, calculate_gpa

def test_grade_calculation():
    assert calculate_grade(95.0) == "A+"
    assert calculate_grade(85.0) == "A"
    assert calculate_grade(75.0) == "B+"
    assert calculate_grade(65.0) == "B"
    assert calculate_grade(55.0) == "C"
    assert calculate_grade(45.0) == "D"
    assert calculate_grade(35.0) == "F"

def test_gpa_calculation():
    assert calculate_gpa(85.0) == 8.5
    assert calculate_gpa(92.4) == 9.24
    assert calculate_gpa(105.0) == 10.0
    assert calculate_gpa(-5.0) == 0.0
