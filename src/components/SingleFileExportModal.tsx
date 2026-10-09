import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { STANDALONE_HTML_CONTENT } from '../standaloneHtml';

interface SingleFileExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SingleFileExportModal: React.FC<SingleFileExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(STANDALONE_HTML_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([STANDALONE_HTML_CONTENT], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google_sheets_income_expense_tracker.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Single Standalone HTML File
              </h2>
              <p className="text-xs text-slate-500">
                Self-contained HTML + Tailwind CSS + JavaScript
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-indigo-900 text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-indigo-700" />
              <span>Zero Build Setup Required</span>
            </div>
            <p className="text-xs text-indigo-950/80 leading-relaxed">
              This standalone file has everything bundled inside: Tailwind CSS via CDN, automatic Google Sheet sync, live charts, transaction form, and localStorage caching. You can double-click it on your desktop, save it to your phone, or host it on GitHub Pages / Cloudflare Pages / Netlify with no server required.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              index.html
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy HTML
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Download .html
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-72 leading-relaxed selection:bg-indigo-600 selection:text-white">
              <code>{STANDALONE_HTML_CONTENT}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
