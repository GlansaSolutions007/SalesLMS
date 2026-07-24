import Icon from "./Icon.jsx";
import "./Pagination.css";

function getPageList(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withGaps = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) withGaps.push("gap");
    withGaps.push(page);
  });
  return withGaps;
}

export default function Pagination({ page, totalPages, onPageChange }) {
  const pages = getPageList(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="page-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <Icon name="back" size={15} />
      </button>

      {pages.map((p, i) =>
        p === "gap" ? (
          <span className="page-gap" key={`gap-${i}`}>…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`page-btn${p === page ? " is-active" : ""}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        className="page-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <Icon name="arrow" size={15} />
      </button>
    </nav>
  );
}
