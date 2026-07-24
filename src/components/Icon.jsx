const icons = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  car: (
    <>
      <path d="M5 17h14" />
      <path d="M6 17v-3l2-5h8l2 5v3" />
      <path d="M8 9h8" />
      <circle cx="8" cy="17" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </>
  ),
  pipeline: (
    <>
      <path d="M4 19V9M11 19V5M18 19v-7" />
      <path d="M4 19h14" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.7-3.2 3-5 5.5-5s4.8 1.8 5.5 5" />
      <circle cx="17" cy="8.5" r="2.6" />
      <path d="M15.6 14.2c2 .3 3.7 2 4.3 4.8" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 14v3M9 20h6M9.5 17h5l.5 3H9l.5-3Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.4-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.5 2.4a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4 2 1.4a7.7 7.7 0 0 0 0 3l-2 1.4 2 3.4 2.3-.7c.77.66 1.65 1.17 2.6 1.5L10 22h4l.5-2.4a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4-2-1.4Z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 15l4-3-4-3M18 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10.3 19a1.8 1.8 0 0 0 3.4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.2M12 17.2v.1" />
    </>
  ),
  rocket: (
    <>
      <path d="M13.5 3c3 1 5 3.6 5 7.5 0 2-1 4-2.6 5.6L13.5 18l-3.4-2c-1.6-1.6-2.6-3.6-2.6-5.5C7.5 6.6 10 4 13 3Z" />
      <circle cx="14" cy="9.5" r="1.6" />
      <path d="M9.5 15.5 7 18l-1 3 3-1 2.5-2.5M6.5 12l-2.5.7L3 16" />
    </>
  ),
  cap: (
    <>
      <path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" />
      <path d="M6.5 10.7v4.3c0 1.3 2.5 3 5.5 3s5.5-1.7 5.5-3v-4.3" />
      <path d="M21.5 8.5v6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 15c.3 1 1.2 1.6 2.5 1.6 1.7 0 2.8-.8 2.8-2s-1-1.7-2.8-2c-1.8-.3-2.8-1-2.8-2.1 0-1.2 1.1-2 2.8-2 1.3 0 2.2.6 2.5 1.6" />
    </>
  ),
  cursor: (
    <>
      <path d="M6 3.5 18.5 10 12.7 12.2 10.4 18 6 3.5Z" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="M15 6l-6 6 6 6" />,
  waveHand: (
    <>
      <path d="M9 11V5a1 1 0 0 1 2 0v6" />
      <path d="M12 11V4a1 1 0 0 1 2 0v7" />
      <path d="M15 11V6a1 1 0 0 1 2 0v6" />
      <path d="M18 11V8a1 1 0 0 1 2 0v6a6 6 0 0 1-12 0v-3a1 1 0 0 1 2 0v3" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z" />
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M10 8.3v7.4l6-3.7-6-3.7Z" />
    </>
  ),
  filter: <path d="M4 5h16l-6.5 7.5v5L10.5 20v-7.5L4 5Z" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  edit: (
    <>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M14 6.5 17.5 10" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="12" height="18" rx="1" />
      <path d="M16 21h4V9l-4-3" />
      <path d="M7.5 7h1M11.5 7h1M7.5 11h1M11.5 11h1M7.5 15h1M11.5 15h1" />
    </>
  ),
  presentation: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
      <path d="M7.5 12.5 10.5 9l2 2 3.5-3.5" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4h12l-3 4 3 4H6" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9C9.5 9 8 7.5 8 6a2.2 2.2 0 0 1 4 0 2.2 2.2 0 0 1 4 0c0 1.5-1.5 3-4 3Z" />
    </>
  ),
  barChart: (
    <>
      <path d="M4 20V10M12 20V4M20 20v-7" />
      <path d="M2 20h20" />
    </>
  ),
  pieChart: (
    <>
      <path d="M12 3.5A8.5 8.5 0 1 0 20.5 12H12V3.5Z" />
      <path d="M15.5 3.9A8.5 8.5 0 0 1 20.1 8.5H15.5V3.9Z" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <rect x="8.5" y="3" width="7" height="3.5" rx="1" />
      <path d="M8.5 12h7M8.5 16h4.5" />
    </>
  ),
  gridView: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.2" />
    </>
  ),
  sort: (
    <>
      <path d="M7 4v13M7 17l-3-3M7 17l3-3" />
      <path d="M17 20V7M17 7l3 3M17 7l-3 3" />
    </>
  ),
  listView: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
};

export default function Icon({ name, size = 20, filled = false, style, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {icons[name] || null}
    </svg>
  );
}