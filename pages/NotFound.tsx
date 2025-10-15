import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Honk&display=swap');
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
          
          .fade-in {
            animation: fadeIn 0.8s ease-out forwards;
          }
          
          .pulse-hover:hover {
            animation: pulse 0.6s ease-in-out;
          }

          .gradient-bg {
            background: linear-gradient(-45deg, #9333ea, #ec4899, #f97316, #f59e0b);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
          }
        `}
      </style>
      
      <div className="gradient-bg min-h-screen flex items-center justify-center p-5">
        <div className="text-center fade-in">
          <div className="float-animation mb-8">
            <h1 
              className="text-9xl md:text-[150px] font-bold text-white mb-8 drop-shadow-2xl leading-none"
              style={{ fontFamily: "'Honk', system-ui" }}
            >
              404
            </h1>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur-xl rounded-3xl p-12 md:p-14 shadow-2xl max-w-md mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
              Oops! Page Not Found
            </h2>
            
            <p className="text-lg md:text-xl text-white mb-10 opacity-90 leading-relaxed">
              Looks like you've ventured into uncharted territory. 
              The page you're looking for doesn't exist.
            </p>
            
            <Link 
              to="/" 
              className="inline-block bg-white text-purple-600 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 pulse-hover"
            >
              Take Me Home
            </Link>
          </div>
          
          <div className="mt-16 flex justify-center gap-8">
            <div 
              className="w-16 h-16 bg-white bg-opacity-20 rounded-full float-animation" 
              style={{ animationDelay: '0s' }}
            />
            <div 
              className="w-12 h-12 bg-white bg-opacity-20 rounded-full float-animation" 
              style={{ animationDelay: '0.5s' }}
            />
            <div 
              className="w-20 h-20 bg-white bg-opacity-20 rounded-full float-animation" 
              style={{ animationDelay: '1s' }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;