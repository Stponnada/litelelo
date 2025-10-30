import { useEffect, useState } from 'react';

export const useThemeDetector = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    // Create an observer instance to watch for class changes on the <html> element
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      }
    });

    // Start observing the target node for configured mutations
    observer.observe(document.documentElement, { attributes: true });

    // Cleanup the observer on component unmount
    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};