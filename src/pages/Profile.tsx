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
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="h-24 bg-ledger-50 border-b border-line" />
        <div className="px-6 pb-6 -mt-10">
          {/* Avatar with upload overlay */}
          <div className="relative w-16 h-16 mb-3 group">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-paper" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-ledger-700 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-paper">
                {profile.name?.[0]?.toUpperCase()}
              </div>
            )}
            {/* Camera overlay */}
            <label className="absolute inset-0 rounded-2xl flex items-center justify-center bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {avatarUploading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="h-5 w-5 text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="display-md text-[2rem] sm:text-[2.4rem] text-ink">{profile.name}</h1>
              <p className="text-muted text-sm">{profile.email}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-ledger-50 border border-ledger-200 text-ledger-600 text-xs font-semibold capitalize">{profile.role}</span>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 border border-line rounded-lg text-muted hover:text-ink text-xs font-medium transition-colors"><X className="h-3.5 w-3.5" /> Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-ledger-700 hover:bg-ledger-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-paper hover:bg-mist border border-line rounded-lg text-ink hover:text-ink text-xs font-medium transition-colors"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address notice — only shown when address hasn't been set */}
      {!profile.address && !editing && (
        <div className="flex items-start gap-3 px-4 py-3 bg-caution-bg border border-caution/25 rounded-2xl">
          <AlertCircle className="h-4 w-4 text-caution shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-caution text-xs font-semibold">Address not set</p>
            <p className="text-caution/80 text-xs mt-0.5">Set your <strong>Address / Location</strong> below — it appears on every audit trail event and enables the live map view.</p>
          </div>
          <button onClick={() => setEditing(true)} className="shrink-0 px-3 py-1.5 bg-caution-bg hover:bg-caution/15 border border-caution/25 text-caution text-xs font-semibold rounded-lg transition-all">
            Set now
          </button>
        </div>
      )}

      {/* Info fields */}
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center gap-2">
          <User className="h-4 w-4 text-ledger-600" />
          <h2 className="text-ink font-semibold text-sm">Profile Information</h2>
        </div>
        <div className="divide-y divide-line">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-muted text-sm w-32">Email</span>
            <span className="text-ink text-sm">{profile.email}</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-muted text-sm w-32">Role</span>
            <span className="text-ink text-sm capitalize">{profile.role}</span>
          </div>
          {fields.map(f => (
            <div key={f.key} className="px-6 py-4 flex items-center justify-between gap-4">
              <span className="text-muted text-sm w-32 shrink-0">{f.label}</span>
              {editing && f.editable ? (
                <input
                  type="text"
                  value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  placeholder={(f as any).placeholder}
                  className="flex-1 px-3 py-1.5 bg-paper border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-ledger-500 transition-colors placeholder-faint"
                />
              ) : (
                <span className="text-ink text-sm">{f.value || (f as any).placeholder || '—'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Crypto Wallet section */}
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center gap-2">
          <Wallet className="h-4 w-4 text-ledger-600" />
          <h2 className="text-ink font-semibold text-sm">Crypto Wallet</h2>
          <span className="ml-auto text-faint text-xs">Sepolia Testnet · {FEE_ETH} ETH per action</span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Status row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isWalletConnected ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-genuine" />
                    <span className="text-ink text-sm font-semibold">Wallet Connected</span>
                  </div>
                  <p className="font-mono text-ledger-700 text-xs break-all">{connectedAddr}</p>
                  {accountMismatch && (
                    <p className="flex items-center gap-1.5 text-caution text-xs mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      MetaMask is on a different account ({shortAddress(liveAccount!)}) — reconnect to update.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-ink text-sm font-medium">No Wallet Connected</p>
                  <p className="text-muted text-xs mt-0.5">Connect MetaMask to perform on-chain actions and pay platform fees.</p>
                </div>
              )}
            </div>

            {isWalletConnected ? (
              <button
                onClick={handleDisconnectWallet}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-recalled-bg hover:bg-recalled/15 border border-recalled/25 text-recalled hover:text-recalled text-xs font-semibold rounded-lg transition-all"
              >
                <Unlink className="h-3.5 w-3.5" /> Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={walletConnecting}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-ledger-50 hover:bg-ledger-100 border border-ledger-200 text-ledger-600 hover:text-ledger-800 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                <Link2 className="h-3.5 w-3.5" />
                {walletConnecting ? 'Connecting…' : 'Connect MetaMask'}
              </button>
            )}
          </div>

          {walletError && (
            <div className="flex items-start gap-2 p-3 bg-recalled-bg border border-recalled/25 rounded-lg">
              <AlertCircle className="h-4 w-4 text-recalled shrink-0 mt-0.5" />
              <p className="text-recalled text-xs">{walletError}</p>
            </div>
          )}

          {/* Fee info */}
          <div className="p-3 bg-paper border border-line rounded-lg space-y-1.5 text-xs text-muted">
            <p className="flex justify-between"><span>Network</span><span className="text-muted">Sepolia Testnet</span></p>
            <p className="flex justify-between"><span>Action fee</span><span className="text-muted">{FEE_ETH} SepoliaETH per transaction</span></p>
            <p className="flex justify-between"><span>Required for</span><span className="text-muted">Register · Handoff · Approve / Reject</span></p>
          </div>
        </div>
      </div>

      {/* Security section */}
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center gap-2">
          <Shield className="h-4 w-4 text-ledger-600" />
          <h2 className="text-ink font-semibold text-sm">Security & Verification</h2>
        </div>

        <div className="divide-y divide-line">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-ink text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-muted text-xs mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={toggle2FA}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${profile.twoFactorEnabled ? 'bg-ledger-700' : 'bg-mist'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${profile.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-ink text-sm font-medium">Document Verification</p>
              <p className="text-muted text-xs mt-0.5">
                {profile.documentsVerified ? 'Identity & company documents verified' : 'Upload documents to verify your identity'}
              </p>
            </div>
            {profile.documentsVerified ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-genuine-bg border border-genuine/25 text-genuine text-xs font-semibold rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <button onClick={simulateDocUpload} className="flex items-center gap-1.5 px-4 py-2 bg-ledger-50 hover:bg-ledger-100 border border-ledger-200 text-ledger-600 hover:text-ledger-800 text-xs font-semibold rounded-lg transition-all">
                <FileText className="h-3.5 w-3.5" /> Upload Docs
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
