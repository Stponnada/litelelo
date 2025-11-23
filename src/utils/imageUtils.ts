// src/utils/imageUtils.ts

const AVATAR_PLACEHOLDER = 'https://ui-avatars.com/api/?name=User&background=1e293b&color=3cfba2';

/**
 * Generates a URL for a resized avatar from Supabase Storage.
 * If the URL is invalid or not a Supabase URL, it returns a placeholder.
 * @param url The original avatar URL.
 * @param width The desired width of the avatar.
 * @param height The desired height of the avatar.
 * @returns A URL for the resized image or a placeholder.
 */
export const getResizedAvatarUrl = (url: string | null | undefined, width: number, height: number): string => {
  if (!url) {
    return AVATAR_PLACEHOLDER;
  }

  // If it's already a placeholder, don't transform it
  if (url.startsWith('https://ui-avatars.com')) {
    return url;
  }

  // Check if it's a Supabase Storage URL that we can transform
  if (url.includes('/storage/v1/object/public/')) {
    // Replace the 'object/public' part with 'render/image/public' to use the transformation API
    const transformedUrl = url.replace('/object/public/', '/render/image/public/');
    // If the incoming URL already contains query params (e.g. ?t=timestamp), append with & instead of ?
    const separator = transformedUrl.includes('?') ? '&' : '?';
    return `${transformedUrl}${separator}width=${width}&height=${height}&resize=cover`;
  }

  // If it's not a transformable URL, return the original
  return url;
};