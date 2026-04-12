import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { payPlatformFee, FEE_ETH } from '../utils/wallet';
import { Package, Plus, AlertTriangle, Upload, X, ImageIcon, Video, ChevronRight, CheckCircle, Wallet, ExternalLink, Zap, Clock3, BarChart2, Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import CryptoJS from 'crypto-js';

// ─── Fee payment helper ────────────────────────────────────────────────────────
// payPlatformFee fetches the active MetaMask account internally, so no pre-check needed.
async function requestFeePayment(_walletAddress?: string): Promise<string> {
  return payPlatformFee();
}

// ─── Fee notice banner ────────────────────────────────────────────────────────
function FeeBanner({ txHash }: { txHash: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-emerald-300 text-xs font-semibold">Fee paid — {FEE_ETH} SepoliaETH</p>
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 text-[10px] font-mono truncate mt-0.5 transition-colors"
        >
          {txHash.slice(0, 20)}… <ExternalLink className="h-2.5 w-2.5 shrink-0" />
        </a>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  if (!profile) return null;

  switch (profile.role) {
    case 'producer': return <ProducerDashboard />;
    case 'distributor': return <DistributorDashboard />;
    case 'regulator': return <RegulatorDashboard />;
    case 'consumer': return <ConsumerDashboard />;
    default: return <div>Unknown role</div>;
  }
}

// ─── Media Upload Zone ────────────────────────────────────────────────────────
function MediaUploadZone({ images, video, onImages, onVideo }: {
  images: File[]; video: File | null;
  onImages: (f: File[]) => void; onVideo: (f: File | null) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imgs = files.filter(f => f.type.startsWith('image/'));
    const vids = files.filter(f => f.type.startsWith('video/'));
    if (imgs.length) onImages([...images, ...imgs].slice(0, 6));
    if (vids.length && !video) onVideo(vids[0]);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => imgRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
      >
        <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []); onImages([...images, ...f].slice(0, 6)); }} />
        <ImageIcon className="h-8 w-8 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">Drag & drop product images or <span className="text-indigo-400">browse</span></p>
        <p className="text-slate-600 text-xs mt-1">PNG, JPG, WebP up to 10MB each · max 6 images</p>
      </div>

      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={URL.createObjectURL(img)} className="w-20 h-20 object-cover rounded-xl border border-white/10" alt="" />
              <button onClick={() => onImages(images.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => vidRef.current?.click()}
        className="relative border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all duration-200"
      >
        <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onVideo(f); }} />
        <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <Video className="h-5 w-5 text-violet-400" />
        </div>
        {video ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium truncate max-w-[200px]">{video.name}</p>
              <p className="text-slate-500 text-xs">{(video.size / 1e6).toFixed(1)} MB</p>
            </div>
            <button onClick={e => { e.stopPropagation(); onVideo(null); }} className="text-slate-500 hover:text-red-400 transition-colors"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 text-sm font-medium">Attach a product video <span className="text-slate-600 font-normal">— optional</span></p>
            <p className="text-slate-600 text-xs">MP4, MOV, WebM up to 50MB</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    registered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'in-transit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    flagged: 'bg-red-500/10 text-red-400 border-red-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    delivered: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{status}</span>;
}

// ─── Wallet guard banner ───────────────────────────────────────────────────────
function WalletGuard({ walletAddress }: { walletAddress?: string }) {
  const navigate = useNavigate();
  const [liveConnected, setLiveConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check live MetaMask state, not just DB-saved address
    if (walletAddress) { setLiveConnected(true); return; }
    import('../utils/wallet').then(({ getConnectedAccount }) => {
      getConnectedAccount().then(acc => setLiveConnected(!!acc));
    });
  }, [walletAddress]);

  // Still loading or already connected
  if (liveConnected === null || liveConnected) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
      <Wallet className="h-5 w-5 text-amber-400 shrink-0" />
      <div className="flex-1">
        <p className="text-amber-300 text-sm font-semibold">Wallet required</p>
        <p className="text-amber-500/80 text-xs mt-0.5">Connect your MetaMask wallet in your Profile to perform on-chain actions (fee: {FEE_ETH} SepoliaETH per action).</p>
      </div>
      <button onClick={() => navigate('/profile')} className="shrink-0 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-all">
        Go to Profile
      </button>
    </div>
  );
}

// ─── Producer ─────────────────────────────────────────────────────────────────
function ProducerDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payStep, setPayStep] = useState<'idle' | 'paying' | 'paid'>('idle');
  const [feeTxHash, setFeeTxHash] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', category: '', packagingType: 'item',
    weight: '', size: '', batchNumber: '', barcode: '', origin: '',
    manufacturingDate: '', expiryDate: '', storageConditions: '', allergens: '', certifications: '',
  });

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    const data = await api.products.list({ producerId: user.uid });
    setProducts(data);
  }, [user]);

  const fetchReviewCounts = useCallback(async () => {
    const counts = await api.notifications.reviewCounts().catch(() => ({}));
    setReviewCounts(counts as Record<string, number>);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchReviewCounts();
    const iv = setInterval(() => { fetchProducts(); fetchReviewCounts(); }, 10000);
    return () => clearInterval(iv);
  }, [fetchProducts, fetchReviewCounts]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    setSubmitting(true);
    try {
      // Step 1: Pay fee
      setPayStep('paying');
      let txHash = '';
      try {
        txHash = await requestFeePayment(profile.walletAddress);
        setFeeTxHash(txHash);
        setPayStep('paid');
      } catch (feeErr: any) {
        alert(`Payment failed: ${feeErr.message}`);
        setPayStep('idle');
        return;
      }

      // Step 2: Register product
      const uniqueId = `${profile.companyPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      let imageUrls: string[] = [];
      let videoUrl = '';
      if (uploadedImages.length || uploadedVideo) {
        const files = [...uploadedImages, ...(uploadedVideo ? [uploadedVideo] : [])];
        const urls = await api.upload(files);
        imageUrls = urls.filter(u => !u.match(/\.(mp4|mov|webm)$/i));
        videoUrl = urls.find(u => u.match(/\.(mp4|mov|webm)$/i)) || '';
      }
      await api.products.create({ id: uniqueId, producerId: user.uid, producerName: profile.companyName || profile.name, ...newProduct, images: imageUrls, video: videoUrl, reviewScore: 0, reviewCount: 0 });
      const eventData = {
        id: `evt-${Date.now()}`,
        productId: uniqueId,
        type: 'CREATED',
        actorId: user.uid,
        actorName: profile.companyName || profile.name,
        actorRole: profile.role,
        data: {
          location: profile.address || 'Producer Facility',
          notes: 'Product registered',
          packagingType: newProduct.packagingType,
          weight: newProduct.weight,
          size: newProduct.size,
          feeTx: txHash,
        },
        previousHash: '0',
      };
      await api.events.create({ ...eventData, hash: CryptoJS.SHA256(JSON.stringify(eventData)).toString() });
      setShowAdd(false);
      setNewProduct({ name: '', description: '', category: '', packagingType: 'item', weight: '', size: '', batchNumber: '', barcode: '', origin: '', manufacturingDate: '', expiryDate: '', storageConditions: '', allergens: '', certifications: '' });
      setUploadedImages([]); setUploadedVideo(null);
      setPayStep('idle'); setFeeTxHash('');
      fetchProducts();
    } catch (err: any) { alert(err.message || 'Failed to register product.'); setPayStep('idle'); }
    finally { setSubmitting(false); }
  };

  const highRisk = products.filter(p => p.riskScore > 50).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Producer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your registered products</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-sm">
          <Plus className="h-4 w-4" /> Register Product
        </button>
      </div>

      <WalletGuard walletAddress={profile?.walletAddress} />

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Products', val: products.length, color: 'text-white' }, { label: 'High Risk', val: highRisk, color: 'text-red-400' }, { label: 'Compliant', val: products.length - highRisk, color: 'text-emerald-400' }].map(s => (
          <div key={s.label} className="bg-white/[0.03] border border-white/6 rounded-2xl p-5">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Product registration modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-xl">Register New Product</h2>
                  <p className="text-slate-500 text-sm">Requires a {FEE_ETH} SepoliaETH platform fee · paid via MetaMask</p>
                </div>
                <button onClick={() => { setShowAdd(false); setPayStep('idle'); setFeeTxHash(''); }} className="text-slate-500 hover:text-white transition-colors p-1"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleRegister} className="p-6 space-y-5">
                {['meat', 'dairy', 'seafood', 'poultry'].some(c => newProduct.category.toLowerCase().includes(c)) && (
                  <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-sm"><strong>Cold-chain alert:</strong> This category has a high risk of temperature compliance issues. Ensure strict monitoring.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Product Name</label>
                  <input type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g. Organic Salmon Fillet" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                    <input type="text" required value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="e.g. Seafood" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Packaging Type</label>
                    <select value={newProduct.packagingType} onChange={e => setNewProduct({ ...newProduct, packagingType: e.target.value })} className="w-full px-4 py-3 bg-[#0a0a14] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all text-sm">
                      <option value="item">Singular Item</option>
                      <option value="box">Box / Group</option>
                      <option value="pallet">Pallet</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Weight</label>
                    <input type="text" value={newProduct.weight} onChange={e => setNewProduct({ ...newProduct, weight: e.target.value })} placeholder="e.g. 2.5kg" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Size / Dimensions</label>
                    <input type="text" value={newProduct.size} onChange={e => setNewProduct({ ...newProduct, size: e.target.value })} placeholder="e.g. 20×15×5 cm" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Batch / Lot Number</label>
                    <input type="text" value={newProduct.batchNumber} onChange={e => setNewProduct({ ...newProduct, batchNumber: e.target.value })} placeholder="e.g. BATCH-2024-001" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Barcode / SKU</label>
                    <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} placeholder="e.g. 5901234123457" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Country of Origin</label>
                  <input type="text" value={newProduct.origin} onChange={e => setNewProduct({ ...newProduct, origin: e.target.value })} placeholder="e.g. Norway" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Manufacturing Date</label>
                    <input type="date" value={newProduct.manufacturingDate} onChange={e => setNewProduct({ ...newProduct, manufacturingDate: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all text-sm [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Expiry / Best Before</label>
                    <input type="date" value={newProduct.expiryDate} onChange={e => setNewProduct({ ...newProduct, expiryDate: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all text-sm [color-scheme:dark]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Storage Conditions</label>
                  <input type="text" value={newProduct.storageConditions} onChange={e => setNewProduct({ ...newProduct, storageConditions: e.target.value })} placeholder="e.g. Store at 0–4°C, keep dry" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Allergens</label>
                    <input type="text" value={newProduct.allergens} onChange={e => setNewProduct({ ...newProduct, allergens: e.target.value })} placeholder="e.g. Fish, Gluten" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Certifications</label>
                    <input type="text" value={newProduct.certifications} onChange={e => setNewProduct({ ...newProduct, certifications: e.target.value })} placeholder="e.g. Organic, ISO 22000" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Describe the product, its origin, and key attributes…" rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2"><Upload className="h-4 w-4" /> Product Media</label>
                  <MediaUploadZone images={uploadedImages} video={uploadedVideo} onImages={setUploadedImages} onVideo={setUploadedVideo} />
                </div>

                {/* Fee status */}
                {payStep === 'paying' && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-indigo-300 text-xs">Waiting for MetaMask confirmation…</p>
                  </div>
                )}
                {payStep === 'paid' && feeTxHash && <FeeBanner txHash={feeTxHash} />}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAdd(false); setPayStep('idle'); setFeeTxHash(''); }} className="px-5 py-2.5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting || payStep === 'paying'} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm">
                    {submitting
                      ? <span className="animate-pulse">{payStep === 'paying' ? 'Awaiting payment…' : payStep === 'paid' ? 'Registering…' : 'Processing…'}</span>
                      : <><Wallet className="h-4 w-4" /> Pay {FEE_ETH} ETH &amp; Register</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6">
          <h3 className="text-white font-semibold">Your Products</h3>
        </div>
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No products yet. Register your first product above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {products.map((p, i) => {
              const unreadReviews = reviewCounts[p.id] || 0;
              return (
                <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors group" onClick={() => navigate(`/product/${p.id}`)}>
                    <div className="flex items-center gap-4">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt={p.name} />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                          <Package className="h-5 w-5 text-indigo-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">{p.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">ID: {p.id} · {p.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-600 mb-1">Risk Score</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${p.riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${p.riskScore}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${p.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{p.riskScore}</span>
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                      {/* Chat / review indicator */}
                      <div className="relative">
                        <MessageCircle className={`h-4 w-4 transition-colors ${unreadReviews > 0 ? 'text-amber-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                        {unreadReviews > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center leading-none">
                            {unreadReviews > 9 ? '9+' : unreadReviews}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Distributor ──────────────────────────────────────────────────────────────
function DistributorDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [searchId, setSearchId] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [feeTxMap, setFeeTxMap] = useState<Record<string, string>>({});

  // Condition log modal state
  const [conditionModal, setConditionModal] = useState<{ productId: string; riskScore: number } | null>(null);
  const [conditionForm, setConditionForm] = useState({
    temperature: '', humidity: '', conditionGrade: 'good', visibleDamage: 'no', notes: '',
  });

  const fetchProducts = useCallback(async () => {
    const data = await api.products.list({ status: 'registered,in-transit' });
    setProducts(data);
  }, []);

  useEffect(() => { fetchProducts(); const iv = setInterval(fetchProducts, 10000); return () => clearInterval(iv); }, [fetchProducts]);

  const handleHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionModal || !profile || !user || processing) return;
    const { productId, riskScore: currentScore } = conditionModal;
    setProcessing(productId);
    try {
      let txHash = '';
      try {
        txHash = await requestFeePayment(profile.walletAddress);
        setFeeTxMap(m => ({ ...m, [productId]: txHash }));
      } catch (feeErr: any) {
        alert(`Payment failed: ${feeErr.message}`);
        return;
      }

      const temp = parseFloat(conditionForm.temperature) || 0;
      const humidity = parseFloat(conditionForm.humidity) || 0;
      let riskIncrease = 0;
      if (temp > 25 || temp < 2) riskIncrease += 20;
      if (humidity > 80) riskIncrease += 10;
      if (conditionForm.conditionGrade === 'fair') riskIncrease += 10;
      if (conditionForm.conditionGrade === 'poor') riskIncrease += 25;
      if (conditionForm.visibleDamage === 'yes') riskIncrease += 15;
      const newScore = Math.min(100, currentScore + riskIncrease);
      const newStatus = newScore > 50 ? 'flagged' : 'in-transit';

      await api.products.update(productId, { status: newStatus, riskScore: newScore });
      const { hash: previousHash } = await api.events.latestHash(productId);
      const eventData = {
        id: `evt-${Date.now()}`,
        productId,
        type: 'HANDOFF',
        actorId: user.uid,
        actorName: profile.companyName || profile.name,
        actorRole: profile.role,
        data: {
          temperature: temp,
          humidity,
          conditionGrade: conditionForm.conditionGrade,
          visibleDamage: conditionForm.visibleDamage,
          notes: conditionForm.notes || undefined,
          location: profile.address || 'Distributor Hub',
          feeTx: txHash,
        },
        previousHash,
      };
      await api.events.create({ ...eventData, hash: CryptoJS.SHA256(JSON.stringify(eventData)).toString() });
      if (newStatus === 'flagged') {
        const product = products.find(p => p.id === productId);
        if (product) await api.notifications.create({ userId: product.producerId, title: 'Risk Alert', message: `Product ${productId} flagged during distribution (Risk: ${newScore}).`, type: 'RISK_ALERT' });
      }
      setConditionModal(null);
      setConditionForm({ temperature: '', humidity: '', conditionGrade: 'good', visibleDamage: 'no', notes: '' });
      fetchProducts();
    } catch (err: any) { console.error(err); }
    finally { setProcessing(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Distributor Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Log product condition on receipt and monitor active shipments</p>
      </div>

      <WalletGuard walletAddress={profile?.walletAddress} />

      <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 text-sm">Look Up a Product</h3>
        <div className="flex gap-3">
          <input type="text" placeholder="Enter Product ID (e.g., CCA-12345)" value={searchId} onChange={e => setSearchId(e.target.value)} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
          <button onClick={() => navigate(`/product/${searchId}`)} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm">Search</button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6">
          <h3 className="text-white font-semibold">Active Shipments</h3>
        </div>
        {products.length === 0 ? (
          <div className="py-14 text-center"><p className="text-slate-500 text-sm">No active shipments.</p></div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {products.map((p, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="px-6 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="cursor-pointer flex-1 min-w-0" onClick={() => navigate(`/product/${p.id}`)}>
                    <p className="text-white font-semibold text-sm hover:text-indigo-300 transition-colors truncate">{p.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{p.id} · Risk: <span className={p.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}>{p.riskScore}</span></p>
                  </div>
                  <StatusBadge status={p.status} />
                  <button
                    onClick={() => { setConditionModal({ productId: p.id, riskScore: p.riskScore }); setConditionForm({ temperature: '', humidity: '', conditionGrade: 'good', visibleDamage: 'no', notes: '' }); }}
                    disabled={processing === p.id}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {processing === p.id ? (
                      <><div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> Logging…</>
                    ) : (
                      <><Plus className="h-3 w-3" /> Log Condition</>
                    )}
                  </button>
                </div>
                {feeTxMap[p.id] && <FeeBanner txHash={feeTxMap[p.id]} />}
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Condition Log Modal ── */}
      <AnimatePresence>
        {conditionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-lg">Log Product Condition</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Record the condition of <span className="text-indigo-300 font-mono">{conditionModal.productId}</span> as received</p>
                </div>
                <button onClick={() => setConditionModal(null)} className="text-slate-500 hover:text-white transition-colors p-1"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleHandoff} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Temperature (°C)</label>
                    <input type="number" step="0.1" required value={conditionForm.temperature} onChange={e => setConditionForm(f => ({ ...f, temperature: e.target.value }))} placeholder="e.g. 4.0" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Humidity (%)</label>
                    <input type="number" step="1" min="0" max="100" required value={conditionForm.humidity} onChange={e => setConditionForm(f => ({ ...f, humidity: e.target.value }))} placeholder="e.g. 65" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Condition Grade</label>
                    <select value={conditionForm.conditionGrade} onChange={e => setConditionForm(f => ({ ...f, conditionGrade: e.target.value }))} className="w-full px-4 py-3 bg-[#0a0a14] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all text-sm">
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Visible Damage?</label>
                    <select value={conditionForm.visibleDamage} onChange={e => setConditionForm(f => ({ ...f, visibleDamage: e.target.value }))} className="w-full px-4 py-3 bg-[#0a0a14] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all text-sm">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Observations / Notes</label>
                  <textarea rows={3} value={conditionForm.notes} onChange={e => setConditionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe product condition, packaging integrity, any concerns…" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm resize-none" />
                </div>

                {(conditionForm.conditionGrade === 'poor' || conditionForm.visibleDamage === 'yes') && (
                  <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-xs">Poor condition or visible damage will increase the product's risk score and may trigger a regulatory flag.</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setConditionModal(null)} className="px-5 py-2.5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={!!processing} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm">
                    {processing ? <span className="animate-pulse">Submitting…</span> : <><Wallet className="h-4 w-4" /> Pay &amp; Log Condition</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Regulator ────────────────────────────────────────────────────────────────
function RegulatorDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [flagged, setFlagged] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [feeTxMap, setFeeTxMap] = useState<Record<string, string>>({});

  // Recall simulation state
  const [recallForm, setRecallForm] = useState({ category: '', producerId: '', productId: '', dateFrom: '', dateTo: '' });
  const [recallRunning, setRecallRunning] = useState(false);
  const [recallResult, setRecallResult] = useState<any>(null);
  const [recallError, setRecallError] = useState('');
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    const data = await api.products.list({ status: 'flagged' });
    setFlagged(data);
  }, []);

  useEffect(() => { fetchProducts(); const iv = setInterval(fetchProducts, 10000); return () => clearInterval(iv); }, [fetchProducts]);

  const handleDecision = async (productId: string, decision: 'approved' | 'rejected') => {
    if (!profile || !user || processing) return;
    setProcessing(productId);
    try {
      let txHash = '';
      try {
        txHash = await requestFeePayment(profile.walletAddress);
        setFeeTxMap(m => ({ ...m, [productId]: txHash }));
      } catch (feeErr: any) {
        alert(`Payment failed: ${feeErr.message}`);
        return;
      }
      await api.products.update(productId, { status: decision, riskScore: decision === 'approved' ? 0 : 100 });
      const { hash: previousHash } = await api.events.latestHash(productId);
      const eventData = {
        id: `evt-${Date.now()}`,
        productId,
        type: 'INSPECTION',
        actorId: user.uid,
        actorName: profile.name,
        actorRole: profile.role,
        data: { decision, notes: `Regulatory inspection resulted in: ${decision}`, location: profile.address || 'Regulatory Office', feeTx: txHash },
        previousHash,
      };
      await api.events.create({ ...eventData, hash: CryptoJS.SHA256(JSON.stringify(eventData)).toString() });
      const product = flagged.find(p => p.id === productId);
      if (product) await api.notifications.create({ userId: product.producerId, title: 'Compliance Update', message: `Product ${productId} has been ${decision} by regulatory oversight.`, type: 'COMPLIANCE' });
      fetchProducts();
    } catch (err: any) { console.error(err); }
    finally { setProcessing(null); }
  };

  const runRecallSim = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecallRunning(true);
    setRecallResult(null);
    setRecallError('');
    try {
      const result = await api.analytics.recallSimulation(recallForm);
      setRecallResult(result);
    } catch (err: any) {
      setRecallError(err.message || 'Simulation failed.');
    } finally {
      setRecallRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Regulatory Oversight</h1>
        <p className="text-slate-500 text-sm mt-1">Review flagged products and run recall simulations</p>
      </div>

      <WalletGuard walletAddress={profile?.walletAddress} />

      {/* Flagged products */}
      <div className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h3 className="text-white font-semibold">Flagged Products</h3>
          {flagged.length > 0 && <span className="ml-auto px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full">{flagged.length}</span>}
        </div>
        {flagged.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">All clear — no flagged products.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {flagged.map((p, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="px-6 py-5 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="cursor-pointer flex-1" onClick={() => navigate(`/product/${p.id}`)}>
                    <p className="text-white font-semibold hover:text-indigo-300 transition-colors">{p.name} <span className="text-slate-600 font-normal text-sm">({p.id})</span></p>
                    <p className="text-slate-500 text-xs mt-1">Producer: {p.producerName} · Risk Score: <span className="text-red-400 font-semibold">{p.riskScore}/100</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={!!processing} onClick={() => handleDecision(p.id, 'approved')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50">
                      {processing === p.id ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Wallet className="h-3 w-3" />}
                      Approve
                    </button>
                    <button disabled={!!processing} onClick={() => handleDecision(p.id, 'rejected')} className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50">
                      {processing === p.id ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Wallet className="h-3 w-3" />}
                      Reject
                    </button>
                  </div>
                </div>
                {feeTxMap[p.id] && <FeeBanner txHash={feeTxMap[p.id]} />}
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Recall Simulation ── */}
      <div className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          <h3 className="text-white font-semibold">Recall Simulation</h3>
          <span className="ml-auto text-slate-600 text-xs">Trace affected products across the full chain</span>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-slate-500 text-sm">Simulate a product recall by searching the chain for affected batches. Measures blockchain trace speed vs estimated traditional database approach.</p>

          <form onSubmit={runRecallSim} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Product ID (exact)</label>
              <input type="text" value={recallForm.productId} onChange={e => setRecallForm(f => ({ ...f, productId: e.target.value }))} placeholder="e.g. CCA-12345" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category (partial match)</label>
              <input type="text" value={recallForm.category} onChange={e => setRecallForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. seafood" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Registered from</label>
              <input type="date" value={recallForm.dateFrom} onChange={e => setRecallForm(f => ({ ...f, dateFrom: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Registered to</label>
              <input type="date" value={recallForm.dateTo} onChange={e => setRecallForm(f => ({ ...f, dateTo: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={recallRunning} className="flex items-center gap-2 px-6 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-semibold text-sm rounded-xl transition-all disabled:opacity-50">
                {recallRunning ? <><div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />Running simulation…</> : <><Search className="h-4 w-4" />Run Recall Simulation</>}
              </button>
            </div>
          </form>

          {recallError && <p className="text-red-400 text-sm">{recallError}</p>}

          {/* Results */}
          <AnimatePresence>
            {recallResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Performance comparison */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Affected Products', val: String(recallResult.affectedCount), color: 'text-amber-400' },
                    { label: 'Events Scanned', val: String(recallResult.totalEventsScanned), color: 'text-indigo-400' },
                    { label: 'Blockchain Time', val: `${recallResult.blockchainMs}ms`, color: 'text-emerald-400' },
                    { label: 'Traditional Est.', val: `${recallResult.estimatedTraditionalMs}ms`, color: 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                      <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Speedup badge */}
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-300 text-sm font-semibold">{recallResult.speedupLabel}</p>
                    <p className="text-emerald-600 text-xs mt-0.5">Simulation ID: {recallResult.simulationId} · {new Date(recallResult.ranAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Trace per product */}
                {recallResult.affectedCount === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No products matched the recall criteria.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Affected Product Traces</p>
                    {recallResult.traces.map((t: any) => (
                      <div key={t.productId} className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                        <button
                          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                          onClick={() => setExpandedTrace(expandedTrace === t.productId ? null : t.productId)}
                        >
                          <div className="text-left">
                            <p className="text-white font-semibold text-sm">{t.name} <span className="text-slate-600 font-normal">({t.productId})</span></p>
                            <p className="text-slate-500 text-xs mt-0.5">{t.producerName} · {t.category} · Last at: {t.currentLocation} · {t.eventsCount} events{t.anomalyCount > 0 ? ` · ⚠ ${t.anomalyCount} anomalies` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full border capitalize ${t.riskScore > 50 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>{t.riskScore} risk</span>
                            <ChevronRight className={`h-4 w-4 text-slate-600 transition-transform ${expandedTrace === t.productId ? 'rotate-90' : ''}`} />
                          </div>
                        </button>
                        <AnimatePresence>
                          {expandedTrace === t.productId && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-2 border-t border-white/[0.04]">
                                <p className="text-slate-600 text-[10px] uppercase tracking-wider pt-3 mb-2">Full Audit Chain</p>
                                {t.chainSummary.map((step: any, j: number) => (
                                  <div key={j} className="flex items-start gap-3 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${step.type === 'CREATED' ? 'bg-emerald-500' : step.type === 'HANDOFF' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                                    <div className="flex-1">
                                      <span className="text-white font-semibold">{step.type}</span>
                                      <span className="text-slate-500"> by {step.actor} ({step.role})</span>
                                      {step.location && <span className="text-slate-600"> · {step.location}</span>}
                                      {step.hasAnomalies && <span className="text-amber-400 ml-1">⚠</span>}
                                    </div>
                                    <span className="text-slate-700 shrink-0 font-mono">{step.hash}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Consumer ─────────────────────────────────────────────────────────────────
function ConsumerDashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
        <Package className="h-10 w-10 text-indigo-400" />
      </div>
      <div>
        <h1 className="text-3xl font-black text-white mb-3">Welcome to TrustChain</h1>
        <p className="text-slate-400 max-w-md">Verify the authenticity and full history of any product using our immutable blockchain-style ledger.</p>
      </div>
      <button onClick={() => navigate('/verify')} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-lg transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]">
        <Package className="h-5 w-5" /> Verify a Product Now
      </button>
    </div>
  );
}
