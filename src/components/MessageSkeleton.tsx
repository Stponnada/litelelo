// src/components/MessageSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';

const MessageSkeleton: React.FC<{ align?: 'left' | 'right' }> = ({ align = 'left' }) => {
  const isRight = align === 'right';
  // Use a few different widths to make the skeleton look more natural
  const widths = ['w-32', 'w-48', 'w-56', 'w-64'];
  const randomWidth = widths[Math.floor(Math.random() * widths.length)];

  return (
    <div className={`flex items-end gap-2 w-full ${isRight ? 'justify-end' : 'justify-start'}`}>
      {!isRight && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
      <div className={`max-w-[70%]`}>
        <Skeleton className={`h-10 ${randomWidth} rounded-2xl`} />
      </div>
    </div>
  );
};

export default MessageSkeleton;