import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  HelpCircle, 
  X, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { SHEET_ID } from '../constants';
import { NaughtyToddlersLogo } from './NaughtyToddlersLogo';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (url: string) => Promise<boolean>;
  onUseDemo: () => void;
  onViewAppsScript: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveUrl,
  onUseDemo,
  onViewAppsScript,
}) => {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setUrlInput(currentUrl);
    setErrorMsg(null);
  }, [currentUrl, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setErrorMsg('Please enter a valid Google Apps Script Web App URL.');
      return;
    }

    if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      setErrorMsg('The URL should start with "https://script.google.com/macros/s/...". Make sure you deployed it as a Web App.');
      return;
    }

    setIsTesting(true);
    setErrorMsg(null);

    try {
      const success = await onSaveUrl(cleanUrl);
      if (success) {
        onClose();
      } else {
        setErrorMsg('Unable to connect to the Apps Script. Please verify the URL and that "Who has access" is set to "Anyone".');
      }
    } catch (err) {
      setErrorMsg((err as Error).message || 'Connection failed.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <NaughtyToddlersLogo size="sm" />
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Connect Google Sheet
              </h2>
              <p className="text-[11px] text-slate-500">
                Google Apps Script Web App Configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Target Google Sheet ID:</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-normal"
              >
                View Sheet <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="font-mono text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 break-all select-all">
              {SHEET_ID}
            </p>
            <p className="text-[11px] text-slate-500">
              Needs two tabs: <strong>Data</strong> (Timestamp, Date, Type, Category, Amount, Note) and <strong>Settings</strong> (Income & Expense categories).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Obtained after deploying your Google Apps Script as a <strong>Web App</strong> with access set to <strong>Anyone</strong>.
            </p>
          </div>

          {/* Cross-device permanent synchronization explanation */}
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-purple-800">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Configured Once Across All Devices</span>
            </p>
            <p className="text-[11px] text-purple-700 leading-relaxed">
              When saved, this Google Apps Script URL is synchronized with the server so phones, tablets, laptops, and Incognito sessions connect automatically without re-entering the script URL.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="mt-0.5 text-rose-600">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Quick Help & Code Action */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onViewAppsScript}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1.5 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Don&apos;t have the script yet? View & Copy Code
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="submit"
              disabled={isTesting}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing & Connecting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save & Connect
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onUseDemo();
                onClose();
              }}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Preview Demo Mode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
