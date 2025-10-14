// src/components/LightBox.tsx

import React from 'react';
import { XCircleIcon } from './icons';

interface LightBoxProps {
    imageUrl: string;
    onClose: () => void;
}

const LightBox: React.FC<LightBoxProps> = ({ imageUrl, onClose }) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const closeButtonRef = React.useRef<HTMLButtonElement>(null);

    // Prevents the modal from closing when the image itself is clicked.
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // Handle ESC key to close lightbox
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when lightbox is open
    React.useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Focus close button on mount for accessibility
    React.useEffect(() => {
        closeButtonRef.current?.focus();
    }, []);

    return (
        <div
            className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black bg-opacity-95 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            style={{
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            {/* Close button with modern styling */}
            <button
                ref={closeButtonRef}
                onClick={onClose}
                className="absolute top-6 right-6 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 z-50 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-1 bg-black/30 backdrop-blur-md hover:bg-black/50"
                aria-label="Close image view"
            >
                <XCircleIcon className="w-10 h-10 drop-shadow-lg" />
            </button>

            {/* Image counter or metadata could go here */}
            <div className="absolute top-6 left-6 text-white/80 text-sm font-medium bg-black/30 backdrop-blur-md px-4 py-2 rounded-full">
                Press ESC to close
            </div>
            
            <div 
                className="relative w-full h-full flex items-center justify-center" 
                onClick={handleContentClick}
            >
                {/* Loading spinner with glow effect */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin blur-sm" 
                                 style={{ animationDuration: '0.8s' }} />
                        </div>
                    </div>
                )}
                
                {/* Image with enhanced styling */}
                <div 
                    className={`relative transition-all duration-500 ${
                        isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                >
                    <img
                        src={imageUrl}
                        alt="Full size view"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                        style={{
                            filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
                        }}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                    
                    {/* Subtle glow effect behind image */}
                    <div 
                        className="absolute inset-0 -z-10 blur-3xl opacity-20"
                        style={{
                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
                        }}
                    />
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default LightBox;