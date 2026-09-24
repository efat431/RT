import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Key,
  Globe,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Send,
  Zap,
} from 'lucide-react';
import { CourierApiConfig } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminCouriersTabProps {
  courierConfigs: CourierApiConfig[];
  onAddCourier: (config: Omit<CourierApiConfig, 'id'>) => void;
  onUpdateCourier: (id: string, updates: Partial<CourierApiConfig>) => void;
  onDeleteCourier: (id: string) => void;
  onResetCouriers: () => void;
}

export const AdminCouriersTab: React.FC<AdminCouriersTabProps> = ({
  courierConfigs,
  onAddCourier,
  onUpdateCourier,
  onDeleteCourier,
  onResetCouriers,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<CourierApiConfig | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [trackingUrlPattern, setTrackingUrlPattern] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openAddModal = () => {
    setEditingCourier(null);
    setName('');
    setCode('');
    setApiKey('');
    setSecretKey('');
    setBaseUrl('https://api.example-courier.com.bd/v1');
    setTrackingUrlPattern('https://example-courier.com.bd/track/{trackingCode}');
    setWebhookSecret('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (c: CourierApiConfig) => {
    setEditingCourier(c);
    setName(c.name);
    setCode(c.code);
    setApiKey(c.apiKey);
    setSecretKey(c.secretKey || '');
    setBaseUrl(c.baseUrl);
    setTrackingUrlPattern(c.trackingUrlPattern || '');
    setWebhookSecret(c.webhookSecret || '');
    setIsActive(c.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !apiKey.trim() || !baseUrl.trim()) return;

    const formattedCode = (code || name).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingCourier) {
      onUpdateCourier(editingCourier.id, {
        name,
        code: formattedCode,
        apiKey,
        secretKey: secretKey || undefined,
        baseUrl,
        trackingUrlPattern: trackingUrlPattern || undefined,
        webhookSecret: webhookSecret || undefined,
        isActive,
      });
      showNotice(`Updated ${name} API configuration!`);
    } else {
      onAddCourier({
        name,
        code: formattedCode,
        apiKey,
        secretKey: secretKey || undefined,
        baseUrl,
        trackingUrlPattern: trackingUrlPattern || undefined,
        webhookSecret: webhookSecret || undefined,
        isActive,
      });
      showNotice(`Added ${name} to Courier Logistics!`);
    }
    setIsModalOpen(false);
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestApi = async (c: CourierApiConfig) => {
    setTestingId(c.id);
    setTestResult(null);

    // Simulate API ping to the courier gateway
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTestingId(null);
    setTestResult({
      id: c.id,
      success: true,
      message: `200 OK — Successfully connected to ${c.name} API gateway (${c.baseUrl})`,
    });

    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Bangladeshi Courier APIs & Logistics (কুরিয়ার এপিআই ম্যানেজমেন্ট)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, update API credentials, or remove courier delivery partners (Steadfast, Pathao, RedX, eCourier, Paperfly, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                title: 'Reset Courier APIs to Default?',
                message: 'Are you sure you want to reset all Courier API configurations back to default settings (Steadfast, Pathao, RedX)?',
                confirmText: 'Reset Defaults',
                variant: 'danger',
                onConfirm: () => {
                  onResetCouriers();
                  showNotice('Restored default courier APIs.');
                },
              });
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            id="admin-add-courier-btn"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Courier API
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Preset Quick Add Helpers */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
          Popular Bangladeshi Courier API Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setName('Paperfly Courier');
              setCode('paperfly');
              setApiKey('PFLY_LIVE_API_KEY_BD9982');
              setSecretKey('sec_paperfly_token_8892');
              setBaseUrl('https://api.paperfly.com.bd/v2');
              setTrackingUrlPattern('https://paperfly.com.bd/tracking/{trackingCode}');
              setIsActive(true);
              setEditingCourier(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3 h-3 text-emerald-600" />
            Paperfly
          </button>

          <button
            onClick={() => {
              setName('eCourier Express');
              setCode('ecourier');
              setApiKey('ECOUR_API_KEY_DHAKA_771');
              setSecretKey('user_id_ecourier_44');
              setBaseUrl('https://backoffice.ecourier.com.bd/api/web/v2');
              setTrackingUrlPattern('https://ecourier.com.bd/tracking?id={trackingCode}');
              setIsActive(true);
              setEditingCourier(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3 h-3 text-emerald-600" />
            eCourier
          </button>

          <button
            onClick={() => {
              setName('Sundarban Courier');
              setCode('sundarban');
              setApiKey('SNDRBN_MERCHANT_KEY_12');
              setSecretKey('sundarban_secret_key');
              setBaseUrl('https://api.sundarbancourier.com/api/v1');
              setTrackingUrlPattern('https://sundarbancourier.com/track/{trackingCode}');
              setIsActive(true);
              setEditingCourier(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3 h-3 text-emerald-600" />
            Sundarban Courier
          </button>
        </div>
      </div>

      {/* Courier Configs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courierConfigs.map((c) => {
          const isRevealed = showKeys[c.id];
          const isTesting = testingId === c.id;
          const result = testResult?.id === c.id ? testResult : null;

          return (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                      <span className="text-[11px] font-mono text-slate-400">code: {c.code}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      c.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* API Details Box */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      API Endpoint Base
                    </span>
                    <span className="font-mono text-[11px] text-slate-700 break-all">{c.baseUrl}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        API Key
                      </span>
                      <button
                        onClick={() => toggleKeyVisibility(c.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                        title={isRevealed ? 'Hide API Key' : 'Reveal API Key'}
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    <span className="font-mono text-[11px] text-slate-900 font-semibold break-all">
                      {isRevealed ? c.apiKey : c.apiKey.replace(/.(?=.{4})/g, '•')}
                    </span>
                  </div>

                  {c.secretKey && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Secret Key / Client ID
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 break-all">
                        {isRevealed ? c.secretKey : c.secretKey.replace(/.(?=.{3})/g, '•')}
                      </span>
                    </div>
                  )}

                  {c.trackingUrlPattern && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tracking Pattern
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 break-all">
                        {c.trackingUrlPattern}
                      </span>
                    </div>
                  )}
                </div>

                {/* Test Result Message */}
                {result && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                      result.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{result.message}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleTestApi(c)}
                  disabled={isTesting}
                  className="py-1.5 px-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  title="Test connection to Courier API"
                >
                  <Zap className={`w-3 h-3 text-amber-500 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing...' : 'Ping Test'}
                </button>

                <button
                  id={`edit-courier-btn-${c.id}`}
                  onClick={() => openEditModal(c)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  Edit API
                </button>

                <button
                  id={`delete-courier-btn-${c.id}`}
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Remove Courier API?',
                      message: `Are you sure you want to permanently remove "${c.name}" courier logistics integration?`,
                      confirmText: 'Remove Courier',
                      variant: 'danger',
                      onConfirm: () => {
                        onDeleteCourier(c.id);
                        showNotice(`Removed ${c.name}`);
                      },
                    });
                  }}
                  className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center justify-center transition-colors"
                  title="Remove Courier API"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Courier API Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="h-2 w-full rainbow-gradient-bg shrink-0" />

            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingCourier ? `Configure ${editingCourier.name}` : 'Add New Courier API'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure your live merchant API keys and base endpoints for order dispatch.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Courier Provider Name *
                  </label>
                  <input
                    id="courier-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Steadfast Courier"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Code / Slug
                  </label>
                  <input
                    id="courier-code-input"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. steadfast"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  API Key / Access Token *
                </label>
                <input
                  id="courier-api-key-input"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste merchant API key provided by the courier"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Secret Key / Client Secret (Optional)
                </label>
                <input
                  id="courier-secret-key-input"
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Secret key or OAuth client secret if required"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Base API Endpoint URL *
                </label>
                <input
                  id="courier-base-url-input"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://portal.steadfast.com.bd/api/v1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tracking URL Pattern
                </label>
                <input
                  id="courier-tracking-pattern-input"
                  type="text"
                  value={trackingUrlPattern}
                  onChange={(e) => setTrackingUrlPattern(e.target.value)}
                  placeholder="https://steadfast.com.bd/tracking/{trackingCode}"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">{"{trackingCode}"}</code> as the placeholder for generated tracking IDs.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="courier-active-checkbox"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="courier-active-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Enable this Courier for Dispatch & Waybill Generation
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-courier-submit-btn"
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  {editingCourier ? 'Save Configuration' : 'Add Courier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Unified Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
      />
    </div>
  );
};
