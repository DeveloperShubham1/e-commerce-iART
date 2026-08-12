import { buildInvoiceHtml } from "./Invoicetemplate";

/**
 * Opens a blank popup window, writes a self-contained invoice document
 * into it (two copies: Customer + Office), and triggers print.
 *
 * Using a fresh window instead of window.print() on the current page
 * means the browser's print header/footer shows a blank/about:blank
 * URL instead of your app's dev URL (e.g. http://localhost:5174/...),
 * and the tab title shown there is the invoice title we set, not the
 * app's title.
 *
 * Note: browsers still let the user manually show a header/footer via
 * the print dialog's "More settings" — that's a native browser option
 * we can't remove via code. Advise users to leave "Headers and footers"
 * unchecked for the cleanest result.
 */
export function printOrderInvoice({ order, currency, merchant }) {
  if (!order) return;

  const html = buildInvoiceHtml({ order, currency, merchant });

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    // Popup blocked
    alert("Please allow pop-ups for this site to print the invoice.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content/layout to be ready before triggering print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  // Fallback in case onload doesn't fire quickly in some browsers
  setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.focus();
      printWindow.print();
    }
  }, 300);
}