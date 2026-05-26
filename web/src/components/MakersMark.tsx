export function MakersMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect x="2" y="3" width="36" height="34" rx="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
      <path
        d="M20 9c-4 0-7 2.8-7 6.5 0 2.2 1.4 4.1 3.5 5.1L20 28l3.5-7.4c2.1-1 3.5-2.9 3.5-5.1C27 11.8 24 9 20 9z"
        fill="currentColor"
        opacity="0.92"
      />
      <path d="M14 17.5h12M17 21h6" stroke="#111" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <circle cx="31" cy="10" r="2.5" fill="#fbbf24" stroke="#111" strokeWidth="0.8" />
    </svg>
  );
}
