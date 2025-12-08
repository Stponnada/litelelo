import React, { useState, useRef, useEffect } from 'react';
import {
  GlobeAmericasIcon,
  UserGroupIcon,
  LockClosedIcon
} from './icons'; // Assuming these icons are available or defined here

// --- Icons ---
// Included inline in case they are missing from your icons file
const ChevronDown: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);


interface VisibilityDropdownProps {
  currentVisibility: 'public' | 'friends' | 'specific';
  onSelect: (visibility: 'public' | 'friends' | 'specific') => void;
  allowedViewersCount: number;
}

const visibilityOptions = [
  { value: 'public', label: 'Public', icon: GlobeAmericasIcon },
  { value: 'friends', label: 'Friends Only', icon: UserGroupIcon },
  { value: 'specific', label: 'Specific Friends', icon: LockClosedIcon },
];

const VisibilityDropdown: React.FC<VisibilityDropdownProps> = ({ currentVisibility, onSelect, allowedViewersCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = visibilityOptions.find(opt => opt.value === currentVisibility);
  const IconComponent = selectedOption?.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value: 'public' | 'friends' | 'specific') => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5 cursor-pointer transition-all"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {IconComponent && <IconComponent className="w-4 h-4 text-brand-green" />}
        <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary capitalize">
          {currentVisibility === 'specific'
            ? (allowedViewersCount > 0 ? `${allowedViewersCount} Friends` : 'Specific')
            : selectedOption?.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-text-tertiary-light dark:text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-40 top-full mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-secondary border border-gray-200 dark:border-tertiary right-0 transform translate-x-1/4 animate-fade-in-up origin-top-right">
          <ul className="py-1">
            {visibilityOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value as 'public' | 'friends' | 'specific')}
                  className="flex items-center w-full px-4 py-2 text-sm text-text-main-light dark:text-text-main hover:bg-gray-100 dark:hover:bg-tertiary transition-colors"
                >
                  <option.icon className="w-4 h-4 mr-3 text-brand-green" />
                  <span>{option.label}</span>
                  {currentVisibility === option.value && (
                    <CheckIcon className="w-4 h-4 ml-auto text-brand-green" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VisibilityDropdown;