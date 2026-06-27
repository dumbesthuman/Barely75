import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const createIcon = (path: ReactNode) => {
  const Icon = (props: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {path}
    </svg>
  );

  return Icon;
};

export const ChartIcon = createIcon(
  <>
    <path d="M5 18V10" />
    <path d="M12 18V6" />
    <path d="M19 18v-4" />
  </>,
);

export const CalendarIcon = createIcon(
  <>
    <path d="M7 3v3" />
    <path d="M17 3v3" />
    <path d="M4 9h16" />
    <rect x="4" y="5" width="16" height="15" rx="4" />
  </>,
);

export const LayersIcon = createIcon(
  <>
    <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
    <path d="m4 12 8 4.5 8-4.5" />
    <path d="m4 16.5 8 4.5 8-4.5" />
  </>,
);

export const PlusIcon = createIcon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const SettingsIcon = createIcon(
  <>
    <path d="M10.4 2.6a1 1 0 0 1 1.2 0l1.1.8a1 1 0 0 0 .9.1l1.3-.5a1 1 0 0 1 1.2.5l.6 1.3a1 1 0 0 0 .7.6l1.4.2a1 1 0 0 1 .8.9l.1 1.5a1 1 0 0 0 .4.8l1.1.9a1 1 0 0 1 .2 1.2l-.7 1.3a1 1 0 0 0 0 .9l.7 1.3a1 1 0 0 1-.2 1.2l-1.1.9a1 1 0 0 0-.4.8l-.1 1.5a1 1 0 0 1-.8.9l-1.4.2a1 1 0 0 0-.7.6l-.6 1.3a1 1 0 0 1-1.2.5l-1.3-.5a1 1 0 0 0-.9.1l-1.1.8a1 1 0 0 1-1.2 0l-1.1-.8a1 1 0 0 0-.9-.1l-1.3.5a1 1 0 0 1-1.2-.5l-.6-1.3a1 1 0 0 0-.7-.6l-1.4-.2a1 1 0 0 1-.8-.9l-.1-1.5a1 1 0 0 0-.4-.8l-1.1-.9a1 1 0 0 1-.2-1.2l.7-1.3a1 1 0 0 0 0-.9l-.7-1.3a1 1 0 0 1 .2-1.2l1.1-.9a1 1 0 0 0 .4-.8l.1-1.5a1 1 0 0 1 .8-.9l1.4-.2a1 1 0 0 0 .7-.6l.6-1.3a1 1 0 0 1 1.2-.5l1.3.5a1 1 0 0 0 .9-.1l1.1-.8Z" />
    <circle cx="12" cy="12" r="3.2" />
  </>,
);

export const ArrowDownIcon = createIcon(<path d="m6 9 6 6 6-6" />);
export const TrashIcon = createIcon(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-12" />
  </>,
);

export const PencilIcon = createIcon(
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>,
);

export const LinkIcon = createIcon(
  <>
    <path d="M10 13a3.5 3.5 0 0 0 4.95 0l2.12-2.12a3.5 3.5 0 0 0-4.95-4.95L10.6 7.4" />
    <path d="M14 11a3.5 3.5 0 0 0-4.95 0L6.93 13.12a3.5 3.5 0 0 0 4.95 4.95L13.4 16.6" />
  </>,
);

export const CheckIcon = createIcon(<path d="M5 12.5 10 17.5 19 7.5" />);

export const ChevronLeftIcon = createIcon(<path d="m15 6-6 6 6 6" />);
export const ChevronRightIcon = createIcon(<path d="m9 6 6 6-6 6" />);
export const DownloadIcon = createIcon(
  <>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </>,
);

export const UploadIcon = createIcon(
  <>
    <path d="M12 20V9" />
    <path d="m17 14-5-5-5 5" />
    <path d="M5 4h14" />
  </>,
);

export const RefreshIcon = createIcon(
  <>
    <path d="M20 11a8 8 0 1 0 2 5.3" />
    <path d="M20 4v7h-7" />
  </>,
);

export const SunMoonIcon = createIcon(
  <>
    <path d="M12 3v2" />
    <path d="M12 19v2" />
    <path d="m4.9 4.9 1.4 1.4" />
    <path d="m17.7 17.7 1.4 1.4" />
    <path d="M3 12h2" />
    <path d="M19 12h2" />
    <path d="m4.9 19.1 1.4-1.4" />
    <path d="m17.7 6.3 1.4-1.4" />
    <circle cx="12" cy="12" r="4.2" />
  </>,
);

export const SparkIcon = createIcon(
  <>
    <path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3Z" />
  </>,
);

export const FlameIcon = createIcon(
  <>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17h2a2.5 2.5 0 0 0 0-5c-.77 0-1.5.32-2 .85V11a2 2 0 0 0-4 0c0 1.1.45 2.1 1.17 2.83" />
    <path d="M12 17c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3" />
    <path d="M14 3c0 4.5-4 5-4 9" />
  </>,
);

export const AlertTriangleIcon = createIcon(
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
);

export const NoteIcon = createIcon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </>,
);

export const CheckAllIcon = createIcon(
  <>
    <path d="M3 12 9 18 21 6" />
    <path d="M9 12l6-6" />
  </>,
);

export const XIcon = createIcon(
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);

export const TrendingUpIcon = createIcon(
  <>
    <path d="m22 7-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </>,
);
