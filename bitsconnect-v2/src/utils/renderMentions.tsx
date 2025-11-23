// src/utils/renderMentions.tsx

import React from 'react';
// FIXED: Use Next.js Link
import Link from 'next/link';

export const renderWithMentions = (text: string): React.ReactNode[] => {
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const parts = text.split(mentionRegex);

  return parts.map((part, index) => {
    // Every odd-indexed part is a username captured by the parentheses in the regex
    if (index % 2 === 1) {
      return (
        <Link
          key={index}
          // FIXED: Changed 'to' to 'href'
          href={`/profile/${part}`}
          className="text-brand-green hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent triggering post link
        >
          @{part}
        </Link>
      );
    }
    // Even-indexed parts are the regular text surrounding the mentions
    return part;
  });
};