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
    xmlSpace="preserve"
    id="Layer_1"
    width="64"
    height="64"
    fill="#000"
    version="1"
    viewBox="0 0 64 64"
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#394240"
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
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#F9EBB2"
        d="M8 32h12c2.211 0 4 1.789 4 4v4h16v-4c0-2.211 1.789-4 4-4h12V8H8z"
      ></path>
      <g fill="#394240">
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
    xmlSpace="preserve"
    id="Layer_1"
    width="64"
    height="64"
    fill="#000"
    version="1"
    viewBox="0 0 64 64"
  >
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#394240"
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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    stroke="#000"
    strokeWidth="3.072"
    className="icon"
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
    width="64"
    height="64"
    fill="#1e00ff"
    stroke="#1e00ff"
    viewBox="0 0 64 64"
  >
    <path
      id="SVGRepo_iconCarrier"
      fill="#1d1d1b"
      d="M21.62 27.65a43 43 0 0 0 .12 5.67 36.5 36.5 0 0 0 5.71-.13 38.5 38.5 0 0 0-.12-5.75 21.2 21.2 0 0 0-5.71.21zm3.87 3.84a4.6 4.6 0 0 1-2 .08 14.5 14.5 0 0 1 0-2.38 3.86 3.86 0 0 1 1.91 0c.13.13.38 2.17.09 2.3zm9.79-4.21a43 43 0 0 0 .13 5.66 38 38 0 0 0 5.71-.12 37 37 0 0 0-.12-5.75 21.2 21.2 0 0 0-5.72.21zm3.88 3.83a4.44 4.44 0 0 1-2 .08 15.5 15.5 0 0 1 0-2.37 3.67 3.67 0 0 1 1.92 0c.12.12.37 2.18.08 2.29zM19 25.9v4.21c0 .21.91.08 1 0s0-3.92 0-4.17-1 .22-1-.04zm37 5.79c-.12-.45-4.12-.54-4.12-.54v-3.5c0-.38-3.62-.37-3.79-.37s.13-5.17 0-5.54-7.62-.59-7.62-.59v-1.12s4.75 0 4.92-.09a49 49 0 0 0 .37-5.2c0-.38-6.21-.34-6.41-.05a26 26 0 0 0-.09 4s-4.71 0-4.91.21a19.6 19.6 0 0 0-.21 3.54c0 .25-6.5 0-6.92 0s-.37-3.08-.5-3.41-4.17 0-4.17 0-.12-4.13-.16-4.59-5.67-.21-6-.08.2 5.21.25 5.54 3.91.17 3.91.17v2.5a43 43 0 0 0-4.58.41c-.37.21-.17 4.34-.17 4.46s-3 0-3.16 0a14.3 14.3 0 0 0-.09 2.71 26 26 0 0 0-4.33.59c-.37.29 0 13 0 13.7s5.84.13 6 0 0-7.95 0-8.08a3.7 3.7 0 0 1 1.67 0c.21.12.12 8.17.17 8.46s5.58.87 5.58.87.12 3.88.46 4.09a86 86 0 0 0 9.08 0 34 34 0 0 0 0-5.05c0-.12-7.08-.29-7.21-.29a6.4 6.4 0 0 1 0-1.79c0-.25 15.54-.5 15.71-.46s.08 1.67.12 1.88-6.83.25-7.2.41-.3 4.84-.3 5.21 9.84-.12 10.09-.21-.13-3.54-.13-3.54 5 0 5.38-.25.08-9.33.08-9.33h2.54c.16 0 .09 8.33.21 8.58a16 16 0 0 0 4.75.17c.44-.21.86-12.96.78-13.42zM41.08 16a10 10 0 0 1 2.58.12 10 10 0 0 1-.08 2.21 13 13 0 0 1-2.5 0 19 19 0 0 1 0-2.33zm-28.5 27c-.13 0-2.38.33-2.46 0s-.09-10.5 0-10.71a13.5 13.5 0 0 1 2.46-.29s.12 11 0 11zm3.08-8.42c-.13 0-1.08.21-1.13 0s-.08-5.5.05-5.62a1.47 1.47 0 0 1 1.12 0c.04.19.08 5.65-.04 5.65zm2.58-16.25a6.1 6.1 0 0 1 0-2.58c.18-.12 2.25-.13 2.34.12a8.1 8.1 0 0 1 0 2.42 23 23 0 0 1-2.34.07zm11.29 27.74v2.25l-5.71-.13a10 10 0 0 1 0-2.25 42 42 0 0 1 5.71.13zM40 47.86c-.2.08-6 .13-6 .13s-.08-1.8.09-1.84a56 56 0 0 1 6-.21c-.01.17.15 1.84-.09 1.92zm3.75-16a14.2 14.2 0 0 1 2 2 11 11 0 0 1 0 1.67 22 22 0 0 0-2.46-2c-.09.12-.34.66-.21.79s2.67 2.5 2.67 2.66v1.46a30 30 0 0 0-2.54-1.79c-.12 0-.46.88-.29.92a15 15 0 0 1 2.79 1.79c0 .25.09 1.46.09 1.46S43.12 39 43 39s-.21.87-.21.87a26 26 0 0 1 3 2.17 9 9 0 0 1 0 1.25 19 19 0 0 0-2.58-1.63c-.13.13-.38.67-.17.75s1.88 1.42 1.71 1.46a12.3 12.3 0 0 1-2.75.08c0-.16 0-3.58-.17-3.62s-8.08-.21-9.91-.13-9.63.5-9.75.8.12 2.75 0 2.75a36 36 0 0 1-4.3-.34c-.12-.16-.5-18.75-.12-18.87s4.54-.25 4.54-.38.08-3.46 0-3.58a13.5 13.5 0 0 1 2.84-.13 25 25 0 0 0 .29 3.71c.16 0 10.37-.08 10.41-.29s.21-3.25.34-3.37a7 7 0 0 1 2.5 0c0 .16-.13 2.41.08 2.46s7.17.25 7.25.41-.17 9.21-.17 9.21-1.54-1.67-1.66-1.5-.55.7-.39.78zm6 2.67a10.7 10.7 0 0 1-2.08-.09c0-.12.17-5.7.25-5.79s2-.25 2 .09.08 5.79-.14 5.79zm3.75 8.87a5.5 5.5 0 0 1-1.25 0s0-10.5.09-10.54 1.83-.13 1.87.08-.51 10.38-.68 10.46z"
    ></path>
  </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    className="icon"
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