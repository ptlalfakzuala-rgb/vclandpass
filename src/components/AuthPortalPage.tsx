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
  Clock
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
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'authority' | 'verify'>('login');

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

  // Camera QR Scanner Loop
  useEffect(() => {
    if (activeTab !== 'verify' || scanMode !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [activeTab, scanMode]);

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
        videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable. You can use image upload or enter Pass Number manually.');
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
        `Pass ${found.passNumber} verified via public camera QR scanner`
      );
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPassInput.trim()) return;
    lookupPass(manualPassInput);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-neutral-900 to-neutral-950 pointer-events-none"></div>

      {/* Official State Header - STRICTLY DEFAULT LETTERHEAD: VILLAGE COUNCIL, MIZORAM */}
      <header className="relative z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-950 border border-emerald-500/30 flex items-center justify-center p-1 shadow-lg shrink-0">
              <span className="text-sm font-serif font-black text-amber-300">VC</span>
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold">
                Government of Mizoram
              </div>
              <h1 className="text-lg sm:text-xl font-serif font-black tracking-wide text-white uppercase">
                VILLAGE COUNCIL, MIZORAM
              </h1>
              <p className="text-[11px] text-neutral-400">
                Official Land Records &amp; Pass Issuance Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'verify'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Public QR Verification</span>
            </button>

            <button
              onClick={() => setActiveTab('authority')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'authority'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700'
              }`}
              title="Full Authority Access (Key Protected)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Full Authority</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Navigation Tabs */}
        <div className="bg-neutral-800/80 p-1.5 rounded-2xl border border-neutral-700/60 max-w-xl mx-auto w-full flex items-center justify-between mb-8 shadow-xl">
          <button
            onClick={() => {
              setActiveTab('login');
              setRegSubmittedUser(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create VC Secretary Account</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'verify'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Scanner</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: LOGIN (ONLY USERNAME & SECRET KEY)                      */}
        {/* ============================================================== */}
        {activeTab === 'login' && (
          <div className="bg-neutral-800/90 rounded-3xl border border-neutral-700/80 p-6 sm:p-10 shadow-2xl max-w-md mx-auto w-full backdrop-blur-md">
            <div className="text-center space-y-1 mb-6">
              <div className="w-12 h-12 bg-emerald-950 border border-emerald-600/40 rounded-2xl mx-auto flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-black text-white">
                VC Secretary Login
              </h2>
              <p className="text-xs text-neutral-400">
                Enter your Username and Secret Key to manage your Village Council Land Passes
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username or contact number"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Secret Key <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginKey ? 'text' : 'password'}
                    value={loginSecretKey}
                    onChange={(e) => setLoginSecretKey(e.target.value)}
                    placeholder="Enter secret key / password"
                    className="w-full pl-10 pr-10 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginKey(!showLoginKey)}
                    className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-200"
                  >
                    {showLoginKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loginLoading ? 'Authenticating...' : 'Login to Council Portal'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-700/60 text-center">
              <p className="text-xs text-neutral-400">
                New Village Council Secretary?{' '}
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-emerald-400 hover:underline font-semibold"
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
          <div className="bg-neutral-800/90 rounded-3xl border border-neutral-700/80 p-6 sm:p-10 shadow-2xl max-w-2xl mx-auto w-full backdrop-blur-md">
            {!regSubmittedUser ? (
              <>
                <div className="text-center space-y-1 mb-6">
                  <div className="w-12 h-12 bg-emerald-950 border border-emerald-600/40 rounded-2xl mx-auto flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-serif font-black text-white">
                    VC Secretary Account Creation
                  </h2>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Register as Village Council Secretary. Village details and logo are configured in the Village Profile Update once your account is active.
                  </p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Username <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="e.g. SecretaryLalthan"
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Contact Number <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={regContactNumber}
                          onChange={(e) => setRegContactNumber(e.target.value)}
                          placeholder="e.g. 9436124589"
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Village Name for this Secretary */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Village Council Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={regVillageName}
                        onChange={(e) => setRegVillageName(e.target.value)}
                        placeholder="Enter your Village Name (e.g. Saiphai, Bilkhawthlir, Darlawn, Sairang)"
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Every Secretary gets a distinct, isolated Village Council profile and Land Pass registry.
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Secret Key <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type={showRegKey ? 'text' : 'password'}
                        value={regSecretKey}
                        onChange={(e) => setRegSecretKey(e.target.value)}
                        placeholder="Choose a secure secret key / password for login"
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegKey(!showRegKey)}
                        className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-200"
                      >
                        {showRegKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      You will use this secret key along with your username to log in.
                    </p>
                  </div>

                  {/* UPI ₹299 Lifetime Fee & Payment Proof Section */}
                  <div className="bg-neutral-900/90 rounded-2xl p-5 border border-neutral-700 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                          Lifetime Council Pass Registration Fee
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          One-time fee: <strong>₹299</strong> to Authority UPI
                        </span>
                      </div>
                      <span className="bg-amber-400/20 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-full border border-amber-400/30">
                        ₹299 Lifetime
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* QR Code */}
                      <div className="bg-white p-2 rounded-xl shrink-0 shadow-md flex flex-col items-center">
                        {upiQrUrl ? (
                          <img src={upiQrUrl} alt="UPI QR Code" className="w-32 h-32" />
                        ) : (
                          <div className="w-32 h-32 bg-neutral-200 animate-pulse rounded-lg"></div>
                        )}
                        <span className="text-[10px] font-mono text-neutral-700 mt-1 font-bold">
                          Scan to Pay ₹299
                        </span>
                      </div>

                      {/* UPI Details & Copy */}
                      <div className="flex-1 space-y-2 text-xs">
                        <div>
                          <span className="text-neutral-400 block">Official Authority UPI ID:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700 text-amber-300 select-all font-semibold text-xs">
                              {UPI_ID}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(UPI_ID);
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2500);
                              }}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 text-neutral-300 transition"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Pay ₹299 via Google Pay, PhonePe, Paytm or BHIM, and upload the payment confirmation screenshot below.
                        </p>
                      </div>
                    </div>

                    {/* Screenshot Upload with Photo Picker */}
                    <div className="pt-2 border-t border-neutral-800">
                      <label className="block text-xs font-semibold text-neutral-300 mb-2">
                        Payment Screenshot <span className="text-rose-400">* (Mandatory Proof)</span>
                      </label>

                      <input
                        type="file"
                        ref={screenshotInputRef}
                        onChange={handleScreenshotUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      {paymentScreenshotUrl ? (
                        <div className="bg-neutral-950 p-3 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={paymentScreenshotUrl}
                              alt="Payment Screenshot Preview"
                              className="w-14 h-14 object-cover rounded-lg border border-neutral-700"
                            />
                            <div>
                              <span className="text-xs font-semibold text-emerald-300 block flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Screenshot Attached
                              </span>
                              <span className="text-[11px] text-neutral-400 font-mono truncate max-w-xs block">
                                {paymentScreenshotName || 'Payment receipt image'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => screenshotInputRef.current?.click()}
                            className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition"
                          >
                            Change Photo
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => screenshotInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-emerald-400 transition bg-neutral-950/40"
                        >
                          <Camera className="w-6 h-6" />
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
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{regLoading ? 'Submitting Registration...' : 'Submit Registration for Authority Approval'}</span>
                  </button>
                </form>
              </>
            ) : (
              /* Success / Notification to Authority Step */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-950 border-2 border-emerald-500 rounded-full mx-auto flex items-center justify-center text-emerald-400 shadow-xl">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-black text-white">
                    Registration Submitted Successfully!
                  </h3>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                    Account for <strong>{regSubmittedUser.username}</strong> has been registered with payment proof. Please notify Authority to expedite approval.
                  </p>
                </div>

                {/* Direct WhatsApp and Email Notification Buttons */}
                <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-700 space-y-3 max-w-md mx-auto text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block text-center">
                    Notify Authority for Instant Approval
                  </span>

                  <a
                    href={`https://wa.me/917005504074?text=${encodeURIComponent(
                      `Hello Authority, I have registered as VC Secretary on VC LAND PASS portal with Username: ${regSubmittedUser.username}, Phone: ${regSubmittedUser.phoneNumber}. I have submitted ₹299 payment proof screenshot. Kindly approve my account. Thank you!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <span>💬 Notify via WhatsApp (7005504074)</span>
                  </a>

                  <a
                    href={`mailto:ptlalfakzuala@gmail.com?subject=${encodeURIComponent(
                      `VC Secretary Account Approval Request - ${regSubmittedUser.username}`
                    )}&body=${encodeURIComponent(
                      `Dear Authority,\n\nI have registered a new VC Secretary account on VC LAND PASS with Username: ${regSubmittedUser.username} and Phone: ${regSubmittedUser.phoneNumber}.\nPayment proof of ₹299 has been uploaded.\n\nPlease review and approve the registration.\n\nThank you.`
                    )}`}
                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <span>✉️ Notify via Email (ptlalfakzuala@gmail.com)</span>
                  </a>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => {
                      onLoginSuccess(regSubmittedUser);
                    }}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md"
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
          <div className="bg-neutral-800/90 rounded-3xl border border-amber-500/30 p-6 sm:p-10 shadow-2xl max-w-md mx-auto w-full backdrop-blur-md">
            <div className="text-center space-y-1 mb-6">
              <div className="w-12 h-12 bg-amber-950 border border-amber-500/40 rounded-2xl mx-auto flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-black text-white">
                Full Authority Mode
              </h2>
              <p className="text-xs text-neutral-400">
                Enter Master Authority Key to review and approve registrations &amp; land passes
              </p>
            </div>

            {authKeyError && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authKeyError}</span>
              </div>
            )}

            <form onSubmit={handleAuthorityUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Master Authority Key <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={authKeyInput}
                    onChange={(e) => setAuthKeyInput(e.target.value)}
                    placeholder="Enter Master Authority Key"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl text-sm font-black shadow-lg transition flex items-center justify-center gap-2"
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
          <div className="bg-neutral-800/90 rounded-3xl border border-neutral-700/80 p-6 sm:p-10 shadow-2xl max-w-xl mx-auto w-full backdrop-blur-md space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-950 border border-emerald-600/40 rounded-2xl mx-auto flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                <QrCode className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-black text-white">
                Public Land Pass Verification
              </h2>
              <p className="text-xs text-neutral-400">
                Scan Land Pass QR code with device camera or search by Pass Number
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-700">
              <button
                type="button"
                onClick={() => setScanMode('camera')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  scanMode === 'camera' ? 'bg-emerald-700 text-white' : 'text-neutral-400'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  scanMode === 'upload' ? 'bg-emerald-700 text-white' : 'text-neutral-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR Image</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('manual')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  scanMode === 'manual' ? 'bg-emerald-700 text-white' : 'text-neutral-400'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Pass Number</span>
              </button>
            </div>

            {cameraError && (
              <div className="p-3 bg-amber-950/60 border border-amber-700 rounded-xl text-xs text-amber-200">
                {cameraError}
              </div>
            )}

            {/* Live Camera Scanner View */}
            {scanMode === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-600/50 bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target Overlay Scanner Frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 border-2 border-emerald-400 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-300"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-300"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-300"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-300"></div>
                  </div>
                </div>

                <div className="absolute bottom-2 text-center text-[10px] text-white/80 bg-black/60 px-3 py-1 rounded-full font-mono">
                  Point camera at the QR code on the Land Pass
                </div>
              </div>
            )}

            {/* Image File Upload Scanner */}
            {scanMode === 'upload' && (
              <div className="text-center py-6 border-2 border-dashed border-neutral-700 rounded-2xl p-4 bg-neutral-900/60">
                <input
                  type="file"
                  ref={qrImageInputRef}
                  onChange={handleQrImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-neutral-300 font-medium mb-3">
                  Upload an image containing the Land Pass QR Code
                </p>
                <button
                  type="button"
                  onClick={() => qrImageInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono uppercase text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Verify
                </button>
              </form>
            )}

            {/* Verification Result Display */}
            {verifySearched && (
              <div className="pt-2">
                {verifiedPass ? (
                  <div className="bg-emerald-950/70 border-2 border-emerald-500 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-emerald-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">
                            Officially Verified Land Pass
                          </span>
                          <span className="text-[11px] text-emerald-400 font-mono">
                            {verifiedPass.passNumber}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono ${
                          verifiedPass.approvalStatus === 'live' || !verifiedPass.approvalStatus
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-amber-400 text-neutral-950'
                        }`}
                      >
                        {verifiedPass.approvalStatus === 'live' || !verifiedPass.approvalStatus
                          ? 'LIVE & APPROVED'
                          : 'PENDING APPROVAL'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Owner:</span>
                        <strong className="text-white text-sm">{verifiedPass.ownerName}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Parent:</span>
                        <span className="text-neutral-200">{verifiedPass.parentName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Type:</span>
                        <span className="text-emerald-300 font-semibold uppercase">
                          {verifiedPass.passType === 'huan_ram' ? 'Huan Ram (Garden)' : 'In Hmun (House)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Issue Date:</span>
                        <span className="font-mono text-neutral-200">{verifiedPass.issueDate}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-neutral-400 block text-[10px]">Village Council:</span>
                        <span className="text-neutral-200 font-medium">
                          {verifiedPass.villageName || 'Mizoram Village Council'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onViewPass(verifiedPass)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Official Certificate (Print View)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-950/60 border border-rose-800 rounded-2xl p-4 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                    <span className="text-xs font-bold text-rose-200 block">
                      Record Not Found in Registry
                    </span>
                    <p className="text-[11px] text-rose-300">
                      No genuine Land Pass matching that QR code or number was found. Please check the serial number carefully.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Official State Footer */}
      <footer className="relative z-10 border-t border-neutral-800 bg-neutral-950/80 px-4 py-4 text-center text-xs text-neutral-500">
        <p>
          Government of Mizoram &bull; Village Council Land Registry System &bull; Direct Authority Support: ptlalfakzuala@gmail.com / WhatsApp: +91 7005504074
        </p>
      </footer>
    </div>
  );
};
