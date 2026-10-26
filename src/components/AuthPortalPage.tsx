import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, LandPass } from '../types';
import {
  LogIn,
  UserPlus,
  ShieldAlert,
  QrCode,
  KeyRound,
  User,
  Phone,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  Send,
  Eye,
  EyeOff,
  Video,
  VideoOff,
  Search,
  MapPin,
  FileText,
  ShieldCheck,
  Building2,
  Clock,
  BookOpen,
  Layers,
  Printer,
  Sparkles,
  Share2
} from 'lucide-react';
import { authenticateSecretary, saveOrUpdateUser } from '../services/userService';
import { logActivity } from '../services/auditLogger';
import { createDefaultVillageForUser, saveVillageConfig } from '../services/villageService';

interface AuthPortalPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenAuthorityMode: () => void;
  allPasses: LandPass[];
  onViewPass: (pass: LandPass) => void;
}

export const AuthPortalPage: React.FC<AuthPortalPageProps> = ({
  onLoginSuccess,
  onOpenAuthorityMode,
  allPasses,
  onViewPass,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'authority' | 'verify' | 'about'>('login');

  // Login form state (Only Username & Secret Key)
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginSecretKey, setLoginSecretKey] = useState<string>('');
  const [showLoginKey, setShowLoginKey] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration form state (Username, Contact Number, Secret Key, Payment Screenshot - NO VILLAGE NAME)
  const [regUsername, setRegUsername] = useState<string>('');
  const [regContactNumber, setRegContactNumber] = useState<string>('');
  const [regVillageName, setRegVillageName] = useState<string>('');
  const [regSecretKey, setRegSecretKey] = useState<string>('');
  const [showRegKey, setShowRegKey] = useState<boolean>(false);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string>('');
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>('');
  const [regLoading, setRegLoading] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSubmittedUser, setRegSubmittedUser] = useState<UserProfile | null>(null);

  // UPI Payment Details
  const UPI_ID = 'ptlalfakzuala@oksbi';
  const UPI_AMOUNT = 299;
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Full Authority Key State (Key is 785392)
  const [authKeyInput, setAuthKeyInput] = useState<string>('');
  const [authKeyError, setAuthKeyError] = useState<string | null>(null);

  // Public QR Scanner State
  const [scanMode, setScanMode] = useState<'camera' | 'manual' | 'upload'>('camera');
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualPassInput, setManualPassInput] = useState<string>('');
  const [verifiedPass, setVerifiedPass] = useState<LandPass | null>(null);
  const [verifySearched, setVerifySearched] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const qrImageInputRef = useRef<HTMLInputElement>(null);

  // Generate UPI QR Code
  useEffect(() => {
    const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
      'Mizoram VC Land Pass Authority'
    )}&am=${UPI_AMOUNT}&cu=INR&tn=VC%20Secretary%20Lifetime%20Portal%20Fee`;

    QRCode.toDataURL(
      upiUri,
      {
        width: 250,
        margin: 1,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) setUpiQrUrl(url);
      }
    );
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await authenticateSecretary(loginUsername, loginSecretKey);
      if (res.user) {
        logActivity(
          'ROLE_CHANGE',
          res.user.uid,
          res.user.displayName || res.user.username || 'Secretary',
          res.user.displayName || 'Secretary',
          `Logged in as VC Secretary for ${res.user.villageName || 'Mizoram Village Council'}`
        );
        onLoginSuccess(res.user);
      } else {
        setLoginError(res.error || 'Invalid credentials. Please verify your username and secret key.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please check connection and try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Payment Screenshot Upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setRegError('Please upload an image file (JPEG or PNG)');
      return;
    }

    setPaymentScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setPaymentScreenshotUrl(compressed);
          } else {
            setPaymentScreenshotUrl(reader.result as string);
          }
          setRegError(null);
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim()) {
      setRegError('Username is required');
      return;
    }
    if (!regContactNumber.trim()) {
      setRegError('Contact number is required');
      return;
    }
    if (!regSecretKey.trim()) {
      setRegError('Secret key / password is required');
      return;
    }
    if (!paymentScreenshotUrl) {
      setRegError('Please upload your ₹299 payment proof screenshot to submit for approval');
      return;
    }

    setRegLoading(true);
    setRegError(null);

    const uid = `vc_sec_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const cleanVillageName = regVillageName.trim() || `${regUsername.trim()} Village Council`;
    const villageId = `village_${uid}`;

    const newUser: UserProfile = {
      uid,
      username: regUsername.trim(),
      displayName: regUsername.trim(),
      phoneNumber: regContactNumber.trim(),
      villageId,
      villageName: cleanVillageName,
      email: `${regUsername.trim().toLowerCase().replace(/\s+/g, '')}@vclandpass.mizoram.gov.in`,
      userType: 'secretary',
      role: 'member', // will elevate to admin on Authority approval
      status: 'pending',
      passkey: regSecretKey.trim(),
      password: regSecretKey.trim(),
      paymentStatus: 'completed',
      paymentAmount: 299,
      paymentScreenshotUrl,
      paymentScreenshotName,
      registrationDate: nowIso,
    };

    try {
      // Create and save dedicated unique village config for this user
      const userVillage = createDefaultVillageForUser(newUser);
      userVillage.villageName = cleanVillageName;
      await saveVillageConfig(userVillage);
      await saveOrUpdateUser(newUser);

      await logActivity(
        'USER_REGISTRATION_SUBMITTED',
        uid,
        newUser.username || 'Secretary',
        newUser.username || 'Secretary',
        `New VC Secretary account created for ${newUser.username} (${cleanVillageName}). Pending Full Authority approval.`
      );
      setRegSubmittedUser(newUser);
    } catch (err: any) {
      setRegError(err?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  // Full Authority Key verification
  const handleAuthorityUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (authKeyInput.trim() === '785392') {
      setAuthKeyError(null);
      setAuthKeyInput('');
      onOpenAuthorityMode();
    } else {
      setAuthKeyError('Invalid Master Authority Key. Access denied.');
    }
  };

  // Camera QR Scanner Loop (Controlled via Dialogue Box)
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
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable. Please grant permission or enter Pass Number manually.');
      setCameraActive(false);
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
    setCameraActive(false);
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
            handleQrCodeFound(code.data);
            return;
          }
        }
      }
    }

    if (streamRef.current) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  // QR Code Found
  const handleQrCodeFound = (decodedText: string) => {
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

    lookupPass(passNumberToSearch);
  };

  // QR Code Image File Upload
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              handleQrCodeFound(code.data);
            } else {
              setCameraError('No valid Land Pass QR code detected in the selected image. Please try another image or enter the Pass Number manually.');
            }
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Lookup Pass by pass number or ID
  const lookupPass = (passNumOrId: string) => {
    const clean = passNumOrId.trim().toLowerCase();
    const found = allPasses.find(
      (p) =>
        p.passNumber.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.passNumber.toLowerCase().includes(clean)
    );

    setVerifiedPass(found || null);
    setVerifySearched(true);

    if (found) {
      logActivity(
        'QR_VERIFIED',
        found.id,
        found.passNumber,
        'Public User',
        `Pass ${found.passNumber} verified via public camera QR scanner. Opened default Print/Save A4 view mode.`
      );
      // Immediately open default Print/Save A4 view mode with no extra functionality
      onViewPass(found);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPassInput.trim()) return;
    lookupPass(manualPassInput);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 flex flex-col justify-between selection:bg-emerald-200 selection:text-neutral-900">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-100/30 via-slate-50 to-neutral-100 pointer-events-none"></div>

      {/* Official State Header - STRICTLY DEFAULT LETTERHEAD: VILLAGE COUNCIL, MIZORAM */}
      <header className="relative z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-600/30 flex items-center justify-center p-1 shadow-xs shrink-0">
              <span className="text-sm font-serif font-black text-amber-300">VC</span>
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-emerald-700 font-bold">
                Mizoram Village Council Registry
              </div>
              <h1 className="text-lg sm:text-xl font-serif font-black tracking-wide text-neutral-900 uppercase">
                VILLAGE COUNCIL, MIZORAM
              </h1>
              <p className="text-[11px] text-neutral-500">
                Official Land Records &amp; Pass Issuance Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                activeTab === 'verify'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Public QR Verification</span>
            </button>

            <button
              onClick={() => setActiveTab('authority')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                activeTab === 'authority'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
              }`}
              title="Full Authority Access (Key Protected)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Full Authority</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Navigation Tabs */}
        <div className="bg-neutral-200/80 p-1.5 rounded-2xl border border-neutral-300/80 max-w-xl mx-auto w-full flex items-center justify-between mb-8 shadow-xs">
          <button
            onClick={() => {
              setActiveTab('login');
              setRegSubmittedUser(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ease-out active:scale-95 flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-emerald-700 text-white shadow-xs -translate-y-0.5'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>VC Secretary Login</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setRegSubmittedUser(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ease-out active:scale-95 flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-emerald-700 text-white shadow-xs -translate-y-0.5'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create VC Secretary Account</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ease-out active:scale-95 flex items-center justify-center gap-1.5 ${
              activeTab === 'verify'
                ? 'bg-emerald-700 text-white shadow-xs -translate-y-0.5'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 ease-out active:scale-95 flex items-center justify-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-emerald-700 text-white shadow-xs -translate-y-0.5'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>App Chungchang (Mizo)</span>
          </button>
        </div>

        {/* Dynamic Tab Content with animated slide/fade entrance */}
        <div key={activeTab} className="animate-page-slide">

        {/* ============================================================== */}
        {/* TAB 1: LOGIN (ONLY USERNAME & SECRET KEY)                      */}
        {/* ============================================================== */}
        {activeTab === 'login' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-10 shadow-lg max-w-md mx-auto w-full">
            <div className="text-center space-y-1 mb-6">
              <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-2xl mx-auto flex items-center justify-center text-emerald-800 mb-3 shadow-inner">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-black text-neutral-900">
                VC Secretary Login
              </h2>
              <p className="text-xs text-neutral-500">
                Enter your Username and Secret Key to manage your Village Council Land Passes
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username or contact number"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Secret Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginKey ? 'text' : 'password'}
                    value={loginSecretKey}
                    onChange={(e) => setLoginSecretKey(e.target.value)}
                    placeholder="Enter secret key / password"
                    className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginKey(!showLoginKey)}
                    className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showLoginKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loginLoading ? 'Authenticating...' : 'Login to Council Portal'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-200 text-center">
              <p className="text-xs text-neutral-500">
                New Village Council Secretary?{' '}
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Create Account &amp; Register
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: REGISTRATION (USERNAME, CONTACT, SECRET KEY + UPI)      */}
        {/* ============================================================== */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-10 shadow-lg max-w-2xl mx-auto w-full">
            {!regSubmittedUser ? (
              <>
                <div className="text-center space-y-1 mb-6">
                  <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-2xl mx-auto flex items-center justify-center text-emerald-800 mb-3 shadow-inner">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-serif font-black text-neutral-900">
                    VC Secretary Account Creation
                  </h2>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Register as Village Council Secretary. Village details and logo are configured in the Village Profile Update once your account is active.
                  </p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Username <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="e.g. SecretaryLalthan"
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Contact Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={regContactNumber}
                          onChange={(e) => setRegContactNumber(e.target.value)}
                          placeholder="e.g. 9436124589"
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Village Name for this Secretary */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Village Council Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={regVillageName}
                        onChange={(e) => setRegVillageName(e.target.value)}
                        placeholder="Enter your Village Name (e.g. Saiphai, Bilkhawthlir, Darlawn, Sairang)"
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Every Secretary gets a distinct, isolated Village Council profile and Land Pass registry.
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Secret Key <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type={showRegKey ? 'text' : 'password'}
                        value={regSecretKey}
                        onChange={(e) => setRegSecretKey(e.target.value)}
                        placeholder="Choose a secure secret key / password for login"
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegKey(!showRegKey)}
                        className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      >
                        {showRegKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      You will use this secret key along with your username to log in.
                    </p>
                  </div>

                  {/* UPI ₹299 Lifetime Fee & Payment Proof Section */}
                  <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-300 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                          Lifetime Council Pass Registration Fee
                        </span>
                        <span className="text-[11px] text-neutral-600">
                          One-time fee: <strong>₹299</strong> to Authority UPI
                        </span>
                      </div>
                      <span className="bg-amber-200 text-amber-950 font-mono font-bold text-xs px-2.5 py-1 rounded-full border border-amber-300">
                        ₹299 Lifetime
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* QR Code */}
                      <div className="bg-white p-2 rounded-xl shrink-0 shadow-md border border-neutral-200 flex flex-col items-center">
                        {upiQrUrl ? (
                          <img src={upiQrUrl} alt="UPI QR Code" className="w-32 h-32" />
                        ) : (
                          <div className="w-32 h-32 bg-neutral-100 animate-pulse rounded-lg"></div>
                        )}
                        <span className="text-[10px] font-mono text-neutral-700 mt-1 font-bold">
                          Scan to Pay ₹299
                        </span>
                      </div>

                      {/* UPI Details & Copy */}
                      <div className="flex-1 space-y-2 text-xs">
                        <div>
                          <span className="text-neutral-600 block font-medium">Official Authority UPI ID:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono bg-white px-3 py-1.5 rounded-lg border border-amber-300 text-amber-950 select-all font-bold text-xs shadow-2xs">
                              {UPI_ID}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(UPI_ID);
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2500);
                              }}
                              className="p-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-300 text-neutral-700 transition cursor-pointer shadow-2xs"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Pay ₹299 via Google Pay, PhonePe, Paytm or BHIM, and upload the payment confirmation screenshot below.
                        </p>
                      </div>
                    </div>

                    {/* Screenshot Upload with Photo Picker */}
                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-xs font-semibold text-neutral-800 mb-2">
                        Payment Screenshot <span className="text-rose-500">* (Mandatory Proof)</span>
                      </label>

                      <input
                        type="file"
                        ref={screenshotInputRef}
                        onChange={handleScreenshotUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      {paymentScreenshotUrl ? (
                        <div className="bg-white p-3 rounded-xl border border-emerald-500/60 flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={paymentScreenshotUrl}
                              alt="Payment Screenshot Preview"
                              className="w-14 h-14 object-cover rounded-lg border border-neutral-200"
                            />
                            <div>
                              <span className="text-xs font-semibold text-emerald-700 block flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Screenshot Attached
                              </span>
                              <span className="text-[11px] text-neutral-500 font-mono truncate max-w-xs block">
                                {paymentScreenshotName || 'Payment receipt image'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => screenshotInputRef.current?.click()}
                            className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg border border-neutral-300 transition cursor-pointer"
                          >
                            Change Photo
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => screenshotInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-amber-300 hover:border-emerald-600 rounded-xl flex flex-col items-center justify-center gap-1 text-neutral-600 hover:text-emerald-700 transition bg-white/80 cursor-pointer"
                        >
                          <Camera className="w-6 h-6 text-neutral-500" />
                          <span className="text-xs font-semibold">
                            Click to Select or Capture Payment Screenshot
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            Supports JPG, PNG (Max 10MB)
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{regLoading ? 'Submitting Registration...' : 'Submit Registration for Authority Approval'}</span>
                  </button>
                </form>
              </>
            ) : (
              /* Success / Notification to Authority Step */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500 rounded-full mx-auto flex items-center justify-center text-emerald-700 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-black text-neutral-900">
                    Registration Submitted Successfully!
                  </h3>
                  <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                    Account for <strong>{regSubmittedUser.username}</strong> has been registered with payment proof. Please notify Authority to expedite approval.
                  </p>
                </div>

                {/* Direct WhatsApp and Email Notification Buttons */}
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3 max-w-md mx-auto text-left shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block text-center">
                    Notify Authority for Instant Approval
                  </span>

                  <a
                    href={`https://wa.me/917005504074?text=${encodeURIComponent(
                      `Hello Authority, I have registered as VC Secretary on VC LAND PASS portal with Username: ${regSubmittedUser.username}, Phone: ${regSubmittedUser.phoneNumber}. I have submitted ₹299 payment proof screenshot. Kindly approve my account. Thank you!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <span>💬 Notify via WhatsApp (7005504074)</span>
                  </a>

                  <a
                    href={`mailto:ptlalfakzuala@gmail.com?subject=${encodeURIComponent(
                      `VC Secretary Account Approval Request - ${regSubmittedUser.username}`
                    )}&body=${encodeURIComponent(
                      `Dear Authority,\n\nI have registered a new VC Secretary account on VC LAND PASS with Username: ${regSubmittedUser.username} and Phone: ${regSubmittedUser.phoneNumber}.\nPayment proof of ₹299 has been uploaded.\n\nPlease review and approve the registration.\n\nThank you.`
                    )}`}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <span>✉️ Notify via Email (ptlalfakzuala@gmail.com)</span>
                  </a>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => {
                      onLoginSuccess(regSubmittedUser);
                    }}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Proceed to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: FULL AUTHORITY ACCESS (KEY IS 785392)                   */}
        {/* ============================================================== */}
        {activeTab === 'authority' && (
          <div className="bg-white rounded-3xl border border-amber-300 p-6 sm:p-10 shadow-lg max-w-md mx-auto w-full">
            <div className="text-center space-y-1 mb-6">
              <div className="w-12 h-12 bg-amber-100 border border-amber-300 rounded-2xl mx-auto flex items-center justify-center text-amber-700 mb-3 shadow-inner">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-black text-neutral-900">
                Full Authority Mode
              </h2>
              <p className="text-xs text-neutral-500">
                Enter Master Authority Key to review and approve registrations &amp; land passes
              </p>
            </div>

            {authKeyError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authKeyError}</span>
              </div>
            )}

            <form onSubmit={handleAuthorityUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Master Authority Key <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={authKeyInput}
                    onChange={(e) => setAuthKeyInput(e.target.value)}
                    placeholder="Enter Master Authority Key"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Unlock Full Authority Mode</span>
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PUBLIC QR VERIFICATION (CAMERA SCANNER & SEARCH)        */}
        {/* ============================================================== */}
        {activeTab === 'verify' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-10 shadow-lg max-w-xl mx-auto w-full space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-2xl mx-auto flex items-center justify-center text-emerald-800 mb-3 shadow-inner">
                <QrCode className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-black text-neutral-900">
                Public Land Pass Verification
              </h2>
              <p className="text-xs text-neutral-500">
                Scan Land Pass QR code with device camera or search by Pass Number
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setScanMode('camera');
                  setIsCameraDialogOpen(true);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  scanMode === 'camera' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Scanner</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  scanMode === 'upload' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR Image</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('manual')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  scanMode === 'manual' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Pass Number</span>
              </button>
            </div>

            {/* Camera Prompt Trigger */}
            {scanMode === 'camera' && (
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-full mx-auto flex items-center justify-center text-emerald-800 shadow-inner">
                  <Camera className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Live Camera QR Scanner</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Opens a dedicated camera viewfinder dialogue box to scan the certificate QR code
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraDialogOpen(true)}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mx-auto shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-100" />
                  <span>Open Camera Dialogue Box</span>
                </button>
              </div>
            )}

            {/* Image File Upload Scanner */}
            {scanMode === 'upload' && (
              <div className="text-center py-6 border-2 border-dashed border-neutral-300 rounded-2xl p-4 bg-neutral-50">
                <input
                  type="file"
                  ref={qrImageInputRef}
                  onChange={handleQrImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                <p className="text-xs text-neutral-600 font-medium mb-3">
                  Upload an image containing the Land Pass QR Code
                </p>
                <button
                  type="button"
                  onClick={() => qrImageInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Choose Image File
                </button>
              </div>
            )}

            {/* Manual Pass Number Search */}
            {scanMode === 'manual' && (
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={manualPassInput}
                    onChange={(e) => setManualPassInput(e.target.value)}
                    placeholder="e.g. MZ-VC-SPH-HR-1001"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono uppercase text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Verify
                </button>
              </form>
            )}

            {/* Verification Result: Clean default Print/Save A4 view mode trigger only, no administrative clutter */}
            {verifySearched && (
              <div className="pt-2">
                {verifiedPass ? (
                  <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 space-y-3 shadow-sm text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                        Verified Authentic Land Pass
                      </span>
                      <strong className="text-base font-mono text-neutral-900 block mt-0.5">
                        {verifiedPass.passNumber}
                      </strong>
                      <p className="text-xs text-neutral-600 mt-1">
                        Owner: <strong>{verifiedPass.ownerName}</strong> &bull; {verifiedPass.passType === 'huan_ram' ? 'Huan Ram' : 'In Hmun'} &bull; {verifiedPass.villageName || 'Mizoram VC'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewPass(verifiedPass)}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Open Default Print / Save A4 View Mode</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
                    <span className="text-xs font-bold text-rose-900 block">
                      Record Not Found in Registry
                    </span>
                    <p className="text-[11px] text-rose-700">
                      No genuine Land Pass matching that QR code or number was found. Please check the serial number carefully.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: APP CHUNGCHANG (ABOUT SYSTEM IN MIZO - SHAREABLE & PDF) */}
        {/* ============================================================== */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-10 shadow-lg max-w-3xl mx-auto w-full text-neutral-900 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-neutral-200 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center text-emerald-800 shadow-inner shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-900">
                    Mizoram Village Council Land Pass App Chungchang
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Village Council Huan Ram leh In Hmun Pass Digital Enkawlna &bull; Chipchiar Taka Hrilhfiahna
                  </p>
                </div>
              </div>

              {/* Share and PDF action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const shareText = `Mizoram Village Council Land Pass App Chungchang:\n\nHuan Ram leh In Hmun Land Pass digital enkawlna, GPS Google Maps, A4 Print/Save PDF, leh QR Code verification nei.\n\nSupport: +91 7005504074 (ptlalfakzuala@gmail.com)\n\nEn rawh: ${window.location.origin}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Mizoram VC Land Pass App Chungchang',
                          text: shareText,
                          url: window.location.href,
                        });
                      } catch {}
                    } else {
                      await navigator.clipboard.writeText(shareText);
                      alert('Document link & details copied to clipboard!');
                    }
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-300 cursor-pointer shadow-2xs"
                  title="Share App Chungchang via WhatsApp, Social media or Copy Link"
                >
                  <Share2 className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const originalTitle = document.title;
                    document.title = 'Mizoram_Village_Council_Land_Pass_App_Chungchang.pdf';
                    window.print();
                    setTimeout(() => {
                      document.title = originalTitle;
                    }, 1000);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Save / Print PDF</span>
                </button>
              </div>
            </div>

            {/* Sorkar Thuchhuah A Ni Lo Tih Fiahna (Mandatory Disclaimer) */}
            <div className="p-4 sm:p-5 bg-amber-50 rounded-2xl border-2 border-amber-400/80 space-y-2">
              <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>HRIATTIRNA PAWIMAWH : Sorkar Thuchhuah / Sorkar App A Ni Lo</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                He application hi <strong>Mizoram Sorkar</strong> siam emaw tihchhuah a ni lo va (not government-issued). Mizoram chhunga Village Council hrang hrang ten mahni khua leh bial chhunga Huan Ram leh In Hmun pass buaipui awlsam zawk nan, ramri fel zawk nan, leh record kumhluna him taka an vawn theih nana <strong>independent digital software</strong> a siam a ni.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-neutral-700 leading-relaxed">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>A Bulpui &amp; Tum Tlangpui (Overview &amp; Purpose)</span>
                </h3>
                <p>
                  He application hi <strong>Mizoram Village Council (V/C)</strong> te tana bika buatsaih, <strong>Huan Ram leh In Hmun Land Pass</strong> felfai, rintlak leh changkang taka enkawl, chhuah, leh chhinchhiahna (Digital Land Registry System) a ni. Hmanlai lehkha bu hlui, chhia leh boral thei laka fihlimin, khawtlang rorelna leh ram pek chungchang rintlak leh zahawm taka digital hmanga kumhlun vawn thatna hmanrua a ni.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                  <span className="font-bold text-neutral-900 text-xs sm:text-sm block">1. Huan Ram &amp; In Hmun Pass</span>
                  <p className="text-xs text-neutral-600">
                    Huan ram leh In hmun pass duhtawka thlan theih a ni a, pass number hi computer-in indawt thlapin (auto-sequential) a pe zel a, pass number in-ang a awm thei lo.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                  <span className="font-bold text-neutral-900 text-xs sm:text-sm block">2. Google Maps &amp; Move Tool</span>
                  <p className="text-xs text-neutral-600">
                    Satellite, Terrain leh Roadmap hmangin ramri kil zawn tak zawnah Move Tool (D-pad &amp; Drag) hmangin GPS coordinates a la thei a, phone dinna GPS la nghal theih a ni.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                  <span className="font-bold text-neutral-900 text-xs sm:text-sm block">3. Official A4 Certificate Print</span>
                  <p className="text-xs text-neutral-600">
                    Website thil dang lang lovin, Council Logo, Official Emblem, QR Code, 2x2 Boundary Grid, leh President Seal space nen A4 paper-ah mawi takin a print/save theih.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                  <span className="font-bold text-neutral-900 text-xs sm:text-sm block">4. QR Code &amp; Cloud Sync</span>
                  <p className="text-xs text-neutral-600">
                    Smartphone-in QR Code scan-in a finfiah theih a. Offline-first leh Realtime Firebase Cloud database-ah background-ah amahin a in-sync nghal zel a ni.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider block">
                  Mizoram Khawtlang Tana A Hlawkna
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-700 list-disc list-inside">
                  <li>Village Council term a inthlak pawhin khaw ram pass record a bo ngai tawh lo.</li>
                  <li>GPS Coordinates leh Ramri Grid felfai tak avangin ramri innek buaina a veng.</li>
                  <li>Khawtual mipuite tan bank leh hmun dangah pawh zahawm taka phawrh ngam pass a ni.</li>
                  <li>Secretary in-register thar te tan One-time Lifetime Fee ₹299 chauh a ni.</li>
                </ul>
              </div>

              <div className="pt-2 text-center text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                Direct Authority &amp; Developer Support: <strong>ptlalfakzuala@gmail.com</strong> &bull; WhatsApp/Phone: <strong>+91 7005504074</strong>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* DIALOGUE BOX FOR CAMERA FUNCTION IN QR SCANNER */}
        {isCameraDialogOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs animate-backdrop-fade">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-neutral-200 shadow-2xl flex flex-col animate-modal-pop">
              {/* Header */}
              <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-neutral-900">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">Scan Land Pass QR Code</h3>
                    <p className="text-[11px] text-emerald-700 font-mono">Live Camera Viewfinder</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraDialogOpen(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-all duration-200 hover:rotate-90 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Viewfinder Frame */}
              <div className="p-5 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-600/70 bg-black aspect-video flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Animated Scanner Frame Overlay with Glowing Sweeping Laser Line */}
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
                    Point camera at the QR code on the Land Pass
                  </div>
                </div>

                {cameraError ? (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 text-center">
                    {cameraError}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-600 text-center leading-relaxed">
                    Hold your device camera steady and place the QR code within the frame to verify authenticity.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono">
                  Auto-detects authentic Pass
                </span>
                <button
                  type="button"
                  onClick={() => setIsCameraDialogOpen(false)}
                  className="px-4 py-1.5 text-xs bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-xl cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  Cancel / Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Official State Footer */}
      <footer className="relative z-10 border-t border-neutral-200 bg-white/90 px-4 py-4 text-center text-xs text-neutral-500">
        <p>
          Mizoram Village Council Land Pass System &bull; Independent Digital Registry for Village Councils &bull; Direct Support: ptlalfakzuala@gmail.com / WhatsApp: +91 7005504074
        </p>
      </footer>
    </div>
  );
};
