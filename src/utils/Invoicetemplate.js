/**
 * Builds a self-contained HTML document (inline CSS, no external
 * stylesheet needed) for a business-style order invoice — printed
 * as two copies: "Customer Copy" and "Office Copy", one per page.
 */
export function buildInvoiceHtml({ order, currency, merchant = {} }) {
    const {
        name: merchantName = "Fashion Flair",
        address: merchantAddress = "",
        phone: merchantPhone = "",
        email: merchantEmail = "",
    } = merchant;

    const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    const itemsRows = (order.items || [])
        .map(
            (item) => `
        <tr>
          <td>
            <div class="item-name">${escapeHtml(
                item.productId?.name || "Product"
            )}</div>
            <div class="item-meta">Color: ${escapeHtml(item.color || "-")}</div>
          </td>
          <td class="center">${escapeHtml(item.size || "-")}</td>
          <td class="center">${item.quantity ?? 0}</td>
          <td class="right"> ${formatMoney(item.price)}</td>
          <td class="right">${formatMoney(item.price * item.quantity)}</td>
        </tr>`
        )
        .join("");

    const customerBlock = `
    <div class="card">
      <h4>Customer Details</h4>
      <p><strong>${escapeHtml(order.userId?.name || "N/A")}</strong></p>
      <p>${escapeHtml(order.userId?.email || "N/A")}</p>
      <p>${escapeHtml(order.userId?.phone || "N/A")}</p>
    </div>`;

    const shippingBlock = `
    <div class="card">
      <h4>Shipping Address</h4>
      <p>${escapeHtml(order?.address?.firstName || "")} ${escapeHtml(
        order?.address?.lastName || ""
    )}</p>
      <p>${escapeHtml(order?.address?.street || "")}${order?.address?.landmark ? ", " + escapeHtml(order.address.landmark) : ""
        }</p>
      <p>${escapeHtml(order?.address?.city || "")}, ${escapeHtml(
            order?.address?.state || ""
        )} - ${escapeHtml(order?.address?.zipcode || "")}</p>
      <p>${escapeHtml(order?.address?.country || "")}</p>
      <p class="phone">Phone: ${escapeHtml(order?.address?.phone || "N/A")}</p>
    </div>`;

    const merchantContactLine = [merchantAddress, merchantPhone, merchantEmail]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" &nbsp;•&nbsp; ");

    const renderCopy = (copyLabel, isLastCopy) => `
    <section class="page">
      

      <header class="invoice-header">
        <div>
          <div class="brand">${escapeHtml(merchantName)}</div>
          ${merchantContactLine
            ? `<div class="brand-contact">${merchantContactLine}</div>`
            : ""
        }
        </div>
        <div class="invoice-meta">
          <div class="invoice-title">ORDER INVOICE</div>
          <div><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</div>
          <div><strong>Date:</strong> ${escapeHtml(orderDate)}</div>
        </div>
      </header>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="center">Size</th>
            <th class="center">Qty</th>
            <th class="right">Price(${currency})</th>
            <th class="right">Amount(${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row grand">
          <span>Total Amount</span>
          <span>${currency} ${formatMoney(order.totalAmount)}</span>
        </div>
      </div>

      <div class="details-grid">
        ${customerBlock}
        ${shippingBlock}
      </div>

      <footer class="invoice-footer">
        <p>Thank you for shopping with ${escapeHtml(merchantName)}!</p> 
      </footer>
    </section>
    ${!isLastCopy ? '<div class="page-break"></div>' : ""}
  `;

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${escapeHtml(order.orderId)} — ${escapeHtml(
        merchantName
    )}</title>
    <style>${invoiceStyles}</style>
  </head>
  <body>
    ${renderCopy("CUSTOMER COPY", false)}
  </body>
</html>`;
}

function formatMoney(value) {
    const num = Number(value) || 0;
    return num.toLocaleString("en-IN");
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) =>
    ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[ch])
    );
}

const invoiceStyles = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #1f2937;
    margin: 0;
    padding: 0;
  }
  .page {
    padding: 32px 40px;
    max-width: 800px;
    margin: 0 auto;
    position: relative;
  }
  .page-break {
    page-break-after: always;
    break-after: page;
  }
  .copy-tag {
    position: absolute;
    top: 32px;
    right: 40px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #4f46e5;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #111827;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .brand {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
  .brand-contact {
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
  }
  .invoice-meta {
    text-align: right;
    font-size: 13px;
    line-height: 1.6;
  }
  .invoice-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .items-table thead th {
    text-align: left;
    background: #f3f4f6;
    padding: 8px 10px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
  }
  .items-table tbody td {
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
  }
  .item-name { font-weight: 600; }
  .item-meta { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .center { text-align: center; }
  .right { text-align: right; }

  .totals {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    font-size: 15px;
    font-weight: 800;
    border-top: 2px solid #111827;
    padding-top: 8px;
    min-width: 220px;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px 16px;
    background: #fafafa;
    font-size: 13px;
    line-height: 1.5;
  }
  .card h4 {
    margin: 0 0 8px 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
  }
  .card p { margin: 2px 0; }
  .phone { margin-top: 6px; font-weight: 600; }

  .invoice-footer {
    text-align: center;
    border-top: 1px dashed #d1d5db;
    padding-top: 16px;
    font-size: 12px;
    color: #6b7280;
  }
  .invoice-footer p { margin: 2px 0; }
  .fine-print { font-size: 10px; }

  @media print {
    @page { margin: 12mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;