/**
 * Injects @media print rules that hide the entire page except
 * whatever is inside an element with the "printable-order" class.
 * Mount this once anywhere in the tree that needs print support.
 */
const PrintStyles = () => (
  <style>{`
    @media print {
      body * {
        visibility: hidden;
      }

      .printable-order,
      .printable-order * {
        visibility: visible;
      }

      .printable-order {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        padding: 24px;
      }

      .no-print {
        display: none !important;
      }
    }
  `}</style>
);

export default PrintStyles;