import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ViewNocModalProps {
  isOpen: boolean;
  onClose: () => void;
  passNumber: string;
  ownerName: string;
  nocDocumentUrl: string;
  nocDocumentName?: string;
  villageName?: string;
}

export const ViewNocModal: React.FC<ViewNocModalProps> = ({
  isOpen,
  onClose,
  passNumber,
  ownerName,
  nocDocumentUrl,
  nocDocumentName,
  villageName
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen || !nocDocumentUrl) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>NOC Document - ${passNumber} - ${ownerName}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: sans-serif; text-align: center; background: #fff; }
              .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              h1 { font-size: 18px; margin: 0 0 5px 0; color: #111; }
              p { font-size: 13px; color: #555; margin: 0; }
              img { max-width: 100%; height: auto; max-height: 90vh; border: 1px solid #ccc; margin-top: 10px; }
              @media print {
                body { padding: 0; }
                img { max-height: 95vh; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>VILLAGE COUNCIL NO OBJECTION CERTIFICATE (NOC)</h1>
              <p>Land Pass No: <strong>${passNumber}</strong> &bull; Owner: <strong>${ownerName}</strong> ${villageName ? `&bull; ${villageName}` : ''}</p>
            </div>
            <img src="${nocDocumentUrl}" alt="NOC Document" onload="window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = nocDocumentUrl;
    a.download = nocDocumentName || `NOC_LandPass_${passNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-modal-pop">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-neutral-950 rounded-xl shadow-xs font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  Village Council NOC Document
                </h3>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Attached Record
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Land Pass No: <span className="font-mono font-bold text-amber-300">{passNumber}</span> &bull; Owner: <span className="font-semibold text-white">{ownerName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Close NOC Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2.5 bg-neutral-100 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-medium">Document:</span>
            <span className="font-semibold text-neutral-800 truncate max-w-xs">
              {nocDocumentName || 'No_Objection_Certificate.png'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-neutral-300 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-neutral-700 font-bold min-w-[3rem] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate */}
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-lg shadow-2xs cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
            >
              Reset
            </button>

            {/* Print NOC */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
              title="Print NOC Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print NOC</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
              title="Download NOC Image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto bg-neutral-900/90 p-4 sm:p-8 flex items-center justify-center min-h-[400px] max-h-[70vh]">
          <div
            className="transition-transform duration-200 ease-out origin-center inline-block shadow-2xl bg-white p-2 rounded-lg"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
            }}
          >
            <img
              src={nocDocumentUrl}
              alt={`NOC Document for ${passNumber}`}
              className="max-w-full max-h-[60vh] object-contain rounded select-none"
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Official archival record attached to Land Pass #{passNumber}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl font-semibold cursor-pointer transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
