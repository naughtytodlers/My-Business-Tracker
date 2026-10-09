import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  User,
  CheckCircle2,
  Sparkles,
  Building2,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthUser } from '../types';
import { loginUser } from '../services/authService';
import { fetchSheetData, getSavedScriptUrl, initScriptUrlConfig, saveScriptUrl } from '../services/sheetService';
import { NaughtyToddlersLogo } from './NaughtyToddlersLogo';
import { CuteToyTrain } from './CuteToyTrain';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Sign In credentials
  const [username, setUsername] = useState('Jaya Narasimha Rao');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Celebratory opening transition state
  const [isSuccessOpening, setIsSuccessOpening] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);

  // Auto-sync users from sheet on mount if scriptUrl is configured across devices
  useEffect(() => {
    initScriptUrlConfig().then((savedUrl) => {
      if (savedUrl) {
        fetchSheetData(savedUrl).catch((e) => {
          console.warn('Initial users sync:', e);
        });
      }
    });
  }, []);

  // Handle Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const savedUrl = (await initScriptUrlConfig()) || getSavedScriptUrl();
      const syncFn = savedUrl
        ? async () => {
            await fetchSheetData(savedUrl);
          }
        : undefined;

      // Proactively pull the latest users from Google Sheet so users added directly can sign in immediately
      if (syncFn) {
        try {
          await syncFn();
        } catch (syncErr) {
          console.warn('Pre-login sync warning:', syncErr);
        }
      }

      const user = await loginUser(username, password, syncFn);
      if (savedUrl) {
        saveScriptUrl(savedUrl);
      }
      setAuthenticatedUser(user);
      setIsSuccessOpening(true);

      // Trigger colorful festive confetti burst!
      try {
        confetti({
          particleCount: 85,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#FF659F', '#A855F7', '#38BDF8', '#F59E0B', '#10B981'],
        });
      } catch {}

      // Play the celebratory opening animation for 1.35s before revealing the main dashboard
      setTimeout(() => {
        onLoginSuccess(user);
      }, 1350);
    } catch (err) {
      setError((err as Error).message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full relative flex flex-col justify-between items-center px-4 pt-2 sm:pt-4 pb-0 overflow-hidden bg-gradient-to-br from-pink-100/90 via-purple-100/80 via-amber-100/70 to-sky-100/90 select-none">
      
      {/* ========================================================================= */}
      {/* 1. VIBRANT COLORFUL PLAYFUL BACKGROUND (Naughty Toddlers Brand Colors)     */}
      {/* Rich pastel pink, purple, sky blue, yellow, and warm orange with playful  */}
      {/* toy building blocks, bubbles, stars, and confetti shapes.                 */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        {/* Rich Multi-Colored Radial Aura Blurs */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-pink-400/30 via-rose-300/20 to-transparent blur-3xl" />
        <div className="absolute -top-24 -right-28 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-purple-400/30 via-indigo-300/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-28 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-amber-400/30 via-orange-300/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-28 -right-28 w-[480px] h-[480px] rounded-full bg-gradient-to-tl from-sky-400/30 via-cyan-300/20 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-gradient-to-r from-yellow-200/20 via-fuchsia-200/15 to-sky-200/20 blur-3xl" />

        {/* Playful Floating Kids & Toys Decorative Elements */}
        {/* Top Left: Bright Pink Toy Building Cube & Sparkling Star */}
        <div className="absolute top-6 left-6 sm:left-14 flex items-center gap-2.5 animate-float-slow">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 border-2 border-white/80 rotate-12 shadow-md shadow-pink-500/25 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-white/80 shadow-xs" />
          </div>
          <Sparkles className="w-5 h-5 text-amber-400 filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.6)] animate-sparkle-pulse" />
        </div>

        {/* Top Right: Royal Purple & Indigo Toy Block with Soft Star */}
        <div className="absolute top-8 right-6 sm:right-16 flex items-center gap-2 animate-float-reverse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-violet-400 border-2 border-white/80 -rotate-12 flex items-center justify-center shadow-md shadow-purple-500/25">
            <div className="w-4 h-4 rounded-lg bg-white/70 rotate-45" />
          </div>
        </div>

        {/* Bottom Left: Sunshine Yellow & Orange Playful Ring & Blocks */}
        <div className="absolute bottom-20 left-6 sm:left-14 flex items-center gap-2.5 animate-float-slow">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 border-3 border-white/90 flex items-center justify-center shadow-md shadow-orange-500/25">
            <div className="w-4.5 h-4.5 rounded-full border-2 border-dashed border-white/90" />
          </div>
          <div className="hidden sm:block w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-300 to-amber-400 rotate-45 shadow-sm shadow-amber-400/30" />
        </div>

        {/* Bottom Right: Bright Cyan & Sky Blue Translucent Bubble */}
        <div className="absolute bottom-20 right-6 sm:right-14 flex items-center gap-2.5 animate-float-reverse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-sky-400 via-cyan-400 to-blue-500 border-2 border-white/90 shadow-md shadow-sky-500/25 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white/60 -mt-1.5 -ml-1.5" />
          </div>
          <Sparkles className="w-5 h-5 text-purple-500 filter drop-shadow-[0_2px_6px_rgba(168,85,247,0.5)] animate-sparkle-pulse" />
        </div>

        {/* Playful Confetti Dots with Naughty Toddlers Colors */}
        <div className="absolute top-1/4 left-10 w-3 h-3 rounded-full bg-pink-400/70 shadow-xs animate-float-slow" />
        <div className="absolute top-1/3 right-12 w-3 h-3 rounded-full bg-amber-400/70 shadow-xs animate-float-reverse" />
        <div className="absolute bottom-1/3 left-12 w-3 h-3 rounded-full bg-purple-400/70 shadow-xs animate-float-slow" />
        <div className="absolute bottom-1/4 right-12 w-3 h-3 rounded-full bg-cyan-400/70 shadow-xs animate-float-reverse" />
        <div className="hidden lg:block absolute top-1/2 left-24 w-2 h-2 rounded-full bg-emerald-400/70" />
        <div className="hidden lg:block absolute top-1/2 right-24 w-2.5 h-2.5 rounded-full bg-rose-400/70" />
      </div>

      {/* ========================================================================= */}
      {/* 2. ELEVATED, SLEEK SIGN IN CARD                                           */}
      {/* Perfectly proportioned to fit standard displays & 90-100% zoom with NO    */}
      {/* scrolling required.                                                       */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full max-w-[420px] flex flex-col justify-center items-center z-10 my-auto py-1 sm:py-2">
        <div className="relative w-full">
          {/* Soft Colorful Ambient Glow Aura around the card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/25 via-purple-500/25 via-amber-400/20 to-sky-500/25 rounded-3xl blur-xl opacity-90 pointer-events-none" />

          {/* Main Card Container */}
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_-10px_rgba(109,40,217,0.18),0_10px_20px_-5px_rgba(15,23,42,0.08)] border border-purple-200/80 ring-2 ring-white/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Card Top Header & Branding */}
            <div className="px-5 pt-4 pb-3 sm:px-6 sm:pt-4.5 sm:pb-3 text-center border-b border-slate-100/90 bg-gradient-to-b from-slate-50/70 to-white/60 flex flex-col items-center">
              {/* Official Naughty Toddlers Brand Logo */}
              <div className="mb-2 w-full flex justify-center">
                <NaughtyToddlersLogo size="lg" className="h-10 sm:h-12" />
              </div>

              <h1 className="text-sm sm:text-base font-black tracking-tight bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Business Tracker
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Secure login required to access business records
              </p>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100/90 text-slate-700 text-[10px] font-semibold mt-1.5 border border-slate-200/80">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                <span>Role-Based Protected Access</span>
              </div>
            </div>

            {/* Success Notification Alert */}
            {successMsg && (
              <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{successMsg}</div>
              </div>
            )}

            {/* Error Notification Alert */}
            {error && (
              <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {/* =================================================================== */}
            {/* STANDARD SIGN IN FORM (Clean, professional, compact)                */}
            {/* =================================================================== */}
            <form onSubmit={handleLogin} className="p-4 sm:p-5 sm:pb-6 space-y-3">
              {/* User Name input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  User Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your User Name"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-8 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Signing In...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In to Business Tracker</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>

          {/* Subtle, professional footer note */}
          <p className="text-center text-[10px] sm:text-[11px] text-slate-500 font-medium mt-2.5 select-none">
            Personal Income & Expense Tracker • Naughty Toddlers
          </p>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CUTE TOY TRAIN ANIMATION DOCKED AT THE BOTTOM                          */}
      {/* Guaranteed 100% visible at 90% and 100% zoom without scrolling down!      */}
      {/* ========================================================================= */}
      <div data-train-track="true" className="w-full shrink-0 z-20 pb-0">
        <CuteToyTrain speed="normal" />
      </div>

      {/* ========================================================================= */}
      {/* 4. CELEBRATORY OPENING ANIMATION OVERLAY AFTER SIGNING IN                 */}
      {/* ========================================================================= */}
      {isSuccessOpening && authenticatedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 text-center animate-in zoom-in-90 duration-400 flex flex-col items-center">
            {/* Glowing Aura & Success Check Icon */}
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 blur-xl opacity-75 animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white">
                <CheckCircle2 className="w-8 h-8 text-white animate-bounce" />
              </div>
            </div>

            {/* Brand Logo */}
            <div className="mb-2">
              <NaughtyToddlersLogo className="h-7 w-auto mx-auto" />
            </div>

            {/* Welcome Greeting */}
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                {authenticatedUser.name}
              </span>!
            </h3>

            {/* Role Badge */}
            <div className="mt-1 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                {authenticatedUser.role === 'Admin' ? (
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                ) : authenticatedUser.role === 'Business User' ? (
                  <Building2 className="w-3 h-3 text-indigo-600" />
                ) : (
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                )}
                <span>{authenticatedUser.role}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>Opening your Business Dashboard...</span>
            </p>

            {/* Playful Animated Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden border border-slate-200/60 p-0.5">
              <div className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 w-full animate-in slide-in-from-left duration-1000" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
