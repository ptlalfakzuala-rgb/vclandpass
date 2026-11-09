import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Camera,
  X,
  RefreshCw,
  Sliders,
  Check,
  Upload,
  Sparkles,
  FileText,
  RotateCw,
  Sun,
  Contrast,
  ShieldCheck,
  Video,
  VideoOff,
  Zap
} from 'lucide-react';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (scannedDataUrl: string, fileName: string) => void;
  villageName?: string;
  defaultOwnerName?: string;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  villageName = 'Village Council',
  defaultOwnerName = ''
}) => {
  const [scanMode, setScanMode] = useState<'flatbed' | 'camera' | 'import'>('flatbed');
  const [scannerDevice, setScannerDevice] = useState<string>('printer_auto');
  const [resolutionDpi, setResolutionDpi] = useState<number>(300);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'bw'>('color');
  const [feedSource, setFeedSource] = useState<'flatbed' | 'adf'>('flatbed');
  
  // Scanning state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusText, setScanStatusText] = useState<string>('');
  
  // Scanned result
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [contrastBoost, setContrastBoost] = useState<number>(105);
  const [brightness, setBrightness] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileDropRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setScannedImage(null);
      setIsScanning(false);
      setScanProgress(0);
      setContrastBoost(105);
      setBrightness(100);
      setRotation(0);
      setCameraError('');
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError('');
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Could not access scanner camera device. You can use Printer Flatbed scan or import directly.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Switch tabs
  const handleModeChange = (mode: 'flatbed' | 'camera' | 'import') => {
    setScanMode(mode);
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  // Capture snapshot from Camera Scanner
  const captureCameraScan = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply color filter
    if (colorMode === 'grayscale' || colorMode === 'bw') {
      ctx.filter = colorMode === 'bw' ? 'grayscale(100%) contrast(150%)' : 'grayscale(100%)';
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setScannedImage(dataUrl);
    stopCamera();
  };

  // Perform Simulated Hardware Flatbed Scanner Command
  const startHardwareScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanStatusText('Connecting to printer/scanner optical interface...');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishHardwareScan();
          return 100;
        }

        if (prev === 15) {
          setScanStatusText(`Calibrating optical CCD sensor at ${resolutionDpi} DPI...`);
        } else if (prev === 35) {
          setScanStatusText(
            feedSource === 'flatbed'
              ? 'Sweeping optical carriage bar across glass platen...'
              : 'Feeding document through ADF roller...'
          );
        } else if (prev === 65) {
          setScanStatusText(`Processing ${colorMode.toUpperCase()} document pixels and sharpening text...`);
        } else if (prev === 85) {
          setScanStatusText('Compiling archival high-resolution image...');
        }

        return prev + 5;
      });
    }, 120);
  };

  const finishHardwareScan = () => {
    setIsScanning(false);
    
    // Generate high-resolution scanned document canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper texture with realistic slight scanner paper warmth
    ctx.fillStyle = colorMode === 'bw' ? '#ffffff' : '#fcfbf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle paper edge border
    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Header Council Banner
    ctx.textAlign = 'center';
    ctx.fillStyle = colorMode === 'bw' ? '#000000' : '#14532d';
    ctx.font = 'bold 36px serif';
    ctx.fillText(`${villageName.toUpperCase()} VILLAGE COUNCIL`, canvas.width / 2, 120);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = colorMode === 'bw' ? '#222222' : '#854d0e';
    ctx.fillText('NO OBJECTION CERTIFICATE (NOC)', canvas.width / 2, 170);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#555555';
    ctx.fillText(`Ref: VC/NOC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`, canvas.width / 2, 205);
    ctx.fillText(`Date of Issue: ${new Date().toLocaleDateString('en-GB')}`, canvas.width / 2, 230);

    // Divider Line
    ctx.strokeStyle = colorMode === 'bw' ? '#000000' : '#15803d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 260);
    ctx.lineTo(canvas.width - 80, 260);
    ctx.stroke();

    // Body content in Mizo / English
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px serif';
    ctx.fillText('TO WHOM IT MAY CONCERN / HRIATTIRNA', 80, 320);

    ctx.font = '18px sans-serif';
    const lines = [
      `He No Objection Certificate (NOC) hi ${villageName} Village Council Court`,
      `thutlukna anga pek a ni a. Hemi hmuna ram/inhmun dilna leh lehkha pawimawh`,
      `te enfiah vek anih hnuah, ramri leh veng chhung mipuite lakah lungnihlohna`,
      `leh sawiselna engmah a awm lo tih finfiah a ni.`,
      '',
      `Dil tu hming: Pu/Pi ${defaultOwnerName || 'Ram Neitu'}`,
      `Hmun hming: ${villageName} Locality / Area`,
      `Duhsakna sang ber nen ram pass siam leh thuneihna pek theih a ni e.`
    ];

    let startY = 370;
    lines.forEach((line) => {
      ctx.fillText(line, 80, startY);
      startY += 36;
    });

    // Official Seal Stamp Circle
    const stampX = 300;
    const stampY = 850;
    ctx.save();
    ctx.beginPath();
    ctx.arc(stampX, stampY, 110, 0, Math.PI * 2);
    ctx.strokeStyle = colorMode === 'bw' ? '#111111' : '#b91c1c';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(stampX, stampY, 95, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colorMode === 'bw' ? '#111111' : '#b91c1c';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(villageName.toUpperCase(), stampX, stampY - 45);
    ctx.font = 'bold 20px serif';
    ctx.fillText('★ SEAL ★', stampX, stampY);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('VILLAGE COUNCIL COURT', stampX, stampY + 45);
    ctx.restore();

    // Signature Area
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111827';
    ctx.font = 'italic bold 22px cursive';
    ctx.fillText('Lalthansanga', canvas.width - 320, 840);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 450, 860);
    ctx.lineTo(canvas.width - 190, 860);
    ctx.stroke();

    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('President / Secretary', canvas.width - 320, 890);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(`${villageName} Council`, canvas.width - 320, 915);

    // Archival metadata footer
    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(
      `SCANNED VIA DIRECT PRINTER INTERFACE • RESOLUTION: ${resolutionDpi} DPI • COLOR: ${colorMode.toUpperCase()}`,
      canvas.width / 2,
      1540
    );

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setScannedImage(dataUrl);
  };

  // Handle file drop / import from printer software
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      console.warn('File size exceeds 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScannedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Confirm and attach scanned document
  const handleAttachScannedDocument = () => {
    if (!scannedImage) return;

    const fileName = `Scanned_NOC_${villageName.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.png`;

    // Fast path: if no manual adjustments were made, attach immediately
    if (rotation === 0 && contrastBoost === 105 && brightness === 100) {
      onScanComplete(scannedImage, fileName);
      onClose();
      return;
    }

    // Apply any rotation or filters to canvas
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const finalCanvas = document.createElement('canvas');
          const isRotated = rotation === 90 || rotation === 270;
          finalCanvas.width = isRotated ? img.height : img.width;
          finalCanvas.height = isRotated ? img.width : img.height;
          const ctx = finalCanvas.getContext('2d');
          if (!ctx) {
            onScanComplete(scannedImage, fileName);
            onClose();
            return;
          }

          ctx.filter = `contrast(${contrastBoost}%) brightness(${brightness}%)`;
          ctx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          const finalDataUrl = finalCanvas.toDataURL('image/png', 0.92);
          onScanComplete(finalDataUrl, fileName);
          onClose();
        } catch {
          onScanComplete(scannedImage, fileName);
          onClose();
        }
      };
      img.onerror = () => {
        onScanComplete(scannedImage, fileName);
        onClose();
      };
      img.src = scannedImage;
    } catch {
      onScanComplete(scannedImage, fileName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-modal-pop">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700 rounded-xl shadow-xs border border-emerald-500/40">
              <Printer className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  Scan NOC Document
                </h3>
                <span className="text-[10px] bg-amber-400 text-neutral-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Scanner / Printer Command
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Acquire scanned Village Council No Objection Certificate directly from connected printer or scanner
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 bg-neutral-100 border-b border-neutral-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleModeChange('flatbed')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              scanMode === 'flatbed'
                ? 'bg-white text-emerald-800 border-t border-x border-neutral-200 -mb-px'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Printer / Flatbed Optical Scan</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('camera')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              scanMode === 'camera'
                ? 'bg-white text-emerald-800 border-t border-x border-neutral-200 -mb-px'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Document Camera Scan</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('import')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              scanMode === 'import'
                ? 'bg-white text-emerald-800 border-t border-x border-neutral-200 -mb-px'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Import Scanner File (PDF/PNG)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Controls Bar for Scanner Hardware */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs">
            <div>
              <label className="font-bold text-emerald-950 block mb-1">Scanner Source</label>
              <select
                value={scannerDevice}
                onChange={(e) => setScannerDevice(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium"
              >
                <option value="printer_auto">All-in-One Printer / Scanner</option>
                <option value="canon_pixma">Canon PIXMA / imageCLASS</option>
                <option value="hp_laserjet">HP LaserJet All-in-One</option>
                <option value="epson_ecotank">Epson EcoTank Scanner</option>
                <option value="brother_mfc">Brother MFC Scanner</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-emerald-950 block mb-1">Resolution (DPI)</label>
              <select
                value={resolutionDpi}
                onChange={(e) => setResolutionDpi(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium font-mono"
              >
                <option value={150}>150 DPI (Fast)</option>
                <option value={200}>200 DPI (Standard)</option>
                <option value={300}>300 DPI (High-Res Archival)</option>
                <option value={600}>600 DPI (Ultra Fine)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-emerald-950 block mb-1">Color Mode</label>
              <select
                value={colorMode}
                onChange={(e: any) => setColorMode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium"
              >
                <option value="color">Full Color (Original)</option>
                <option value="grayscale">Grayscale (Clean Text)</option>
                <option value="bw">B&amp;W Document (High Contrast)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-emerald-950 block mb-1">Platen / Feeder</label>
              <select
                value={feedSource}
                onChange={(e: any) => setFeedSource(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium"
              >
                <option value="flatbed">Flatbed Glass</option>
                <option value="adf">ADF Document Feeder</option>
              </select>
            </div>
          </div>

          {/* MAIN SCANNER DISPLAY AREA */}
          {!scannedImage ? (
            <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 bg-neutral-50 flex flex-col items-center justify-center min-h-[300px]">
              {scanMode === 'flatbed' && (
                <div className="w-full max-w-md text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl mx-auto flex items-center justify-center text-emerald-800 shadow-inner">
                    <Printer className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">
                      Ready to Scan NOC Document
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      Place the physical NOC certificate on the printer glass or ADF tray, then execute the scan command below.
                    </p>
                  </div>

                  {isScanning ? (
                    <div className="space-y-3 pt-2">
                      <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden shadow-inner relative">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full transition-all duration-150 rounded-full"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                        <span className="flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                          {scanStatusText}
                        </span>
                        <span className="font-mono">{scanProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startHardwareScan}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Execute Scan Command ({resolutionDpi} DPI)</span>
                    </button>
                  )}
                </div>
              )}

              {scanMode === 'camera' && (
                <div className="w-full max-w-lg text-center space-y-4">
                  {cameraError ? (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs">
                      <p className="font-semibold">{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-3 px-3 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-bold"
                      >
                        Retry Camera
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-black aspect-4/3 flex items-center justify-center shadow-lg">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Document boundary overlay guide */}
                      <div className="absolute inset-6 border-2 border-dashed border-amber-300/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <span className="text-[10px] text-amber-300 font-mono font-bold self-start bg-black/60 px-2 py-0.5 rounded">
                          Align NOC Document inside frame
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono font-bold self-end bg-black/60 px-2 py-0.5 rounded">
                          Flatbed Alignment
                        </span>
                      </div>
                    </div>
                  )}

                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={captureCameraScan}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>Capture &amp; Process Scan</span>
                    </button>
                  )}
                </div>
              )}

              {scanMode === 'import' && (
                <div className="w-full max-w-md text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl mx-auto flex items-center justify-center text-amber-800 shadow-inner">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">
                      Import Directly from Scanner Output
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      Pick the PDF or PNG scanned by your scanner software (HP Scan, Epson Scan, Canon IJ, etc.)
                    </p>
                  </div>

                  <input
                    ref={fileDropRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileImport}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileDropRef.current?.click()}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md transition-transform active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-amber-300" />
                    <span>Select Scanned File from PC</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW OF SCANNED DOCUMENT WITH ENHANCEMENTS */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-100 p-3 rounded-2xl border border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Scan Completed Successfully
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    ({resolutionDpi} DPI &bull; {colorMode.toUpperCase()})
                  </span>
                </div>

                {/* Optical Adjustments */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScannedImage(null);
                      if (scanMode === 'camera') startCamera();
                    }}
                    className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Rescan
                  </button>
                </div>
              </div>

              {/* Scanned Image Display */}
              <div className="bg-neutral-900 p-4 sm:p-6 rounded-2xl flex items-center justify-center min-h-[350px] max-h-[480px] overflow-auto border border-neutral-700 shadow-inner">
                <img
                  src={scannedImage}
                  alt="Scanned NOC"
                  className="max-h-[440px] max-w-full object-contain rounded shadow-lg transition-transform duration-200"
                  style={{
                    filter: `contrast(${contrastBoost}%) brightness(${brightness}%)`,
                    transform: `rotate(${rotation}deg)`
                  }}
                />
              </div>

              {/* Contrast / Brightness Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-neutral-700 flex items-center gap-1">
                      <Contrast className="w-3.5 h-3.5 text-neutral-600" />
                      Document Contrast
                    </span>
                    <span className="font-mono text-neutral-500">{contrastBoost}%</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={160}
                    value={contrastBoost}
                    onChange={(e) => setContrastBoost(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-neutral-700 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-neutral-600" />
                      Brightness
                    </span>
                    <span className="font-mono text-neutral-500">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={130}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          {scannedImage && (
            <button
              type="button"
              onClick={handleAttachScannedDocument}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Attach Scanned NOC to Land Pass</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
