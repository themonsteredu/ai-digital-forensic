#!/usr/bin/env python3
"""Generate CASE 017 phone files and classroom printables.

The generated materials contain only fictional names and a fictional school
festival scenario. They are intentionally deterministic so the download packs
can be rebuilt before a release.
"""

from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PHONE_FILES = PUBLIC / "case017" / "phone-files"
PRINTABLES = PUBLIC / "downloads" / "case017" / "printables"
TEMP = ROOT / "tmp" / "case017-assets"

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#0B1A2A")
BLUE = colors.HexColor("#176B9C")
PALE_BLUE = colors.HexColor("#EAF5FB")
CHARCOAL = colors.HexColor("#26333D")
MUTED = colors.HexColor("#5C6A74")
LINE = colors.HexColor("#C9D6DE")
LIGHT = colors.HexColor("#F4F7F9")
RED = colors.HexColor("#B82935")
WHITE = colors.white


class KoreanCanvas(canvas.Canvas):
    """ReportLab canvas that rasterizes S-Core Dream text with Pillow.

    The bundled S-Core Dream webfonts use CFF outlines, which ReportLab cannot
    embed as a TTFont. Shapes remain vector-based while text is embedded as
    high-resolution transparent imagery so Korean prints consistently.
    """

    regular_font: Path
    bold_font: Path

    @classmethod
    def configure_fonts(cls, regular_font: Path, bold_font: Path) -> None:
        cls.regular_font = regular_font
        cls.bold_font = bold_font

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._raster_font_name = "SCore"
        self._raster_font_size = 10.0

    def setFont(self, psfontname, size, leading=None):  # noqa: N802
        self._raster_font_name = str(psfontname)
        self._raster_font_size = float(size)
        super().setFont("Helvetica-Bold" if "Bold" in str(psfontname) else "Helvetica", size, leading)

    def _pil_font(self, scale: int = 4) -> ImageFont.FreeTypeFont:
        path = self.bold_font if "Bold" in self._raster_font_name else self.regular_font
        return ImageFont.truetype(str(path), max(1, round(self._raster_font_size * scale)))

    def stringWidth(self, text, fontName=None, fontSize=None):  # noqa: N802
        old_name, old_size = self._raster_font_name, self._raster_font_size
        if fontName is not None:
            self._raster_font_name = str(fontName)
        if fontSize is not None:
            self._raster_font_size = float(fontSize)
        font = self._pil_font(scale=4)
        bbox = font.getbbox(str(text))
        width = (bbox[2] - bbox[0]) / 4
        self._raster_font_name, self._raster_font_size = old_name, old_size
        return width

    def _text_color(self) -> tuple[int, int, int, int]:
        color = self._fillColorObj
        try:
            red, green, blue = color.red, color.green, color.blue
        except AttributeError:
            red, green, blue = 0, 0, 0
        alpha = getattr(color, "alpha", 1)
        return (
            round(red * 255),
            round(green * 255),
            round(blue * 255),
            round(alpha * 255),
        )

    def drawString(self, x, y, text, mode=None, charSpace=0, direction=None, wordSpace=None):  # noqa: N802
        text = str(text)
        if not text:
            return
        scale = 4
        font = self._pil_font(scale)
        probe = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
        probe_draw = ImageDraw.Draw(probe)
        bbox = probe_draw.textbbox((0, 0), text, font=font, anchor="ls")
        pad = scale * 2
        width = max(1, bbox[2] - bbox[0] + pad * 2)
        height = max(1, bbox[3] - bbox[1] + pad * 2)
        image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        anchor_x = -bbox[0] + pad
        anchor_y = -bbox[1] + pad
        draw.text((anchor_x, anchor_y), text, font=font, fill=self._text_color(), anchor="ls")
        pdf_width = width / scale
        pdf_height = height / scale
        left = x - anchor_x / scale
        bottom = y - (height - anchor_y) / scale
        self.drawImage(ImageReader(image), left, bottom, pdf_width, pdf_height, mask="auto")

    def drawCentredString(self, x, y, text, mode=None, charSpace=0, direction=None, wordSpace=None):  # noqa: N802
        self.drawString(x - self.stringWidth(text) / 2, y, text)

    def drawRightString(self, x, y, text, mode=None, charSpace=0, direction=None, wordSpace=None):  # noqa: N802
        self.drawString(x - self.stringWidth(text), y, text)


def ensure_fonts() -> tuple[Path, Path]:
    TEMP.mkdir(parents=True, exist_ok=True)
    regular_woff = PUBLIC / "fonts" / "S-CoreDream-4Regular.woff"
    bold_woff = PUBLIC / "fonts" / "S-CoreDream-7ExtraBold.woff"
    regular_ttf = TEMP / "SCoreDream-Regular.ttf"
    bold_ttf = TEMP / "SCoreDream-ExtraBold.ttf"

    for source, target in ((regular_woff, regular_ttf), (bold_woff, bold_ttf)):
        font = TTFont(str(source))
        font.flavor = None
        font.save(str(target))

    KoreanCanvas.configure_fonts(regular_ttf, bold_ttf)
    return regular_ttf, bold_ttf


def page_header(c: canvas.Canvas, title: str, subtitle: str = "CASE 017") -> None:
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 29 * mm, PAGE_W, 29 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("SCoreBold", 15)
    c.drawString(15 * mm, PAGE_H - 16 * mm, title)
    c.setFont("SCore", 7.5)
    c.drawRightString(PAGE_W - 15 * mm, PAGE_H - 16 * mm, subtitle)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2)
    c.line(15 * mm, PAGE_H - 29 * mm, PAGE_W - 15 * mm, PAGE_H - 29 * mm)


def page_footer(c: canvas.Canvas, page_no: int, teacher_only: bool = False) -> None:
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(15 * mm, 13 * mm, PAGE_W - 15 * mm, 13 * mm)
    c.setFont("SCore", 6.8)
    c.setFillColor(RED if teacher_only else MUTED)
    c.drawString(
        15 * mm,
        8 * mm,
        "교사용 정답 자료 - 학생 배포 금지" if teacher_only else "DIGITAL FORENSICS LAB - CASE 017",
    )
    c.setFillColor(MUTED)
    c.drawRightString(PAGE_W - 15 * mm, 8 * mm, f"{page_no:02d}")


def draw_wrapped(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    font: str = "SCore",
    size: float = 9,
    leading: float | None = None,
    color: colors.Color = CHARCOAL,
    max_lines: int | None = None,
) -> float:
    leading = leading or size * 1.55
    words = list(text)
    lines: list[str] = []
    current = ""
    for char in words:
        trial = current + char
        if c.stringWidth(trial, font, size) <= width or not current:
            current = trial
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def checkbox(c: canvas.Canvas, x: float, y: float, label: str, width: float) -> None:
    c.setStrokeColor(CHARCOAL)
    c.setLineWidth(0.8)
    c.rect(x, y - 2.6 * mm, 3.4 * mm, 3.4 * mm, fill=0, stroke=1)
    draw_wrapped(c, label, x + 6 * mm, y, width - 6 * mm, size=8.3, leading=4.7 * mm)


def build_festival_schedule(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "학교 축제 운영 일정표", "10월 17일 - 내부 운영용")
    rows = [
        ["시간", "장소", "운영 내용", "담당"],
        ["16:30", "체육관", "공연 장비 반입 및 음향 점검", "공연팀"],
        ["17:10", "본관 1층", "안내 부스 및 장식 최종 확인", "운영팀"],
        ["17:40", "행사실", "모금함과 축제 물품 인계", "회계팀"],
        ["18:00", "운동장", "체험 부스 운영 시작", "부스팀"],
        ["18:25", "체육관", "공연 리허설 시작", "공연팀"],
        ["19:00", "중앙 무대", "축제 개막 안내", "학생회"],
        ["20:20", "전 구역", "운영 종료 및 장비 회수", "전체"],
    ]
    widths = [23, 34, 85, 32]
    x_values = [18]
    for value in widths:
        x_values.append(x_values[-1] + value)
    top = PAGE_H - 48 * mm
    row_h = 18 * mm
    for row_index, row in enumerate(rows):
        y = top - row_index * row_h
        c.setFillColor(NAVY if row_index == 0 else (WHITE if row_index % 2 else LIGHT))
        c.setStrokeColor(LINE)
        c.rect(18 * mm, y - row_h, 174 * mm, row_h, fill=1, stroke=1)
        for x_mm in x_values[1:-1]:
            c.line(x_mm * mm, y, x_mm * mm, y - row_h)
        for cell_index, value in enumerate(row):
            c.setFillColor(WHITE if row_index == 0 else CHARCOAL)
            c.setFont("SCoreBold" if row_index == 0 else "SCore", 7.2)
            cell_center = (x_values[cell_index] + x_values[cell_index + 1]) * mm / 2
            c.drawCentredString(cell_center, y - 11 * mm, value)
    info_y = top - len(rows) * row_h - 13 * mm
    c.setFillColor(PALE_BLUE)
    c.roundRect(18 * mm, info_y - 34 * mm, 174 * mm, 31 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("SCoreBold", 9)
    c.drawString(24 * mm, info_y - 13 * mm, "운영 주의")
    draw_wrapped(
        c,
        "행사실 출입이 필요한 경우 장비 담당자와 회계 담당자가 함께 확인한다. 모금함과 개인 물품은 지정 위치를 벗어나 임의로 이동하지 않는다.",
        24 * mm,
        info_y - 22 * mm,
        160 * mm,
        size=7.5,
        leading=4.6 * mm,
    )
    page_footer(c, 1)
    c.save()


def build_event_map(output: Path, regular_ttf: Path, bold_ttf: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    width, height = 1600, 1100
    image = Image.new("RGB", (width, height), "#F4F7F9")
    draw = ImageDraw.Draw(image)
    regular = ImageFont.truetype(str(regular_ttf), 28)
    bold = ImageFont.truetype(str(bold_ttf), 45)
    small = ImageFont.truetype(str(regular_ttf), 22)

    draw.rounded_rectangle((70, 60, 1530, 1035), radius=26, fill="#FFFFFF", outline="#B9CBD7", width=4)
    draw.rectangle((70, 60, 1530, 185), fill="#0B1A2A")
    draw.text((120, 96), "학교 축제 행사 구역 안내", fill="white", font=bold)
    draw.text((1230, 112), "10월 17일", fill="#8FD5F2", font=small)

    blocks = [
        ((150, 270, 600, 520), "체육관", "공연 무대 / 대기 구역"),
        ((900, 270, 1400, 520), "본관", "행사실 / 교실 체험"),
        ((150, 690, 600, 930), "운동장", "체험 부스 / 휴게 구역"),
        ((900, 690, 1400, 930), "급식실 앞", "먹거리 부스"),
    ]
    for (x1, y1, x2, y2), name, desc in blocks:
        draw.rounded_rectangle((x1, y1, x2, y2), radius=18, fill="#EAF5FB", outline="#176B9C", width=4)
        name_box = draw.textbbox((0, 0), name, font=bold)
        name_w = name_box[2] - name_box[0]
        draw.text(((x1 + x2 - name_w) / 2, y1 + 67), name, fill="#0B1A2A", font=bold)
        desc_box = draw.textbbox((0, 0), desc, font=regular)
        desc_w = desc_box[2] - desc_box[0]
        draw.text(((x1 + x2 - desc_w) / 2, y1 + 145), desc, fill="#52636F", font=regular)

    draw.line((600, 395, 900, 395), fill="#176B9C", width=14)
    draw.polygon(((900, 395), (860, 370), (860, 420)), fill="#176B9C")
    draw.line((600, 805, 900, 805), fill="#176B9C", width=14)
    draw.polygon(((900, 805), (860, 780), (860, 830)), fill="#176B9C")
    draw.line((375, 520, 375, 690), fill="#176B9C", width=14)
    draw.polygon(((375, 690), (350, 650), (400, 650)), fill="#176B9C")
    draw.line((1150, 520, 1150, 690), fill="#176B9C", width=14)
    draw.polygon(((1150, 690), (1125, 650), (1175, 650)), fill="#176B9C")
    draw.text((125, 980), "※ 안전 통로와 출입구를 막지 마십시오.", fill="#5C6A74", font=small)
    image.save(output, "JPEG", quality=92, optimize=True)


def build_envelope_labels(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    for row in range(2):
        y = PAGE_H - (22 + row * 132) * mm
        c.setStrokeColor(NAVY)
        c.setLineWidth(1.5)
        c.roundRect(17 * mm, y - 108 * mm, 176 * mm, 108 * mm, 3 * mm, fill=0, stroke=1)
        c.setFillColor(NAVY)
        c.rect(17 * mm, y - 23 * mm, 176 * mm, 23 * mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("SCoreBold", 14)
        c.drawString(25 * mm, y - 14 * mm, "DIGITAL FORENSICS LAB")
        c.setFont("SCore", 8)
        c.drawRightString(185 * mm, y - 14 * mm, "CASE 017")
        c.setFillColor(CHARCOAL)
        c.setFont("SCoreBold", 28)
        c.drawString(25 * mm, y - 42 * mm, "EVIDENCE E-01")
        fields = [
            ("증거 종류", "MOBILE DEVICE"),
            ("압수 위치", "행사실 인근"),
            ("취급 주의", "임의 조작 금지"),
        ]
        field_y = y - 56 * mm
        for label, value in fields:
            c.setFont("SCore", 7.5)
            c.setFillColor(MUTED)
            c.drawString(25 * mm, field_y, label)
            c.setFont("SCoreBold", 10)
            c.setFillColor(CHARCOAL)
            c.drawString(56 * mm, field_y, value)
            c.setStrokeColor(LINE)
            c.line(25 * mm, field_y - 4 * mm, 185 * mm, field_y - 4 * mm)
            field_y -= 15 * mm
        c.setFont("SCore", 7)
        c.setFillColor(RED)
        c.drawRightString(185 * mm, y - 101 * mm, "TRAINING EVIDENCE - CONTROLLED")
    c.save()


def build_briefing_card(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "CASE 017 사건 브리핑 카드")
    y = PAGE_H - 48 * mm
    c.setFont("SCoreBold", 25)
    c.setFillColor(NAVY)
    c.drawString(18 * mm, y, "사라진 축제 모금함")
    y -= 14 * mm
    draw_wrapped(
        c,
        "학교 축제 당일, 행사실에 보관 중이던 모금함이 사라졌다. 복도 CCTV에는 여러 인물이 포착되었고, 현장에서 발견된 스마트폰에는 일부 사진과 파일이 남아 있다.",
        18 * mm,
        y,
        174 * mm,
        size=10.5,
        leading=6.5 * mm,
    )
    y -= 28 * mm
    for number, title, body in [
        ("01", "현장 증거물", "증거물 E-01 스마트폰의 갤러리, 파일 구조와 외부 저장매체를 조사한다."),
        ("02", "삭제 데이터", "microSD를 분리해 IMG_2048.jpg를 복구하고 원본을 변경하지 않는다."),
        ("03", "교차검증", "메시지, 통화기록, CCTV, 메타데이터의 시간을 비교한다."),
        ("04", "수사 결론", "사실과 추측을 구분하고 세 가지 이상의 증거로 결론을 설명한다."),
    ]:
        c.setFillColor(PALE_BLUE)
        c.roundRect(18 * mm, y - 23 * mm, 174 * mm, 21 * mm, 2 * mm, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.setFont("SCoreBold", 10)
        c.drawString(24 * mm, y - 10 * mm, number)
        c.setFillColor(NAVY)
        c.setFont("SCoreBold", 10)
        c.drawString(39 * mm, y - 10 * mm, title)
        draw_wrapped(c, body, 39 * mm, y - 16 * mm, 145 * mm, size=7.8, leading=4 * mm)
        y -= 27 * mm
    c.setFillColor(NAVY)
    c.roundRect(18 * mm, 31 * mm, 174 * mm, 31 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("SCoreBold", 11)
    c.drawString(25 * mm, 51 * mm, "수사 원칙")
    draw_wrapped(c, "원본 보존 / 취급 과정 기록 / 독립된 증거 교차검증 / 개인정보 보호", 25 * mm, 41 * mm, 155 * mm, size=8, color=WHITE)
    page_footer(c, 1)
    c.save()


def build_number_labels(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "증거번호 라벨", "E-01 - E-14")
    cols, rows = 2, 7
    box_w, box_h = 82 * mm, 29 * mm
    start_x, start_y = 18 * mm, PAGE_H - 43 * mm
    for index in range(14):
        col, row = index % cols, index // cols
        x = start_x + col * (box_w + 10 * mm)
        y = start_y - row * (box_h + 5 * mm)
        c.setStrokeColor(NAVY)
        c.setLineWidth(1)
        c.roundRect(x, y - box_h, box_w, box_h, 2 * mm, fill=0, stroke=1)
        c.setFillColor(NAVY)
        c.rect(x, y - box_h, 22 * mm, box_h, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("SCoreBold", 14)
        c.drawCentredString(x + 11 * mm, y - 18 * mm, f"E-{index + 1:02d}")
        c.setFillColor(CHARCOAL)
        c.setFont("SCoreBold", 8)
        c.drawString(x + 27 * mm, y - 12 * mm, "CASE 017")
        c.setFont("SCore", 6.5)
        c.setFillColor(MUTED)
        c.drawString(x + 27 * mm, y - 20 * mm, "DIGITAL EVIDENCE")
    page_footer(c, 1)
    c.save()


def build_suspect_cards(output: Path) -> None:
    suspects = [
        ("A", "한지원", "축제 회계 봉사", "모금함을 행사실에 두고 담당 교사를 찾으러 갔어요.", "회색 바람막이 / 흰 운동화", "suspect-a.jpg"),
        ("B", "김민수", "공연 동아리", "그 시간에는 체육관 무대에서 공연 준비를 하고 있었어요.", "검은 후드티 / 검은 백팩", "suspect-b.jpg"),
        ("C", "박도윤", "축제 장비 담당", "행사실 앞은 지나갔지만 안에는 들어가지 않았어요.", "검은 후드티 / 밝은 운동화 / 반사형 가방끈", "suspect-c.jpg"),
        ("D", "서유나", "축제 사진 기록", "운동장 부스 사진을 정리하느라 본관에는 가지 않았어요.", "남색 조끼 / 카메라 스트랩", "suspect-d.jpg"),
    ]
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "용의자 카드", "SUSPECT A-D")
    for index, (code, name, role, statement, clothing, image_name) in enumerate(suspects):
        col, row = index % 2, index // 2
        x = 18 * mm + col * 92 * mm
        y = PAGE_H - 44 * mm - row * 111 * mm
        c.setStrokeColor(LINE)
        c.setFillColor(WHITE)
        c.roundRect(x, y - 103 * mm, 82 * mm, 99 * mm, 3 * mm, fill=1, stroke=1)
        c.setFillColor(NAVY)
        c.roundRect(x + 5 * mm, y - 52 * mm, 29 * mm, 42 * mm, 2 * mm, fill=1, stroke=0)
        portrait = PUBLIC / "case017" / "suspects" / image_name
        c.drawImage(ImageReader(str(portrait)), x + 6 * mm, y - 51 * mm, 27 * mm, 40 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
        c.setFillColor(WHITE)
        c.setFont("SCoreBold", 7)
        c.drawString(x + 7 * mm, y - 16 * mm, f"SUSPECT {code}")
        c.setFillColor(NAVY)
        c.setFont("SCoreBold", 15)
        c.drawString(x + 39 * mm, y - 22 * mm, name)
        c.setFont("SCore", 7.2)
        c.setFillColor(BLUE)
        c.drawString(x + 39 * mm, y - 31 * mm, role)
        c.setFillColor(CHARCOAL)
        c.setFont("SCoreBold", 7.2)
        c.drawString(x + 39 * mm, y - 40 * mm, "사건 당시 진술")
        draw_wrapped(c, statement, x + 39 * mm, y - 47 * mm, 36 * mm, size=6.3, leading=3.6 * mm, max_lines=3)
        c.setFillColor(PALE_BLUE)
        c.roundRect(x + 5 * mm, y - 71 * mm, 72 * mm, 14 * mm, 1.5 * mm, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.setFont("SCoreBold", 6.5)
        c.drawString(x + 9 * mm, y - 64 * mm, "복장 정보")
        draw_wrapped(c, clothing, x + 26 * mm, y - 64 * mm, 47 * mm, size=6.1, leading=3.5 * mm, max_lines=2)
        c.setFillColor(MUTED)
        c.setFont("SCore", 6.3)
        c.drawString(x + 6 * mm, y - 81 * mm, "확인한 사실:")
        c.setStrokeColor(LINE)
        c.line(x + 28 * mm, y - 82 * mm, x + 76 * mm, y - 82 * mm)
        c.drawString(x + 6 * mm, y - 91 * mm, "다른 증거와 연결:")
        c.line(x + 32 * mm, y - 92 * mm, x + 76 * mm, y - 92 * mm)
    page_footer(c, 1)
    c.save()


EVIDENCE_CARDS = [
    ("E-01", "MOBILE DEVICE", "행사실 인근에서 확보된 공폰"),
    ("E-02", "FILE SYSTEM", "IMG_2048.jpg 삭제 흔적"),
    ("E-03", "RECOVERED IMAGE", "복구된 목격 사진"),
    ("E-04", "DEVICE STORAGE", "외부 저장매체 microSD 사용"),
    ("E-05", "EXIF", "촬영 시각 18:42:17"),
    ("E-06", "PHOTO LOCATION", "행사실 동쪽 복도"),
    ("E-07", "CCTV FRAME", "18:47:06 / 행사실 동쪽 복도"),
    ("E-08", "VISUAL FEATURE", "밝은 캔버스 운동화"),
    ("E-09", "VISUAL FEATURE", "좁은 반사형 가방끈"),
    ("E-10", "EVENT FILE", "축제 운영 일정표"),
    ("E-11", "MESSAGE RECORD", "추출 메시지 기록"),
    ("E-12", "CALL RECORD", "추출 통화 기록"),
    ("E-13", "WITNESS NOTE", "목격자 진술 요약"),
    ("E-14", "LOCATION RECORD", "체육관 위치 기록"),
]


def build_evidence_cards(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_no = 1
    for page_start in range(0, len(EVIDENCE_CARDS), 6):
        page_header(c, "CASE 017 증거카드", f"EVIDENCE SET {page_no}")
        for offset, (code, evidence_type, detail) in enumerate(EVIDENCE_CARDS[page_start : page_start + 6]):
            col, row = offset % 2, offset // 2
            x = 18 * mm + col * 92 * mm
            y = PAGE_H - 46 * mm - row * 67 * mm
            c.setFillColor(WHITE)
            c.setStrokeColor(LINE)
            c.roundRect(x, y - 59 * mm, 82 * mm, 55 * mm, 2 * mm, fill=1, stroke=1)
            c.setFillColor(NAVY)
            c.rect(x, y - 20 * mm, 82 * mm, 16 * mm, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont("SCoreBold", 14)
            c.drawString(x + 6 * mm, y - 14 * mm, code)
            c.setFont("SCore", 6.5)
            c.drawRightString(x + 76 * mm, y - 14 * mm, evidence_type)
            c.setFillColor(CHARCOAL)
            c.setFont("SCoreBold", 9)
            draw_wrapped(c, detail, x + 6 * mm, y - 31 * mm, 70 * mm, font="SCoreBold", size=9, leading=5 * mm)
            c.setFont("SCore", 5.8)
            c.setFillColor(MUTED)
            c.drawString(x + 6 * mm, y - 45 * mm, "이 증거에서 확인한 사실:")
            c.setStrokeColor(LINE)
            c.line(x + 40 * mm, y - 46 * mm, x + 76 * mm, y - 46 * mm)
            c.drawString(x + 6 * mm, y - 51 * mm, "다른 증거와 연결되는 점:")
            c.line(x + 42 * mm, y - 52 * mm, x + 76 * mm, y - 52 * mm)
        page_footer(c, page_no)
        c.showPage()
        page_no += 1
    c.save()


def build_timeline_worksheet(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "CASE 017 타임라인 활동지")
    c.setFillColor(CHARCOAL)
    c.setFont("SCore", 8.5)
    c.drawString(18 * mm, PAGE_H - 39 * mm, "각 증거의 발생 시각을 확인하고 시간순으로 정리하십시오.")
    x_positions = [18, 45, 82, 153, 192]
    y = PAGE_H - 53 * mm
    headers = ["순서", "시각", "증거번호", "확인한 사실", "추측 여부"]
    for index, header in enumerate(headers):
        x1 = x_positions[index] * mm
        x2 = x_positions[index + 1] * mm if index + 1 < len(x_positions) else 192 * mm
        c.setFillColor(NAVY)
        c.rect(x1, y - 10 * mm, x2 - x1, 10 * mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("SCoreBold", 7.2)
        c.drawCentredString((x1 + x2) / 2, y - 6.5 * mm, header)
    for row in range(9):
        row_top = y - 10 * mm - row * 21 * mm
        c.setStrokeColor(LINE)
        c.setFillColor(WHITE if row % 2 == 0 else LIGHT)
        c.rect(18 * mm, row_top - 21 * mm, 174 * mm, 21 * mm, fill=1, stroke=1)
        for x_mm in x_positions[1:-1]:
            c.line(x_mm * mm, row_top, x_mm * mm, row_top - 21 * mm)
        c.setFillColor(MUTED)
        c.setFont("SCore", 7)
        c.drawCentredString(31.5 * mm, row_top - 12 * mm, f"{row + 1:02d}")
    checkbox(c, 18 * mm, 36 * mm, "발생 시각과 확인 시각을 구분했습니다.", 80 * mm)
    checkbox(c, 108 * mm, 36 * mm, "사실과 추측을 구분했습니다.", 80 * mm)
    page_footer(c, 1)
    c.save()


def build_notes(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "CASE 017 수사 메모지")
    sections = [
        ("1. 실제 공폰에서 확인한 것", 57),
        ("2. microSD 복구 결과", 57),
        ("3. 웹 추출 데이터와의 연결", 57),
        ("4. 현재 가설과 반대 증거", 57),
    ]
    y = PAGE_H - 44 * mm
    for title, height_mm in sections:
        c.setFillColor(PALE_BLUE)
        c.rect(18 * mm, y - 11 * mm, 174 * mm, 11 * mm, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("SCoreBold", 9)
        c.drawString(23 * mm, y - 7 * mm, title)
        c.setStrokeColor(LINE)
        for line_index in range(6):
            line_y = y - 19 * mm - line_index * 7 * mm
            c.line(22 * mm, line_y, 188 * mm, line_y)
        y -= height_mm * mm
    page_footer(c, 1)
    c.save()


def build_final_report(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "DIGITAL FORENSIC EXAMINATION REPORT")
    c.setFillColor(NAVY)
    c.setFont("SCoreBold", 22)
    c.drawString(18 * mm, PAGE_H - 45 * mm, "최종 수사보고서")
    c.setFont("SCoreBold", 16)
    c.drawRightString(192 * mm, PAGE_H - 45 * mm, "CASE 017")
    y = PAGE_H - 59 * mm
    for label, width in [("모둠", 42), ("작성자", 76), ("제출 시각", 56)]:
        c.setFont("SCoreBold", 7.5)
        c.setFillColor(MUTED)
        c.drawString(18 * mm, y, label)
        c.setStrokeColor(LINE)
        c.line(34 * mm, y - 1 * mm, (34 + width) * mm, y - 1 * mm)
        y -= 10 * mm
    y -= 2 * mm
    sections = [
        ("01", "의심 인물", 22),
        ("02", "결정적 증거 3개 이상", 32),
        ("03", "사건 발생 순서", 40),
        ("04", "증거 연결과 판단 근거", 48),
    ]
    for number, title, height_mm in sections:
        c.setFillColor(NAVY)
        c.circle(24 * mm, y - 5 * mm, 5 * mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("SCoreBold", 6.5)
        c.drawCentredString(24 * mm, y - 7 * mm, number)
        c.setFillColor(CHARCOAL)
        c.setFont("SCoreBold", 10)
        c.drawString(35 * mm, y - 7 * mm, title)
        c.setStrokeColor(LINE)
        c.roundRect(18 * mm, y - height_mm * mm, 174 * mm, (height_mm - 13) * mm, 2 * mm, fill=0, stroke=1)
        line_start = y - 20 * mm
        for line_index in range(max(1, int((height_mm - 18) / 8))):
            c.line(24 * mm, line_start - line_index * 8 * mm, 186 * mm, line_start - line_index * 8 * mm)
        y -= (height_mm + 5) * mm
    checkbox(c, 18 * mm, 27 * mm, "이 결론은 단일 자료가 아닌 교차검증을 바탕으로 작성했습니다.", 174 * mm)
    page_footer(c, 1)
    c.save()


def build_answer_key(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    page_header(c, "CASE 017 교사용 정답표", "TEACHER ONLY")
    y = PAGE_H - 43 * mm
    c.setFillColor(RED)
    c.setFont("SCoreBold", 9)
    c.drawString(18 * mm, y, "학생에게 배포하지 마십시오.")
    y -= 15 * mm
    answers = [
        ("PIN", "1017 - 축제 개막일 10월 17일"),
        ("증거 코드", "DF-2048"),
        ("복구 파일", "IMG_2048.jpg"),
        ("결론 인물", "용의자 C 박도윤"),
        ("결정 특징", "밝은 캔버스 운동화 / 좁은 반사형 가방끈"),
        ("배제 근거", "용의자 B는 18:39-18:49 체육관 공연 영상과 위치 기록으로 확인"),
    ]
    for label, value in answers:
        c.setFillColor(LIGHT)
        c.rect(18 * mm, y - 15 * mm, 174 * mm, 14 * mm, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.setFont("SCoreBold", 8)
        c.drawString(23 * mm, y - 9 * mm, label)
        draw_wrapped(c, value, 55 * mm, y - 9 * mm, 130 * mm, size=8, leading=4.5 * mm)
        y -= 18 * mm
    y -= 5 * mm
    c.setFillColor(NAVY)
    c.setFont("SCoreBold", 12)
    c.drawString(18 * mm, y, "정답 타임라인")
    y -= 10 * mm
    timeline = [
        ("18:32:14", "한지원이 모금함을 행사실에 보관"),
        ("18:40:52", "박도윤의 행사실 관련 메시지"),
        ("18:42:17", "목격 사진 IMG_2048.jpg 촬영"),
        ("18:43:06", "IMG_2048.jpg 삭제 흔적"),
        ("18:44:12", "박도윤과 목격자의 통화"),
        ("18:47:03", "같은 특징의 인물이 행사실 방향 진입"),
    ]
    for time, detail in timeline:
        c.setStrokeColor(LINE)
        c.line(25 * mm, y - 3 * mm, 25 * mm, y - 14 * mm)
        c.setFillColor(BLUE)
        c.circle(25 * mm, y - 3 * mm, 2 * mm, fill=1, stroke=0)
        c.setFont("SCoreBold", 8)
        c.drawString(34 * mm, y, time)
        c.setFillColor(CHARCOAL)
        c.setFont("SCore", 8)
        c.drawString(65 * mm, y, detail)
        y -= 18 * mm
    page_footer(c, 1, teacher_only=True)
    c.save()


def build_lesson_guide(output: Path) -> None:
    c = KoreanCanvas(str(output), pagesize=A4, pageCompression=1)
    pages = [
        (
            "수업 개요와 준비",
            [
                ("수업 목표", "실제 스마트폰과 microSD를 증거물로 취급하고, 웹 추출 데이터와 교차검증해 사건을 재구성한다."),
                ("권장 운영", "중학교 1-3학년 / 모둠별 3-5명 / 60분형 권장"),
                ("모둠 준비물", "공폰 1대, microSD 1개, 카드리더기 1개, 분석 노트북 1대, 증거봉투와 출력물"),
                ("핵심 원칙", "공폰은 가짜 앱을 실행하는 장치가 아니라 실제 갤러리, 파일 구조와 저장매체를 조사하는 현장 증거물이다."),
                ("안전", "개인 기기를 조사하지 않으며, 복구 결과는 microSD가 아닌 노트북의 별도 폴더에 저장한다."),
            ],
        ),
        (
            "60분 수업 진행",
            [
                ("1. 브리핑 - 5분", "CCTV를 관찰하고 사실과 추측을 구분한다."),
                ("2. 증거물 E-01 - 9분", "PIN 1017을 풀고 실제 갤러리와 파일 앱을 조사한다."),
                ("3. 증거 등록 - 8분", "결정 사진이 없고 외부 저장매체가 있다는 사실을 확인한다."),
                ("4. 삭제 복구 - 14분", "microSD를 분리하고 IMG_2048.jpg를 노트북 폴더로 복구한다."),
                ("5. 웹 분석 - 9분", "메타데이터, CCTV, 메시지, 통화기록을 비교한다."),
                ("6. 타임라인 - 8분", "발생 시각순으로 증거를 정렬한다."),
                ("7. 보고서 - 4분", "세 가지 이상 증거로 결론을 작성한다."),
                ("8. 직업 연결 - 3분", "보존, 획득, 분석, 검증, 보고의 실제 업무와 연결한다."),
            ],
        ),
        (
            "교사 힌트와 평가",
            [
                ("공폰 조사 힌트", "사진만 보지 말고 파일 앱과 저장 위치를 확인하게 한다."),
                ("삭제 복구 힌트", "흔적 발견과 내용 복구는 다르다는 점을 질문한다."),
                ("인물 판별 힌트", "검은 옷이 아니라 바꾸기 어려운 작은 특징 두 가지를 찾게 한다."),
                ("평가 25점", "증거 취급 절차와 원본 보존"),
                ("평가 30점", "파일 상태, 시각, 메타데이터 판독 정확성"),
                ("평가 30점", "독립된 증거 3개 이상의 교차검증"),
                ("평가 15점", "사실과 추측을 구분한 보고와 협업"),
            ],
        ),
    ]
    for page_no, (title, items) in enumerate(pages, start=1):
        page_header(c, f"CASE 017 교사용 수업지도안 - {title}")
        y = PAGE_H - 45 * mm
        for heading, body in items:
            c.setFillColor(PALE_BLUE)
            c.roundRect(18 * mm, y - 25 * mm, 174 * mm, 22 * mm, 2 * mm, fill=1, stroke=0)
            c.setFillColor(NAVY)
            c.setFont("SCoreBold", 9)
            c.drawString(24 * mm, y - 11 * mm, heading)
            draw_wrapped(c, body, 24 * mm, y - 18 * mm, 160 * mm, size=7.6, leading=4.5 * mm)
            y -= 29 * mm
        page_footer(c, page_no, teacher_only=True)
        if page_no < len(pages):
            c.showPage()
    c.save()


def merge_pdfs(inputs: list[Path], output: Path) -> None:
    writer = PdfWriter()
    for source in inputs:
        reader = PdfReader(str(source))
        for page in reader.pages:
            writer.add_page(page)
    with output.open("wb") as stream:
        writer.write(stream)


def build_zip(output: Path, entries: list[tuple[Path, str]]) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source, archive_name in entries:
            archive.write(source, archive_name)


def main() -> None:
    if TEMP.exists():
        shutil.rmtree(TEMP)
    TEMP.mkdir(parents=True, exist_ok=True)
    PRINTABLES.mkdir(parents=True, exist_ok=True)
    regular_ttf, bold_ttf = ensure_fonts()

    build_festival_schedule(PHONE_FILES / "Documents" / "festival_schedule.pdf")
    build_event_map(PHONE_FILES / "Download" / "event_map.jpg", regular_ttf, bold_ttf)

    outputs = [
        PRINTABLES / "01_evidence_envelope_label.pdf",
        PRINTABLES / "02_case_briefing_card.pdf",
        PRINTABLES / "03_evidence_number_labels.pdf",
        PRINTABLES / "04_suspect_cards.pdf",
        PRINTABLES / "05_evidence_cards.pdf",
        PRINTABLES / "06_timeline_worksheet.pdf",
        PRINTABLES / "07_investigation_notes.pdf",
        PRINTABLES / "08_final_investigation_report.pdf",
        PRINTABLES / "09_teacher_answer_key.pdf",
        PRINTABLES / "10_teacher_lesson_guide.pdf",
    ]
    builders = [
        build_envelope_labels,
        build_briefing_card,
        build_number_labels,
        build_suspect_cards,
        build_evidence_cards,
        build_timeline_worksheet,
        build_notes,
        build_final_report,
        build_answer_key,
        build_lesson_guide,
    ]
    for builder, output in zip(builders, outputs, strict=True):
        builder(output)

    merge_pdfs(outputs, PRINTABLES / "CASE017_PRINT_ALL.pdf")
    download_root = PRINTABLES.parent
    phone_image_root = PUBLIC / "case017" / "phone-images"
    sd_pack_root = PUBLIC / "case017" / "sd-pack"
    build_zip(
        download_root / "CASE017_PHONE_IMAGES.zip",
        [(phone_image_root / f"IMG_{number}.jpg", f"IMG_{number}.jpg") for number in range(2039, 2046)],
    )
    build_zip(
        download_root / "CASE017_SD_PACK.zip",
        [(sd_pack_root / f"IMG_{number}.jpg", f"IMG_{number}.jpg") for number in (2039, 2040, 2041, 2042, 2048)],
    )
    build_zip(
        download_root / "CASE017_PHONE_FILES.zip",
        [
            (PHONE_FILES / "Documents" / "festival_schedule.pdf", "Documents/festival_schedule.pdf"),
            (PHONE_FILES / "Download" / "event_map.jpg", "Download/event_map.jpg"),
        ],
    )
    printable_entries = [(item, item.name) for item in outputs]
    printable_entries.append((PRINTABLES / "CASE017_PRINT_ALL.pdf", "CASE017_PRINT_ALL.pdf"))
    build_zip(download_root / "CASE017_PRINTABLES.zip", printable_entries)
    print(f"Generated {len(outputs) + 2} PDFs, event_map.jpg, and 4 ZIP packs")


if __name__ == "__main__":
    main()
