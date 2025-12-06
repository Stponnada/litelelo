// src/utils/renderEmbeds.tsx

import React from 'react';
import { Tweet } from 'react-tweet';
import { renderWithMentions } from './renderMentions';

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9\-_]{11})/;
const TWITTER_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+)\/status\/(\d+)/;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => (
  <div className="my-4 rounded-lg overflow-hidden">
    <div className="relative" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  </div>
);

// Helper function to convert URLs in text to clickable links
const linkifyText = (text: string): React.ReactNode => {
  const parts = text.split(URL_REGEX);

  return parts.map((part, i) => {
    // Check if this part is a URL
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    // Otherwise, render with mentions
    return <React.Fragment key={i}>{renderWithMentions(part)}</React.Fragment>;
  });
};

export const renderContentWithEmbeds = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const lines = text.split('\n');

  return lines.map((line, index) => {
    const youtubeMatch = line.match(YOUTUBE_REGEX);
    if (youtubeMatch && youtubeMatch[1]) {
      return <YouTubeEmbed key={`yt-${index}`} videoId={youtubeMatch[1]} />;
    }

    const twitterMatch = line.match(TWITTER_REGEX);
    if (twitterMatch && twitterMatch[1]) {
      return (
        <div key={`tweet-${index}`} className="my-4 grid place-items-center">
          {/* --- THE FIX: Added style to remove internal padding --- */}
          <div
            // --- MY FIX: Changed max-w-sm to sm:max-w-sm to make it responsive. ---
            // This ensures the tweet embed is full-width on mobile and doesn't overflow,
            // while maintaining the max-width on desktop for better layout.
            className="w-full sm:max-w-sm min-w-0"
            style={{ '--tweet-padding': '0px' } as React.CSSProperties}
          >
            <Tweet id={twitterMatch[1]} />
          </div>
        </div>
      );
    }

    if (line.trim() === '') {
      return null;
    }

    return (
      <p key={`text-${index}`} className="whitespace-pre-wrap">
        {linkifyText(line)}
      </p>
    );
  });
};