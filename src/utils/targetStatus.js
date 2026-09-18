// 0% = not started yet, 1-49% = still catching up, 50-99% = on pace to
// finish the period on target, exactly 100% = target met, over 100% =
// target exceeded. Takes the raw (uncapped) percentage — the visual 100%
// cap is applied separately, only for progress bar width, so "achieved" and
// "exceeded" stay distinguishable. Shared by MyTarget.jsx and Reports.jsx
// (Target Achievement tab) so both surfaces agree on the same thresholds.
export function getTargetStatus(rawPct) {
  const pct = Number(rawPct) || 0;
  if (pct <= 0) return { label: "Not Started", tone: "gray" };
  if (pct < 50) return { label: "In Progress", tone: "orange" };
  if (pct < 100) return { label: "On Track", tone: "blue" };
  if (pct > 100) return { label: "Target Exceeded", tone: "green" };
  return { label: "Target Achieved", tone: "green" };
}
