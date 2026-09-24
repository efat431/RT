import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UserRole, isMasterAdminEmail } from '../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginUser,
    registerUser,
    setCurrentView,
  } = useStore();

  // Login form state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up form state
  const [name, setName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpPhone, setSignUpPhone] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsAuthModalOpen(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedInput = emailOrUsername.trim();
    const trimmedPass = password.trim();

    if (!trimmedInput || !trimmedPass) {
      setErrorMessage('Please enter both your email or username and password.');
      return;
    }

    const res = loginUser(trimmedInput, trimmedPass);
    if (res.success && res.user) {
      const isPrivilegedAdmin =
        res.user.role === 'super_admin' ||
        res.user.role === 'admin' ||
        res.user.role === 'sub_admin' ||
        isMasterAdminEmail(res.user.email);

      if (isPrivilegedAdmin) {
        setCurrentView('admin');
        handleClose();
        return;
      }

      setSuccessMessage(`Welcome back, ${res.user.name}!`);
      setTimeout(() => {
        handleClose();
        setCurrentView('store');
      }, 500);
    } else {
      setErrorMessage(res.message || 'Invalid email/username or password. Please try again.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = name.trim();
    const trimmedEmail = signUpEmail.trim().toLowerCase();
    const trimmedPass = signUpPassword.trim();
    const trimmedConfirmPass = signUpConfirmPassword.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!trimmedPass || trimmedPass.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (trimmedPass !== trimmedConfirmPass) {
      setErrorMessage('Passwords do not match. Please verify your confirm password.');
      return;
    }

    const res = registerUser({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPass,
      phone: signUpPhone.trim(),
      role: 'customer',
    });

    if (res.success && res.user) {
      setSuccessMessage(`Account registered successfully! Welcome, ${res.user.name}.`);
      setTimeout(() => {
        handleClose();
        setCurrentView('store');
      }, 850);
    } else {
      setErrorMessage(res.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        id="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Rainbow Accent */}
        <div className="h-1.5 w-full rainbow-gradient-bg" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">
                {authModalMode === 'login' ? 'Account Sign In' : 'Create an Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {authModalMode === 'login'
                  ? 'Sign in for customers & store administrators'
                  : 'Register for fast checkout, order tracking & access'}
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Sign In / Sign Up */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 m-4 mb-2 rounded-xl">
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              authModalMode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => {
              setAuthModalMode('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              authModalMode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Messages */}
        <div className="px-5 pt-2">
          {errorMessage && (
            <div
              id="auth-error-alert"
              className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div
              id="auth-success-alert"
              className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-fadeIn"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Form Body with Scroll */}
        <div className="p-5 pt-1 overflow-y-auto space-y-4">
          {authModalMode === 'login' ? (
            <form id="login-form" onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-email-input"
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form id="signup-form" onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 4 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-password-input"
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-confirm-password-input"
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-phone-input"
                    type="tel"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                id="submit-signup-btn"
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Create Account</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          {authModalMode === 'login' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-bold text-rose-600 hover:underline"
              >
                Create one here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-bold text-rose-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
