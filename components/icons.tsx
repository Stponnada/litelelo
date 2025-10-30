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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    className="icon"
    viewBox="0 0 1024 1024"
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#3C9"
        d="M845.4 383H758c-16.6 0-30-13.4-30-30s13.4-30 30-30h87.4c16.6 0 30 13.4 30 30s-13.5 30-30 30m-183.1 0H263.1c-16.6 0-30-13.4-30-30s13.4-30 30-30h399.2c16.6 0 30 13.4 30 30s-13.5 30-30 30"
      ></path>
      <path
        fill="#bdbdbd"
        d="M378.2 873.2a55 55 0 1 0 110 0 55 55 0 1 0-110 0M799.5 873.2a55 55 0 1 0 110 0 55 55 0 1 0-110 0"
      ></path>
      <path
        fill="#45484C"
        d="M889.8 722.1h-511c-37.7 0-68.4-30.7-68.4-68.4v-1.4L274.5 270v-.4l-6-55.4c-8.6-86.8-57.6-117.5-97.3-128.1L101.5 69c-16.1-4-32.3 5.9-36.3 22s5.9 32.3 22 36.3l68.9 16.9c16.2 4.3 28.1 12.4 36.6 24.7 8.6 12.4 14 29.7 16.1 51.4l6 55.6 35.6 379.3c.8 70.1 58.1 126.9 128.4 126.9h511c16.6 0 30-13.4 30-30s-13.4-30-30-30"
      ></path>
      <path
        fill="#45484C"
        d="M840.3 197.8H381c-16.6 0-30 13.4-30 30s13.4 30 30 30h459.3c30.2 0 54.9 24.3 55.5 54.3l-19.9 226.5-.1 1.3v1.3c0 30.6-24.9 55.5-55.5 55.5H436c-16.6 0-30 13.4-30 30s13.4 30 30 30h384.3c63.2 0 114.7-51.1 115.5-114.1L955.7 316l.1-1.3v-1.3c0-63.8-51.8-115.6-115.5-115.6M408.5 842.1c7.2 0 13.1 5.9 13.1 13.1s-5.9 13.1-13.1 13.1-13.1-5.9-13.1-13.1 5.9-13.1 13.1-13.1m0-60c-40.4 0-73.1 32.7-73.1 73.1s32.7 73.1 73.1 73.1 73.1-32.7 73.1-73.1-32.7-73.1-73.1-73.1m414.6 60c7.2 0 13.1 5.9 13.1 13.1s-5.9 13.1-13.1 13.1-13.1-5.9-13.1-13.1 5.9-13.1 13.1-13.1m0-60c-40.4 0-73.1 32.7-73.1 73.1s32.7 73.1 73.1 73.1 73.1-32.7 73.1-73.1-32.7-73.1-73.1-73.1"
      ></path>
    </g>
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

// New icon used to indicate community consulship
export const ConsulIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="-87.04 -87.04 686.06 686.06"
    className={className}
  >
    <path
      fill="gold"
      d="M9.166.33a2.25 2.25 0 0 0-2.332 0l-5.25 3.182A2.25 2.25 0 0 0 .5 5.436v5.128a2.25 2.25 0 0 0 1.084 1.924l5.25 3.182a2.25 2.25 0 0 0 2.332 0l5.25-3.182a2.25 2.25 0 0 0 1.084-1.924V5.436a2.25 2.25 0 0 0-1.084-1.924z"
      transform="translate(-87.04 -87.04)scale(42.87875)"
    ></path>
  </svg>
);

export const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (

  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    id="Layer_1"
    width="64"
    height="64"
    fill="#545454"
    stroke="#545454"
    version="1.1"
    viewBox="0 0 512 512"
  >
    <g id="SVGRepo_iconCarrier">
      <path d="M59.179 185.707c2.411 5.355 8.683 7.723 14.101 5.355 5.376-2.411 7.765-8.725 5.355-14.101l-24.363-54.165c-2.411-5.355 0-11.691 5.333-14.101l97.301-43.755c2.624-1.173 5.525-1.259 8.149-.256a10.53 10.53 0 0 1 5.931 5.589l51.904 115.413a10.75 10.75 0 0 0 9.771 6.315c1.451 0 2.944-.299 4.373-.939 5.376-2.411 7.765-8.725 5.355-14.101L190.485 61.547c-3.52-7.787-9.835-13.76-17.835-16.789s-16.683-2.752-24.469.747L50.88 89.259c-16.085 7.232-23.275 26.219-16.043 42.304zM285.931 184.341A10.65 10.65 0 0 0 296.15 192h175.68c4.736 0 8.896-3.115 10.219-7.659l18.816-64c1.536-5.248-1.131-10.816-6.187-12.885-5.077-2.027-10.88.021-13.44 4.843-4.097 7.722-21.675 15.701-43.905 15.701-24.427 0-42.667-11.264-42.667-21.333v-64C394.667 19.136 375.531 0 352 0s-42.667 19.136-42.667 42.667v10.667C309.333 59.221 314.112 64 320 64s10.667-4.779 10.667-10.667V42.667c0-11.755 9.579-21.333 21.333-21.333s21.333 9.579 21.333 21.333v64c0 10.069-18.24 21.333-42.667 21.333-22.229 0-39.808-7.979-43.925-15.701-2.56-4.821-8.427-6.827-13.44-4.843-5.056 2.069-7.723 7.637-6.187 12.885zM490.667 213.333H21.333c-5.888 0-10.667 4.779-10.667 10.667v192c0 52.928 43.072 96 96 96h298.667c52.928 0 96-43.072 96-96V224c0-5.888-4.778-10.667-10.666-10.667zM263.467 444.8c-1.92 2.133-4.693 3.2-7.467 3.2s-5.547-1.067-7.467-3.2c-2.133-1.92-3.2-4.693-3.2-7.467s1.067-5.547 3.2-7.467c4.053-4.053 10.88-4.053 14.933 0 2.133 1.92 3.2 4.693 3.2 7.467.001 2.774-1.066 5.547-3.199 7.467zm3.242-68.501-.021 18.368c0 5.888-4.779 10.667-10.667 10.667s-10.667-4.8-10.667-10.667l.022-26.667c0-4.864 3.285-9.109 8-10.304l2.368-.576C271.701 353.451 288 347.115 288 328.021c0-16.171-14.357-29.333-32.021-29.333-16.896 0-30.955 12.075-32 27.52-.405 5.888-5.163 10.283-11.371 9.92-5.867-.405-10.325-5.483-9.92-11.371 1.813-26.603 25.237-47.424 53.312-47.424 29.419 0 53.355 22.72 53.355 50.667 0 23.979-14.336 40.192-42.646 48.299z"></path>
      <path d="M78.528 113.109c-5.888 0-10.56 4.779-10.56 10.667s4.885 10.667 10.773 10.667 10.667-4.779 10.667-10.667-4.779-10.667-10.667-10.667z"></path>
    </g>
  </svg>
);


export const ClipboardDocumentListIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    id="Layer_1"
    width="64"
    height="64"
    fill="#000"
    version="1.1"
    viewBox="0 0 512 512"
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#FF755C"
        d="M391.528 179.548 368.361 319.71l23.167 140.163h46.335V179.548z"
      ></path>
      <path fill="#FFB14E" d="M11.583 179.548h379.946v280.326H11.583z"></path>
      <g fill="#01121C">
        <path d="M72.906 300.849h260.968c6.397 0 11.584-5.187 11.584-11.584s-5.187-11.584-11.584-11.584H72.906c-6.397 0-11.584 5.187-11.584 11.584s5.187 11.584 11.584 11.584M284.363 335.183H122.418c-6.397 0-11.584 5.187-11.584 11.584s5.187 11.584 11.584 11.584h161.946c6.397 0 11.584-5.187 11.584-11.584s-5.188-11.584-11.585-11.584"></path>
        <path d="M500.416 41.902c-6.397 0-11.584 5.187-11.584 11.584v49.128H356.669v-.152c0-6.397-5.187-11.584-11.584-11.584s-11.584 5.187-11.584 11.584v.152H73.28v-.152c0-6.397-5.187-11.584-11.584-11.584s-11.584 5.187-11.584 11.584v.152H11.584C5.187 102.613 0 107.8 0 114.197s5.187 11.584 11.584 11.584h38.529v40.153H11.584C5.187 165.933 0 171.12 0 177.517v280.998c0 6.397 5.187 11.584 11.584 11.584h426.638c6.397 0 11.584-5.187 11.584-11.584V177.517c0-6.397-5.187-11.584-11.584-11.584h-81.553V125.78h132.163v49.128c0 6.397 5.187 11.584 11.584 11.584S512 181.305 512 174.908V53.485c0-6.397-5.187-11.583-11.584-11.583m-73.778 405.029h-19.857v-257.83h19.857zm-43.024 0H23.167v-257.83h360.447zm-50.112-280.998H73.28V125.78h260.223v40.153z"></path>
      </g>
    </g>
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



export const MapIcon: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);




export const WifiOffIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    id="svg822"
    fill="#00ff62"
    stroke="#00ff62"
    version="1.1"
    viewBox="0 0 30 30"
  >
    <g id="SVGRepo_iconCarrier">
      <g id="layer1" transform="translate(0 -289.063)">
        <path
          id="rect1854"
          fill="#00ff91"
          fillOpacity="1"
          stroke="none"
          strokeDasharray="none"
          strokeMiterlimit="4"
          strokeOpacity="1"
          strokeWidth="2"
          d="M25.607 4.393 4.393 25.607l1.414 1.414 6.095-6.095L15 25 27 9.21s-.732-.61-2.016-1.366l2.037-2.037zM15 5C8 5 3 9.21 3 9.21l6.46 8.5L21.114 6.06C19.357 5.453 17.29 5 15 5"
          transform="translate(0 289.063)"
        ></path>
      </g>
    </g>
  </svg>
  );



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

export const SettingsCogIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className}>
    <g id="SVGRepo_iconCarrier" stroke="#94a3b8" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M13.765 2.152C13.398 2 12.932 2 12 2s-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083c-.092.223-.129.484-.143.863a1.62 1.62 0 0 1-.79 1.353 1.62 1.62 0 0 1-1.567.008c-.336-.178-.579-.276-.82-.308a2 2 0 0 0-1.478.396C4.04 5.79 3.806 6.193 3.34 7s-.7 1.21-.751 1.605a2 2 0 0 0 .396 1.479c.148.192.355.353.676.555.473.297.777.803.777 1.361s-.304 1.064-.777 1.36c-.321.203-.529.364-.676.556a2 2 0 0 0-.396 1.479c.052.394.285.798.75 1.605.467.807.7 1.21 1.015 1.453a2 2 0 0 0 1.479.396c.24-.032.483-.13.819-.308a1.62 1.62 0 0 1 1.567.008c.483.28.77.795.79 1.353.014.38.05.64.143.863a2 2 0 0 0 1.083 1.083C10.602 22 11.068 22 12 22s1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083c.092-.223.129-.483.143-.863.02-.558.307-1.074.79-1.353a1.62 1.62 0 0 1 1.567-.008c.336.178.579.276.819.308a2 2 0 0 0 1.479-.396c.315-.242.548-.646 1.014-1.453s.7-1.21.751-1.605a2 2 0 0 0-.396-1.479c-.148-.192-.355-.353-.676-.555A1.62 1.62 0 0 1 19.562 12c0-.558.304-1.064.777-1.36.321-.203.529-.364.676-.556a2 2 0 0 0 .396-1.479c-.052-.394-.285-.798-.75-1.605-.467-.807-.7-1.21-1.015-1.453a2 2 0 0 0-1.479-.396c-.24.032-.483.13-.82.308a1.62 1.62 0 0 1-1.566-.008 1.62 1.62 0 0 1-.79-1.353c-.014-.38-.05-.64-.143-.863a2 2 0 0 0-1.083-1.083Z"></path>
    </g>
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


export const CurrencyRupeeIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className = "w-6 h-6", ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    fill="none"
    stroke="#fff"
    viewBox="0 0 24 24"
  >
    <g
      id="SVGRepo_iconCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m12 17-2.878-2.878v0c-.045-.045-.01-.123.054-.125C13.999 13.835 13.94 7 9 7h6M9 10.5h6"></path>
    </g>
  </svg>
  );

export const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M11.2519 8.07812V10.9381L10.2419 10.5881C9.73187 10.4081 9.42188 10.2381 9.42188 9.36812C9.42188 8.65812 9.95188 8.07812 10.6019 8.07812H11.2519Z" fill="#292D32"></path> <path d="M14.58 14.6286C14.58 15.3386 14.05 15.9186 13.4 15.9186H12.75V13.0586L13.76 13.4086C14.27 13.5886 14.58 13.7586 14.58 14.6286Z" fill="#292D32"></path> <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.19C2 19.83 4.17 22 7.81 22H16.19C19.83 22 22 19.83 22 16.19V7.81C22 4.17 19.83 2 16.19 2ZM14.26 12C15.04 12.27 16.08 12.84 16.08 14.63C16.08 16.17 14.88 17.42 13.4 17.42H12.75V18C12.75 18.41 12.41 18.75 12 18.75C11.59 18.75 11.25 18.41 11.25 18V17.42H10.89C9.25 17.42 7.92 16.03 7.92 14.33C7.92 13.92 8.25 13.58 8.67 13.58C9.08 13.58 9.42 13.92 9.42 14.33C9.42 15.21 10.08 15.92 10.89 15.92H11.25V12.53L9.74 12C8.96 11.73 7.92 11.16 7.92 9.37C7.92 7.83 9.12 6.58 10.6 6.58H11.25V6C11.25 5.59 11.59 5.25 12 5.25C12.41 5.25 12.75 5.59 12.75 6V6.58H13.11C14.75 6.58 16.08 7.97 16.08 9.67C16.08 10.08 15.75 10.42 15.33 10.42C14.92 10.42 14.58 10.08 14.58 9.67C14.58 8.79 13.92 8.08 13.11 8.08H12.75V11.47L14.26 12Z" fill="#292D32"></path> </g></svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export const CarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
<svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64px" height="64px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path fill="#F9EBB2" d="M28,12h8c15.41,0,15.984,14.379,16,16H12C12,27.348,12.184,12,28,12z"></path> <polygon fill="#45AAB8" points="56,44 48,44 16,44 8,44 8,36 16,36 48,36 56,36 "></polygon> <g> <path fill="#394240" d="M60,28c0-8.301-5.016-24-24-24h-8C9.016,4,4,19.699,4,28c-2.211,0-4,1.789-4,4v16c0,2.211,1.789,4,4,4h4v4 c0,2.211,1.789,4,4,4h4c2.211,0,4-1.789,4-4v-4h24v4c0,2.211,1.789,4,4,4h4c2.211,0,4-1.789,4-4v-4h4c2.211,0,4-1.789,4-4V32 C64,29.789,62.211,28,60,28z M28,12h8c15.41,0,15.984,14.379,16,16H12C12,27.348,12.184,12,28,12z M56,44h-8H16H8v-8h8h32h8V44z"></path> <circle fill="#394240" cx="48" cy="40" r="4"></circle> <circle fill="#394240" cx="16" cy="40" r="4"></circle> </g> </g> </g></svg>
);

export const CubeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

export const LogoGraphicIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="130"
    height="130"
    fill="none"
    stroke="#00ff4c"
    viewBox="0 0 400 400"
  >
    <g
      id="SVGRepo_iconCarrier"
      stroke="#3dfba2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.9"
    >
      <path
        strokeWidth="16"
        d="M138.051 150.752c30.977 11.258 7.999 62.071-23.22 49.444-27.913-11.289-28.749-78.638 36.117-55.789M194.279 254c-31.331-4-37.876-47.152-35.979-47 31.481 10.222 62.365 6.416 64.762 6 4.064-.705 82.24-18.107 107.938-42"
      ></path>
      <path
        strokeWidth="16"
        d="M303 217c-.903-1.78-2.268-3.013-4.119-4.445-.706-.548-1.491-1.066-2.247-1.581-1.986-1.349-36.809-22.96-40.924-25.183-1.986-1.084-4.018-1.791-6.71-1.791q-.056.042-.112.078.029-.036.057-.078c-.031.039-27.396 24.314-27.945 26"
      ></path>
      <path
        strokeWidth="6"
        d="M26 152.9q.473.306.932.641c1.668 3.905 93.159 65.243 180.046 63.419C291.383 215.188 364.921 156.553 374 147"
        opacity="0.503"
      ></path>
    </g>
  </svg>
);

export const CampusPlacesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    id="Layer_1"
    width="64"
    height="64"
    fill="#000"
    version="1"
    viewBox="0 0 64 64"
  >
    <g id="SVGRepo_iconCarrier">
      <g fill="#F76D57">
        <path d="M43 2v22a4 4 0 0 0 8 0V2zM23 24a4 4 0 0 0 8 0V2h-8zM3 4v20a4 4 0 0 0 8 0V2H5a2 2 0 0 0-2 2"></path>
      </g>
      <path
        fill="#F9EBB2"
        d="M58 60a2 2 0 0 1-2 2H26V37c0-.516-.447-1-1-1H11a1 1 0 0 0-1 1v25H8a2 2 0 0 1-2-2V29.91c.326.055.658.09 1 .09a5.99 5.99 0 0 0 5-2.688C13.074 28.932 14.912 30 17 30s3.926-1.068 5-2.688C23.074 28.932 24.912 30 27 30s3.926-1.068 5-2.688C33.074 28.932 34.912 30 37 30s3.926-1.068 5-2.688C43.074 28.932 44.912 30 47 30s3.926-1.068 5-2.688A5.99 5.99 0 0 0 57 30c.342 0 .674-.035 1-.09z"
      ></path>
      <g fill="#B4CCB9">
        <path d="M33 24a4 4 0 0 0 8 0V2h-8zM13 24a4 4 0 0 0 8 0V2h-8zM59 2h-6v22a4 4 0 0 0 8 0V4a2 2 0 0 0-2-2"></path>
      </g>
      <path
        fill="#394240"
        d="M59 0H5C2.789 0 1 1.789 1 4v20a5.99 5.99 0 0 0 3 5.189V60c0 2.211 1.789 4 4 4h48c2.211 0 4-1.789 4-4V29.189A5.99 5.99 0 0 0 63 24V4c0-2.211-1.789-4-4-4m-8 2v22a4 4 0 0 1-8 0V2zM41 2v22a4 4 0 0 1-8 0V2zM31 2v22a4 4 0 0 1-8 0V2zM21 2v22a4 4 0 0 1-8 0V2zM3 4a2 2 0 0 1 2-2h6v22a4 4 0 0 1-8 0zm9 58V38h12v10h-1a1 1 0 1 0 0 2h1v12zm46-2a2 2 0 0 1-2 2H26V37c0-.516-.447-1-1-1H11a1 1 0 0 0-1 1v25H8a2 2 0 0 1-2-2V29.91c.326.055.658.09 1 .09a5.99 5.99 0 0 0 5-2.688C13.074 28.932 14.912 30 17 30s3.926-1.068 5-2.688C23.074 28.932 24.912 30 27 30s3.926-1.068 5-2.688C33.074 28.932 34.912 30 37 30s3.926-1.068 5-2.688C43.074 28.932 44.912 30 47 30s3.926-1.068 5-2.688A5.99 5.99 0 0 0 57 30c.342 0 .674-.035 1-.09zm-1-32a4 4 0 0 1-4-4V2h6a2 2 0 0 1 2 2v20a4 4 0 0 1-4 4"
      ></path>
      <path
        fill="#394240"
        d="M53 36H29a1 1 0 0 0-1 1v20a1 1 0 0 0 1 1h24a1 1 0 0 0 1-1V37a1 1 0 0 0-1-1m-1 20H30V38h22z"
      ></path>
      <g fill="#45AAB8">
        <path d="M12 62h12V50h-1a1 1 0 1 1 0-2h1V38H12zM30 38h22v18H30z"></path>
      </g>
      <path
        fill="#394240"
        d="M48.293 42.707a.997.997 0 0 0 1.414 0 1 1 0 0 0 0-1.414l-1-1a.999.999 0 1 0-1.414 1.414zM48.293 47.707a.997.997 0 0 0 1.414 0 1 1 0 0 0 0-1.414l-6-6a.999.999 0 1 0-1.414 1.414z"
      ></path>
    </g>
  </svg>
);

