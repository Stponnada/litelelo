// src/pages/NotFound.tsx

import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50% { transform: translateY(-15px) rotate(1deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      
      <div className="bg-primary-light dark:bg-primary min-h-screen flex items-center justify-center p-4 overflow-hidden">
        {/* Pattern Overlay from Header */}
        <div className="absolute inset-0 bg-repeat bg-[url('/patterns/tech-circuit.svg')] opacity-5 dark:opacity-25 pointer-events-none" />
        
        {/* Subtle background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-green/5 dark:bg-brand-green/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-green/5 dark:bg-brand-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative text-center z-10" style={{ animation: 'fadeIn 1s ease-out forwards' }}>
          {/* 404 Heading */}
          <div style={{ animation: 'float 4s ease-in-out infinite' }}>
            <h1 
              className="text-8xl md:text-9xl font-raleway font-black text-brand-green"
              style={{ textShadow: '0 0 15px rgba(60, 251, 162, 0.4), 0 0 30px rgba(60, 251, 162, 0.2)' }}
            >
              404
            </h1>
          </div>
          
          {/* Message Card */}
          <div className="max-w-md mx-auto mt-6">
            <h2 className="text-3xl md:text-4xl font-bold text-text-main-light dark:text-text-main" style={{ animation: 'fadeIn 1s 0.2s ease-out forwards', opacity: 0 }}>
              Page Not Found
            </h2>
            
            <p className="text-md md:text-lg text-text-secondary-light dark:text-text-secondary mt-4 mb-8 leading-relaxed" style={{ animation: 'fadeIn 1s 0.4s ease-out forwards', opacity: 0 }}>
              Oops! It seems you've ventured into uncharted territory. 
              Let's get you back on track.
            </p>
            
            <Link 
              to="/" 
              className="inline-block bg-brand-green text-black font-bold text-base px-8 py-3 rounded-full shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30 transform hover:-translate-y-1 transition-all duration-300"
              style={{ animation: 'fadeIn 1s 0.6s ease-out forwards', opacity: 0 }}
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;