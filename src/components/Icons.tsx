/** Набор иконок: тонкие штриховые, 24×24, цвет наследуется. */

type Props = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconPlay = ({ size = 20, className }: Props) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const IconPause = ({ size = 20, className }: Props) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <rect x="7" y="5" width="3.6" height="14" rx="1.2" />
    <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" />
  </svg>
);

export const IconNext = ({ size = 20, className }: Props) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M6 5.8v12.4a1 1 0 0 0 1.53.85l8.2-5.9a1 1 0 0 0 0-1.7l-8.2-5.9A1 1 0 0 0 6 5.8Z" />
    <rect x="17.4" y="5" width="2.4" height="14" rx="1.2" />
  </svg>
);

export const IconPrev = ({ size = 20, className }: Props) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M18 5.8v12.4a1 1 0 0 1-1.53.85l-8.2-5.9a1 1 0 0 1 0-1.7l8.2-5.9A1 1 0 0 1 18 5.8Z" />
    <rect x="4.2" y="5" width="2.4" height="14" rx="1.2" />
  </svg>
);

export const IconWave = ({ size = 20, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12c2.2 0 2.6-6 5-6s2.8 12 5 12 2.8-9 5-9 2.2 3 3 3" />
  </svg>
);

export const IconSearch = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const IconHeart = ({ size = 18, className, filled }: Props & { filled?: boolean }) => (
  <svg
    {...base(size)}
    className={className}
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
  >
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6Z" />
  </svg>
);

export const IconVolume = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9.5h3l4-3.2v11.4l-4-3.2H4z" />
    <path d="M15 9.2a4 4 0 0 1 0 5.6" />
    <path d="M17.6 6.8a7.5 7.5 0 0 1 0 10.4" />
  </svg>
);

export const IconVolumeLow = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9.5h3l4-3.2v11.4l-4-3.2H4z" />
    <path d="M15 9.2a4 4 0 0 1 0 5.6" />
  </svg>
);

export const IconVolumeMute = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9.5h3l4-3.2v11.4l-4-3.2H4z" />
    <path d="m15 10 4 4M19 10l-4 4" />
  </svg>
);

export const IconMinimize = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14" />
  </svg>
);

export const IconMaximize = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
  </svg>
);

export const IconClose = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </svg>
);

export const IconRefresh = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4v4h-4" />
  </svg>
);

export const IconLogout = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M15 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8" />
    <path d="M18 12H10m8 0-3-3m3 3-3 3" />
  </svg>
);

export const IconSparkle = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
    <path d="M12 9.5 13 12l2.5 1L13 14l-1 2.5L11 14l-2.5-1L11 12z" />
  </svg>
);

export const IconNote = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M9 18V6.5l9-2V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="15.5" cy="16" r="2.5" />
  </svg>
);

export const IconDislike = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M7 4h10.5a2 2 0 0 1 1.94 1.5l1.1 4.2a2 2 0 0 1-1.93 2.55H13l.9 4.2A2.2 2.2 0 0 1 11.7 19l-3.2-6.2" />
    <path d="M7 4H4.5v8.25H7z" />
  </svg>
);

export const IconBan = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="m6.6 6.6 10.8 10.8" />
  </svg>
);

export const IconMore = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <circle cx="12" cy="5.4" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="18.6" r="1.7" />
  </svg>
);

export const IconSettings = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.54h.09A1.7 1.7 0 0 0 10.1 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.46 9v.09a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z" />
  </svg>
);

export const IconPalette = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M12 4a8 8 0 1 0 0 16c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.6 1.7-1.6H16a4 4 0 0 0 4-4c0-3.5-3.6-6.4-8-6.4Z" />
    <circle cx="8.2" cy="11" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="10.8" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="8.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconInfo = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.2M12 7.9v.1" />
  </svg>
);

export const IconTelegram = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M20.5 4.3 3.9 10.6c-.9.35-.87 1.6.04 1.9l3.9 1.28 1.5 4.7c.27.85 1.37 1 1.9.28l2.1-2.85 4 2.9c.7.5 1.7.12 1.87-.73l2.06-12.3c.16-.94-.78-1.7-1.67-1.35Z" />
    <path d="m7.9 13.8 9.6-6.6-7.6 7.5" />
  </svg>
);

export const IconCheck = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconQueue = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h11M4 12h11M4 17h7" />
    <path d="M18 9v7.5" />
    <circle cx="16.2" cy="17.3" r="1.8" />
    <circle cx="19.8" cy="16.5" r="1.8" />
  </svg>
);

export const IconExternal = ({ size = 16, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </svg>
);

export const IconImage = ({ size = 18, className }: Props) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4.5 17 4.6-4.6a1.6 1.6 0 0 1 2.3 0l3.2 3.2" />
    <path d="m13.6 15.6 1.6-1.6a1.6 1.6 0 0 1 2.3 0l2 2" />
  </svg>
);
