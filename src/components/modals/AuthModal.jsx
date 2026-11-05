import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api, isDeviceTrusted, saveDeviceTrust, clearDeviceTrust } from '../../services/api';
import { 
  X, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  User, 
  ArrowLeft, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  Clock,
  Headphones,
  ExternalLink
} from 'lucide-react';

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

function getOrCreateDeviceId() {
  let id = localStorage.getItem('archon_device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);
    localStorage.setItem('archon_device_id', id);
  }
  return id;
}

// Visual Password Policy Checklist
function PasswordChecklist({ password }) {
  const rules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'One special symbol (!@#$%...)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) }
  ];

  const allValid = rules.every(r => r.valid);

  return (
    <div className={`p-3 rounded-2xl border transition-all text-left ${
      allValid ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
          <ShieldCheck className={`w-3.5 h-3.5 ${allValid ? 'text-emerald-600' : 'text-blue-600'}`} />
          Security Password Policy
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
          allValid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
        }`}>
          {allValid ? 'Compliant' : 'Required'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
            {rule.valid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0 bg-white" />
            )}
            <span className={rule.valid ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthModal() {
  const { 
    isAuthOpen, 
    setIsAuthOpen, 
    loginWithAuth,
    setCurrentUser, 
    setCurrentView, 
    showToast,
    setIsCsOpen
  } = useApp();

  // Modes: 'LOGIN' | 'LOGIN_OTP' | 'FORGOT_EMAIL' | 'FORGOT_OTP' | 'REGISTER'
  const [mode, setMode] = useState('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Trust this device for 5 days toggle state
  const [trustDevice, setTrustDevice] = useState(true);

  // OTP Fields & Restrictions
  const [otpCode, setOtpCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes overall code life
  const [resendCooldown, setResendCooldown] = useState(60); // 1-minute (60s) cooldown for Resend
  const [isOtpAborted, setIsOtpAborted] = useState(false); // True if 5 wrong attempts entered

  // Forgot Password Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // Timer countdown for overall OTP expiration
  useEffect(() => {
    let timer;
    if ((mode === 'LOGIN_OTP' || mode === 'FORGOT_OTP') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, timeLeft]);

  // Timer countdown for 1-minute (60 seconds) Resend OTP cooldown
  useEffect(() => {
    let timer;
    if ((mode === 'LOGIN_OTP' || mode === 'FORGOT_OTP') && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, resendCooldown]);

  // Reset form when modal closes/opens
  useEffect(() => {
    if (!isAuthOpen) {
      setMode('LOGIN');
      setErrorMsg('');
      setOtpCode('');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsOtpAborted(false);
      setResendCooldown(60);
    }
  }, [isAuthOpen]);

  if (!isAuthOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const validatePasswordRules = (pwd) => {
    return pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd);
  };

  // 1. STEP 1: LOGIN (Validates credentials -> Checks 5-day trust, 5-attempt limit, or dispatches OTP)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await api.loginInit(email.trim().toLowerCase(), password, deviceId, trustDevice);
      setLoading(false);

      // Check if trusted device bypassed OTP
      if (!res.requireOtp && res.token && res.user) {
        if (loginWithAuth) {
          loginWithAuth(res.user, res.token);
        } else {
          localStorage.setItem('archon_token', res.token);
          localStorage.setItem('archon_user', JSON.stringify(res.user));
          setCurrentUser(res.user);
          setIsAuthOpen(false);
          setCurrentView(res.user.role === 'admin' ? 'admin-dashboard' : 'customer-dashboard');
        }
        showToast(`Welcome back, ${res.user.name}! (Trusted device recognized - OTP skipped)`, 'success');
        return;
      }

      if (res.requireOtp) {
        setMode('LOGIN_OTP');
        setTimeLeft(300);
        setResendCooldown(60);
        setOtpCode('');
        setIsOtpAborted(false);
        showToast(`Verification code sent to ${res.email}`, 'info');
      }
    } catch (err) {
      setLoading(false);
      // If 5 wrong password attempts reached: force password reset
      if (err.forcePasswordReset || err.message?.includes('Maximum password attempts exceeded') || err.message?.includes('Account locked')) {
        setErrorMsg('Maximum password attempts exceeded (5/5). Your account has been locked. Please reset your password.');
        showToast('Account locked after 5 failed attempts. Please reset your password.', 'error');
        setMode('FORGOT_EMAIL');
        // Automatically dispatch forgot password OTP to user
        api.forgotPasswordInit(email.trim().toLowerCase()).then((fRes) => {
          if (fRes.requireOtp) {
            setMode('FORGOT_OTP');
            setTimeLeft(300);
            setResendCooldown(60);
            setOtpCode('');
            showToast(`Security reset code dispatched to ${email}`, 'info');
          }
        }).catch(() => {});
        return;
      }
      setErrorMsg(err.message || 'Invalid email or password.');
    }
  };

  // 2. STEP 2: VERIFY LOGIN OTP (Identifies role -> RBAC Redirect & stores trusted device; aborts after 5 wrong OTP entries)
  const handleLoginOtpVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isOtpAborted) {
      setErrorMsg('This verification code was aborted due to 5 wrong entries. Please click Resend Code below.');
      return;
    }

    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await api.loginVerifyOtp(email.trim().toLowerCase(), otpCode, deviceId, trustDevice);
      setLoading(false);

      if (res.token && res.user) {
        if (trustDevice) {
          saveDeviceTrust(email.trim().toLowerCase());
        } else {
          clearDeviceTrust(email.trim().toLowerCase());
        }

        if (loginWithAuth) {
          loginWithAuth(res.user, res.token);
        } else {
          localStorage.setItem('archon_token', res.token);
          localStorage.setItem('archon_user', JSON.stringify(res.user));
          setCurrentUser(res.user);
          setIsAuthOpen(false);
          setCurrentView(res.user.role === 'admin' ? 'admin-dashboard' : 'customer-dashboard');
          showToast(`Welcome, ${res.user.name}!`, 'success');
        }
      }
    } catch (err) {
      setLoading(false);
      // Check if 5th wrong OTP attempt caused code abort
      if (err.otpAborted || err.message?.includes('Maximum OTP attempts exceeded') || err.message?.includes('aborted')) {
        setIsOtpAborted(true);
        setOtpCode('');
        setErrorMsg('Maximum OTP attempts exceeded (5/5). This verification code has been aborted. Please click Resend Code to receive a new one.');
        showToast('OTP code aborted. Please click Resend Code to request a new code.', 'error');
        return;
      }
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    }
  };

  // 3. FORGOT PASSWORD - STEP 1: SEND RESET CODE
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPasswordInit(email.trim().toLowerCase());
      setLoading(false);

      if (res.requireOtp) {
        setMode('FORGOT_OTP');
        setTimeLeft(300);
        setResendCooldown(60);
        setOtpCode('');
        setIsOtpAborted(false);
        showToast(res.message, 'info');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to process request.');
    }
  };

  // 4. FORGOT PASSWORD - STEP 2: VERIFY OTP & SET NEW PASSWORD
  const handleForgotOtpVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isOtpAborted) {
      setErrorMsg('This verification code was aborted due to 5 wrong entries. Please click Resend Code below.');
      return;
    }

    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    if (!validatePasswordRules(newPassword)) {
      setErrorMsg('New password must satisfy all 5 requirements of the Password Policy below.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPasswordVerify(email.trim().toLowerCase(), otpCode, newPassword);
      setLoading(false);
      showToast(res.message || 'Password successfully updated! Your account is unlocked.', 'success');
      setPassword('');
      setMode('LOGIN');
    } catch (err) {
      setLoading(false);
      if (err.otpAborted || err.message?.includes('Maximum OTP attempts exceeded')) {
        setIsOtpAborted(true);
        setOtpCode('');
        setErrorMsg('Maximum OTP attempts exceeded (5/5). Code aborted. Please click Resend Code.');
        return;
      }
      setErrorMsg(err.message || 'Failed to reset password.');
    }
  };

  // 5. RESEND OTP CODE VIA BREVO (WITH 1-MINUTE COOLDOWN)
  const handleResendOtp = async (purpose) => {
    if (resendCooldown > 0) {
      setErrorMsg(`Please wait ${resendCooldown} seconds before requesting a new code.`);
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.resendOtp(email.trim().toLowerCase(), purpose);
      setLoading(false);
      setTimeLeft(300);
      setResendCooldown(60);
      setOtpCode('');
      setIsOtpAborted(false);
      showToast(res.message || 'New verification code dispatched to your email.', 'info');
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to resend code.');
    }
  };

  // 6. REGISTER NEW CUSTOMER
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!validatePasswordRules(regPassword)) {
      setErrorMsg('Password must satisfy all 5 requirements of the Password Policy below.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        phone: regPhone.trim(),
        defaultAddress: regAddress.trim() || null
      });
      setLoading(false);

      if (res.token && res.user) {
        if (loginWithAuth) {
          loginWithAuth(res.user, res.token);
        } else {
          localStorage.setItem('archon_token', res.token);
          localStorage.setItem('archon_user', JSON.stringify(res.user));
          setCurrentUser(res.user);
          setIsAuthOpen(false);
          setCurrentView('customer-dashboard');
        }
        showToast(`Account created! Welcome to Archon Nell, ${res.user.name}.`, 'success');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#FBF9F5] flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      
      {/* Top Application Bar matching screenshot */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pb-4 sm:pb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-900 font-bold">
          <span>Archon Nell Incorporated</span>
          <span className="text-slate-300 font-normal">•</span>
          <span className="text-slate-500 font-normal text-xs">Hardware Online</span>
          <span className="text-slate-300 font-normal">•</span>
          <span className="text-slate-400 font-mono text-[11px] font-normal">Project v1</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF3EC] border border-[#F3E5D8] text-[11px] text-[#8C4F27] font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#B45309]" />
            <span>Archon Secure Gateway</span>
            <span className="text-amber-300">•</span>
            <span className="text-amber-900/70">Hardware Online</span>
          </div>

          <button
            onClick={() => setIsAuthOpen(false)}
            aria-label="Close"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Centered Main Card matching screenshot */}
      <div className="w-full flex items-center justify-center my-auto py-2">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-300/40 max-w-[460px] w-full overflow-hidden flex flex-col relative transition-all">
          
          {/* Top Dark Navy Accent Strip */}
          <div className="h-1 bg-[#0B1B3D] w-full" />

          <div className="p-7 sm:p-9">
            
            {/* Archon Nell Logo */}
            <div className="flex justify-center mb-1">
              <img 
                src="/assets/images/archon_nell_logo.png" 
                alt="Archon Nell Incorporated" 
                className="h-10 sm:h-11 w-auto object-contain" 
              />
            </div>

            {/* Tagline */}
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#C25E38] text-center uppercase mb-5 font-mono">
              PARTNER • INNOVATOR • SOLUTIONS PROVIDER
            </div>

            {/* Section Headings based on mode */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug">
                {mode === 'LOGIN' && 'Hardware Gateway & Control Access'}
                {mode === 'LOGIN_OTP' && 'Two-Factor OTP Verification'}
                {mode === 'FORGOT_EMAIL' && 'Reset Terminal Credentials'}
                {mode === 'FORGOT_OTP' && 'Verify & Update Credentials'}
                {mode === 'REGISTER' && 'Provision New Client Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                {mode === 'LOGIN' && 'Enter hardware operator or engineer credentials to access node controller & telemetry dashboard'}
                {mode === 'LOGIN_OTP' && `Enter the 6-digit authentication token dispatched to ${maskEmail(email)}`}
                {mode === 'FORGOT_EMAIL' && 'Enter your verified account email to initiate security credential recovery'}
                {mode === 'FORGOT_OTP' && 'Enter the 6-digit recovery code and configure your compliant security password'}
                {mode === 'REGISTER' && 'Enter your corporate and operator details to provision client portal access'}
              </p>
            </div>

            {/* Error Alert Box */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* 1. LOGIN FORM                                            */}
            {/* ======================================================== */}
            {mode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eng.id@archonnell.com / HW-NODE-04"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900 placeholder:text-slate-400 transition-colors shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('FORGOT_EMAIL');
                      }}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900 placeholder:text-slate-400 transition-colors shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#0B1B3D] hover:bg-[#142958] disabled:opacity-50 text-white text-xs sm:text-[13px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Authorizing Session...</span>
                  ) : (
                    <>
                      <span>Authorize Terminal Session</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Security Footnote */}
                <div className="pt-3 text-center">
                  <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Hardware TPM 2.0 & Physical Key Authentication</span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2.5">
                    Unprovisioned hardware controller?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('REGISTER');
                      }}
                      className="font-bold text-[#C25E38] hover:text-[#9A4323] transition-colors"
                    >
                      Contact Hardware Lead / Register
                    </button>
                  </p>
                </div>

              </form>
            )}

            {/* ======================================================== */}
            {/* 2. LOGIN OTP VERIFICATION                                */}
            {/* ======================================================== */}
            {mode === 'LOGIN_OTP' && (
              <form onSubmit={handleLoginOtpVerify} className="space-y-4">
                
                <div className="space-y-1.5 text-center">
                  <p className="text-xs text-slate-500">Authentication token dispatched to:</p>
                  <div className="inline-block bg-slate-100 text-slate-800 font-mono text-xs px-3 py-1 rounded-full font-bold">
                    {maskEmail(email)}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 text-center mb-1.5">
                    6-Digit OTP Token
                  </label>
                  <input
                    type="text"
                    autoFocus
                    disabled={isOtpAborted}
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className={`w-full text-center text-2xl tracking-[0.45em] font-mono font-bold py-3 bg-white border rounded-lg focus:outline-none transition-all shadow-sm ${
                      isOtpAborted 
                        ? 'bg-rose-50 border-rose-300 text-rose-500 cursor-not-allowed' 
                        : 'border-slate-300 focus:border-slate-800 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Token validity:</span>
                  <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-800'}`}>
                    {formattedTime}
                  </span>
                </div>

                {/* Trust this device for 5 days toggle on OTP screen */}
                <div 
                  onClick={() => setTrustDevice(!trustDevice)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-all cursor-pointer text-left shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      trustDevice ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px] font-bold text-slate-900 block truncate">Trust this device for 5 days.</span>
                      <span className="text-[10px] text-slate-500 block truncate">Skips OTP verification on this browser for 5 days</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={trustDevice}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 ${
                      trustDevice ? 'bg-[#0B1B3D]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform ${
                        trustDevice ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6 || isOtpAborted}
                  className="w-full py-3 px-4 bg-[#0B1B3D] hover:bg-[#142958] disabled:opacity-50 text-white text-xs sm:text-[13px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Verifying Token...</span>
                  ) : (
                    <>
                      <span>Verify Token & Authorize Session</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Login</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading || resendCooldown > 0}
                    onClick={() => handleResendOtp('Login 2FA Verification')}
                    className="text-[#C25E38] hover:text-[#9A4323] disabled:text-slate-400 disabled:cursor-not-allowed font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend Token (${resendCooldown}s)` : 'Resend Token'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* ======================================================== */}
            {/* 3. FORGOT PASSWORD - EMAIL INPUT                         */}
            {/* ======================================================== */}
            {mode === 'FORGOT_EMAIL' && (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eng.id@archonnell.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900 placeholder:text-slate-400 transition-colors shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#0B1B3D] hover:bg-[#142958] disabled:opacity-50 text-white text-xs sm:text-[13px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Dispatching Recovery Key...</span>
                  ) : (
                    <>
                      <span>Dispatch Security Recovery Code</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Terminal Login</span>
                  </button>
                </div>

              </form>
            )}

            {/* ======================================================== */}
            {/* 4. FORGOT PASSWORD - OTP & NEW PASSWORD                  */}
            {/* ======================================================== */}
            {mode === 'FORGOT_OTP' && (
              <form onSubmit={handleForgotOtpVerify} className="space-y-3.5">
                
                <div className="space-y-1 text-center">
                  <p className="text-xs text-slate-500">Recovery token sent to:</p>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {maskEmail(email)}
                  </span>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 text-center mb-1">
                    6-Digit Recovery Token
                  </label>
                  <input
                    type="text"
                    autoFocus
                    disabled={isOtpAborted}
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center text-2xl tracking-[0.45em] font-mono font-bold py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Must comply with security policy"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900"
                  />
                </div>

                <PasswordChecklist password={newPassword} />

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter compliant password"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !validatePasswordRules(newPassword) || newPassword !== confirmPassword || isOtpAborted}
                  className="w-full py-3 px-4 bg-[#0B1B3D] hover:bg-[#142958] disabled:opacity-40 text-white text-xs sm:text-[13px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Updating Credentials...</span>
                  ) : (
                    <>
                      <span>Confirm & Update Credentials</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading || resendCooldown > 0}
                    onClick={() => handleResendOtp('Password Reset')}
                    className="text-[#C25E38] hover:text-[#9A4323] disabled:text-slate-400 disabled:cursor-not-allowed font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* ======================================================== */}
            {/* 5. REGISTER NEW ACCOUNT                                  */}
            {/* ======================================================== */}
            {mode === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Roland Martinez"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="operator@company.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[12px] font-semibold text-slate-700">Mobile Phone</label>
                      <span className="text-[10px] text-slate-400 font-mono">{regPhone.length}/11</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={11}
                      value={regPhone}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setRegPhone(clean);
                      }}
                      placeholder="09171234567"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900 font-mono tracking-wider"
                    />
                  </div>
                </div>

                <PasswordChecklist password={regPassword} />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[12px] font-semibold text-slate-700">Primary Delivery Address / Depot</label>
                    <span className="text-[10px] text-slate-400 font-semibold">(Optional)</span>
                  </div>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Depot address or project location (optional)"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !validatePasswordRules(regPassword)}
                  className="w-full py-3 px-4 bg-[#0B1B3D] hover:bg-[#142958] disabled:opacity-40 text-white text-xs sm:text-[13px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Provisioning Account...</span>
                  ) : (
                    <>
                      <span>Provision Client Account</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Already provisioned with credentials?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('LOGIN');
                      }}
                      className="font-bold text-[#C25E38] hover:text-[#9A4323] ml-1"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>

              </form>
            )}

          </div>
        </div>
      </div>

      {/* Bottom Footer matching screenshot with Help Desk link */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center pt-4 sm:pt-6">
        <button
          type="button"
          onClick={() => {
            setIsAuthOpen(false);
            if (setIsCsOpen) setIsCsOpen(true);
          }}
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-white/80"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Help Desk</span>
        </button>
      </div>

    </div>
  );
}
