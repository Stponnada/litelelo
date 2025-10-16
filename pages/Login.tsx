// src/pages/Login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../components/icons';
import Spinner from '../components/Spinner';

// === Music & Pause Icons ===
const MusicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M9 19a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm7-11.5V17a1 1 0 1 1-2 0V8.91l-3.64.77A1 1 0 0 1 9 8.7V5a1 1 0 0 1 .79-.98l6-1.25A1 1 0 0 1 17 3.75Z" />
  </svg>
);
const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const BITS_DOMAINS = [
  'hyderabad.bits-pilani.ac.in',
  'goa.bits-pilani.ac.in',
  'pilani.bits-pilani.ac.in',
  'dubai.bits-pilani.ac.in'
];

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const navigate = useNavigate();
  const { session, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // === Music state ===
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (session) navigate('/');
  }, [session, navigate]);

  // Typewriter effect
  useEffect(() => {
    const fullText = 'The exclusive social network for BITSians.';
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) setTypedText(fullText.slice(0, index++));
      else clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const validateEmail = (email: string) => BITS_DOMAINS.includes(email.split('@')[1]);

  // Setup audio
  useEffect(() => {
    const newAudio = new Audio('/login_music.mp3');
    newAudio.loop = true;
    newAudio.volume = 0.2;
    setAudio(newAudio);

    const ctx = new AudioContext();
    const analyserNode = ctx.createAnalyser();
    const source = ctx.createMediaElementSource(newAudio);
    source.connect(analyserNode);
    analyserNode.connect(ctx.destination);
    analyserNode.fftSize = 128;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArr = new Uint8Array(bufferLength);

    setAudioCtx(ctx);
    setAnalyser(analyserNode);
    setDataArray(dataArr);

    return () => {
      newAudio.pause();
      newAudio.src = '';
    };
  }, []);
  
  // High-DPI Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx?.scale(dpr, dpr);
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  // === Draw gonio circular visual ===
  const drawGonio = () => {
    if (!canvasRef.current || !analyser || !dataArray) return;
    const canvas = canvasRef.current;
    const { width, height } = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // --- THIS IS THE NEW DRAWING LOGIC ---
    const centerX = width / 1.75;
    const centerY = height * 1.75; // Center the arc's origin well below the screen
    const radius = height * 1.55;    // Use a large radius based on screen height
    
    analyser.getByteFrequencyData(dataArray);
    
    const bufferLength = analyser.frequencyBinCount;
    // Spread the visualizer across a wide, flat arc (approx 120 degrees)
    const totalArc = Math.PI * 0.76; 
    // Start angle is offset to center this arc at the top of its circle
    const startAngle = -Math.PI / 2 - totalArc / 2 + 0.52;

    dataArray.forEach((val, i) => {
        const angle = startAngle + (i / bufferLength) * totalArc;
        const length = (val / 255) * (height * 0.4); // Max length is 40% of screen height

        const startX = centerX + radius * Math.cos(angle);
        const startY = centerY + radius * Math.sin(angle);
        const endX = centerX + (radius + length) * Math.cos(angle);
        const endY = centerY + (radius + length) * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        ctx.strokeStyle = `rgba(60, 251, 162, ${Math.max(0.2, val / 255)})`;
        ctx.lineWidth = 3; // Make lines a bit thicker to match reference
        ctx.stroke();
    });

    ctx.restore();
    requestAnimationFrame(drawGonio);
  };

  // Start visual
  useEffect(() => {
    if (isPlaying) {
        requestAnimationFrame(drawGonio);
    }
  }, [isPlaying, analyser, dataArray]);

  const fadeInAudio = (targetVol = 0.2) => {
    if (!audio) return;
    audio.volume = 0;
    audio.play().catch(() => {});
    const interval = setInterval(() => {
      if (!audio) return clearInterval(interval);
      if (audio.volume < targetVol - 0.01) audio.volume = Math.min(targetVol, audio.volume + 0.02);
      else clearInterval(interval);
    }, 60);
  };

  const fadeOutAudio = (callback?: () => void) => {
    if (!audio || !isPlaying) {
      callback?.();
      return;
    }
    const interval = setInterval(() => {
      if (!audio) return clearInterval(interval);
      if (audio.volume > 0.02) audio.volume -= 0.02;
      else {
        clearInterval(interval);
        try { audio.pause(); } catch {}
        audio.volume = 0.2;
        setIsPlaying(false);
        callback?.();
      }
    }, 60);
  };

  const toggleMusic = () => {
    if (!audio || !audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) fadeOutAudio();
    else { fadeInAudio(); setIsPlaying(true); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        fadeOutAudio(() => { setLoading(false); navigate('/'); });
      } else {
        if (/\s/.test(username)) throw new Error('Username cannot contain spaces.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        if (!validateEmail(email)) throw new Error('Please use a valid BITS Pilani email address.');
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Sign up returned no user.');
        const { error: profileError } = await supabase.from('profiles').insert({ user_id: data.user.id, username: username.trim(), email: data.user.email });
        if (profileError) throw profileError;
        fadeOutAudio(() => { setLoading(false); navigate('/'); });
      }
    } catch (err: any) {
      setError(err.message); setLoading(false);
    }
  };

  if (authLoading || session) return <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary"><Spinner /></div>;

  return (
    <div className="relative flex flex-col lg:flex-row items-center justify-center min-h-screen bg-primary-light dark:bg-primary p-4 overflow-hidden">
      {/* Background waves */}
      <div className={`absolute inset-0 z-0 transition-all duration-[3s] ${isPlaying ? 'opacity-0' : 'opacity-50'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(0,255,100,0.7)_0%,transparent_70%),radial-gradient(circle_at_85%_75%,rgba(0,255,150,0.15)_0%,transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(130deg,transparent_0%,rgba(0,255,100,0.17)_10%,transparent_20%,rgba(0,255,150,0.22)_30%,transparent_40%,rgba(0,255,100,0.25)_50%,transparent_60%)] bg-[length:400%_400%] animate-[circuitFlowSmooth_18s_ease-in-out_infinite]"></div>
      </div>

      {/* Wire/Gonio canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full z-0 pointer-events-none transition-opacity duration-2000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md lg:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full bg-secondary-light dark:bg-secondary p-8 rounded-lg shadow-lg relative backdrop-blur-sm bg-opacity-90 dark:bg-opacity-80">
          <h2 className="text-2xl font-bold text-center text-text-main-light dark:text-text-main mb-6">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input type="email" placeholder={isLogin ? 'Email' : 'BITS Email'} value={email} onChange={e => setEmail(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />
            {!isLogin && <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />}
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />
            {!isLogin && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />}
            <button type="submit" disabled={loading} className="bg-brand-green text-black font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-brand-green-darker disabled:opacity-50">{loading ? <Spinner /> : isLogin ? 'Log In' : 'Sign Up'}</button>
          </form>
          {error && <p className="mt-4 text-red-400 text-center text-sm">{error}</p>}
          <div className="mt-6 flex justify-between items-center">
            <button onClick={toggleMusic} className="bg-brand-green text-black p-2 rounded-full hover:bg-brand-green-darker transition">
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <MusicIcon className="w-6 h-6" />}
            </button>
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main">
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </button>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="relative z-10 w-full max-w-md lg:w-1/2 flex items-center justify-center p-8 order-first lg:order-last">
        <div className="text-center lg:text-left">
          <h1
            className={`logo-transform text-8xl lg:text-8xl font-black select-none
              ${isPlaying
                ? 'font-rubik-glitch text-neon-green animate-glitch'
                : 'font-raleway text-brand-green drop-shadow-[0_0_20px_rgba(0,255,150,0.3)]'
              }`}
          >
            litelelo.
          </h1>
          <p className="text-text-tertiary-light dark:text-text-tertiary mt-4 text-lg min-h-[28px]">
            {typedText}{typedText.length < 45 && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <button onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`} className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary shadow-lg flex items-center justify-center text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors">
        {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default Login;