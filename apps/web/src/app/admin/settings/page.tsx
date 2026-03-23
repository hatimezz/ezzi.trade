'use client';

import { useState } from 'react';
import { Settings, Save, AlertTriangle, CheckCircle } from 'lucide-react';

export const runtime = 'nodejs';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}

function Toggle({ label, description, checked, onChange, accent = '#ff6b35' }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white font-semibold">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? accent : 'rgba(255,255,255,0.10)' }}
        aria-label={`Toggle ${label}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
        />
      </button>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  description?: string;
}

function InputField({ label, value, onChange, type = 'text', description }: InputFieldProps) {
  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <label className="block text-sm text-white font-semibold mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-sm text-white outline-none focus:border-[#ff6b35]/40 transition-colors font-mono"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [presaleEnabled, setPresaleEnabled]           = useState(true);
  const [marketplaceEnabled, setMarketplaceEnabled]   = useState(true);
  const [miningEnabled, setMiningEnabled]             = useState(true);
  const [capsuleOpenEnabled, setCapsuleOpenEnabled]   = useState(true);
  const [maintenanceMode, setMaintenanceMode]         = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [devMode, setDevMode]                         = useState(false);

  const [platformName, setPlatformName]   = useState('EZZI World');
  const [supportEmail, setSupportEmail]   = useState('support@ezzi.world');
  const [rpcEndpoint, setRpcEndpoint]     = useState('https://api.mainnet-beta.solana.com');
  const [minWithdraw, setMinWithdraw]     = useState('100');
  const [platformFee, setPlatformFee]     = useState('3');
  const [capsuleCooldown, setCapsuleCooldown] = useState('24');
  const [maxMinersPerUser, setMaxMinersPerUser] = useState('10');

  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#00ff9f]/10 border border-[#00ff9f]/20 text-[#00ff9f] text-sm">
          <CheckCircle className="w-4 h-4" /> Settings saved successfully.
        </div>
      )}

      {/* Platform Features */}
      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#ff6b35]" /> Platform Features
        </h3>
        <Toggle label="Presale"            description="Enable presale rounds"            checked={presaleEnabled}           onChange={setPresaleEnabled} />
        <Toggle label="Marketplace"        description="Enable NFT marketplace trading"   checked={marketplaceEnabled}       onChange={setMarketplaceEnabled} />
        <Toggle label="Mining"             description="Enable EZZI coin mining"          checked={miningEnabled}            onChange={setMiningEnabled} />
        <Toggle label="Capsule Opening"    description="Allow users to open capsules"     checked={capsuleOpenEnabled}       onChange={setCapsuleOpenEnabled} />
        <Toggle label="New Registrations"  description="Allow new user sign-ups"         checked={registrationEnabled}      onChange={setRegistrationEnabled} />
      </div>

      {/* Platform Config */}
      <div className="admin-card">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-gray-300 mb-4">
          Platform Configuration
        </h3>
        <InputField label="Platform Name"     value={platformName}     onChange={setPlatformName} />
        <InputField label="Support Email"     value={supportEmail}     onChange={setSupportEmail}  type="email" />
        <InputField label="Solana RPC"        value={rpcEndpoint}      onChange={setRpcEndpoint}   description="Primary RPC endpoint for on-chain operations" />
        <InputField label="Platform Fee (%)"  value={platformFee}      onChange={setPlatformFee}   type="number" description="Marketplace transaction fee (3 = 3%)" />
        <InputField label="Min Withdrawal (EZZI)" value={minWithdraw}  onChange={setMinWithdraw}   type="number" />
        <InputField label="Capsule Cooldown (hrs)" value={capsuleCooldown} onChange={setCapsuleCooldown} type="number" />
        <InputField label="Max Miners / User" value={maxMinersPerUser} onChange={setMaxMinersPerUser} type="number" />
      </div>

      {/* Danger Zone */}
      <div className="admin-card border border-red-500/20">
        <h3 className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h3>
        <Toggle
          label="Maintenance Mode"
          description="Show maintenance page to all users"
          checked={maintenanceMode}
          onChange={setMaintenanceMode}
          accent="#ff3366"
        />
        <Toggle
          label="Developer Mode"
          description="Enable verbose logging and debug endpoints"
          checked={devMode}
          onChange={setDevMode}
          accent="#ff3366"
        />
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-3">
          <button type="button" className="btn btn-danger text-xs py-2 px-4 min-h-0 h-9 gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Flush Redis Cache
          </button>
          <button type="button" className="btn btn-danger text-xs py-2 px-4 min-h-0 h-9 gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Reset Rate Limits
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn text-sm py-2.5 px-6 gap-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8c00] text-white">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </form>
  );
}
