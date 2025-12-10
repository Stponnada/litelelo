'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BlurText from './BlurText';
import { useAuth } from '@/hooks/useAuth';

interface WelcomeScreenProps {
  onComplete?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const { profile } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  const handleClick = () => {
    if (animationComplete) {
      if (onComplete) {
        onComplete();
      } else {
        router.push('/');
      }
    }
  };

  // Use full_name from the completed profile
  const userName = profile?.full_name;
  const welcomeText = userName ? `Welcome, ${userName}!` : 'Welcome to litelelo!';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary-light dark:bg-primary cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label="Click to continue to home"
    >
      <div className="text-center px-4">
        {showContent && (
          <BlurText
            text={welcomeText}
            delay={150}
            animateBy="words"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-brand-green"
          />
        )}
        {animationComplete && (
          <p className="mt-8 text-sm text-text-secondary-light dark:text-text-secondary animate-pulse">
            Tap anywhere to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;

