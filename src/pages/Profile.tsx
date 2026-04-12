import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { connectWallet, getConnectedAccount, FEE_ETH, SEPOLIA_CHAIN_ID } from '../utils/wallet';
import { User, Shield, FileText, CheckCircle, Edit2, Save, X, Wallet, Link2, Unlink, AlertCircle, Camera } from 'lucide-react';
import { motion } from 'motion/react';

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Profile() {
  const { profile, user, setProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    companyName: profile?.companyName || '',
    phoneNumber: profile?.phoneNumber || '',
    address: profile?.address || '',
  });

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Wallet state
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [liveAccount, setLiveAccount] = useState<string | null>(null);

  useEffect(() => {
    getConnectedAccount().then(setLiveAccount);
    // Use the same provider detection as wallet.ts (handles multi-extension setups)
    const provider = (Array.isArray(window.ethereum?.providers)
      ? window.ethereum.providers.find((p: any) => p.isMetaMask)
      : window.ethereum) ?? null;
    if (!provider) return;
    const handler = (accounts: string[]) => setLiveAccount(accounts[0]?.toLowerCase() || null);
    provider.on('accountsChanged', handler);
    return () => provider.removeListener('accountsChanged', handler);
  }, []);

  if (!profile || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.auth.updateProfile(formData);
      setProfile({ ...profile, ...updated });
      setEditing(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const urls = await api.upload([file]);
      const updated = await api.auth.updateProfile({ avatar: urls[0] });
      setProfile({ ...profile, ...updated });
    } catch (err) { console.error(err); }
    finally { setAvatarUploading(false); }
  };

  const toggle2FA = async () => {
    const updated = await api.auth.updateProfile({ twoFactorEnabled: !profile.twoFactorEnabled }).catch(console.error);
    if (updated) setProfile({ ...profile, ...updated });
  };

  const simulateDocUpload = async () => {
    const updated = await api.auth.updateProfile({ documentsVerified: true }).catch(console.error);
    if (updated) { setProfile({ ...profile, ...updated }); alert('Documents verified successfully.'); }
  };

  const handleConnectWallet = async () => {
    setWalletConnecting(true);
    setWalletError(null);
    try {
      const addr = await connectWallet();
      setLiveAccount(addr);
      // Save to profile so it persists across sessions
      const updated = await api.auth.updateProfile({ walletAddress: addr });
      setProfile({ ...profile, ...updated });
    } catch (err: any) {
      setWalletError(err.message || 'Failed to connect wallet.');
    } finally {
      setWalletConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      setLiveAccount(null);
      const updated = await api.auth.updateProfile({ walletAddress: '' });
      setProfile({ ...profile, ...updated });
    } catch (err) { console.error(err); }
  };

  const roleColors: Record<string, string> = {
    producer: 'from-indigo-500 to-blue-500',
    distributor: 'from-violet-500 to-purple-500',
    regulator: 'from-emerald-500 to-teal-500',
    consumer: 'from-amber-500 to-orange-500',
  };

  const fields = [
    { label: 'Full Name', key: 'name', editable: true, value: formData.name, onChange: (v: string) => setFormData({ ...formData, name: v }) },
    { label: 'Phone Number', key: 'phoneNumber', editable: true, value: formData.phoneNumber, onChange: (v: string) => setFormData({ ...formData, phoneNumber: v }), placeholder: 'Not provided' },
    ...(profile.role === 'producer' || profile.role === 'distributor'
      ? [{ label: 'Company Name', key: 'companyName', editable: true, value: formData.companyName, onChange: (v: string) => setFormData({ ...formData, companyName: v }), placeholder: '' }]
      : []),
    ...(profile.companyPrefix ? [{ label: 'Company Prefix', key: 'companyPrefix', editable: false, value: profile.companyPrefix, onChange: () => { } }] : []),
    {
      label: 'Address / Location',
      key: 'address',
      editable: true,
      value: formData.address,
      onChange: (v: string) => setFormData({ ...formData, address: v }),
      placeholder: 'e.g. 123 Main St, London, UK',
    },
  ];

  // Show as connected based on live MetaMask state, fall back to saved DB address
  const connectedAddr = liveAccount || profile.walletAddress || '';
  const isWalletConnected = !!connectedAddr;
  // Warn if saved DB address differs from what MetaMask currently shows
  const accountMismatch = !!(profile.walletAddress && liveAccount && liveAccount !== profile.walletAddress);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-5">
      {/* Profile header card */}
      <div className="bg-white/[0.03] border border-white/6 rounded-2xl overflow-hidden">
        <div className={`h-24 bg-gradient-to-r ${roleColors[profile.role] || 'from-indigo-500 to-violet-500'} opacity-20`} />
        <div className="px-6 pb-6 -mt-10">
          {/* Avatar with upload overlay */}
          <div className="relative w-16 h-16 mb-3 group">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/10" />
            ) : (
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleColors[profile.role] || 'from-indigo-500 to-violet-500'} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>
                {profile.name?.[0]?.toUpperCase()}
              </div>
            )}
            {/* Camera overlay */}
            <label className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {avatarUploading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="h-5 w-5 text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white">{profile.name}</h1>
              <p className="text-slate-400 text-sm">{profile.email}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold capitalize">{profile.role}</span>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"><X className="h-3.5 w-3.5" /> Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white text-xs font-medium transition-colors"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address notice — only shown when address hasn't been set */}
      {!profile.address && !editing && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-300 text-xs font-semibold">Address not set</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Set your <strong>Address / Location</strong> below — it appears on every audit trail event and enables the live map view.</p>
          </div>
          <button onClick={() => setEditing(true)} className="shrink-0 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-all">
            Set now
          </button>
        </div>
      )}

      {/* Info fields */}
      <div className="bg-white/[0.03] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Profile Information</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-slate-500 text-sm w-32">Email</span>
            <span className="text-slate-300 text-sm">{profile.email}</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-slate-500 text-sm w-32">Role</span>
            <span className="text-slate-300 text-sm capitalize">{profile.role}</span>
          </div>
          {fields.map(f => (
            <div key={f.key} className="px-6 py-4 flex items-center justify-between gap-4">
              <span className="text-slate-500 text-sm w-32 shrink-0">{f.label}</span>
              {editing && f.editable ? (
                <input
                  type="text"
                  value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  placeholder={(f as any).placeholder}
                  className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                />
              ) : (
                <span className="text-slate-300 text-sm">{f.value || (f as any).placeholder || '—'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Crypto Wallet section */}
      <div className="bg-white/[0.03] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Crypto Wallet</h2>
          <span className="ml-auto text-slate-600 text-xs">Sepolia Testnet · {FEE_ETH} ETH per action</span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Status row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isWalletConnected ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    <span className="text-white text-sm font-semibold">Wallet Connected</span>
                  </div>
                  <p className="font-mono text-indigo-300 text-xs break-all">{connectedAddr}</p>
                  {accountMismatch && (
                    <p className="flex items-center gap-1.5 text-amber-400 text-xs mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      MetaMask is on a different account ({shortAddress(liveAccount!)}) — reconnect to update.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-white text-sm font-medium">No Wallet Connected</p>
                  <p className="text-slate-500 text-xs mt-0.5">Connect MetaMask to perform on-chain actions and pay platform fees.</p>
                </div>
              )}
            </div>

            {isWalletConnected ? (
              <button
                onClick={handleDisconnectWallet}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl transition-all"
              >
                <Unlink className="h-3.5 w-3.5" /> Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={walletConnecting}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                <Link2 className="h-3.5 w-3.5" />
                {walletConnecting ? 'Connecting…' : 'Connect MetaMask'}
              </button>
            )}
          </div>

          {walletError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs">{walletError}</p>
            </div>
          )}

          {/* Fee info */}
          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-1.5 text-xs text-slate-500">
            <p className="flex justify-between"><span>Network</span><span className="text-slate-400">Sepolia Testnet</span></p>
            <p className="flex justify-between"><span>Action fee</span><span className="text-slate-400">{FEE_ETH} SepoliaETH per transaction</span></p>
            <p className="flex justify-between"><span>Required for</span><span className="text-slate-400">Register · Handoff · Approve / Reject</span></p>
          </div>
        </div>
      </div>

      {/* Security section */}
      <div className="bg-white/[0.03] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Security & Verification</h2>
        </div>

        <div className="divide-y divide-white/[0.04]">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-slate-500 text-xs mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={toggle2FA}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${profile.twoFactorEnabled ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${profile.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Document Verification</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {profile.documentsVerified ? 'Identity & company documents verified' : 'Upload documents to verify your identity'}
              </p>
            </div>
            {profile.documentsVerified ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <button onClick={simulateDocUpload} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-semibold rounded-xl transition-all">
                <FileText className="h-3.5 w-3.5" /> Upload Docs
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
