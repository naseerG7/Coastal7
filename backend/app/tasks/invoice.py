import os
import time
from pathlib import Path
from decimal import Decimal
from typing import Dict, Any

from app.core.celery_app import (
    celery_app,
    update_task_progress,
    complete_task,
    fail_task,
)

def _generate_pdf_with_reportlab(
    pdf_path: Path,
    order_data: Dict[str, Any],
):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )

    # Register Arial font.
    arial_path = r"C:\Windows\Fonts\arial.ttf"

    if "ArialUnicode" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(
            TTFont("ArialUnicode", arial_path)
        )

    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=35,
        bottomMargin=35,
    )

    navy = colors.HexColor("#172033")
    light_gray = colors.HexColor("#F4F7FA")
    border_gray = colors.HexColor("#DCE3EB")
    text_gray = colors.HexColor("#555555")

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ShopFlowTitle",
            parent=styles["Title"],
            fontName="ArialUnicode",
            fontSize=23,
            leading=28,
            textColor=navy,
            alignment=0,
            spaceAfter=2,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ShopFlowSubtitle",
            parent=styles["Normal"],
            fontName="ArialUnicode",
            fontSize=10,
            leading=13,
            textColor=text_gray,
            spaceAfter=15,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ShopFlowNormal",
            parent=styles["Normal"],
            fontName="ArialUnicode",
            fontSize=9,
            leading=13,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ShopFlowFooter",
            parent=styles["Normal"],
            fontName="ArialUnicode",
            fontSize=9,
            leading=13,
            textColor=text_gray,
            italic=True,
        )
    )

    story = []

    # Order and customer information.
    order_id = order_data.get("id", "")
    customer_name = order_data.get("customer_name", "Customer")
    customer_email = order_data.get("customer_email", "")
    order_date = str(order_data.get("created_at", ""))
    order_status = (
        str(order_data.get("status", "Pending"))
        .replace("_", " ")
        .title()
    )
    payment_status = str(
        order_data.get("payment_status", "Confirmed")
    ).title()

    story.append(
        Paragraph(
            "ShopFlow — Official Tax Invoice",
            styles["ShopFlowTitle"],
        )
    )

    story.append(
        Paragraph(
            "E-Commerce Order Receipt &amp; Invoice",
            styles["ShopFlowSubtitle"],
        )
    )

    invoice_number = (
        f"INV-{int(order_id):06d}"
        if str(order_id).isdigit()
        else f"INV-{order_id}"
    )

    metadata = [
        [
            Paragraph(
                f"<b>Invoice #:</b> {invoice_number}",
                styles["ShopFlowNormal"],
            ),
            Paragraph(
                f"<b>Customer Name:</b> {customer_name}",
                styles["ShopFlowNormal"],
            ),
        ],
        [
            Paragraph(
                f"<b>Order Date:</b> {order_date}",
                styles["ShopFlowNormal"],
            ),
            Paragraph(
                f"<b>Email:</b> {customer_email}",
                styles["ShopFlowNormal"],
            ),
        ],
        [
            Paragraph(
                f"<b>Order Status:</b> {order_status}",
                styles["ShopFlowNormal"],
            ),
            Paragraph(
                f"<b>Payment Status:</b> {payment_status}",
                styles["ShopFlowNormal"],
            ),
        ],
    ]

    metadata_table = Table(
        metadata,
        colWidths=[290, 290],
    )

    metadata_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    light_gray,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "LINEBELOW",
                    (0, -1),
                    (-1, -1),
                    1,
                    border_gray,
                ),
            ]
        )
    )

    story.append(metadata_table)
    story.append(Spacer(1, 20))

    # Product table.
    items = order_data.get("items") or []

    item_rows = [
        [
            "#",
            "Item Description",
            "Unit Price",
            "Qty",
            "Total (INR)",
        ]
    ]

    subtotal = 0.0

    for index, item in enumerate(items, start=1):
        product_name = str(
            item.get("product_name")
            or item.get("name")
            or "Product"
        )

        quantity = int(item.get("quantity", 1) or 1)

        unit_price = float(
            item.get(
                "price",
                item.get("unit_price", 0),
            )
            or 0
        )

        line_total = float(
            item.get(
                "item_total",
                item.get(
                    "total",
                    unit_price * quantity,
                ),
            )
            or 0
        )

        subtotal += line_total

        item_rows.append(
            [
                str(index),
                Paragraph(
                    product_name,
                    styles["ShopFlowNormal"],
                ),
                f"{unit_price:,.2f}",
                str(quantity),
                f"{line_total:,.2f}",
            ]
        )

    product_table = Table(
        item_rows,
        colWidths=[30, 285, 85, 45, 105],
        repeatRows=1,
    )

    product_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    navy,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, -1),
                    "ArialUnicode",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "LEADING",
                    (0, 0),
                    (-1, -1),
                    12,
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (0, -1),
                    "CENTER",
                ),
                (
                    "ALIGN",
                    (2, 1),
                    (-1, -1),
                    "RIGHT",
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    border_gray,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(product_table)
    story.append(Spacer(1, 18))

    # Invoice totals.
    order_total = float(
        order_data.get("total_amount", subtotal) or 0
    )

    shipping = float(
        order_data.get("shipping_amount", 0) or 0
    )

    tax = float(
        order_data.get("tax_amount", 0) or 0
    )

    totals_data = [
        ["Subtotal:", f"INR {subtotal:,.2f}"],
        [
            "Shipping & Delivery:",
            "FREE" if shipping == 0 else f"INR {shipping:,.2f}",
        ],
        ["Tax (Included):", f"INR {tax:,.2f}"],
        ["Total Amount:", f"INR {order_total:,.2f}"],
    ]

    totals_table = Table(
        totals_data,
        colWidths=[180, 120],
        hAlign="RIGHT",
    )

    totals_table.setStyle(
        TableStyle(
            [
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, -1),
                    "ArialUnicode",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (-1, -1),
                    "RIGHT",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "LINEABOVE",
                    (0, -1),
                    (-1, -1),
                    1,
                    navy,
                ),
                (
                    "FONTNAME",
                    (0, -1),
                    (-1, -1),
                    "ArialUnicode",
                ),
                (
                    "FONTSIZE",
                    (0, -1),
                    (-1, -1),
                    12,
                ),
            ]
        )
    )

    story.append(totals_table)
    story.append(Spacer(1, 35))

    story.append(
        Paragraph(
            "Thank you for your business! This is an electronically "
            "generated invoice from ShopFlow. Questions? Reach out to "
            "support@shopflow.com.",
            styles["ShopFlowFooter"],
        )
    )

    doc.build(story)

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    story = []

    # Title / Header
    header_style = ParagraphStyle(
        "HeaderStyle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#172033"),
        spaceAfter=6,
    )
    sub_style = ParagraphStyle(
        "SubStyle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#555555"),
    )

    story.append(Paragraph("<b>ShopFlow</b> — Official Tax Invoice", header_style))
    story.append(Paragraph("E-Commerce Order Receipt & Invoice", sub_style))
    story.append(Spacer(1, 15))

    # Order Meta Table
    order_id = order_data.get("id", "N/A")
    created_at = str(order_data.get("created_at", "N/A"))[:19]
    status = str(order_data.get("status", "pending")).capitalize()
    customer_name = order_data.get("customer_name", "Valued Customer")
    customer_email = order_data.get("customer_email", "customer@shopflow.com")

    meta_data = [
        [
            Paragraph(f"<b>Invoice #:</b> INV-{order_id:06d}" if isinstance(order_id, int) else f"<b>Invoice #:</b> INV-{order_id}", styles["Normal"]),
            Paragraph(f"<b>Customer Name:</b> {customer_name}", styles["Normal"]),
        ],
        [
            Paragraph(f"<b>Order Date:</b> {created_at}", styles["Normal"]),
            Paragraph(f"<b>Email:</b> {customer_email}", styles["Normal"]),
        ],
        [
            Paragraph(f"<b>Order Status:</b> {status}", styles["Normal"]),
            Paragraph("<b>Payment Status:</b> Confirmed", styles["Normal"]),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[260, 270])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#e2e8f0")),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # Items Table
    items = order_data.get("items", [])
    table_data = [
        ["#", "Item Description", "Unit Price", "Qty", "Total (INR)"]
    ]

    for idx, item in enumerate(items, 1):
        name = item.get("product_name", f"Product #{item.get('product_id', idx)}")
        price = float(item.get("price", 0))
        qty = int(item.get("quantity", 1))
        item_total = float(item.get("item_total", price * qty))
        table_data.append([
            str(idx),
            Paragraph(name, styles["Normal"]),
            f"₹{price:,.2f}",
            str(qty),
            f"₹{item_total:,.2f}",
        ])

    items_table = Table(table_data, colWidths=[30, 260, 80, 50, 110])
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#172033")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # Totals Summary
    total_amount = float(order_data.get("total_amount", 0))
    summary_data = [
        ["Subtotal:", f"₹{total_amount:,.2f}"],
        ["Shipping & Delivery:", "FREE"],
        ["Tax (Included):", "₹0.00"],
        ["Total Amount:", f"₹{total_amount:,.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[150, 100], hAlign="RIGHT")
    summary_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 12),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#172033")),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 30))

    # Footer
    footer_text = Paragraph(
        "<i>Thank you for your business! This is an electronically generated invoice from ShopFlow. "
        "Questions? Reach out to support@shopflow.com.</i>",
        styles["Normal"]
    )
    story.append(footer_text)

    doc.build(story)





def _generate_fallback_pdf(pdf_path: Path, order_data: Dict[str, Any]):
    """Generate a branded ShopFlow invoice PDF using only Python."""
    import textwrap

    order_id = order_data.get("id", "N/A")
    customer = str(order_data.get("customer_name", "Customer"))
    email = str(order_data.get("customer_email", ""))
    status = str(order_data.get("status", "pending")).strip().upper()
    date_str = str(order_data.get("created_at", "N/A"))[:19]
    total = float(order_data.get("total_amount", 0) or 0)
    items = order_data.get("items", [])

    def clean(value):
        """Escape text safely for a PDF literal string."""
        value = str(value).encode("cp1252", errors="replace").decode("cp1252")
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    commands = []

    navy = (0.08, 0.16, 0.29)
    blue = (0.13, 0.34, 0.60)
    pale = (0.94, 0.96, 0.99)
    grey = (0.38, 0.43, 0.50)
    green = (0.08, 0.42, 0.25)
    white = (1.0, 1.0, 1.0)

    def rect(x, top, width, height, color):
        r, g, b = color
        bottom = 792 - top - height
        commands.append(
            f"{r:.3f} {g:.3f} {b:.3f} rg "
            f"{x} {bottom} {width} {height} re f"
        )

    def text(x, top, value, size=10, color=navy, bold=False):
        font = "F2" if bold else "F1"
        y = 792 - top - size
        commands.append(
            f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg "
            f"BT /{font} {size} Tf {x} {y} Td "
            f"({clean(value)}) Tj ET"
        )

    def money(value):
        return f"INR {float(value or 0):,.2f}"

    # Branded header.
    rect(0, 0, 595, 150, navy)
    text(42, 32, "SHOPFLOW", 25, white, True)
    text(43, 65, "ONLINE SHOPPING | OFFICIAL INVOICE", 9, (0.82, 0.88, 0.96))
    text(42, 101, "INVOICE", 23, white, True)
    text(43, 130, f"Invoice ID: INV-{order_id}", 10, white)

    badge_color = green if status in {"DELIVERED", "COMPLETED"} else blue
    rect(415, 104, 137, 27, badge_color)
    text(424, 112, status[:20], 10, white, True)

    # Customer and order information.
    text(42, 176, "BILL TO", 9, blue, True)
    text(42, 197, customer[:42], 13, navy, True)
    text(42, 217, email[:48], 9, grey)

    text(330, 176, "ORDER DETAILS", 9, blue, True)
    text(330, 197, f"Order Number: #{order_id}", 10, navy, True)
    text(330, 217, f"Order Date: {date_str}", 9, grey)

    # Item table.
    table_top = 255
    rect(42, table_top, 510, 31, navy)
    text(52, table_top + 9, "ITEM DESCRIPTION", 9, white, True)
    text(365, table_top + 9, "QTY", 9, white, True)
    text(410, table_top + 9, "UNIT PRICE", 8, white, True)
    text(493, table_top + 9, "AMOUNT", 8, white, True)

    row_top = table_top + 31

    if not items:
        rect(42, row_top, 510, 34, pale)
        text(52, row_top + 11, "No order items found", 9, grey)
        row_top += 34

    for index, item in enumerate(items):
        if row_top > 575:
            text(52, 590, "Additional items are not shown on this page.", 9, grey)
            break

        if index % 2 == 0:
            rect(42, row_top, 510, 34, pale)

        name = str(item.get("product_name", "Item"))
        qty = int(item.get("quantity", 1) or 1)
        price = float(item.get("price", 0) or 0)
        amount = float(item.get("item_total", price * qty) or 0)

        # Keep product names on one line to avoid overlapping columns.
        text(52, row_top + 11, name[:42], 9, navy, True)
        text(370, row_top + 11, qty, 9)
        text(410, row_top + 11, f"{price:,.2f}", 8)
        text(490, row_top + 11, f"{amount:,.2f}", 8)
        row_top += 34

    # Totals panel.
    total_top = min(max(row_top + 18, 365), 605)
    rect(320, total_top, 232, 83, pale)
    text(334, total_top + 13, "Delivery", 10, grey)
    text(485, total_top + 13, "FREE", 10, green, True)
    text(334, total_top + 37, "GRAND TOTAL", 11, navy, True)
    text(410, total_top + 59, money(total), 14, blue, True)

    # Footer.
    rect(0, 720, 595, 72, navy)
    text(42, 736, "THANK YOU FOR SHOPPING WITH SHOPFLOW!", 11, white, True)
    text(42, 757, "Your shopping, made simple.", 9, (0.82, 0.88, 0.96))
    text(42, 773, "Computer-generated invoice", 8, (0.82, 0.88, 0.96))

    # Assemble a valid PDF document.
    stream = "\n".join(commands).encode("cp1252", errors="replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 792] "
            b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> "
            b"/Contents 6 0 R >>"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        (
            b"<< /Length " + str(len(stream)).encode("ascii")
            + b" >>\nstream\n" + stream + b"\nendstream"
        ),
    ]

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for number, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")

    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )

    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    
def build_invoice_pdf(order_data: Dict[str, Any], task_id: str | None = None) -> Dict[str, Any]:
    """
    Core function that builds the invoice PDF file and updates progress.
    Can be run synchronously, as a Celery task, or in a background thread.
    """
    order_id = order_data.get("id")

    # Step 1: Progress 15%
    if task_id:
        update_task_progress(
            task_id, 15, 100, 15,
            "Initializing invoice generation..."
        )
    time.sleep(0.3)

    # Output directory
    out_dir = Path("uploads/invoices")
    out_dir.mkdir(parents=True, exist_ok=True)
    filename = f"order_{order_id}_invoice.pdf"
    pdf_path = out_dir / filename

    # Step 2: Progress 45%
    if task_id:
        update_task_progress(
            task_id, 45, 100, 45,
            "Compiling order details and item pricing..."
        )
    time.sleep(0.4)

    # Step 3: Progress 75%
    if task_id:
        update_task_progress(
            task_id, 75, 100, 75,
            "Rendering PDF invoice layout..."
        )
    time.sleep(0.4)

    # Generate the invoice using ReportLab, with fallback if needed
    try:
        _generate_pdf_with_reportlab(pdf_path, order_data)
        print(f"Branded ReportLab invoice generated: {pdf_path}")
    except Exception as reportlab_error:
        print(f"ReportLab invoice generation failed: {reportlab_error}")
        _generate_fallback_pdf(pdf_path, order_data)
        print(f"Fallback invoice generated: {pdf_path}")

    # Step 4: Progress 100%
    result = {
        "order_id": order_id,
        "filename": filename,
        "download_url": f"/uploads/invoices/{filename}",
        "file_size": pdf_path.stat().st_size if pdf_path.exists() else 0,
        "status": "ready",
    }

    if task_id:
        complete_task(
            task_id,
            result,
            f"Invoice for order #{order_id} generated successfully!"
        )

    return result

# =========================================================
# CELERY TASK DEFINITION
# =========================================================

@celery_app.task(bind=True, name="tasks.generate_invoice_pdf")
def generate_invoice_pdf(self, order_data: Dict[str, Any]):
    task_id = self.request.id
    try:
        self.update_state(state="PROGRESS", meta={"current": 10, "total": 100, "percent": 10, "message": "Starting invoice generation..."})
        update_task_progress(task_id, 10, 100, 10, "Starting invoice generation...")

        result = build_invoice_pdf(order_data, task_id=task_id)

        self.update_state(state="SUCCESS", meta=result)
        return result
    except Exception as exc:
        fail_task(task_id, str(exc))
        self.update_state(state="FAILURE", meta={"error": str(exc)})
        raise

