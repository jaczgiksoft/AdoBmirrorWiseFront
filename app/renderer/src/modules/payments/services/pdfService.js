import jsPDF from "jspdf";
import logo from "@/assets/images/logo/BWISE-Logo.png";

const formatCurrency = (value) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(value);

const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toISOString().replace("T", " ").substring(0, 19);
};

export async function generatePaymentPDF(payment, user) {
    const doc = new jsPDF();

    // 🎨 PALETA (alineada con design system)
    const primary = [0, 184, 219];        // #00b8db
    const primarySoft = [224, 247, 250];  // soft primary
    const dark = [15, 23, 42];            // #0f172a
    const secondary = [30, 41, 59];       // #1e293b
    const gray = [100, 116, 139];         // slate-500
    const lightGray = [248, 250, 252];    // slate-50

    // ───────────────── HEADER ─────────────────
    doc.setFillColor(...primary);
    doc.rect(0, 0, 210, 26, "F");

    const img = new Image();
    img.src = logo;
    await new Promise((resolve) => (img.onload = resolve));

    doc.addImage(img, "PNG", 14, 5, 16, 16);

    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(user?.tenant?.name || "BWISE Dental", 34, 12);

    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(user?.tenant?.legal_name || "", 34, 17);
    doc.text(`RFC: ${user?.tenant?.tax_id || "-"}`, 34, 21);

    // 📍 DIRECCIÓN DERECHA
    doc.setFontSize(7);
    doc.text(`${user?.tenant?.address || ""}`, 196, 10, { align: "right" });
    doc.text(`${user?.tenant?.city || ""}, ${user?.tenant?.state || ""}`, 196, 14, { align: "right" });
    doc.text(`Tel: ${user?.tenant?.contact_phone || "-"}`, 196, 18, { align: "right" });

    // ───────────────── STATUS BADGE PRO ─────────────────
    let statusColor = [120, 120, 120];
    let statusBg = [230, 230, 230];
    let statusIcon = "●"; // fallback

    if (payment.status === "paid") {
        statusColor = [16, 185, 129];
        statusBg = [220, 252, 231];
        statusIcon = "✔";
    }

    if (payment.status === "partial") {
        statusColor = [245, 158, 11];
        statusBg = [254, 243, 199];
        statusIcon = "▲";
    }

    if (payment.status === "pending") {
        statusColor = [239, 68, 68];
        statusBg = [254, 226, 226];
        statusIcon = "✖";
    }

    const badgeWidth = 100;
    const badgeHeight = 13;
    const badgeX = 14;
    const badgeY = 32;

    // Fondo
    doc.setFillColor(...statusBg);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 6, 6, "F");

    // Línea izquierda tipo accent (🔥 detalle pro)
    doc.setFillColor(...statusColor);
    doc.rect(badgeX, badgeY, 4, badgeHeight, "F");

    // Texto + icono
    doc.setTextColor(...statusColor);
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");

    // Icono
    doc.text(
        statusIcon,
        badgeX + 10,
        badgeY + 8
    );

    // Texto
    doc.text(
        payment.status.toUpperCase(),
        badgeX + 20,
        badgeY + 8
    );

    // ───────────────── INFO ─────────────────
    let y = 50;

    doc.setTextColor(...dark);
    doc.setFontSize(10);

    doc.setFont(undefined, "bold");
    doc.text("Paciente:", 14, y);
    doc.setFont(undefined, "normal");
    doc.text(`${payment.patient_name} (${payment.patient_id})`, 45, y);

    doc.setFont(undefined, "bold");
    doc.text("Folio:", 120, y);
    doc.setFont(undefined, "normal");
    doc.text(payment.id, 145, y);

    y += 7;

    doc.setFont(undefined, "bold");
    doc.text("Fecha:", 14, y);
    doc.setFont(undefined, "normal");
    doc.text(formatDateTime(payment.created_at), 45, y);

    doc.setFont(undefined, "bold");
    doc.text("Método:", 120, y);
    doc.setFont(undefined, "normal");
    doc.text(payment.method.toUpperCase(), 145, y);

    doc.setDrawColor(230);
    doc.line(14, y - 5, 196, y - 5);

    // ───────────────── TABLA ─────────────────
    y += 12;

    doc.setFillColor(...primarySoft);
    doc.rect(14, y, 182, 10, "F");

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...dark);

    const headerY = y + 6.5;

    doc.text("Concepto", 18, headerY);
    doc.text("Cant.", 110, headerY, { align: "right" });
    doc.text("Precio", 150, headerY, { align: "right" });
    doc.text("Total", 190, headerY, { align: "right" });

    y += 11;

    doc.setFont(undefined, "normal");

    payment.ticket.items.forEach((item, index) => {
        const rowHeight = 11;
        const textY = y + 4;

        // zebra más elegante
        if (index % 2 === 0) {
            doc.setFillColor(241, 245, 249);
            doc.rect(14, y - 2, 182, rowHeight, "F");
        }

        doc.setTextColor(...dark);

        doc.text(item.name, 18, textY);
        doc.text(String(item.qty), 110, textY, { align: "right" });
        doc.text(formatCurrency(item.price), 150, textY, { align: "right" });
        doc.text(formatCurrency(item.total), 190, textY, { align: "right" });

        y += rowHeight;
    });

    doc.setDrawColor(220);
    doc.line(14, y, 196, y);

    // ───────────────── TOTAL BOX ─────────────────
    y += 5;

    doc.setFillColor(...lightGray);
    doc.roundedRect(120, y, 76, 30, 5, 5, "F");

    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text(formatCurrency(payment.total), 190, y + 8, { align: "right" });

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    doc.setTextColor(...secondary);
    doc.text("Pagado", 125, y + 16);

    doc.setTextColor(...dark);
    doc.text(formatCurrency(payment.received), 190, y + 16, { align: "right" });

    doc.setTextColor(...secondary);
    doc.text("Cambio", 125, y + 24);

    doc.setTextColor(...dark);
    doc.text(formatCurrency(payment.ticket.change), 190, y + 24, { align: "right" });

    // ───────────────── FOOTER ─────────────────
    const footerY1 = 285;
    const footerY2 = 290;

    // izquierda
    doc.setFontSize(7);
    doc.setTextColor(180);

    doc.text(`Ref: ${payment.id}`, 14, footerY1);
    doc.text(`Generado: ${formatDateTime(new Date())}`, 14, footerY2);

    // centro
    doc.setFontSize(8);
    doc.setTextColor(...gray);

    doc.text("Gracias por su preferencia", 105, footerY1, { align: "center" });
    doc.text("Comprobante de pago • No es factura fiscal", 105, footerY2, { align: "center" });

    // derecha (paginación)
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFontSize(7);
        doc.setTextColor(180);

        doc.text(`Página ${i} de ${pageCount}`, 196, footerY1, { align: "right" });
    }

    // ───────────────── SAVE ─────────────────
    doc.save(`pago_${payment.id}.pdf`);
}