import Icon from "./Icon.jsx";
import "./StarRating.css";

export default function StarRating({ value, max = 5, size = 13, showValue = true }) {
  const filled = Math.round(value);

  return (
    <div className="star-rating">
      <span className="star-rating-stars">
        {Array.from({ length: max }, (_, i) => (
          <Icon key={i} name="star" size={size} filled={i < filled} />
        ))}
      </span>
      {showValue && <span className="star-rating-value">{value}</span>}
    </div>
  );
}
