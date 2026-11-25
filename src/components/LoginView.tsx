import React, { useState } from 'react';
import { ArrowLeft, KeyRound, ShieldCheck, Truck } from 'lucide-react';
import { Rider, UserRole, UserSession } from '../types/zaiqa';

interface LoginViewProps {
  preferredRole: UserRole;
  riders: Rider[];
  onLogin: (session: UserSession) => void;
  onBackToStorefront: () => void;
}

const ADMIN_DEMO_PIN = '2026';

export const LoginView: React.FC<LoginViewProps> = ({
  preferredRole,
  riders,
  onLogin,
  onBackToStorefront,
}) => {
  const [roleTab, setRoleTab] = useState<UserRole>(preferredRole);
  const [adminName, setAdminName] = useState('Zaiqa Owner');
  const [adminPin, setAdminPin] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string>(riders[0]?.id ?? '');
  const [riderPin, setRiderPin] = useState('');
  const [error, setError] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      setError('Please enter an admin or staff name.');
      return;
    }
    if (adminPin.trim() !== ADMIN_DEMO_PIN) {
      setError(`Invalid Admin PIN. Use demo PIN ${ADMIN_DEMO_PIN} or quick demo login.`);
      return;
    }
    onLogin({ role: 'admin', name: adminName.trim() });
  };

  const handleRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rider = riders.find((r) => r.id === selectedRiderId);
    if (!rider) {
      setError('Please select a delivery rider.');
      return;
    }
    if (riderPin.trim() !== rider.pin) {
      setError(`Invalid Rider PIN for ${rider.name}. Demo PIN is ${rider.pin}.`);
      return;
    }
    onLogin({ role: 'rider', name: rider.name, riderId: rider.id });
  };

  return (
    <div className="min-h-[calc(100vh-69px)] bg-[#FAF9F6] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#141210] px-6 py-6 text-white">
          <button
            type="button"
            onClick={onBackToStorefront}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Storefront</span>
          </button>
          <h1 className="font-display text-2xl font-bold">ZAIQA Staff &amp; Rider Portal</h1>
          <p className="text-xs text-stone-300 mt-1">
            Role-based access for kitchen management and delivery dispatch.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setRoleTab('admin');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleTab === 'admin'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Admin / Owner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab('rider');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              roleTab === 'rider'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Delivery Rider</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
            >
              {error}
            </div>
          )}

          {roleTab === 'admin' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-name-input"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Staff / Owner Name
                </label>
                <input
                  id="admin-name-input"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-pin-input"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Admin Access PIN (Demo PIN: <span className="font-mono">2026</span>)
                </label>
                <input
                  id="admin-pin-input"
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#141210] text-amber-400 text-sm font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Sign in to Admin Dashboard
              </button>
            </form>
          ) : (
            <form onSubmit={handleRiderSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="rider-select"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Select Delivery Rider
                </label>
                <select
                  id="rider-select"
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · PIN {r.pin}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="rider-pin-input"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Rider PIN
                </label>
                <input
                  id="rider-pin-input"
                  type="password"
                  value={riderPin}
                  onChange={(e) => setRiderPin(e.target.value)}
                  placeholder="Enter rider 4-digit PIN"
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#141210] text-amber-400 text-sm font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Sign in to Rider Portal
              </button>
            </form>
          )}

          {/* Quick Demo Login Buttons */}
          <div className="pt-4 border-t border-stone-200 space-y-2.5">
            <p className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span>Instant Demo Access</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onLogin({ role: 'admin', name: 'Zaiqa Owner (Demo)' })}
                className="px-3.5 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-950 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Demo Admin Login
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstActive = riders.find((r) => r.active) ?? riders[0];
                  if (firstActive) {
                    onLogin({
                      role: 'rider',
                      name: firstActive.name,
                      riderId: firstActive.id,
                    });
                  }
                }}
                className="px-3.5 py-2.5 rounded-lg border border-stone-300 bg-stone-50 text-stone-900 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Demo Rider Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
