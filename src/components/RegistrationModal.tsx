import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { UserProfile, UserType, UserStatus } from '../types';
import {
  X,
  UserCheck,
  Building2,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Clock,
  Smartphone,
  Lock,
  Copy,
  Check,
  LogIn,
  AlertCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileCheck
} from 'lucide-react';
import { logActivity } from '../services/auditLogger';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (user: UserProfile, needsMandatoryProfileUpdate: boolean, initialVillageName?: string) => void;
  onSwitchToLogin: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  const [step, setStep] = useState<'form' | 'payment'>('form');

  // Form Fields - Strictly Username, Contact Number, and Secret Key (NO VILLAGE NAME, NO PRE-FILLED TEXT)
  const [userName, setUserName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [passkey, setPasskey] = useState<string>('');

  // Payment State - Completely clean inputs (NO PRE-FILLED UTR)
  const [upiProvider, setUpiProvider] = useState<'gpay' | 'phonepe' | 'paytm' | 'qr'>('gpay');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [paymentQrUrl, setPaymentQrUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment Screenshot Photo Picker State
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string>('');
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 5 Minutes Countdown Timer
  const [secondsLeft, setSecondsLeft] = useState<number>(300); // 5 minutes

  const upiId = 'ptlalfakzuala@oksbi';
  const paymentAmount = 299;

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrors({});
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    let timer: any = null;
    if (isOpen && step === 'payment') {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, step]);

  // QR Code generator
  useEffect(() => {
    if (step === 'payment') {
      const upiUri = `upi://pay?pa=${upiId}&pn=Village%20Council%20Land%20Pass%20Portal&am=${paymentAmount}&cu=INR&tn=VC%20Secretary%20Lifetime%20Access`;
      QRCode.toDataURL(
        upiUri,
        {
          width: 240,
          margin: 1,
          color: { dark: '#064e3b', light: '#ffffff' },
        },
        (err, url) => {
          if (!err && url) setPaymentQrUrl(url);
        }
      );
    }
  }, [step]);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setSecondsLeft(300);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!userName.trim()) errs.userName = 'Username is required';
    if (!contactNumber.trim() || contactNumber.length < 8)
      errs.contactNumber = 'Valid contact number is required';
    if (!passkey.trim() || passkey.length < 4) {
      errs.passkey = 'Secret Key of at least 4 characters is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSecondsLeft(300);
    setStep('payment');
  };

  // Handle Photo Picker for Payment Screenshot
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Screenshot file size exceeds 5MB. Please choose a smaller compressed image.');
      return;
    }

    setPaymentScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setPaymentScreenshotUrl(compressed);
          } else {
            setPaymentScreenshotUrl(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCompletePaymentAndRegister = () => {
    if (!paymentScreenshotUrl) {
      setErrors({ screenshot: 'Please upload a photo of your payment confirmation screenshot.' });
      return;
    }

    setPaymentProcessing(true);

    setTimeout(() => {
      const cleaned = contactNumber.replace(/\D/g, '');

      // Created with status 'pending' awaiting Full Authority approval
      // Village name will be set during mandatory Profile Update immediately following!
      const secretaryUid = `secretary_${cleaned}_${Date.now()}`;
      const userVillageId = `village_${secretaryUid}`;
      const secretaryUser: UserProfile = {
        uid: secretaryUid,
        villageId: userVillageId,
        villageName: `${userName.trim()} Village Council`,
        email: `${cleaned}@secretary.mizoram.gov.in`,
        displayName: userName.trim(),
        userType: 'secretary',
        role: 'admin',
        status: 'pending', // Awaiting Full Authority approval
        phoneNumber: contactNumber.trim(),
        passkey: passkey.trim(),
        paymentStatus: 'completed',
        paymentRef: utrNumber.trim() || `UPI/REF/${Date.now().toString().slice(-6)}`,
        paymentAmount,
        upiProvider,
        paymentScreenshotUrl,
        paymentScreenshotName: paymentScreenshotName || 'payment_receipt.jpg',
        registrationDate: new Date().toISOString(),
      };

      logActivity(
        'USER_REGISTRATION_SUBMITTED',
        secretaryUser.uid,
        secretaryUser.displayName || 'VC Secretary',
        secretaryUser.displayName || 'Officer',
        `Registered VC Secretary account for ${userName.trim()} with payment screenshot. Status: Pending Full Authority Approval.`
      );

      setPaymentProcessing(false);
      // USER PROFILE UPDATE IS MANDATORY JUST AFTER USER CREATED!
      onRegisterSuccess(secretaryUser, true);
      onClose();
    }, 1200);
  };

  const copyUpiId = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {step === 'form' ? 'VC Secretary Account Creation' : 'Official Portal Activation'}
              </h3>
              <p className="text-xs text-emerald-300">
                {step === 'form'
                  ? 'Village Council Secretary Registration'
                  : 'UPI Payment to ptlalfakzuala@oksbi (₹299 Lifetime)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* STEP 1: VC SECRETARY CREDENTIALS FORM (USERNAME, PHONE, KEY)   */}
        {/* ============================================================== */}
        {step === 'form' ? (
          <form onSubmit={handleNextToPayment} className="p-6 space-y-4 text-sm overflow-y-auto">
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-950 block">
                Village Council Secretary Account
              </span>
              <span className="text-xs text-emerald-800 mt-0.5 block leading-tight">
                Enter your secretary username, contact number, and secret key. Village details will be configured in the mandatory profile setup.
              </span>
            </div>

            {/* 1. Username */}
            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                placeholder="Enter Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {errors.userName && (
                <p className="text-xs text-rose-600 mt-1">{errors.userName}</p>
              )}
            </div>

            {/* 2. Contact Number */}
            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                required
                placeholder="Enter 10-digit mobile number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
              {errors.contactNumber && (
                <p className="text-xs text-rose-600 mt-1">{errors.contactNumber}</p>
              )}
            </div>

            {/* 3. Secret Key */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              <label className="text-xs font-bold text-amber-950 block mb-1">
                Secret Key (Passkey) *
              </label>
              <input
                type="password"
                required
                placeholder="Enter secret key for login"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-base tracking-widest font-mono font-bold text-center focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-amber-800 mt-1 block">
                You will use this secret key with your username to log in to the council portal.
              </span>
              {errors.passkey && (
                <p className="text-xs text-rose-600 mt-1">{errors.passkey}</p>
              )}
            </div>

            {/* Secretary Payment Notice */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-950 font-medium">One-Time Lifetime Access Fee:</span>
              </div>
              <div className="text-right">
                <span className="font-bold font-mono text-emerald-900 text-sm">₹{paymentAmount}</span>
                <span className="text-[10px] text-emerald-700 block">Lifetime Access</span>
              </div>
            </div>

            {/* Actions & Login Switcher */}
            <div className="pt-2 border-t border-neutral-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Secretary Login
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl text-sm transition shadow-md flex items-center gap-1.5"
                >
                  <span>Pay ₹299 &amp; Upload Proof</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ============================================================== */
          /* STEP 2: UPI PAYMENT GATEWAY WITH SCREENSHOT PHOTO PICKER       */
          /* ============================================================== */
          <div className="p-6 space-y-4 text-sm overflow-y-auto">
            {/* Countdown Timer Banner */}
            <div className="bg-amber-500/10 border-2 border-amber-500 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                <div>
                  <span className="text-xs uppercase font-bold text-amber-950 tracking-wider block">
                    Payment Window Active (5 Min)
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    Complete UPI transfer &amp; upload screenshot proof
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono text-amber-950">
                  {formatTimer(secondsLeft)}
                </span>
                {secondsLeft === 0 && (
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="text-[10px] text-emerald-700 underline block"
                  >
                    Reset Timer
                  </button>
                )}
              </div>
            </div>

            {/* Official Amount & VPA Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider block">
                  Official Lifetime License
                </span>
                <span className="text-xs text-emerald-700 font-medium">
                  {userName} (VC Secretary)
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-950">₹299</span>
                <span className="text-[10px] text-emerald-700 block">Lifetime Access</span>
              </div>
            </div>

            {/* UPI ID Copy Box */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
              <span className="text-xs font-bold text-neutral-800 block">
                Pay via UPI / GPay / PhonePe / Paytm / BHIM to:
              </span>
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-neutral-300 font-mono text-sm font-bold text-emerald-950">
                <span>{upiId}</span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-xs font-semibold flex items-center gap-1 transition"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* UPI QR Code */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-white border border-neutral-200 rounded-xl shadow-xs text-center space-y-1.5">
              <span className="text-xs font-bold text-neutral-800">
                Scan QR Code with any UPI App
              </span>
              {paymentQrUrl && (
                <img
                  src={paymentQrUrl}
                  alt="UPI Payment QR Code"
                  className="w-40 h-40 border-2 border-emerald-900 rounded-xl p-1.5 bg-white shadow-xs"
                />
              )}
              <span className="text-[11px] text-neutral-500 font-mono">
                ptlalfakzuala@oksbi • ₹299.00
              </span>
            </div>

            {/* PHOTO PICKER FOR PAYMENT SCREENSHOT */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border-2 border-dashed border-emerald-300 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    Input Photo for Payment Screenshot *
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Upload receipt screenshot from Google Pay, PhonePe, or Paytm
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase">
                  Required Proof
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
              />

              {paymentScreenshotUrl ? (
                <div className="bg-white p-3 rounded-xl border border-emerald-300 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={paymentScreenshotUrl}
                      alt="Payment screenshot proof"
                      className="w-16 h-16 object-cover rounded-lg border border-neutral-200 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[160px] sm:max-w-[200px]">
                          {paymentScreenshotName || 'Payment Screenshot Attached'}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        Ready for Full Authority verification
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentScreenshotUrl('');
                        setPaymentScreenshotName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-white hover:bg-emerald-100/60 border border-emerald-400 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer group"
                >
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-full group-hover:bg-emerald-200 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-950">
                    Click to Choose Payment Screenshot Photo
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Supports JPG, PNG, WEBP (Max 5MB)
                  </span>
                </button>
              )}

              {errors.screenshot && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.screenshot}
                </p>
              )}
            </div>

            {/* Transaction Ref / UTR - NO PRE-FILLED TEXT */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Transaction Ref / UTR Number
              </label>
              <input
                type="text"
                placeholder="Enter 12-digit UTR from your UPI payment"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-neutral-500 mt-0.5 block">
                Enter the reference number shown in your payment confirmation.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCompletePaymentAndRegister}
                disabled={paymentProcessing}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl text-sm transition shadow-md flex items-center gap-2"
              >
                {paymentProcessing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting Registration...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
