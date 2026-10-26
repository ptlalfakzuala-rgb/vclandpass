import React, { useState, useRef, useEffect } from 'react';
import { LandPass } from '../types';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Search,
  Camera,
  QrCode,
  Upload,
  RefreshCw,
  Printer,
  Sparkles
} from 'lucide-react';
import jsQR from 'jsqr';
import { logActivity } from '../services/auditLogger';

interface VerifyPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPass?: LandPass | null;
  allPasses: LandPass[];
  onOpenPrint: (pass: LandPass) => void;
}

export const VerifyPassModal: React.FC<VerifyPassModalProps> = ({
  isOpen,
  onClose,
  initialPass,
  allPasses,
  onOpenPrint,
}) => {
  const [queryInput, setQueryInput] = useState<string>(
    initialPass?.passNumber || ''
  );
  const [searched, setSearched] = useState<boolean>(!!initialPass);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // If initial pass is supplied, auto-trigger print/save view
  useEffect(() => {
    if (initialPass) {
      setQueryInput(initialPass.passNumber);
      setSearched(true);
    }
  }, [initialPass]);

  // Handle Camera Dialogue open / close
  useEffect(() => {
    if (!isCameraDialogOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isCameraDialogOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. Please grant camera permission or enter Pass Number manually.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const scanVideoFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleDecodedQr(code.data);
            return;
          }
        }
      }
    }

    if (streamRef.current) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  const handleDecodedQr = (decodedText: string) => {
    stopCamera();
    setIsCameraDialogOpen(false);

    let passNumberToSearch = decodedText.trim();
    if (decodedText.includes('verify=')) {
      try {
        const url = new URL(decodedText);
        const ref = url.searchParams.get('verify');
        if (ref) passNumberToSearch = decodeURIComponent(ref);
      } catch {
        const match = decodedText.match(/verify=([^&]+)/);
        if (match && match[1]) passNumberToSearch = decodeURIComponent(match[1]);
      }
    }

    setQueryInput(passNumberToSearch);
    executeVerification(passNumberToSearch);
  };

  const executeVerification = (passNumberOrId: string) => {
    const clean = passNumberOrId.trim().toLowerCase();
    const found = allPasses.find(
      (p) =>
        p.passNumber.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.passNumber.toLowerCase().includes(clean)
    );

    setSearched(true);

    if (found) {
      logActivity(
        'QR_VERIFIED',
        found.id,
        found.passNumber,
        'Council / Citizen',
        `Pass ${found.passNumber} verified via QR Scanner. Opened default Print/Save A4 view mode.`
      );
      // Immediately open default Print/Save A4 view mode with no extra functionality
      onClose();
      onOpenPrint(found);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    executeVerification(queryInput);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
              handleDecodedQr(code.data);
            } else {
              setCameraError('No valid Land Pass QR code detected in the selected image.');
            }
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const currentPass =
    allPasses.find(
      (p) =>
        p.passNumber.toLowerCase() === queryInput.trim().toLowerCase() ||
        p.id.toLowerCase() === queryInput.trim().toLowerCase()
    ) || (initialPass && initialPass.passNumber.toLowerCase() === queryInput.trim().toLowerCase() ? initialPass : null);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-backdrop-fade">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col animate-modal-pop">
          {/* Header */}
          <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-900 rounded-xl text-amber-300">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Council QR Verification</h3>
                <p className="text-xs text-emerald-300">
                  Village Council Land Authenticity &bull; Default Print/Save A4 View
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-emerald-900 transition-all duration-200 hover:rotate-90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Verification Form with Camera Scanner Button */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraDialogOpen(true)}
                className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer group"
              >
                <Camera className="w-4 h-4 text-amber-300 transition-transform duration-200 group-hover:scale-110" />
                <span>Scan QR with Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-neutral-300 flex items-center gap-1.5 cursor-pointer"
                title="Upload image containing QR Code"
              >
                <Upload className="w-4 h-4 text-neutral-600" />
                <span>Upload QR</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="relative flex items-center my-2">
              <div className="grow border-t border-neutral-200"></div>
              <span className="shrink mx-3 text-neutral-400 text-xs font-medium uppercase">Or enter Pass Number</span>
              <div className="grow border-t border-neutral-200"></div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Enter Pass Number (e.g. SPH-HR-1001)"
                  value={queryInput}
                  onChange={(e) => {
                    setQueryInput(e.target.value);
                    setSearched(false);
                  }}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Verify
              </button>
            </form>

            {/* Quick Demo Samples */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-neutral-500">
              <span>Try sample pass:</span>
              {allPasses.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setQueryInput(p.passNumber);
                    executeVerification(p.passNumber);
                  }}
                  className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-mono font-medium cursor-pointer"
                >
                  {p.passNumber}
                </button>
              ))}
            </div>

            {/* Verification Result: No functionality, just opens default Print/Save A4 view mode */}
            {searched && (
              <div>
                {currentPass ? (
                  <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                        Verified Authentic Land Pass
                      </span>
                      <strong className="text-sm font-mono text-neutral-950 block mt-0.5">
                        {currentPass.passNumber}
                      </strong>
                      <p className="text-xs text-neutral-600 mt-1">
                        Owner: <strong>{currentPass.ownerName}</strong> &bull; {currentPass.passType === 'huan_ram' ? 'Huan Ram' : 'In Hmun'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPrint(currentPass);
                      }}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Open Default Print / Save A4 View Mode</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-1.5">
                    <ShieldAlert className="w-7 h-7 text-rose-500 mx-auto" />
                    <h4 className="font-bold text-rose-900 text-xs">Pass Record Not Found</h4>
                    <p className="text-[11px] text-rose-700 leading-normal">
                      No matching land pass with number "{queryInput}" was found in the Village Council registry.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DIALOGUE BOX FOR CAMERA FUNCTION IN QR SCANNER                 */}
      {/* ============================================================== */}
      {isCameraDialogOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm animate-backdrop-fade">
          <div className="bg-neutral-900 rounded-3xl max-w-md w-full overflow-hidden border border-neutral-700 shadow-2xl flex flex-col animate-modal-pop">
            {/* Camera Dialogue Header */}
            <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded-xl text-emerald-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Scan Land Pass QR Code</h3>
                  <p className="text-[11px] text-emerald-400 font-mono">Live Camera Viewfinder</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraDialogOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder Frame */}
            <div className="p-5 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-black aspect-video flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Animated Scanner Frame Overlay with Sweeping Laser Line */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.35)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-300"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-300"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-300"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-300"></div>
                    {/* Sweeping Laser Line */}
                    <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scanner-laser"></div>
                  </div>
                </div>

                <div className="absolute bottom-2 text-center text-[10px] text-white/90 bg-black/70 px-3 py-1 rounded-full font-mono">
                  Scanning for QR Code...
                </div>
              </div>

              {cameraError ? (
                <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 text-center">
                  {cameraError}
                </div>
              ) : (
                <p className="text-xs text-neutral-300 text-center leading-relaxed">
                  Hold your camera steady and position the QR code printed on the Land Pass certificate within the frame.
                </p>
              )}
            </div>

            {/* Camera Dialogue Footer */}
            <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Auto-detects authentic Pass
              </span>
              <button
                type="button"
                onClick={() => setIsCameraDialogOpen(false)}
                className="px-4 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
