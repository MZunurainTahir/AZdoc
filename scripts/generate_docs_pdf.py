import os
import sys
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas for adding page numbers and running headers/footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f172a"))
        
        # Header (pages after cover page)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AZdoc — AI Health & Diagnostics Platform")
            self.drawRightString(612 - 54, 750, "Official Documentation & Pitch Package")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)

        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 36, "Confidential — AZdoc (Abdullah Khalid & Abdullah Nadeem)")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 36, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        
        self.restoreState()


def convert_md_to_pdf(md_filepath, output_pdf_filepath, title_text, subtitle_text):
    print(f"Generating PDF from {md_filepath} -> {output_pdf_filepath}...")
    
    with open(md_filepath, "r", encoding="utf-8") as f:
        content = f.read()

    doc = SimpleDocTemplate(
        output_pdf_filepath,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#0d9488") # Teal Primary
    DARK_BLUE = colors.HexColor("#0f172a") # Slate 900
    BODY_TEXT = colors.HexColor("#334155") # Slate 700
    CODE_BG = colors.HexColor("#f8fafc") # Slate 50
    CODE_BORDER = colors.HexColor("#e2e8f0")

    # Modify/Add Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=DARK_BLUE,
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=DARK_BLUE,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=DARK_BLUE,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=BODY_TEXT,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
        backColor=CODE_BG,
        borderColor=CODE_BORDER,
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=6
    )

    story = []

    # Title Banner
    story.append(Spacer(1, 10))
    story.append(Paragraph(title_text, title_style))
    story.append(Paragraph(subtitle_text, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=15))

    lines = content.splitlines()
    in_code_block = False
    code_lines = []
    
    for line in lines:
        raw_line = line.rstrip()
        
        # Code Block Toggle
        if raw_line.startswith("```"):
            if in_code_block:
                # End of code block
                code_text = "<br/>".join([c.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;") for c in code_lines])
                story.append(Paragraph(code_text, code_style))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(raw_line)
            continue

        if not raw_line.strip():
            story.append(Spacer(1, 4))
            continue

        # Headings
        if raw_line.startswith("# "):
            clean_text = re.sub(r'^[#\s]+', '', raw_line)
            story.append(Spacer(1, 8))
            story.append(Paragraph(clean_text, h1_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
        elif raw_line.startswith("## "):
            clean_text = re.sub(r'^[#\s]+', '', raw_line)
            story.append(Paragraph(clean_text, h2_style))
        elif raw_line.startswith("### ") or raw_line.startswith("#### "):
            clean_text = re.sub(r'^[#\s]+', '', raw_line)
            story.append(Paragraph(clean_text, h3_style))
        # Bullet Points
        elif raw_line.startswith("- ") or raw_line.startswith("* "):
            clean_text = raw_line[2:].strip()
            # Basic markdown bold conversion
            clean_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', clean_text)
            clean_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', clean_text)
            story.append(Paragraph(f"• {clean_text}", bullet_style))
        elif re.match(r'^\d+\.\s', raw_line):
            clean_text = re.sub(r'^\d+\.\s', '', raw_line).strip()
            clean_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', clean_text)
            clean_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', clean_text)
            story.append(Paragraph(f"• {clean_text}", bullet_style))
        # Horizontal Rule
        elif raw_line.startswith("---"):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94a3b8"), spaceBefore=8, spaceAfter=8))
        # Normal Text Paragraph
        else:
            clean_text = raw_line
            clean_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', clean_text)
            clean_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', clean_text)
            clean_text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', clean_text)
            story.append(Paragraph(clean_text, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {output_pdf_filepath}")


if __name__ == "__main__":
    docs_dir = os.path.join(os.getcwd(), "docs")
    
    # 1. Technical Software Engineering PDF
    eng_md = os.path.join(docs_dir, "AZDOC_COMPLETE_SOFTWARE_ENGINEERING_DOCS.md")
    eng_pdf = os.path.join(docs_dir, "AZdoc_Complete_Software_Engineering_and_UML_Docs.pdf")
    convert_md_to_pdf(
        eng_md,
        eng_pdf,
        "AZdoc — Software Engineering & System Architecture Specification",
        "Complete SRS, Database Schema, API Catalog, and UML Diagrams for Humans, Livestock, Pets, Plants & Crops"
    )

    # 2. Startup Pitch & 500 Q&A PDF
    pitch_md = os.path.join(docs_dir, "AZDOC_STARTUP_PITCH_AND_500_QA_DEFENSE_MANUAL.md")
    pitch_pdf = os.path.join(docs_dir, "AZdoc_Startup_Pitch_and_500_QA_Defense_Manual.pdf")
    convert_md_to_pdf(
        pitch_md,
        pitch_pdf,
        "AZdoc — Startup Pitch Strategy & 500 Q&A Defense Manual",
        "Investor Presentation Guide across 7 Core Evaluation Criteria & 500 Structured Defense Responses"
    )
