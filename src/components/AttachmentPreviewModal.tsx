/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { BillAttachment } from '../types';
import { getAttachmentsForTx, fetchAttachmentFromServer, saveAttachmentsForTx, fetchAttachmentFromCloud } from '../services/attachmentStore';
import { getSavedScriptUrl } from '../services/sheetService';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: BillAttachment[];
  initialIndex?: number;
  txId?: string;
  signature?: string;
}

/**
 * Safely converts a base64 / data URL to a temporary Blob URL.
 */
function dataUrlToBlobUrl(dataUrl: string): string {
  try {
    if (!dataUrl.startsWith('data:')) {
      return dataUrl;
    }
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Failed to convert dataUrl to blob URL', e);
    return dataUrl;
  }
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachments: initialAttachments,
  initialIndex = 0,
  txId,
  signature,
}) => {
  const [attachments, setAttachments] = useState<BillAttachment[]>(initialAttachments);
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [isLoadingAttachment, setIsLoadingAttachment] = useState<boolean>(false);

  // Sync attachments and index when modal opens
  useEffect(() => {
    if (isOpen) {
      setAttachments(initialAttachments);
      const targetIdx = Math.min(Math.max(0, initialIndex), Math.max(0, initialAttachments.length - 1));
      setCurrentIndex(targetIdx);
      setZoomLevel(1);
      setRotation(0);
      setImageLoadError(false);

      const activeAtt = initialAttachments[targetIdx];
      if (activeAtt && !activeAtt.dataUrl && activeAtt.id) {
        setIsLoadingAttachment(true);
        fetchAttachmentFromCloud(getSavedScriptUrl(), activeAtt.id, txId, signature)
          .then((cloudData) => {
            if (cloudData) {
              setAttachments((prev) =>
                prev.map((a, i) => (i === targetIdx ? { ...a, dataUrl: cloudData, hasData: true } : a))
              );
            }
          })
          .finally(() => {
            setIsLoadingAttachment(false);
          });
      }

      // Also hydrate any other attachments in this list in background
      initialAttachments.forEach((att, idx) => {
        if (!att.dataUrl && att.id && idx !== targetIdx) {
          fetchAttachmentFromCloud(getSavedScriptUrl(), att.id, txId, signature).then((cloudData) => {
            if (cloudData) {
              setAttachments((prev) =>
                prev.map((a, i) => (i === idx ? { ...a, dataUrl: cloudData, hasData: true } : a))
              );
            }
          });
        }
      });
    }
  }, [isOpen, initialIndex, initialAttachments, txId, signature]);

  const currentAttachment = attachments[currentIndex] || initialAttachments[0];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
    setZoomLevel(1);
    setRotation(0);
    setImageLoadError(false);
  }, [attachments.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setRotation(0);
    setImageLoadError(false);
  }, [attachments.length]);

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && attachments.length > 1) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && attachments.length > 1) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, attachments.length, handlePrev, handleNext, onClose]);

  if (!isOpen) return null;

  const fileName = currentAttachment?.name || 'Bill Attachment';
  const dataUrl = currentAttachment?.dataUrl || '';
  const fileType = (currentAttachment?.type || '').toLowerCase();
  const lowerName = fileName.toLowerCase();

  const isImage = 
    fileType.startsWith('image/') || 
    dataUrl.startsWith('data:image/') ||
    lowerName.endsWith('.jpg') || 
    lowerName.endsWith('.jpeg') || 
    lowerName.endsWith('.png') || 
    lowerName.endsWith('.webp') || 
    lowerName.endsWith('.gif') || 
    lowerName.endsWith('.svg');

  const isPdf = 
    fileType.includes('pdf') || 
    dataUrl.startsWith('data:application/pdf') || 
    lowerName.endsWith('.pdf');

  const currentBlobUrl = dataUrl ? dataUrlToBlobUrl(dataUrl) : '';

  const handleOpenInNewTab = () => {
    if (!dataUrl) return;
    const blobUrl = currentBlobUrl || dataUrlToBlobUrl(dataUrl);
    const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownload = async () => {
    let targetDataUrl: string | null | undefined = dataUrl;
    if (!targetDataUrl && currentAttachment?.id) {
      setIsLoadingAttachment(true);
      targetDataUrl = await fetchAttachmentFromCloud(getSavedScriptUrl(), currentAttachment.id, txId, signature);
      setIsLoadingAttachment(false);
      if (targetDataUrl) {
        setAttachments((prev) =>
          prev.map((a, i) => (i === currentIndex ? { ...a, dataUrl: targetDataUrl!, hasData: true } : a))
        );
      }
    }

    if (!targetDataUrl) {
      return;
    }

    const blobUrl = dataUrlToBlobUrl(targetDataUrl);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Floating high-contrast close button at top right of screen for instant mobile closing */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[110] w-10 h-10 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center shadow-xl border border-white/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
        title="Close Preview (Escape)"
        aria-label="Close Preview"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/90 animate-in zoom-in-95">
        
        {/* Top Control Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="w-5 h-5 text-indigo-600" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-rose-600" />
              ) : (
                <File className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-[160px] sm:max-w-md" title={fileName}>
                  {fileName}
                </h3>
                {attachments.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] shrink-0">
                    {currentIndex + 1} of {attachments.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {currentAttachment?.size ? `${(currentAttachment.size / 1024).toFixed(1)} KB • ` : ''}
                {isPdf ? 'PDF Bill Document' : isImage ? 'Invoice Image File' : 'Attachment File'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Zoom (if image), Open New Tab, Download, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isImage && dataUrl && !imageLoadError && (
              <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs mr-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-600 px-1">
                  {(zoomLevel * 100).toFixed(0)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Open in New Tab Button */}
            {dataUrl && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                title="Open attachment in a new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Open in Tab</span>
              </button>
            )}

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer active:scale-95"
              title="Download attachment file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Prominent Header Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer ml-1"
              title="Close preview (Escape)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Preview Viewport */}
        <div className="relative flex-1 bg-slate-900/5 min-h-[340px] sm:min-h-[460px] max-h-[70vh] flex items-center justify-center p-3 sm:p-5 overflow-auto">
          {/* Previous Button (if multiple) */}
          {attachments.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 sm:left-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 hover:scale-105 transition-all cursor-pointer"
              title="Previous attachment (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next Button (if multiple) */}
          {attachments.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 sm:right-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 hover:scale-105 transition-all cursor-pointer"
              title="Next attachment (Right Arrow)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Content Renderers */}
          {isLoadingAttachment ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-indigo-100 shadow-md max-w-sm w-full space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
              <div className="text-center">
                <h4 className="text-xs font-bold text-slate-800">Fetching bill attachment...</h4>
                <p className="text-[11px] text-slate-500 mt-1">Retrieving image across devices & incognito session</p>
              </div>
            </div>
          ) : isImage && dataUrl && !imageLoadError ? (
            <div className="flex items-center justify-center w-full h-full overflow-auto p-2">
              <img
                src={dataUrl}
                alt={fileName}
                onError={() => setImageLoadError(true)}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
              />
            </div>
          ) : isPdf && dataUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <object
                data={currentBlobUrl || dataUrl}
                type="application/pdf"
                className="w-full h-[62vh] rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                <iframe
                  src={currentBlobUrl || dataUrl}
                  title={fileName}
                  className="w-full h-full rounded-xl border-none"
                />
              </object>
            </div>
          ) : (
            /* Fallback Card when image data is not available or non-visual format */
            <div className="text-center p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                {isImage ? <ImageIcon className="w-8 h-8" /> : <File className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{fileName}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {currentAttachment?.size ? `${(currentAttachment.size / 1024).toFixed(1)} KB` : 'Attached Document'}
                </p>
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Bill Attached: </span>
                    {dataUrl 
                      ? 'Format requires downloading to view.' 
                      : 'Attachment file is not available in cloud storage for this legacy entry. You can edit this transaction to re-upload the bill.'}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {dataUrl && (
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Tab</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>Close</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Carousel / Thumbnails Bar (When multiple attachments exist) */}
        {attachments.length > 1 && (
          <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Attached Files:</span>
            {attachments.map((att, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={att.id || idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                    setRotation(0);
                    setImageLoadError(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={att.name}
                >
                  <Eye className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{att.name}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
