// src/components/AboutModal.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon } from './icons';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const [clickCount, setClickCount] = useState(0);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // This function will be called on each click of the logo
    setClickCount(prevCount => prevCount + 1);
  };

  useEffect(() => {
    // This effect runs whenever the click count changes
    if (clickCount === 0) return; // Do nothing if count is 0

    // If 5 clicks are reached, navigate to the easter egg page
    if (clickCount >= 5) {
      onClose(); // Close the modal
      navigate('/easter-egg'); // Navigate to the secret page
    }

    // Set a timer to reset the click count if the user stops clicking
    const timer = setTimeout(() => setClickCount(0), 1500);

    // Clean up the timer if the component unmounts or clickCount changes
    return () => clearTimeout(timer);
  }, [clickCount, navigate, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-secondary-light dark:bg-secondary rounded-lg shadow-2xl w-full max-w-2xl border border-brand-green/20 dark:border-brand-green/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient accent */}
        <div className="relative bg-gradient-to-r from-brand-green/5 to-transparent p-6 border-b border-tertiary-light dark:border-tertiary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                [Life is unfair.]
              </p>
              <h1 
                className="text-4xl font-raleway font-black text-brand-green mb-1 cursor-pointer select-none"
                onClick={handleLogoClick}
                title="What are you clicking at?"
              >
                litelelo.
              </h1>

            </div>
            <button
              onClick={onClose}
              className="text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green dark:hover:text-brand-green transition-colors"
              aria-label="Close modal"
            >
              <XCircleIcon className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* About Section */}

          
          {/* The Project Section */}
          <div className="group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-brand-green rounded-full"></div>
              <h2 className="font-bold text-xl text-text-main-light dark:text-text-main">
                About litelelo.
              </h2>
            </div>
            <p className="text-text-secondary-light dark:text-text-secondary leading-relaxed pl-4">
                Connect with friends and explore your campus like never before with Litelelo.            </p>
          </div>

          {/* The People Section */}
          <div className="group">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-brand-green rounded-full"></div>
              <h2 className="font-bold text-xl text-text-main-light dark:text-text-main">
                The People
              </h2>
            </div>
            <div className="pl-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-tertiary-light/30 dark:bg-tertiary/30 border border-transparent hover:border-brand-green/30 transition-colors">
                <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold text-text-main-light dark:text-text-main">
                    Sriniketh Ponnada
                  </p>
                  <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                    Founder & CEO
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-tertiary-light/30 dark:bg-tertiary/30 border border-transparent hover:border-brand-green/30 transition-colors">
                <div className="w-2 h-2 bg-brand-green rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold text-text-main-light dark:text-text-main">
                    Saathvik Manikandan
                  </p>
                  <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                    Co-Founder & President
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-transparent to-brand-green/5 border-t border-tertiary-light dark:border-tertiary py-4 px-6">
          <div className="text-center text-xs text-text-tertiary-light dark:text-text-tertiary space-y-1">
            <p className="font-medium">litelelo. © {new Date().getFullYear()}</p>
            <p>a Sriniketh Ponnada production</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;