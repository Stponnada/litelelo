import React from 'react';

export const HomeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M3 10.5v9A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 19.5v-9M15.75 21v-6.75A2.25 2.25 0 0013.5 12h-3a2.25 2.25 0 00-2.25 2.25V21" />
  </svg>
);

export const ChatIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12a8.25 8.25 0 018.25-8.25h3.5a8.25 8.25 0 010 16.5H9l-4.5 3v-3.75A8.25 8.25 0 012.25 12z"
    />
  </svg>
);


export const UserIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

export const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.424 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M6.633 10.5l-1.928 1.928a1.5 1.5 0 01-2.121-2.121L6.633 10.5z" />
  </svg>
);

export const ThumbsDownIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.47 10.5c.806 0 1.533.424 2.031 1.08a9.041 9.041 0 002.861 2.4c.723.384 1.35.956 1.653 1.715a4.498 4.498 0 01.322 1.672V21a.75.75 0 00.75.75A2.25 2.25 0 0016.5 19.5c0-1.152-.26-2.243-.723-3.218-.266-.558.107-1.282.725-1.282h3.126c1.026 0 1.945-.694 2.054-1.715.045-.422.068-.85.068-1.285a11.95 11.95 0 00-2.649-7.521c-.388-.482-.987-.729-1.605-.729H13.48c-.483 0-.964.078-1.423-.23l-3.114 1.04a4.501 4.501 0 01-1.423-.23H5.904M7.47 10.5l-1.928-1.928a1.5 1.5 0 00-2.121 2.121L7.47 10.5z" />
  </svg>
);

export const CommentIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

export const SendIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

export const ImageIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const VideoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 15.75l-2.22-8.88a.75.75 0 00-1.423-.23l-3.114 3.114a.75.75 0 11-1.063-1.063l3.114-3.114a.75.75 0 00-.23-1.423L8.25 3.75h-.03a.75.75 0 00-.75.75v.03c0 .02.01.04.02.06l2.36 9.44A.75.75 0 0010.5 15h.03a.75.75 0 00.75-.75V15h.03a.75.75 0 00.75-.75v-.03a.75.75 0 00-.75-.75H10.5v-.03a.75.75 0 00-.75-.75v-.03h.03a.75.75 0 01.75.75v.03h.03a.75.75 0 01.75.75v.03h.03a.75.75 0 01.75.75v.03h.03a.75.75 0 01.75.75v.03h.03a.75.75 0 01.75.75v.03h.03a.75.75 0 01.75.75v.03h.03a.75.75 0 01.75.75v.03Z" />
    </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

// src/components/icons.tsx

// ... keep all your existing icons (HomeIcon, ChatIcon, etc.) ...


export const BookOpenIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

export const AtSymbolIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
  </svg>
);

export const SunIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

export const MoonIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);



export const BuildingStorefrontIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25m11.25 0h8.25a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h3.75m11.25-18l-2.25 .002M5.25 3l2.25 .002M10.5 3l2.25 .002" />
    </svg>
);

export const NewspaperIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
);

export const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.836A.75.75 0 0018.016 6H5.668a.75.75 0 00-.721.523L3.841 11.25M11.25 11.25l-2.25-2.25m2.25 2.25l2.25-2.25" />
    </svg>
);


export const BuildingLibraryIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

export const ClipboardDocumentListIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


export const UserGroupIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

export const GifIcon: React.FC<{ className?: string; title?: string }> = ({
  className = "w-6 h-6",
  title = "GIF icon",
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    <title>{title}</title>

    {/* outer rounded rect (like a media card) */}
    <rect x="1" y="4" width="22" height="14" rx="3" ry="3" fill="currentColor" opacity="0.08" />
    <rect
      x="1.5"
      y="4.5"
      width="21"
      height="13"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />

    {/* small film holes on top */}
    <rect x="3" y="2" width="2" height="2" rx="0.4" fill="currentColor" />
    <rect x="7" y="2" width="2" height="2" rx="0.4" fill="currentColor" />
    <rect x="11" y="2" width="2" height="2" rx="0.4" fill="currentColor" />

    {/* GIF label panel */}
    <rect x="3.5" y="8.5" width="17" height="7" rx="1.2" fill="currentColor" opacity="0.02" />

    {/* Text "GIF" — using SVG text for crispness; inherits currentColor */}
    <text
      x="12"
      y="13.2"
      textAnchor="middle"
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight={700}
      fontSize="4.6"
      fill="currentColor"
    >
      GIF
    </text>

    {/* subtle play/film strip accent */}
    <path d="M3 11.5h18" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
  </svg>
);


export const PlusIcon: React.FC<{ className?: string; title?: string }> = ({
  className = "w-6 h-6",
  title = "Add",
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    <title>{title}</title>

    {/* plus sign only */}
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EllipsisVerticalIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const XMarkIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const PinIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const ReplyIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17L4 12m0 0l5-5m-5 5h11a4 4 0 014 4v1"
    />
  </svg>
);

export const FaceSmileIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4.072 4.072 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);


export const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.247c-.539.036-1.05.242-1.443.593l-3.41 2.972a1.125 1.125 0 01-1.597 0l-3.41-2.972c-.393-.351-.904-.557-1.443-.593l-3.722-.247A2.122 2.122 0 013 14.894V10.608c0-.97.616-1.813 1.5-2.097L6.6 8.113A2.122 2.122 0 008.02 6.5h7.96a2.122 2.122 0 001.42-.511l2.85-2.685a1.125 1.125 0 011.597 0l2.85 2.685c.393.351.904.557 1.443.593l.003.001z" />
  </svg>
);

export const InformationCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

export const ChatBubbleOvalLeftEllipsisIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

export const HeartIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

export const ArrowPathRoundedSquareIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-3.181-4.991v4.99" />
  </svg>
);

export const ArrowDownCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


export const BookmarkIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
  </svg>
);


export const GlobeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className} // merged with your prop
  >
    {/*\<path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/>*/}
    <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/>
    <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/>
    <circle cx="12" cy="12" r="10"/>
  </svg>
);




export const WifiOffIcon = ({
  size = 48,
  color = '#000000',
  strokeWidth = 1.5,
  background = 'transparent',
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0
}) => {
  const transforms: string[] = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push('scaleX(-1)');
  if (flipVertical) transforms.push('scaleY(-1)');

  const viewBoxSize = 24 + padding * 2;
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(' ') || undefined,
        filter:
          shadow > 0
            ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))`
            : undefined,
        backgroundColor: background !== 'transparent' ? background : undefined
      }}
    >
      <path
        d="M12 20h.01M8.5 16.429a5 5 0 0 1 7 0M5 12.859a10 10 0 0 1 5.17-2.69m8.83 2.69a10 10 0 0 0-2.007-1.523M2 8.82a15 15 0 0 1 4.177-2.643M22 8.82a15 15 0 0 0-11.288-3.764M2 2l20 20"
      />
    </svg>
  );
};


export const QuestionMarkCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

export const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
  </svg>
);

export const LockClosedIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-2.25m18 2.25v-2.25M5.25 10.5h13.5" />
  </svg>
);


export const CurrencyRupeeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M0 0 C2.82077442 0.0107486 5.64091419 0.0000119 8.46166992 -0.01269531 C25.49962981 -0.02810454 41.8127342 1.81739129 58.5065918 5.13574219 C59.78663086 5.379375 61.06666992 5.62300781 62.38549805 5.87402344 C87.06745553 10.70038392 111.1788748 19.22788228 133.7565918 30.26074219 C134.58400879 30.6595459 135.41142578 31.05834961 136.26391602 31.46923828 C156.53664533 41.32818664 175.45176046 53.82212437 192.7565918 68.26074219 C193.29832031 68.70240723 193.84004883 69.14407227 194.39819336 69.59912109 C208.84429352 81.37702067 222.33867993 94.51436155 233.7565918 109.26074219 C234.66715015 110.36260568 235.58147043 111.46136716 236.4987793 112.55761719 C286.03188303 172.18321309 307.66687296 251.87806445 300.74316406 328.48803711 C297.06480385 364.69661022 287.85312795 399.53156544 271.7565918 432.26074219 C271.16056152 433.4953418 271.16056152 433.4953418 270.55249023 434.75488281 C259.18434435 458.13516082 244.39716317 479.91979648 226.78393555 499.04980469 C224.99515839 501.00057129 223.27816061 502.99054613 221.5690918 505.01074219 C212.81818177 515.02048382 203.20769786 524.05825029 192.7565918 532.26074219 C191.61510524 533.2008295 190.47591038 534.14370412 189.33862305 535.08886719 C180.25906974 542.58657025 170.77673893 549.08864511 160.7565918 555.26074219 C160.09498047 555.67533691 159.43336914 556.08993164 158.75170898 556.51708984 C91.82630611 598.33303622 9.24960948 610.37739952 -67.3684082 593.13574219 C-103.33731484 584.52850203 -138.06227698 569.79721565 -168.2434082 548.26074219 C-168.93611816 547.76880371 -169.62882813 547.27686523 -170.3425293 546.77001953 C-192.82183489 530.7377163 -214.53353914 512.40746203 -231.2434082 490.26074219 C-232.26269695 488.9561485 -233.28367745 487.65287566 -234.3059082 486.35058594 C-262.99623911 449.60815455 -282.29043763 407.81332623 -292.2434082 362.26074219 C-292.50629639 361.06199463 -292.76918457 359.86324707 -293.04003906 358.62817383 C-294.88561023 349.85015099 -296.11246217 341.12827322 -296.9309082 332.19824219 C-297.02571472 331.18150421 -297.02571472 331.18150421 -297.12243652 330.14422607 C-298.49314923 315.16690527 -298.61434433 300.29756524 -298.2434082 285.26074219 C-298.22793945 284.39352539 -298.2124707 283.52630859 -298.1965332 282.6328125 C-297.42116998 244.04233886 -286.12214788 204.79004381 -269.2434082 170.26074219 C-268.58021006 168.86902361 -267.91743929 167.47710128 -267.25512695 166.08496094 C-257.58128289 146.00822247 -245.50789641 127.38367843 -231.2434082 110.26074219 C-230.51895508 109.35195313 -229.79450195 108.44316406 -229.0480957 107.50683594 C-223.0158577 100.10363475 -216.47549682 93.2819881 -209.7434082 86.51074219 C-208.44463745 85.19819458 -208.44463745 85.19819458 -207.11962891 83.85913086 C-201.13670391 77.9043502 -194.8663066 72.49000461 -188.2434082 67.26074219 C-187.52185547 66.68517578 -186.80030273 66.10960937 -186.05688477 65.51660156 C-146.96793729 34.54188869 -101.31074144 13.57089528 -52.2434082 4.57324219 C-51.14061523 4.37045654 -50.03782227 4.1676709 -48.90161133 3.95874023 C-32.60702539 1.11099262 -16.53005814 -0.07463428 0 0 Z " fill="#1B3046" transform="translate(510.243408203125,211.7392578125)"/>
    <path d="M0 0 C2.95703125 0.73925781 5.9140625 1.47851562 8.87109375 2.21777344 C9.60972656 2.40243164 10.34835937 2.58708984 11.109375 2.77734375 C13.64648438 3.41162109 16.18359375 4.04589844 18.72070312 4.68017578 C19.64302734 4.91075684 20.56535156 5.14133789 21.515625 5.37890625 C22.42731445 5.60682861 23.33900391 5.83475098 24.27832031 6.06958008 C25.17647461 6.29411865 26.07462891 6.51865723 27 6.75 C30 7.5 33 8.25 36 9 C35.32023722 16.77293964 33.29442699 24.16058924 31.3125 31.6875 C30.95297898 33.06710063 30.59360515 34.44673962 30.234375 35.82641602 C27.33003673 46.93430037 24.2416582 57.98572953 21 69 C21.87414551 69.13591553 22.74829102 69.27183105 23.64892578 69.41186523 C26.69558165 69.94657265 29.62811733 70.62090738 32.6171875 71.41015625 C33.63554688 71.67763672 34.65390625 71.94511719 35.703125 72.22070312 C36.74984375 72.49849609 37.7965625 72.77628906 38.875 73.0625 C39.94492187 73.34416016 41.01484375 73.62582031 42.1171875 73.91601562 C44.74543507 74.60827726 47.37300335 75.30300924 50 76 C50.11988281 74.85660156 50.23976563 73.71320313 50.36328125 72.53515625 C50.92746918 68.04626836 51.98594613 63.7927816 53.1875 59.4375 C53.63732846 57.77360221 54.08651725 56.1095314 54.53515625 54.4453125 C54.77250488 53.56907227 55.00985352 52.69283203 55.25439453 51.79003906 C56.04237456 48.84143535 56.80357188 45.8868956 57.55859375 42.9296875 C57.81938721 41.91205322 58.08018066 40.89441895 58.34887695 39.84594727 C58.85427287 37.87062662 59.35685943 35.89458437 59.85620117 33.91772461 C61.26297106 28.45464799 62.91720926 23.24394946 65 18 C77.16567456 20.26644177 89.20332743 23.25682505 101 27 C100.33901919 33.57092688 98.94600645 39.79425802 97.3125 46.1875 C96.91756348 47.75177734 96.91756348 47.75177734 96.51464844 49.34765625 C94.28017569 58.10530507 91.83427243 66.7947168 89.296875 75.46875 C88.08847892 79.62194707 87.02178945 83.79716794 86 88 C86.65226563 88.09152344 87.30453125 88.18304688 87.9765625 88.27734375 C92.00829876 89.24100164 95.60509274 90.86001292 99.375 92.5625 C100.16865967 92.92037598 100.96231934 93.27825195 101.7800293 93.64697266 C125.0740744 104.27771828 146.91258495 117.754721 156.4375 142.9375 C162.42326172 160.30426157 158.68474455 178.85526833 151.40625 195.1875 C144.04133296 209.91733409 134.24505055 218.12517529 119 224 C115.81275889 224.76296892 113.28785369 225 110 225 C110 225.66 110 226.32 110 227 C110.72832031 227.26683594 111.45664062 227.53367187 112.20703125 227.80859375 C128.07244372 234.57635711 139.7526517 248.60839776 146.0546875 264.23828125 C153.18977704 285.0833569 146.17305056 309.54284077 136.97412109 328.59106445 C128.50055384 345.23516823 115.68525144 357.07001734 98.25 363.875 C72.6209919 372.07741787 46.99029242 369.55721649 21.03833008 364.45898438 C17.97685101 363.99650301 15.0911068 363.9189825 12 364 C8.43897904 377.28534744 5.07512544 390.61653162 1.76757812 403.96679688 C1.59965256 404.64272888 1.43172699 405.31866089 1.25871277 406.01507568 C0.79887226 407.86625683 0.34042851 409.71778479 -0.11791992 411.56933594 C-1.01734351 415.06745392 -1.99244232 418.53176686 -3 422 C-9.58956577 421.36982901 -15.7007502 419.86104215 -22.0625 418.0625 C-23.01705078 417.79759766 -23.97160156 417.53269531 -24.95507812 417.25976562 C-29.97669144 415.86314025 -34.99018658 414.43832369 -40 413 C-38.77059102 405.70667341 -37.22680243 398.58010544 -35.3125 391.4375 C-35.05774902 390.47384521 -34.80299805 389.51019043 -34.54052734 388.51733398 C-33.69930671 385.34336139 -32.85061889 382.17146634 -32 379 C-31.68240723 377.81438477 -31.36481445 376.62876953 -31.03759766 375.40722656 C-29.03439885 367.93562211 -27.0215269 360.46666558 -25 353 C-31.344938 351.57863145 -37.69846364 350.20804098 -44.0625 348.875 C-44.92810547 348.69324219 -45.79371094 348.51148438 -46.68554688 348.32421875 C-48.79026627 347.88234396 -50.89511898 347.44110426 -53 347 C-56.14528602 358.96870102 -59.2549592 370.94381303 -62.23388672 382.95507812 C-64.06801342 390.32751886 -66.01140923 397.66776588 -68 405 C-75.90682945 404.35454454 -83.39500222 402.14509429 -91 400 C-92.01441162 399.71406982 -92.01441162 399.71406982 -93.04931641 399.42236328 C-97.03678259 398.29499175 -101.01984509 397.15295705 -105 396 C-104.20390397 390.69557757 -103.00128632 385.52340172 -101.75 380.3125 C-101.52965088 379.39130371 -101.30930176 378.47010742 -101.08227539 377.52099609 C-98.86177385 368.30950123 -96.45324718 359.15173073 -94 350 C-93.59863127 348.49357669 -93.1975837 346.98706777 -92.796875 345.48046875 C-91.86719518 341.98627894 -90.93456886 338.49288587 -90 335 C-90.79921875 334.88140625 -91.5984375 334.7628125 -92.421875 334.640625 C-96.75289936 333.86520142 -100.9857766 332.82799238 -105.25 331.75 C-106.13623047 331.52675049 -107.02246094 331.30350098 -107.93554688 331.07348633 C-116.66488663 328.85766088 -125.33869808 326.46680717 -134 324 C-135.15918945 323.67 -136.31837891 323.34 -137.51269531 323 C-145.67718103 320.67381735 -153.8393777 318.33970396 -162 316 C-161.340617 311.04816297 -159.27837606 306.8939504 -157.18359375 302.41796875 C-156.80767593 301.60378983 -156.43175812 300.7896109 -156.04444885 299.95075989 C-154.84715686 297.36064541 -153.64244659 294.774061 -152.4375 292.1875 C-151.62255453 290.42796232 -150.80809581 288.66819912 -149.99414062 286.90820312 C-148.00172443 282.60283507 -146.00264979 278.30061682 -144 274 C-141.94866355 274.46238754 -139.89801617 274.92783259 -137.84765625 275.39453125 C-136.13461304 275.78282104 -136.13461304 275.78282104 -134.38696289 276.17895508 C-131.36033432 276.91265016 -128.40827605 277.75700988 -125.4375 278.6875 C-118.69378028 280.54375082 -111.3847474 281.65783546 -104.9375 278.5 C-100.08941254 272.24440327 -98.66969518 263.46379603 -96.6875 255.9375 C-96.23346802 254.23243286 -96.23346802 254.23243286 -95.77026367 252.49291992 C-93.25819312 243.03868629 -90.78959627 233.57298298 -88.328125 224.10546875 C-86.07087199 215.42458235 -83.78547068 206.75501796 -81.33984375 198.125 C-78.4890501 188.05995304 -75.66975154 178.01811066 -73.34326172 167.81762695 C-71.74844889 160.8268886 -69.89145652 153.91515261 -68 147 C-67.51814758 145.23309516 -67.03638252 143.4661665 -66.5546875 141.69921875 C-66.30009766 140.76650146 -66.04550781 139.83378418 -65.78320312 138.87280273 C-65.26240424 136.96250334 -64.74286624 135.05185974 -64.22460938 133.14086914 C-63.08801052 128.95456625 -61.94251699 124.77339084 -60.7265625 120.609375 C-57.10032686 108.58414332 -57.10032686 108.58414332 -59.5625 96.6875 C-69.53747406 85.68945168 -86.11299513 83.57151418 -100 80 C-97.67760511 66.39740133 -93.83034541 53.24196145 -90 40 C-79.84971487 42.50701858 -69.72927795 45.10791013 -59.62835693 47.80667114 C-45.12004259 51.68078341 -30.58491618 55.42333505 -16 59 C-15.76418213 57.97656494 -15.52836426 56.95312988 -15.28540039 55.89868164 C-13.01295538 46.10144712 -10.59490084 36.35209162 -8.01782227 26.63061523 C-7.42968175 24.40795381 -6.84853876 22.18353193 -6.26757812 19.95898438 C-4.48276841 13.17795143 -2.67230983 6.49721336 0 0 Z " fill="#99F23D" transform="translate(507,301)"/>
    <path d="M0 0 C11.09719181 2.32327174 22.01575882 4.93906809 32.83935547 8.32470703 C34.30270563 8.78206596 35.76795344 9.23338939 37.23486328 9.67919922 C51.79516289 14.11904095 65.70484282 19.85812667 78 29 C79.03125 29.7425 80.0625 30.485 81.125 31.25 C88.64430263 38.44237643 94.00617814 46.85620049 94.375 57.375 C94.0651817 67.11407095 90.89676915 75.76034986 84.21484375 82.91015625 C71.60612171 94.71673295 55.83385081 94.63165776 39.46875 94.37109375 C18.78095154 93.62503736 -1.30753371 86.93450377 -21 81 C-20.34296319 73.24304307 -18.23970604 65.92382117 -16.1875 58.4375 C-15.84396484 57.16841797 -15.50042969 55.89933594 -15.14648438 54.59179688 C-14.44893678 52.01492782 -13.7493459 49.43869302 -13.04736328 46.86303711 C-12.01558895 43.06948908 -11.00944215 39.26933903 -10.00390625 35.46875 C-8.00912415 27.97372535 -5.89430052 20.51592978 -3.75 13.0625 C-3.38648438 11.79470703 -3.02296875 10.52691406 -2.6484375 9.22070312 C-1.7668592 6.14677878 -0.88403676 3.07321803 0 0 Z " fill="#1C3246" transform="translate(488,522)"/>
    <path d="M0 0 C25.36629717 3.1965659 54.24164551 11.03846325 71.6484375 30.87890625 C77.02503605 37.82497432 77.89418047 45.50528558 77 54 C75.13370211 62.39834053 72.08397091 70.48792822 64.7890625 75.52734375 C62.56433335 76.80231311 60.33114814 77.93408468 58 79 C57.113125 79.4125 56.22625 79.825 55.3125 80.25 C38.99286266 85.54285535 19.20639581 82.19035234 3 78 C1.57107422 77.63865967 1.57107422 77.63865967 0.11328125 77.27001953 C-2.8272296 76.51615327 -5.758488 75.7348048 -8.6875 74.9375 C-9.60362061 74.69241699 -10.51974121 74.44733398 -11.46362305 74.19482422 C-12.72493042 73.83348389 -12.72493042 73.83348389 -14.01171875 73.46484375 C-14.75897217 73.254646 -15.50622559 73.04444824 -16.27612305 72.82788086 C-16.84500244 72.55468018 -17.41388184 72.28147949 -18 72 C-19.19842974 68.40471077 -18.70179953 67.02292984 -17.7421875 63.3984375 C-17.44884521 62.27727539 -17.15550293 61.15611328 -16.85327148 60.00097656 C-16.53044189 58.8044043 -16.2076123 57.60783203 -15.875 56.375 C-15.55023682 55.14749023 -15.22547363 53.91998047 -14.89086914 52.65527344 C-12.98740318 45.51151727 -10.99895891 38.40020109 -8.85400391 31.32543945 C-6.68224414 24.10205545 -4.82845782 16.7956738 -2.96655273 9.48730469 C-2.72493408 8.5440332 -2.48331543 7.60076172 -2.234375 6.62890625 C-1.91291504 5.3615564 -1.91291504 5.3615564 -1.58496094 4.06860352 C-1 2 -1 2 0 0 Z " fill="#1C3245" transform="translate(517,414)"/>
  </svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export const CarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5h12.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 14.25c0-1.02.55-1.946 1.397-2.481C5.593 11.352 6.8 11 8.25 11h7.5c1.45 0 2.657.352 3.478.769.847.535 1.397 1.46 1.397 2.481v3.375H3.375V14.25z" />
  </svg>
);