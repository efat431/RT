import React, { useState } from 'react';
import { X, Lock, ShieldCheck, User, AlertCircle, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('efatadmin');
  const [password, setPassword] = useState('efat@#413');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Strict Credentials verification per specification
    if (username.trim() === 'efatadmin' && password === 'efat@#413') {
      onLoginSuccess();
      onClose();
    } else {
      setError('Invalid admin credentials. Please verify your username and password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="admin-login-modal"
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center relative">
          <button
            id="close-admin-login-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>

          <h3 className="text-xl font-black">Admin Access Portal</h3>
          <p className="text-xs text-slate-400 mt-1">
            Rongdhonu Trade Store & Courier Management
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Protected Security Guard:</span>
              <span className="text-[11px] text-purple-700">
                Authorized credentials: Username <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">efatadmin</code> | Password <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">efat@#413</code>
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Admin Username
            </label>
            <div className="relative">
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="efatadmin"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Admin Password
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="admin-login-submit-btn"
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg rainbow-gradient-bg hover:opacity-95 transition-all transform active:scale-98"
            >
              <span>Unlock Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Rongdhonu Trade Internal Systems • Uttara, Dhaka
        </div>
      </div>
    </div>
  );
}
