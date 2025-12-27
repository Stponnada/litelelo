import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

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

// src/components/

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
    xmlSpace="preserve"
    id="Layer_1"
    width="64"
    height="64"
    fill="#000"
    version="1"
    viewBox="0 0 64 64"
    className={className}
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#004939ff"
        d="M44 20v-8c0-6.633-5.371-12-12-12S20 5.367 20 12v8H8v40c0 2.211 1.789 4 4 4h40c2.211 0 4-1.789 4-4V20zm-16-8c0-2.211 1.789-4 4-4s4 1.789 4 4v8h-8zm20 44H16V28h32z"
      ></path>
      <path fill="#46b987" d="M16 28h32v28H16z"></path>
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
    fill="#000"
    version="1"
    viewBox="0 0 64 64"
    className={className}
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#F9EBB2"
        d="M8 32h12c2.211 0 4 1.789 4 4v4h16v-4c0-2.211 1.789-4 4-4h12V8H8z"
      ></path>
      <g fill="#202020ff">
        <path d="M60 0H4C1.789 0 0 1.789 0 4v56c0 2.211 1.789 4 4 4h56c2.211 0 4-1.789 4-4V4c0-2.211-1.789-4-4-4m-4 56H8V40h8v4c0 2.211 1.789 4 4 4h24c2.211 0 4-1.789 4-4v-4h8zm0-24H44c-2.211 0-4 1.789-4 4v4H24v-4c0-2.211-1.789-4-4-4H8V8h48z"></path>
        <path d="M20 24h24c2.211 0 4-1.789 4-4s-1.789-4-4-4H20c-2.211 0-4 1.789-4 4s1.789 4 4 4"></path>
      </g>
      <path
        fill="#767676ff"
        d="M8 56h48V40h-8v4c0 2.211-1.789 4-4 4H20c-2.211 0-4-1.789-4-4v-4H8z"
      ></path>
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
    className={className}
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#ff8558ff"
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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    className="icon icon-tabler icons-tabler-outline icon-tabler-pin"
    viewBox="0 0 24 24"
  >
    <path stroke="none" d="M0 0h24v24H0z"></path>
    <path d="m15 4.5-4 4L7 10l-1.5 1.5 7 7L14 17l1.5-4 4-4M9 15l-4.5 4.5M14.5 4 20 9.5"></path>
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
    <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />
    <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);



export const MapIcon: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    id="Layer_1"
    width="64"
    height="64"
    fill="#000"
    version="1"
    viewBox="0 0 64 64"
    className={className}
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#242424ff"
        d="M60.406 4.023q-.485-.001-1.023.133L44 8 20 0 4 4c-2.387.797-4 2.789-4 5v47.574c0 1.824 1.363 3.398 3.527 3.398.457 0 .949-.07 1.473-.223L20 56l24 8 16-4c2.18-.645 4-2.414 4-4.625V8c0-1.934-1.34-3.977-3.594-3.977M28 11.102l8 2.664v39.133l-8-2.664zM8 50.754V11.246l12-2.812v39.32zm48 2-12 2.812V16l12-2.754z"
      ></path>
      <g fill="#b94646">
        <path d="m28 50.234 8 2.664V13.766l-8-2.664zM8 50.754l12-3V8.434L8 11.246zM44 16v39.566l12-2.812V13.246z"></path>
      </g>
      <path
        fill="#231F20"
        d="m28 50.234 8 2.664V13.766l-8-2.664z"
        opacity="0.2"
      ></path>
    </g>
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
    className={className}
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
    className={className}
    {...rest}
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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    stroke="#000"
    strokeWidth="3.072"
    className={className}
    viewBox="0 0 1024 1024"
  >
    <g
      id="SVGRepo_tracerCarrier"
      stroke="#CCC"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="71.68"
    >
      <path
        fill="#B8CA43"
        d="M908.8 742.4c0 14.08-11.52 25.6-25.6 25.6H140.8c-14.08 0-25.6-11.52-25.6-25.6v-384c0-14.08 11.52-25.6 25.6-25.6h742.4c14.08 0 25.6 11.52 25.6 25.6z"
      ></path>
      <path
        fill="#231C1C"
        d="M883.2 780.8H140.8c-21.76 0-38.4-16.64-38.4-38.4v-384c0-21.76 16.64-38.4 38.4-38.4h742.4c21.76 0 38.4 16.64 38.4 38.4v384c0 21.76-16.64 38.4-38.4 38.4M140.8 345.6c-7.68 0-12.8 5.12-12.8 12.8v384c0 7.68 5.12 12.8 12.8 12.8h742.4c7.68 0 12.8-5.12 12.8-12.8v-384c0-7.68-5.12-12.8-12.8-12.8z"
      ></path>
      <path
        fill="#B8CA43"
        d="M844.8 652.8V448c-28.16 0-51.2-23.04-51.2-51.2H230.4c0 28.16-23.04 51.2-51.2 51.2v204.8c28.16 0 51.2 23.04 51.2 51.2h563.2c0-28.16 23.04-51.2 51.2-51.2"
      ></path>
      <path
        fill="#231C1C"
        d="M806.4 716.8H217.6V704c0-21.76-16.64-38.4-38.4-38.4h-12.8V435.2h12.8c21.76 0 38.4-16.64 38.4-38.4V384h588.8v12.8c0 21.76 16.64 38.4 38.4 38.4h12.8v230.4h-12.8c-21.76 0-38.4 16.64-38.4 38.4zm-564.48-25.6h540.16c5.12-25.6 24.32-44.8 49.92-49.92V459.52c-25.6-5.12-44.8-24.32-49.92-49.92H241.92c-5.12 25.6-24.32 44.8-49.92 49.92v181.76c25.6 5.12 44.8 24.32 49.92 49.92"
      ></path>
      <path
        fill="#E1E0A6"
        d="M345.6 550.4a179.2 166.4 90 1 0 332.8 0 179.2 166.4 90 1 0-332.8 0"
      ></path>
      <path
        fill="#231C1C"
        d="M512 742.4c-98.56 0-179.2-85.76-179.2-192s80.64-192 179.2-192 179.2 85.76 179.2 192-80.64 192-179.2 192m0-358.4c-84.48 0-153.6 74.24-153.6 166.4S427.52 716.8 512 716.8s153.6-74.24 153.6-166.4S596.48 384 512 384"
      ></path>
      <path fill="#231C1C" d="M499.2 371.2h25.6v358.4h-25.6z"></path>
      <path
        fill="#231C1C"
        d="M512 691.2c-21.76 0-42.24-8.96-56.32-24.32-12.8-14.08-20.48-33.28-20.48-52.48h25.6c0 12.8 5.12 25.6 14.08 34.56 10.24 10.24 23.04 16.64 37.12 16.64 28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2c-42.24 0-76.8-34.56-76.8-76.8s34.56-76.8 76.8-76.8 76.8 34.56 76.8 76.8h-25.6c0-28.16-23.04-51.2-51.2-51.2s-51.2 23.04-51.2 51.2 23.04 51.2 51.2 51.2c42.24 0 76.8 34.56 76.8 76.8s-34.56 76.8-76.8 76.8"
      ></path>
    </g>
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#B8CA43"
        d="M908.8 742.4c0 14.08-11.52 25.6-25.6 25.6H140.8c-14.08 0-25.6-11.52-25.6-25.6v-384c0-14.08 11.52-25.6 25.6-25.6h742.4c14.08 0 25.6 11.52 25.6 25.6z"
      ></path>
      <path
        fill="#231C1C"
        d="M883.2 780.8H140.8c-21.76 0-38.4-16.64-38.4-38.4v-384c0-21.76 16.64-38.4 38.4-38.4h742.4c21.76 0 38.4 16.64 38.4 38.4v384c0 21.76-16.64 38.4-38.4 38.4zM140.8 345.6c-7.68 0-12.8 5.12-12.8 12.8v384c0 7.68 5.12 12.8 12.8 12.8h742.4c7.68 0 12.8-5.12 12.8-12.8v-384c0-7.68-5.12-12.8-12.8-12.8z"
      ></path>
      <path
        fill="#B8CA43"
        d="M844.8 652.8V448c-28.16 0-51.2-23.04-51.2-51.2H230.4c0 28.16-23.04 51.2-51.2 51.2v204.8c28.16 0 51.2 23.04 51.2 51.2h563.2c0-28.16 23.04-51.2 51.2-51.2z"
      ></path>
      <path
        fill="#231C1C"
        d="M806.4 716.8H217.6V704c0-21.76-16.64-38.4-38.4-38.4h-12.8V435.2h12.8c21.76 0 38.4-16.64 38.4-38.4V384h588.8v12.8c0 21.76 16.64 38.4 38.4 38.4h12.8v230.4h-12.8c-21.76 0-38.4 16.64-38.4 38.4zm-564.48-25.6h540.16c5.12-25.6 24.32-44.8 49.92-49.92V459.52c-25.6-5.12-44.8-24.32-49.92-49.92H241.92c-5.12 25.6-24.32 44.8-49.92 49.92v181.76c25.6 5.12 44.8 24.32 49.92 49.92z"
      ></path>
      <path
        fill="#E1E0A6"
        d="M345.6 550.4a179.2 166.4 90 1 0 332.8 0 179.2 166.4 90 1 0-332.8 0Z"
      ></path>
      <path
        fill="#231C1C"
        d="M512 742.4c-98.56 0-179.2-85.76-179.2-192s80.64-192 179.2-192 179.2 85.76 179.2 192-80.64 192-179.2 192zm0-358.4c-84.48 0-153.6 74.24-153.6 166.4S427.52 716.8 512 716.8s153.6-74.24 153.6-166.4S596.48 384 512 384z"
      ></path>
      <path fill="#231C1C" d="M499.2 371.2h25.6v358.4h-25.6z"></path>
      <path
        fill="#231C1C"
        d="M512 691.2c-21.76 0-42.24-8.96-56.32-24.32-12.8-14.08-20.48-33.28-20.48-52.48h25.6c0 12.8 5.12 25.6 14.08 34.56 10.24 10.24 23.04 16.64 37.12 16.64 28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2c-42.24 0-76.8-34.56-76.8-76.8s34.56-76.8 76.8-76.8 76.8 34.56 76.8 76.8h-25.6c0-28.16-23.04-51.2-51.2-51.2s-51.2 23.04-51.2 51.2 23.04 51.2 51.2 51.2c42.24 0 76.8 34.56 76.8 76.8s-34.56 76.8-76.8 76.8z"
      ></path>
    </g>
  </svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export const CarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" width="64px" height="64px" viewBox="0 0 64 64" fill="#161616ff" className={className}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path fill="#cbcbcbff" d="M28,12h8c15.41,0,15.984,14.379,16,16H12C12,27.348,12.184,12,28,12z"></path> <polygon fill="#00ffe1ff" points="56,44 48,44 16,44 8,44 8,36 16,36 48,36 56,36 "></polygon> <g> <path fill="#242424ff" d="M60,28c0-8.301-5.016-24-24-24h-8C9.016,4,4,19.699,4,28c-2.211,0-4,1.789-4,4v16c0,2.211,1.789,4,4,4h4v4 c0,2.211,1.789,4,4,4h4c2.211,0,4-1.789,4-4v-4h24v4c0,2.211,1.789,4,4,4h4c2.211,0,4-1.789,4-4v-4h4c2.211,0,4-1.789,4-4V32 C64,29.789,62.211,28,60,28z M28,12h8c15.41,0,15.984,14.379,16,16H12C12,27.348,12.184,12,28,12z M56,44h-8H16H8v-8h8h32h8V44z"></path> <circle fill="#394240" cx="48" cy="40" r="4"></circle> <circle fill="#394240" cx="16" cy="40" r="4"></circle> </g> </g> </g></svg>
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
    className={className}
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
    className={className}
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#394240"
        d="M60 0H4C1.789 0 0 1.789 0 4v28h4v28c0 2.211 1.789 4 4 4h48c2.211 0 4-1.789 4-4V32h4V4c0-2.211-1.789-4-4-4M48 8h8v16h-8zM24 8h16v16H24zM8 8h8v16H8zm44 48H40V40H24v16H12V32h40z"
      ></path>
      <path fill="#B4CCB9" d="M24 8h16v16H24z"></path>
      <g fill="#F76D57">
        <path d="M48 8h8v16h-8zM8 8h8v16H8z"></path>
      </g>
      <path fill="#F9EBB2" d="M52 56H40V40H24v16H12V32h40z"></path>
    </g>
  </svg>

);

export const SpaceInvaderIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    stroke="#000"
    strokeWidth="0.001"
    viewBox="0 0 64 64"
    className={className}
  >
    <g
      id="SVGRepo_tracerCarrier"
      stroke="#CCC"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4.352"
    >
      <path
        fill="#1d1d1b"
        d="M12.53 30.15a14.3 14.3 0 0 1 .09-2.71c.16 0 3.16.09 3.16 0s-.2-4.25.17-4.46a43 43 0 0 1 4.58-.41v-2.5s-3.87.16-3.91-.17-.63-5.42-.25-5.54 6-.38 6 .08.16 4.59.16 4.59 4-.34 4.17 0 .08 3.37.5 3.41 6.92.29 6.92 0a19.6 19.6 0 0 1 .21-3.54c.2-.16 4.91-.21 4.91-.21a26 26 0 0 1 .09-4c.2-.29 6.41-.33 6.41.05a49 49 0 0 1-.37 5.2c-.17 0-4.92.09-4.92.09v1.12s7.54.21 7.62.59-.2 5.54 0 5.54 3.75 0 3.79.37 0 3.5 0 3.5 4 .09 4.12.54-.29 13.21-.75 13.42a16 16 0 0 1-4.75-.17c-.12-.25 0-8.5-.21-8.58s-2.54 0-2.54 0 .25 9-.08 9.33-5.38.25-5.38.25.38 3.46.13 3.54-10.09.59-10.09.21-.08-5 .3-5.21 7.25-.2 7.2-.41 0-1.84-.12-1.88-15.69.17-15.69.42a6.4 6.4 0 0 0 0 1.79c.13 0 7.17.17 7.21.29a34 34 0 0 1 0 5.05 86 86 0 0 1-9.08 0c-.34-.21-.46-4.09-.46-4.09s-5.54-.58-5.58-.87 0-8.34-.17-8.46a3.7 3.7 0 0 0-1.67 0c0 .13.17 8 0 8.08s-6 .67-6 0S7.83 31 8.2 30.74a26 26 0 0 1 4.33-.59"
      ></path>
      <g fill="#002aff">
        <path d="M10.12 32.32a13.5 13.5 0 0 1 2.46-.32s.12 11 0 11-2.38.33-2.46 0-.12-10.47 0-10.68M14.58 29a1.47 1.47 0 0 1 1.12 0c0 .12.08 5.58 0 5.58s-1.08.21-1.13 0-.12-5.47.01-5.58M18.24 15.78c.18-.12 2.25-.13 2.34.12a8.1 8.1 0 0 1 0 2.42 23 23 0 0 1-2.34 0 6.1 6.1 0 0 1 0-2.54M41.08 16a10 10 0 0 1 2.58.12 10 10 0 0 1-.08 2.21 13 13 0 0 1-2.5 0 19 19 0 0 1 0-2.33"></path>
      </g>
      <path
        fill="#775cff"
        d="M22.24 20.57a13.5 13.5 0 0 1 2.84-.13 25 25 0 0 0 .29 3.71c.16 0 10.37-.08 10.41-.29s.21-3.25.34-3.37a7 7 0 0 1 2.5 0c0 .16-.13 2.41.08 2.46s7.17.25 7.25.41-.17 9.21-.17 9.21-1.54-1.67-1.66-1.5-.5.67-.34.75a14.2 14.2 0 0 1 2 2 11 11 0 0 1 0 1.67 22 22 0 0 0-2.46-2c-.09.12-.34.66-.21.79s2.67 2.5 2.67 2.66v1.46a30 30 0 0 0-2.54-1.79c-.12 0-.46.88-.29.92a15 15 0 0 1 2.79 1.79c0 .25.09 1.46.09 1.46S43.12 39 43 39s-.21.87-.21.87a26 26 0 0 1 3 2.17 9 9 0 0 1 0 1.25 19 19 0 0 0-2.58-1.63c-.13.13-.38.67-.17.75s1.88 1.42 1.71 1.46a12.3 12.3 0 0 1-2.75.08c0-.16 0-3.58-.17-3.62s-8.08-.21-9.91-.13-9.63.5-9.75.8.12 2.75 0 2.75a36 36 0 0 1-4.3-.34c-.12-.16-.5-18.75-.12-18.87s4.54-.25 4.54-.38-.01-3.47-.05-3.59"
      ></path>
      <path
        fill="#1d1d1b"
        d="M21.62 27.65a21.2 21.2 0 0 1 5.71-.21 38.5 38.5 0 0 1 .12 5.75 36.5 36.5 0 0 1-5.71.13 43 43 0 0 1-.12-5.67"
      ></path>
      <path
        fill="#fac400"
        d="M23.58 29.19a3.86 3.86 0 0 1 1.91 0c0 .13.29 2.17 0 2.3a4.6 4.6 0 0 1-2 .08 14.5 14.5 0 0 1 .09-2.38"
      ></path>
      <path
        fill="#1d1d1b"
        d="M35.28 27.28a21.2 21.2 0 0 1 5.72-.21 37 37 0 0 1 .13 5.75 38 38 0 0 1-5.71.12 43 43 0 0 1-.14-5.66"
      ></path>
      <path
        fill="#fac400"
        d="M37.24 28.82a3.67 3.67 0 0 1 1.92 0c0 .12.29 2.17 0 2.29a4.44 4.44 0 0 1-2 .08 15.5 15.5 0 0 1 .08-2.37"
      ></path>
      <path
        fill="#1d1d1b"
        d="M19 25.9c0 .26 1-.21 1 0s.21 4.09.09 4.17-1 .21-1 0S19 25.82 19 25.9"
      ></path>
      <path
        fill="#002aff"
        d="M48 28.65c.12-.12 2-.25 2 .09s0 5.79-.21 5.79a10.7 10.7 0 0 1-2.08-.09c-.05-.12.16-5.7.29-5.79M52.37 32.82c.2-.07 1.83-.13 1.87.08s-.54 10.42-.71 10.5a5.5 5.5 0 0 1-1.25 0s-.04-10.54.09-10.58M23.83 45.94a42 42 0 0 1 5.7.13v2.25l-5.71-.13a10 10 0 0 1 .01-2.25M34.12 46.15a56 56 0 0 1 6-.21c0 .17.16 1.84 0 1.92S34 48 34 48s0-1.81.12-1.85"
      ></path>
    </g>
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#1d1d1b"
        d="M12.53 30.15a14.3 14.3 0 0 1 .09-2.71c.16 0 3.16.09 3.16 0s-.2-4.25.17-4.46a43 43 0 0 1 4.58-.41v-2.5s-3.87.16-3.91-.17-.63-5.42-.25-5.54 6-.38 6 .08.16 4.59.16 4.59 4-.34 4.17 0 .08 3.37.5 3.41 6.92.29 6.92 0a19.6 19.6 0 0 1 .21-3.54c.2-.16 4.91-.21 4.91-.21a26 26 0 0 1 .09-4c.2-.29 6.41-.33 6.41.05a49 49 0 0 1-.37 5.2c-.17 0-4.92.09-4.92.09v1.12s7.54.21 7.62.59-.2 5.54 0 5.54 3.75 0 3.79.37 0 3.5 0 3.5 4 .09 4.12.54-.29 13.21-.75 13.42a16 16 0 0 1-4.75-.17c-.12-.25 0-8.5-.21-8.58s-2.54 0-2.54 0 .25 9-.08 9.33-5.38.25-5.38.25.38 3.46.13 3.54-10.09.59-10.09.21-.08-5 .3-5.21 7.25-.2 7.2-.41 0-1.84-.12-1.88-15.69.17-15.69.42a6.4 6.4 0 0 0 0 1.79c.13 0 7.17.17 7.21.29a34 34 0 0 1 0 5.05 86 86 0 0 1-9.08 0c-.34-.21-.46-4.09-.46-4.09s-5.54-.58-5.58-.87 0-8.34-.17-8.46a3.7 3.7 0 0 0-1.67 0c0 .13.17 8 0 8.08s-6 .67-6 0S7.83 31 8.2 30.74a26 26 0 0 1 4.33-.59z"
      ></path>
      <g fill="#002aff">
        <path d="M10.12 32.32a13.5 13.5 0 0 1 2.46-.32s.12 11 0 11-2.38.33-2.46 0-.12-10.47 0-10.68zM14.58 29a1.47 1.47 0 0 1 1.12 0c0 .12.08 5.58 0 5.58s-1.08.21-1.13 0-.12-5.47.01-5.58zM18.24 15.78c.18-.12 2.25-.13 2.34.12a8.1 8.1 0 0 1 0 2.42 23 23 0 0 1-2.34 0 6.1 6.1 0 0 1 0-2.54zM41.08 16a10 10 0 0 1 2.58.12 10 10 0 0 1-.08 2.21 13 13 0 0 1-2.5 0 19 19 0 0 1 0-2.33z"></path>
      </g>
      <path
        fill="#775cff"
        d="M22.24 20.57a13.5 13.5 0 0 1 2.84-.13 25 25 0 0 0 .29 3.71c.16 0 10.37-.08 10.41-.29s.21-3.25.34-3.37a7 7 0 0 1 2.5 0c0 .16-.13 2.41.08 2.46s7.17.25 7.25.41-.17 9.21-.17 9.21-1.54-1.67-1.66-1.5-.5.67-.34.75a14.2 14.2 0 0 1 2 2 11 11 0 0 1 0 1.67 22 22 0 0 0-2.46-2c-.09.12-.34.66-.21.79s2.67 2.5 2.67 2.66v1.46a30 30 0 0 0-2.54-1.79c-.12 0-.46.88-.29.92a15 15 0 0 1 2.79 1.79c0 .25.09 1.46.09 1.46S43.12 39 43 39s-.21.87-.21.87a26 26 0 0 1 3 2.17 9 9 0 0 1 0 1.25 19 19 0 0 0-2.58-1.63c-.13.13-.38.67-.17.75s1.88 1.42 1.71 1.46a12.3 12.3 0 0 1-2.75.08c0-.16 0-3.58-.17-3.62s-8.08-.21-9.91-.13-9.63.5-9.75.8.12 2.75 0 2.75a36 36 0 0 1-4.3-.34c-.12-.16-.5-18.75-.12-18.87s4.54-.25 4.54-.38-.01-3.47-.05-3.59z"
      ></path>
      <path
        fill="#1d1d1b"
        d="M21.62 27.65a21.2 21.2 0 0 1 5.71-.21 38.5 38.5 0 0 1 .12 5.75 36.5 36.5 0 0 1-5.71.13 43 43 0 0 1-.12-5.67z"
      ></path>
      <path
        fill="#fac400"
        d="M23.58 29.19a3.86 3.86 0 0 1 1.91 0c0 .13.29 2.17 0 2.3a4.6 4.6 0 0 1-2 .08 14.5 14.5 0 0 1 .09-2.38z"
      ></path>
      <path
        fill="#1d1d1b"
        d="M35.28 27.28a21.2 21.2 0 0 1 5.72-.21 37 37 0 0 1 .13 5.75 38 38 0 0 1-5.71.12 43 43 0 0 1-.14-5.66z"
      ></path>
      <path
        fill="#fac400"
        d="M37.24 28.82a3.67 3.67 0 0 1 1.92 0c0 .12.29 2.17 0 2.29a4.44 4.44 0 0 1-2 .08 15.5 15.5 0 0 1 .08-2.37z"
      ></path>
      <path
        fill="#1d1d1b"
        d="M19 25.9c0 .26 1-.21 1 0s.21 4.09.09 4.17-1 .21-1 0S19 25.82 19 25.9z"
      ></path>
      <path
        fill="#002aff"
        d="M48 28.65c.12-.12 2-.25 2 .09s0 5.79-.21 5.79a10.7 10.7 0 0 1-2.08-.09c-.05-.12.16-5.7.29-5.79zM52.37 32.82c.2-.07 1.83-.13 1.87.08s-.54 10.42-.71 10.5a5.5 5.5 0 0 1-1.25 0s-.04-10.54.09-10.58zM23.83 45.94a42 42 0 0 1 5.7.13v2.25l-5.71-.13a10 10 0 0 1 .01-2.25zM34.12 46.15a56 56 0 0 1 6-.21c0 .17.16 1.84 0 1.92S34 48 34 48s0-1.81.12-1.85z"
      ></path>
    </g>
  </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    className={className}
    viewBox="0 0 1024 1024"
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#3D5AFE"
        d="M960 224v608c0 35.3-28.7 64-64 64H128c-35.3 0-64-28.7-64-64V224c0-17.7 14.3-32 32-32h832c17.7 0 32 14.3 32 32"
      ></path>
      <path
        fill="#ffffffff"
        d="M832 480.2c0 17.7-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32h576c17.7 0 32 14.4 32 32m0 192c0 17.7-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32h576c17.7 0 32 14.4 32 32"
      ></path>
      <path
        fill="#536DFE"
        d="M224 319.8c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32s32 14.3 32 32v127.8c0 17.7-14.3 32-32 32m576 0c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32s32 14.3 32 32v127.8c0 17.7-14.3 32-32 32"
      ></path>
      <path
        fill="#536DFE"
        d="M660.8 704.3H224c-17.7 0-32-14.3-32-32s14.3-32 32-32h461.4c12.1-40.6 18.6-83.5 18.6-128H224c-17.7 0-32-14.3-32-32s14.3-32 32-32h475.5c-14.2-99.8-61.3-189-130-256.3H256v95.8c0 17.7-14.3 32-32 32s-32-14.3-32-32V192H96c-17.7 0-32 14.3-32 32v608c0 35.3 28.7 64 64 64h358.9c75.1-45.2 135.9-112 173.9-191.7"
      ></path>
      <path
        fill="rgba(237, 235, 235, 1)"
        d="M192 480.3c0 17.7 14.3 32 32 32h480v-.2c0-21.6-1.5-42.9-4.5-63.8H224c-17.7 0-32 14.3-32 32m0 192c0 17.7 14.3 32 32 32h436.8c9.8-20.5 18-41.9 24.6-64H224c-17.7 0-32 14.3-32 32"
      ></path>
      <path
        fill="#4762ffff"
        d="M192 287.8c0 17.7 14.3 32 32 32s32-14.3 32-32V192h-64z"
      ></path>
    </g>
  </svg>

);

export const UserPlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
  </svg>
);

export const ShoppingBagIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>

);

export const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export const ErrorIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

export const ArrowRightIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export const MapPinIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

export const TagIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

export const FireIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
  </svg>
);


export const HandoutIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="178"
    height="178"
    className={className}
    viewBox="-51.2 -51.2 1126.4 1126.4"
    {...props}
  >
    <g
      id="SVGRepo_tracerCarrier"
      stroke="#CCC"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="149.504"
    >
      <path
        fill="#F4B1B2"
        d="M526.629 512 190.17 285.257 533.943 65.83 870.4 285.257z"
      ></path>
      <path
        fill="#5900ff"
        d="M526.629 541.257c-7.315 0-7.315 0-14.629-7.314L175.543 307.2c-7.314 0-7.314-14.629-7.314-21.943s7.314-14.628 14.628-21.943L519.314 36.571c7.315-7.314 21.943-7.314 29.257 0L892.343 256c7.314 7.314 14.628 14.629 14.628 21.943s-7.314 14.628-14.628 21.943L541.257 533.943s-7.314 7.314-14.628 7.314m-285.258-256L526.63 475.43 819.2 285.257 526.629 95.086z"
      ></path>
      <path
        fill="#5900ff"
        d="M526.629 716.8 124.343 446.171c-14.629-7.314-21.943-29.257-7.314-36.571 7.314-14.629 21.942-14.629 36.571-7.314l380.343 256 394.971-256c14.629-7.315 29.257-7.315 36.572 7.314s7.314 29.257-7.315 36.571z"
      ></path>
      <path
        fill="#5900ff"
        d="M526.629 877.714 124.343 607.086c-14.629-7.315-21.943-21.943-7.314-36.572 7.314-14.628 21.942-14.628 36.571-7.314l380.343 256 394.971-256c14.629-7.314 29.257-7.314 36.572 7.314 7.314 14.629 7.314 29.257-7.315 36.572z"
      ></path>
    </g>
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#F4B1B2"
        d="M526.629 512 190.17 285.257 533.943 65.83 870.4 285.257z"
      ></path>
      <path
        fill="#5900ff"
        d="M526.629 541.257c-7.315 0-7.315 0-14.629-7.314L175.543 307.2c-7.314 0-7.314-14.629-7.314-21.943s7.314-14.628 14.628-21.943L519.314 36.571c7.315-7.314 21.943-7.314 29.257 0L892.343 256c7.314 7.314 14.628 14.629 14.628 21.943s-7.314 14.628-14.628 21.943L541.257 533.943s-7.314 7.314-14.628 7.314m-285.258-256L526.63 475.43 819.2 285.257 526.629 95.086z"
      ></path>
      <path
        fill="#5900ff"
        d="M526.629 716.8 124.343 446.171c-14.629-7.314-21.943-29.257-7.314-36.571 7.314-14.629 21.942-14.629 36.571-7.314l380.343 256 394.971-256c14.629-7.315 29.257-7.315 36.572 7.314s7.314 29.257-7.315 36.571z"
      ></path>
      <path
        fill="#5900ff"
        d="M526.629 877.714 124.343 607.086c-14.629-7.315-21.943-21.943-7.314-36.572 7.314-14.628 21.942-14.628 36.571-7.314l380.343 256 394.971-256c14.629-7.314 29.257-7.314 36.572 7.314 7.314 14.629 7.314 29.257-7.315 36.572z"
      ></path>
    </g>
  </svg>
);

export const GlobeAmericasIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.546-3.131 1.457-4.341" />
  </svg>
);

export const UltradarkIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    fill="#aabbc6ff"
    height="64px"
    width="64px"
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="-30.72 -30.72 573.44 573.44"
    xmlSpace="preserve"
    stroke="#a6b8caff"
    strokeWidth="13.824000000000002"
    className={className}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="3.072"></g>
    <g id="SVGRepo_iconCarrier">
      <g>
        <g>
          <g>
            <path d="M437.019,74.982C388.667,26.628,324.379,0,256,0S123.334,26.628,74.982,74.982C26.628,123.333,0,187.621,0,256 c0,54.144,16.71,105.713,47.666,148.847c0.36,0.503,0.724,1.003,1.089,1.504c0.575,0.788,1.144,1.579,1.728,2.362 c12.273,16.512,26.512,31.496,42.462,44.659c1.063,0.881,2.135,1.746,3.21,2.609c0.066,0.053,0.13,0.105,0.196,0.157 C141.544,492.332,197.256,512,256,512c45.527,0,90.237-12.104,129.297-35.005c37.904-22.223,69.663-54.018,91.843-91.947 c2.254-3.855,0.956-8.805-2.897-11.06c-3.854-2.254-8.805-0.956-11.06,2.897C420.279,450.254,340.892,495.832,256,495.832 c-43.113,0-83.6-11.442-118.6-31.438c14.599-14.874,22.783-34.718,22.783-55.958c0-44.164-35.928-80.092-80.092-80.092 c-17.215,0-33.637,5.422-47.285,15.448C22.07,316.59,16.168,286.971,16.168,256C16.168,123.756,123.756,16.168,256,16.168 S495.832,123.756,495.832,256c0,34.419-7.132,67.638-21.199,98.734c-1.841,4.068-0.034,8.857,4.034,10.697 c4.069,1.841,8.857,0.033,10.697-4.033C504.385,328.194,512,292.734,512,256C512,187.621,485.372,123.333,437.019,74.982z M80.093,344.512c35.247,0,63.924,28.676,63.924,63.923c0,18.178-7.518,35.076-20.804,47.178 c-35.889-23.953-64.984-57.311-83.732-96.531C50.903,349.65,65.122,344.512,80.093,344.512z"></path>
            <path d="M264.084,125.019c0-25.045-20.374-45.42-45.419-45.42s-45.419,20.375-45.419,45.42c0,25.044,20.374,45.419,45.419,45.419 S264.084,150.062,264.084,125.019z M189.415,125.019c0-16.13,13.122-29.252,29.251-29.252s29.25,13.122,29.25,29.252 c0,16.129-13.122,29.251-29.251,29.251S189.415,141.147,189.415,125.019z"></path>
            <path d="M380.924,148.637c0-17.482-14.221-31.704-31.702-31.704c-17.482,0-31.704,14.222-31.704,31.704 c0,17.481,14.222,31.704,31.704,31.704C366.702,180.34,380.924,166.119,380.924,148.637z M333.685,148.637 c0-8.566,6.97-15.536,15.536-15.536c8.565,0,15.534,6.97,15.534,15.536s-6.969,15.536-15.534,15.536 C340.655,164.172,333.685,157.203,333.685,148.637z"></path>
            <path d="M281.035,351.076c0,28.079,22.844,50.924,50.923,50.924c28.08,0,50.925-22.844,50.925-50.924 c0-28.08-22.845-50.924-50.925-50.924C303.879,300.152,281.035,322.995,281.035,351.076z M331.958,316.32 c19.165,0,34.757,15.592,34.757,34.756s-15.592,34.756-34.757,34.756c-19.164,0-34.755-15.591-34.755-34.756 S312.793,316.32,331.958,316.32z"></path>
            <path d="M135.105,270.096c0,17.259,14.041,31.301,31.299,31.301c17.259,0,31.301-14.042,31.301-31.301 c0-17.259-14.042-31.3-31.301-31.3C149.146,238.796,135.105,252.836,135.105,270.096z M181.537,270.096 c0,8.344-6.789,15.133-15.133,15.133c-8.343,0-15.13-6.788-15.13-15.133c0-8.344,6.787-15.131,15.13-15.131 C174.748,254.964,181.537,261.752,181.537,270.096z"></path>
          </g>
        </g>
      </g>
    </g>
  </svg>
);

export const QuoteIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="-2 -6 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      d="M12 0v8h4v4h4v-12zm-12 0h8v12h-4v-4h-4z"
    />
  </svg>
);

export const RepostIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-3 -3 30 30" strokeWidth={1.5} stroke="currentColor" className={className}>
    <g id="SVGRepo_iconCarrier">
      <g
        id="Page-1"
        fill="none"
        fillRule="evenodd"
        stroke="none"
        strokeWidth="1"
      >
        <g
          id="Dribbble-Light-Preview"
          fill="#64748b"
          transform="translate(-300 -7039)"
        >
          <g id="icons" transform="translate(56 160)">
            <path
              id="arrow_left-[#246]"
              d="M244 6884.445c0 3.008 2.462 5.445 5.5 5.445h9c1.933 0 3.5 1.551 3.5 3.465s-1.567 3.465-3.5 3.465h-10.293a.495.495 0 0 1-.353-.846l1.682-1.665a.984.984 0 0 0 0-1.4 1.01 1.01 0 0 0-1.415 0l-3.535 3.501a1.966 1.966 0 0 0 0 2.8l3.535 3.5a1.01 1.01 0 0 0 1.415 0 .984.984 0 0 0 0-1.4l-1.682-1.665a.495.495 0 0 1 .353-.845H258.5c3.038 0 5.5-2.437 5.5-5.445s-2.462-5.445-5.5-5.445h-9c-1.933 0-3.5-1.551-3.5-3.465s1.567-3.465 3.5-3.465H263c.552 0 1-.444 1-.99a.995.995 0 0 0-1-.99h-13.5c-3.038 0-5.5 2.437-5.5 5.445"
            ></path>
          </g>
        </g>
      </g>
    </g>
  </svg>
);

// Archive Icon - Clean drawer/box style
export const ArchiveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

// Chevron Left Icon - Used for the "Back" button on mobile chat
export const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const PhoneIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);
