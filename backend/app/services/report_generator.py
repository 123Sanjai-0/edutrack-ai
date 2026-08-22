import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_student_pdf_report(student_info: dict, subject_perfs: list, risk_data: dict, prediction_data: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b")
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#64748b")
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=6
    )
    normal_style = ParagraphStyle(
        'DocNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )
    bold_style = ParagraphStyle(
        'DocBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # 1. Header
    story.append(Paragraph("EduTrack AI — Academic Performance Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | Confidential Institutional Document", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#6366f1"), spaceBefore=8, spaceAfter=12))

    # 2. Student Info Card
    student_details = [
        [
            Paragraph("<b>Student Name:</b>", normal_style), Paragraph(student_info.get("full_name", "N/A"), bold_style),
            Paragraph("<b>Student ID:</b>", normal_style), Paragraph(student_info.get("student_id", "N/A"), bold_style)
        ],
        [
            Paragraph("<b>Department:</b>", normal_style), Paragraph(student_info.get("department_name", "N/A"), bold_style),
            Paragraph("<b>Semester / Class:</b>", normal_style), Paragraph(f"Sem {student_info.get('semester_number', 'N/A')} ({student_info.get('class_section_name', 'N/A')})", bold_style)
        ],
        [
            Paragraph("<b>Overall Percentage:</b>", normal_style), Paragraph(f"{student_info.get('overall_score_pct', 0.0):.1f}% (CGPA: {student_info.get('cgpa', 0.0):.2f})", bold_style),
            Paragraph("<b>Attendance:</b>", normal_style), Paragraph(f"{student_info.get('overall_attendance_pct', 0.0):.1f}%", bold_style)
        ],
        [
            Paragraph("<b>Current Risk Level:</b>", normal_style), Paragraph(f"{risk_data.get('risk_level', 'LOW')} (Score: {risk_data.get('risk_score', 0):.1f}/100)", bold_style),
            Paragraph("<b>Predicted Final Score:</b>", normal_style), Paragraph(f"{prediction_data.get('predicted_final_score', 'N/A')}% (Grade: {prediction_data.get('expected_grade', 'N/A')})", bold_style)
        ]
    ]

    t_info = Table(student_details, colWidths=[120, 150, 120, 150])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 14))

    # 3. Subject Performance Table
    story.append(Paragraph("Subject-Wise Academic Performance", h2_style))
    
    table_data = [
        ["Code", "Subject Title", "Credits", "Attendance", "Internal", "Midterm", "Total", "Grade", "Status"]
    ]
    for sp in subject_perfs:
        table_data.append([
            sp.get("subject_code", ""),
            sp.get("subject_name", "")[:26],
            str(sp.get("credits", 3)),
            f"{sp.get('attendance_pct', 0):.1f}%",
            f"{sp.get('internal_score', 0):.1f}",
            f"{sp.get('midterm_score', 0):.1f}",
            f"{sp.get('total_weighted_score', 0):.1f}%",
            sp.get("grade", "N/A"),
            sp.get("status", "NORMAL")
        ])

    t_subs = Table(table_data, colWidths=[55, 145, 45, 60, 50, 50, 50, 40, 45])
    t_subs.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_subs)
    story.append(Spacer(1, 14))

    # 4. Risk Factors & AI Explainability
    story.append(Paragraph("AI Risk Diagnostic & Early Warning Analysis", h2_style))
    reasons = risk_data.get("reasons", [])
    if reasons:
        for r in reasons:
            story.append(Paragraph(f"• <b>Risk Factor:</b> {r}", normal_style))
    else:
        story.append(Paragraph("• No adverse academic or attendance risk factors detected.", normal_style))

    pos_factors = prediction_data.get("positive_factors", [])
    if pos_factors:
        for pf in pos_factors:
            story.append(Paragraph(f"• <font color='#16a34a'><b>Positive Anchor:</b></font> {pf}", normal_style))
            
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=4, spaceAfter=8))
    story.append(Paragraph("<i>Note: Predictive models are estimates generated based on historical academic datasets. For academic guidance, contact your assigned faculty advisor.</i>", subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_students_csv(students_list: list) -> io.StringIO:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Student ID", "Full Name", "Email", "Department", "Semester", "Class Section",
        "Attendance %", "Score %", "CGPA", "Risk Level", "Predicted Score"
    ])
    for s in students_list:
        writer.writerow([
            s.get("student_id", ""),
            s.get("full_name", ""),
            s.get("email", ""),
            s.get("department_name", ""),
            s.get("semester_number", ""),
            s.get("class_section_name", ""),
            f"{s.get('overall_attendance_pct', 0.0):.1f}",
            f"{s.get('overall_score_pct', 0.0):.1f}",
            f"{s.get('cgpa', 0.0):.2f}",
            s.get("current_risk_level", "LOW"),
            f"{s.get('predicted_score', 0.0):.1f}" if s.get("predicted_score") else "N/A"
        ])
    output.seek(0)
    return output
