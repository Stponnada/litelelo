// src/pages/Login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../components/icons';
import Spinner from '../components/Spinner';

// === Icon Components (Kept for brevity) ===
const MusicIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>);
const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>);
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A8 8 0 0 1 24 36c-5.223 0-9.655-3.657-11.303-8.59H4.89v.01A20 20 0 0 0 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.434 36.316 48 30.659 48 24c0-1.341-.138-2.65-.389-3.917z" /></svg>);

const BITS_DOMAINS = [
  'hyderabad.bits-pilani.ac.in',
  'goa.bits-pilani.ac.in',
  'pilani.bits-pilani.ac.in',
  'dubai.bits-pilani.ac.in'
];

type AuthView = 'signup' | 'login' | 'reset_request';

// --- Form components defined outside the main component to prevent re-creation ---

interface AuthFormProps {
  view: 'login' | 'signup';
  handleAuth: (e: React.FormEvent) => Promise<void>;
  email: string; setEmail: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  loading: boolean;
  setView: (v: AuthView) => void;
  setError: (v: string | null) => void;
  setMessage: (v: string | null) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  view, handleAuth, email, setEmail, username, setUsername, password, setPassword,
  confirmPassword, setConfirmPassword, loading, setView, setError, setMessage
}) => (
  <form onSubmit={handleAuth} className="flex flex-col gap-3 sm:gap-4">
    {view === 'signup' && <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />}
    <input type="email" placeholder={view === 'signup' ? 'BITS Email' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />
    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />
    {view === 'signup' && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />}
    {view === 'login' && (
      <button type="button" onClick={() => { setView('reset_request'); setError(null); setMessage(null); }} className="text-xs text-right text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green">
        Forgot Password?
      </button>
    )}
    <button type="submit" disabled={loading} className="bg-brand-green text-black font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-brand-green-darker disabled:opacity-50">{loading ? <Spinner /> : view === 'login' ? 'Log In' : 'Sign Up'}</button>
  </form>
);

interface ResetFormProps {
  handlePasswordResetRequest: (e: React.FormEvent) => Promise<void>;
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
}

const ResetRequestForm: React.FC<ResetFormProps> = ({ handlePasswordResetRequest, email, setEmail, loading }) => (
  <form onSubmit={handlePasswordResetRequest} className="flex flex-col gap-4">
    <p className="text-sm text-center text-text-secondary-light dark:text-text-secondary">Enter your email to receive a password reset link.</p>
    <input type="email" placeholder="BITS Email" value={email} onChange={e => setEmail(e.target.value)} required className="p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green" />
    <button type="submit" disabled={loading} className="bg-brand-green text-black font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-brand-green-darker disabled:opacity-50">{loading ? <Spinner /> : 'Send Reset Link'}</button>
  </form>
);


const Login: React.FC = () => {
  const [view, setView] = useState<AuthView>('signup');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const navigate = useNavigate();
  const { session, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (session) navigate('/');
  }, [session, navigate]);

  useEffect(() => {
    const fullText = 'The exclusive social network for BITSians.';
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) setTypedText(fullText.slice(0, index++));
      else clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) { setError(error.message); setLoading(false); }
  };

  const validateEmail = (email: string) => BITS_DOMAINS.includes(email.split('@')[1]);

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
    return () => { newAudio.pause(); newAudio.src = ''; };
  }, []);

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

  const drawGonio = () => {
    if (!canvasRef.current || !analyser || !dataArray) return;
    const canvas = canvasRef.current;
    const { width, height } = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    const centerX = width / 1.75;
    const centerY = height * 1.75;
    const radius = height * 1.55;
    analyser.getByteFrequencyData(dataArray as any);
    const bufferLength = analyser.frequencyBinCount;
    const totalArc = Math.PI * 0.76;
    const startAngle = -Math.PI / 2 - totalArc / 2 + 0.52;
    dataArray.forEach((val, i) => {
      const angle = startAngle + (i / bufferLength) * totalArc;
      const length = (val / 255) * (height * 0.4);
      const startX = centerX + radius * Math.cos(angle);
      const startY = centerY + radius * Math.sin(angle);
      const endX = centerX + (radius + length) * Math.cos(angle);
      const endY = centerY + (radius + length) * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(60, 251, 162, ${Math.max(0.2, val / 255)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    ctx.restore();
    requestAnimationFrame(drawGonio);
  };

  useEffect(() => { if (isPlaying) requestAnimationFrame(drawGonio); }, [isPlaying, analyser, dataArray]);

  const fadeInAudio = (targetVol = 0.2) => {
    if (!audio) return;
    audio.volume = 0;
    audio.play().catch(() => { });
    const interval = setInterval(() => {
      if (!audio) return clearInterval(interval);
      if (audio.volume < targetVol - 0.01) audio.volume = Math.min(targetVol, audio.volume + 0.02);
      else clearInterval(interval);
    }, 60);
  };

  const fadeOutAudio = (callback?: () => void) => {
    if (!audio || !isPlaying) { callback?.(); return; }
    const interval = setInterval(() => {
      if (!audio) return clearInterval(interval);
      if (audio.volume > 0.02) audio.volume -= 0.02;
      else {
        clearInterval(interval);
        try { audio.pause(); } catch { }
        audio.volume = 0.2;
        setIsPlaying(false);
        callback?.();
      }
    }, 60);
  };

  const toggleMusic = () => {
    if (!audio || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isPlaying) fadeOutAudio();
    else { fadeInAudio(); setIsPlaying(true); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        fadeOutAudio(() => { setLoading(false); navigate('/'); });
      } else { // signup
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
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset`,
      });
      if (error) throw error;
      setMessage("Password reset link sent! Please check your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || session) return <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary"><Spinner /></div>;

  return (
    <div className="relative flex flex-col lg:flex-row items-center justify-center min-h-screen bg-primary-light dark:bg-primary overflow-hidden">
      <div className={`absolute inset-0 z-0 transition-all duration-[2s] ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
        {/* Modern Professional Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 dark:from-black dark:via-gray-900 dark:to-black"></div>

        {/* Subtle Animated Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-green/10 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px] animate-pulse-slow delay-1000"></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full z-0 pointer-events-none transition-opacity duration-2000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

      {/* Mobile: Combined container for branding and login */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center justify-center gap-8 px-4 py-8 lg:hidden">
        <div className="text-center">
          <h1 className={`logo-transform text-6xl sm:text-7xl select-none tracking-tight ${isPlaying ? 'font-rubik-glitch text-neon-green animate-neon-glitch' : 'font-raleway font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-400'}`}>
            litelelo.
          </h1>
          <p className="text-text-tertiary-light dark:text-text-tertiary mt-3 text-sm sm:text-base min-h-[24px] font-medium tracking-wide">
            {typedText}{typedText.length < 45 && <span className="animate-pulse">|</span>}
          </p>
        </div>
        <div className="w-full max-w-md bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 p-6 sm:p-8 rounded-2xl shadow-2xl relative">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-text-main-light dark:text-text-main mb-5 sm:mb-6 tracking-tight">
            {view === 'login' && 'Welcome Back'}
            {view === 'signup' && 'Create Account'}
            {view === 'reset_request' && 'Reset Password'}
          </h2>
          {view !== 'reset_request' && (
            <>
              <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-text-main-light dark:text-text-main transition-all duration-200 disabled:opacity-50">
                <GoogleIcon className="w-5 h-5" /> Continue with Google
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider"><span className="bg-transparent px-2 text-text-tertiary-light dark:text-text-tertiary font-medium">Or</span></div>
              </div>
            </>
          )}
          {view === 'reset_request' ? <ResetRequestForm handlePasswordResetRequest={handlePasswordResetRequest} email={email} setEmail={setEmail} loading={loading} /> : <AuthForm view={view} handleAuth={handleAuth} email={email} setEmail={setEmail} username={username} setUsername={setUsername} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} loading={loading} setView={setView} setError={setError} setMessage={setMessage} />}
          {error && <p className="mt-3 sm:mt-4 text-red-400 text-center text-sm bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
          {message && <p className="mt-3 sm:mt-4 text-brand-green text-center text-sm bg-brand-green/10 py-2 rounded-lg border border-brand-green/20">{message}</p>}
          <div className="mt-6 text-center">
            <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }} className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green transition-colors font-medium">
              {view === 'login' && "New here? Create an account"}
              {view === 'signup' && 'Already have an account? Sign in'}
              {view === 'reset_request' && 'Back to Login'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: Branding on left */}
      <div className="relative z-10 hidden lg:flex w-1/2 items-center justify-end p-8 pr-20">
        <div className="text-left">
          <h1 className={`logo-transform text-8xl select-none tracking-tighter ${isPlaying ? 'font-rubik-glitch text-neon-green animate-neon-glitch' : 'font-raleway font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-400'}`}>
            litelelo.
          </h1>
          <p className="text-text-tertiary-light dark:text-text-tertiary mt-4 text-lg min-h-[24px] font-medium tracking-wide max-w-md leading-relaxed">
            {typedText}{typedText.length < 45 && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </div>

      {/* Desktop: Login Card on right */}
      <div className="relative z-10 hidden lg:flex w-1/2 flex-col items-start justify-center p-8 pl-20">
        <div className="w-full max-w-[420px] bg-white/5 dark:bg-black/20 backdrop-blur-2xl border border-white/10 dark:border-white/5 p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <h2 className="text-3xl font-bold text-center text-text-main-light dark:text-text-main mb-8 tracking-tight">
            {view === 'login' && 'Welcome Back'}
            {view === 'signup' && 'Create Account'}
            {view === 'reset_request' && 'Reset Password'}
          </h2>
          {view !== 'reset_request' && (
            <>
              <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-text-main-light dark:text-text-main transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]">
                <GoogleIcon className="w-5 h-5" /> Continue with Google
              </button>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider"><span className="bg-transparent px-3 text-text-tertiary-light dark:text-text-tertiary font-medium">Or</span></div>
              </div>
            </>
          )}
          {view === 'reset_request' ? <ResetRequestForm handlePasswordResetRequest={handlePasswordResetRequest} email={email} setEmail={setEmail} loading={loading} /> : <AuthForm view={view} handleAuth={handleAuth} email={email} setEmail={setEmail} username={username} setUsername={setUsername} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} loading={loading} setView={setView} setError={setError} setMessage={setMessage} />}
          {error && <p className="mt-4 text-red-400 text-center text-sm bg-red-500/10 py-2.5 rounded-lg border border-red-500/20">{error}</p>}
          {message && <p className="mt-4 text-brand-green text-center text-sm bg-brand-green/10 py-2.5 rounded-lg border border-brand-green/20">{message}</p>}
          <div className="mt-8 text-center">
            <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }} className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green transition-colors font-medium">
              {view === 'login' && "New here? Create an account"}
              {view === 'signup' && 'Already have an account? Sign in'}
              {view === 'reset_request' && 'Back to Login'}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 flex items-center gap-3 sm:gap-4 z-20">
        <button onClick={toggleMusic} title={isPlaying ? 'Pause Music' : 'Play Music'} className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-brand-green/20 border border-brand-green/30 text-brand-green' : 'bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary'}`}>
          {isPlaying ? <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MusicIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <button onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'Dark' : theme === 'dark' ? 'Monochrome' : 'Light'} Mode`} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary shadow-lg flex items-center justify-center text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors">
          {theme === 'light' ? <MoonIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <SunIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>
    </div>
  );
};

export default Login;