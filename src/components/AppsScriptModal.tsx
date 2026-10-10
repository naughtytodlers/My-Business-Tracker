import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2, BookOpen, ShieldCheck } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE, SHEET_ID } from '../constants';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Google Apps Script Backend
              </h2>
              <p className="text-xs text-slate-500">
                Pre-configured for Google Sheet ID: <span className="font-mono text-slate-700 font-medium">{SHEET_ID.substring(0, 12)}...</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Quick Steps */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Updating / Deploying Backend Script v2.3 (1 Minute)</span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span>🔄 If you already deployed a Web App URL (Update in 3 clicks):</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                <li>In your Google Sheet, click <strong>Extensions &rarr; Apps Script</strong>.</li>
                <li>Select all (Ctrl+A / Cmd+A) in the editor, and paste the copied code below.</li>
                <li>Click <strong>Deploy &rarr; Manage deployments</strong> (top right).</li>
                <li>Click the <strong>Edit pencil icon</strong> on your active deployment.</li>
                <li>Under <strong>Version</strong>, select <strong className="text-emerald-700 font-bold">&ldquo;New version&rdquo;</strong>, then click <strong>Deploy</strong>!</li>
              </ol>
              <p className="text-[11px] text-emerald-800 italic mt-1">
                ✨ That&apos;s it! Your active Web App URL is instantly updated to v2.3 with cross-device cloud attachment storage, zero-lag transaction saving & instant sync.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p className="font-bold text-slate-800">First-time deployment instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 pl-1">
                <li>
                  Open your Google Sheet:{' '}
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-emerald-700 underline inline-flex items-center gap-1 hover:text-emerald-800"
                  >
                    Open Sheet ({SHEET_ID.substring(0, 8)}...) <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Click <strong>Extensions &rarr; Apps Script</strong>, paste code.</li>
                <li>Click <strong>Deploy &rarr; New deployment &rarr; Web app</strong>.</li>
                <li>Set <strong>Execute as: Me</strong>, and <strong>Who has access: Anyone</strong>.</li>
                <li>Click <strong>Deploy</strong>, authorize permissions, and copy the Web App URL.</li>
              </ol>
            </div>
          </div>

          {/* Sheet Structure Note */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-0.5">Automated Sheet Setup</p>
              <p>
                The script automatically manages five tabs: <strong>Data</strong> (transactions), <strong>Settings</strong> (categories), <strong>Users</strong> (credentials & roles), <strong>Items</strong> (Stock Purchased master items), and <strong>Sellers</strong> (Stock Purchased master sellers). You can add or delete items and sellers directly from the app without editing code!
              </p>
            </div>
          </div>

          {/* Code block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Code.gs (Apps Script)
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Script
                  </>
                )}
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-72 leading-relaxed selection:bg-emerald-600 selection:text-white">
                <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
