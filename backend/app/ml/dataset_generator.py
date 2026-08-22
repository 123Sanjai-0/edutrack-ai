import numpy as np
import pandas as pd

def generate_academic_dataset(num_samples: int = 1500, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic dataset for student academic performance and risk modeling.
    Features have realistic physical correlations:
    - Attendance < 75% introduces strong risk and mark penalties
    - Assignment completion is correlated with quiz and internal scores
    - Downward trend in tests reflects higher risk
    """
    np.random.seed(random_state)
    
    # 1. Attendance percentage (normally distributed around 82%, clipped to [40, 100])
    attendance = np.clip(np.random.normal(loc=82, scale=12, size=num_samples), 40.0, 100.0)
    
    # 2. Assignment completion rate (0.0 to 100.0) - correlated with attendance
    assignment_rate = np.clip(attendance * 0.9 + np.random.normal(loc=5, scale=10, size=num_samples), 30.0, 100.0)
    
    # 3. Quiz average (0 to 100) - correlated with assignments
    quiz_avg = np.clip(assignment_rate * 0.7 + attendance * 0.2 + np.random.normal(loc=5, scale=8, size=num_samples), 20.0, 100.0)
    
    # 4. Internal assessment score (0 to 100)
    internal_score = np.clip(quiz_avg * 0.5 + assignment_rate * 0.3 + np.random.normal(loc=15, scale=7, size=num_samples), 25.0, 100.0)
    
    # 5. Midterm exam score (0 to 100)
    midterm_score = np.clip(internal_score * 0.6 + quiz_avg * 0.3 + np.random.normal(loc=5, scale=9, size=num_samples), 20.0, 100.0)
    
    # 6. Previous semester GPA (scale 0.0 to 10.0)
    prev_gpa = np.clip((midterm_score / 10.0) + np.random.normal(loc=0.0, scale=0.8, size=num_samples), 4.0, 10.0)
    
    # 7. Number of failed subjects in past (0 to 4) - inversely related to GPA
    failed_subjects_prob = np.clip(1.0 - (prev_gpa / 10.0), 0.05, 0.9)
    failed_subjects = np.random.binomial(n=3, p=failed_subjects_prob)
    
    # 8. Performance trend (delta score: -25 to +25)
    trend = np.clip(np.random.normal(loc=0, scale=8, size=num_samples), -25.0, 25.0)
    
    # Target 1: Final Exam Score (Continuous 0 - 100)
    # Realistic composite formula with natural variance
    final_score = (
        0.30 * midterm_score +
        0.20 * internal_score +
        0.15 * quiz_avg +
        0.15 * assignment_rate +
        0.10 * (attendance - 70) * 1.2 +
        0.10 * (prev_gpa * 10) +
        0.5 * trend -
        4.0 * failed_subjects +
        np.random.normal(loc=0, scale=4.0, size=num_samples)
    )
    final_score = np.clip(final_score, 15.0, 100.0)
    
    # Target 2: Risk Level (Categorical: LOW, MEDIUM, HIGH, CRITICAL)
    # Determined by risk factors
    risk_metric = (
        (100 - attendance) * 0.35 +
        (100 - midterm_score) * 0.30 +
        (100 - assignment_rate) * 0.15 +
        (failed_subjects * 8) +
        np.maximum(0, -trend * 1.2)
    )
    
    risk_labels = []
    for r in risk_metric:
        if r < 28:
            risk_labels.append("LOW")
        elif r < 48:
            risk_labels.append("MEDIUM")
        elif r < 68:
            risk_labels.append("HIGH")
        else:
            risk_labels.append("CRITICAL")
            
    df = pd.DataFrame({
        "attendance_pct": attendance,
        "assignment_completion_rate": assignment_rate,
        "quiz_average": quiz_avg,
        "internal_assessment_score": internal_score,
        "midterm_score": midterm_score,
        "previous_semester_gpa": prev_gpa,
        "number_of_failed_subjects": failed_subjects,
        "performance_trend": trend,
        "final_score": final_score,
        "risk_level": risk_labels
    })
    
    return df
