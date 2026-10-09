import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Users, 
  LogOut, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  ChevronDown, 
  Settings,
  Code2,
  Share2,
  Check 
} from 'lucide-react';
import { SHEET_ID } from '../constants';
import { NaughtyToddlersLogo } from './NaughtyToddlersLogo';
import { AuthUser } from '../types';

interface HeaderProps {
  scriptUrl: string;
  isDemoMode: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenUserManagement?: () => void;
  onOpenAppsScript?: () => void;
  onOpenExportHtml?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scriptUrl,
  isDemoMode,
  isLoading,
  onRefresh,
  onOpenSettings,
  currentUser,
  onLogout,
  onOpenUserManagement,
  onOpenAppsScript,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCopyShareLink = async () => {
    try {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      let shareUrl = `${origin}${pathname}`;
      if (scriptUrl) {
        shareUrl += `?scriptUrl=${encodeURIComponent(scriptUrl)}`;
      }
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.warn('Failed to copy share link', e);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getRoleBadge = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'Admin') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
          <ShieldCheck className="w-3 h-3 text-purple-700" />
          <span>Admin</span>
        </span>
      );
    }
    if (currentUser.role === 'Business User') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
          <Building2 className="w-3 h-3 text-indigo-700" />
          <span>Business</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
        <UserCheck className="w-3 h-3 text-emerald-700" />
        <span>User</span>
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 relative">
        
        {/* Main Header Container with Centered Logo (Never overlaps on Mobile, Tablet or Desktop) */}
        <div className="relative flex items-center justify-between gap-2 sm:gap-4 min-h-[44px]">
          
          {/* Left Section: Brand Title & Connection Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 z-10">
            {/* "My Business Tracker" brand text */}
            <div className="flex items-center">
              <span className="text-xs sm:text-sm font-black tracking-tight whitespace-nowrap bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xs">
                My Business Tracker
              </span>
            </div>

            {/* Subtle Divider on Tablet & Desktop */}
            <div className="hidden sm:block h-4 w-px bg-slate-200" />

            {/* Connection badge & status */}
            <button
              onClick={onOpenSettings}
              className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border cursor-pointer ${
                isDemoMode || !scriptUrl
                  ? 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
              }`}
              title="Google Sheet connection status"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isDemoMode || !scriptUrl ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span className="font-semibold hidden sm:inline">
                {isDemoMode || !scriptUrl ? 'Demo Mode' : 'Connected'}
              </span>
            </button>
          </div>

          {/* Center Section: Only for PC / Laptop (lg+ screens), completely removed for Tab and Mobile */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-auto">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center justify-center p-0.5 cursor-pointer hover:opacity-95 transition-opacity focus:outline-hidden"
              title="Naughty Toddlers - Back to top"
              aria-label="Naughty Toddlers Logo"
            >
              {/* SINGLE LOGO INSTANCE ONLY - Kept only for PC / Laptop, removed for Tab & Mobile */}
              <NaughtyToddlersLogo className="h-7.5 md:h-8.5 xl:h-9 w-auto" />
            </button>
          </div>

          {/* Right Section: Refresh & User Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto z-10">
            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              title="Refresh data from Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <div className="hidden xs:block h-4 w-px bg-slate-200" />

            {/* User Profile & Options Dropdown Menu */}
            {currentUser && (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 pl-1.5 sm:pl-2 pr-2 sm:pr-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                    isDropdownOpen
                      ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 text-purple-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-800'
                  }`}
                  title="User account & options"
                >
                  <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-black text-[10px] shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-xs font-bold whitespace-nowrap max-w-[130px] truncate">
                    {currentUser.name}
                  </span>
                  <div className="shrink-0">
                    {getRoleBadge()}
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
                </button>

                {/* Dropdown Menu Popup */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 sm:w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header info in dropdown */}
                    <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed In As</p>
                      <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{currentUser.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">Role:</span>
                        {getRoleBadge()}
                      </div>
                    </div>

                    <div className="py-1">
                      {/* Admin only: Manage Users */}
                      {currentUser.role === 'Admin' && onOpenUserManagement && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onOpenUserManagement();
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-purple-900 hover:bg-purple-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-purple-600" />
                          <span>Manage Users & Roles</span>
                        </button>
                      )}

                      {/* Open Google Sheet */}
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-emerald-600" />
                        <span>Open Google Sheet</span>
                      </a>

                      {/* Connection Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Connection Settings</span>
                      </button>

                      {/* Backend Script Setup */}
                      {onOpenAppsScript && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onOpenAppsScript();
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Code2 className="w-4 h-4 text-indigo-600" />
                          <span>Backend Script (v2.2)</span>
                        </button>
                      )}

                      {/* Copy Shareable App Link for Mobile / Other Devices */}
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        title="Copy direct configured link to open on phone or send to team"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Link Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 text-purple-600" />
                            <span>Copy App Link for Mobile</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Logout Option */}
                    {onLogout && (
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
