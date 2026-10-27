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
    <div className="flex items-start gap-3 p-3 bg-genuine-bg border border-genuine/25 rounded-lg">
      <CheckCircle className="h-4 w-4 text-genuine shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-genuine text-xs font-semibold">Fee paid — {FEE_ETH} SepoliaETH</p>
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-genuine hover:text-genuine text-[10px] font-mono truncate mt-0.5 transition-colors"
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
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${dragging ? 'border-ledger-500 bg-ledger-50' : 'border-line hover:border-ledger-300 hover:bg-mist'}`}
      >
        <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []); onImages([...images, ...f].slice(0, 6)); }} />
        <ImageIcon className="h-8 w-8 text-muted mx-auto mb-3" />
        <p className="text-muted text-sm font-medium">Drag & drop product images or <span className="text-ledger-600">browse</span></p>
        <p className="text-faint text-xs mt-1">PNG, JPG, WebP up to 10MB each · max 6 images</p>
      </div>

      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={URL.createObjectURL(img)} className="w-20 h-20 object-cover rounded-lg border border-line" alt="" />
              <button onClick={() => onImages(images.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 w-5 h-5 bg-recalled rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => vidRef.current?.click()}
        className="relative border border-line rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-ledger-300 hover:bg-mist transition-all duration-200"
      >
        <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onVideo(f); }} />
        <div className="w-10 h-10 rounded-lg bg-ledger-50 border border-ledger-200 flex items-center justify-center shrink-0">
          <Video className="h-5 w-5 text-ledger-600" />
        </div>
        {video ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-ink text-sm font-medium truncate max-w-[200px]">{video.name}</p>
              <p className="text-muted text-xs">{(video.size / 1e6).toFixed(1)} MB</p>
            </div>
            <button onClick={e => { e.stopPropagation(); onVideo(null); }} className="text-muted hover:text-recalled transition-colors"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div>
            <p className="text-muted text-sm font-medium">Attach a product video <span className="text-faint font-normal">— optional</span></p>
            <p className="text-faint text-xs">MP4, MOV, WebM up to 50MB</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    registered: 'bg-genuine-bg text-genuine border-genuine/25',
    'in-transit': 'bg-sky-50 text-sky-800 border-sky-200',
    flagged: 'bg-recalled-bg text-recalled border-recalled/25',
    approved: 'bg-genuine-bg text-genuine border-genuine/25',
    rejected: 'bg-recalled-bg text-recalled border-recalled/25',
    delivered: 'bg-mist text-muted border-line',
  };
  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${map[status] || 'bg-mist text-muted border-line'}`}>{status}</span>;
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
    <div className="flex items-center gap-3 p-4 bg-caution-bg border border-caution/25 rounded-2xl">
      <Wallet className="h-5 w-5 text-caution shrink-0" />
      <div className="flex-1">
        <p className="text-caution text-sm font-semibold">Wallet required</p>
        <p className="text-caution/85 text-xs mt-0.5">Connect your MetaMask wallet in your Profile to perform on-chain actions (fee: {FEE_ETH} SepoliaETH per action).</p>
      </div>
      <button onClick={() => navigate('/profile')} className="shrink-0 px-3 py-1.5 bg-caution-bg hover:bg-caution/15 border border-caution/25 text-caution text-xs font-semibold rounded-lg transition-all">
        Go to profile
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
          <h1 className="display-md text-[2rem] sm:text-[2.4rem] text-ink">Your products</h1>
          <p className="text-muted text-sm mt-1">Register batches and see where each one is, and whether it’s still safe.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg transition-all text-sm bg-ledger-700 hover:bg-ledger-800">
          <Plus className="h-4 w-4" /> Register a product
        </button>
      </div>

      <WalletGuard walletAddress={profile?.walletAddress} />

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Products', val: products.length, color: 'text-ink' }, { label: 'High risk', val: highRisk, color: 'text-recalled' }, { label: 'Compliant', val: products.length - highRisk, color: 'text-genuine' }].map(s => (
          <div key={s.label} className="bg-paper border border-line rounded-2xl p-5">
            <p className="text-muted text-sm mb-1">{s.label}</p>
            <p className={`display tnum text-[2rem] ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Product registration modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-paper border border-line rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="text-ink font-bold text-xl">Register a product</h2>
                  <p className="text-muted text-sm">Requires a {FEE_ETH} SepoliaETH platform fee · paid via MetaMask</p>
                </div>
                <button onClick={() => { setShowAdd(false); setPayStep('idle'); setFeeTxHash(''); }} className="text-muted hover:text-ink transition-colors p-1"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleRegister} className="p-6 space-y-5">
                {['meat', 'dairy', 'seafood', 'poultry'].some(c => newProduct.category.toLowerCase().includes(c)) && (
                  <div className="flex gap-3 p-4 bg-caution-bg border border-caution/25 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-caution shrink-0 mt-0.5" />
                    <p className="text-caution text-sm"><strong>Cold-chain alert:</strong> This category has a high risk of temperature compliance issues. Ensure strict monitoring.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Product name</label>
                  <input type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g. Organic Salmon Fillet" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Category</label>
                    <input type="text" required value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="e.g. Seafood" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Packaging type</label>
                    <select value={newProduct.packagingType} onChange={e => setNewProduct({ ...newProduct, packagingType: e.target.value })} className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-ledger-500 transition-all text-sm">
                      <option value="item">Singular Item</option>
                      <option value="box">Box / Group</option>
                      <option value="pallet">Pallet</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Weight</label>
                    <input type="text" value={newProduct.weight} onChange={e => setNewProduct({ ...newProduct, weight: e.target.value })} placeholder="e.g. 2.5kg" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Size / Dimensions</label>
                    <input type="text" value={newProduct.size} onChange={e => setNewProduct({ ...newProduct, size: e.target.value })} placeholder="e.g. 20×15×5 cm" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Batch / lot number</label>
                    <input type="text" value={newProduct.batchNumber} onChange={e => setNewProduct({ ...newProduct, batchNumber: e.target.value })} placeholder="e.g. BATCH-2024-001" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Barcode / SKU</label>
                    <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} placeholder="e.g. 5901234123457" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Country of origin</label>
                  <input type="text" value={newProduct.origin} onChange={e => setNewProduct({ ...newProduct, origin: e.target.value })} placeholder="e.g. Norway" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Manufacturing date</label>
                    <input type="date" value={newProduct.manufacturingDate} onChange={e => setNewProduct({ ...newProduct, manufacturingDate: e.target.value })} className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Expiry / best before</label>
                    <input type="date" value={newProduct.expiryDate} onChange={e => setNewProduct({ ...newProduct, expiryDate: e.target.value })} className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Storage conditions</label>
                  <input type="text" value={newProduct.storageConditions} onChange={e => setNewProduct({ ...newProduct, storageConditions: e.target.value })} placeholder="e.g. Store at 0–4°C, keep dry" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Allergens</label>
                    <input type="text" value={newProduct.allergens} onChange={e => setNewProduct({ ...newProduct, allergens: e.target.value })} placeholder="e.g. Fish, Gluten" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Certifications</label>
                    <input type="text" value={newProduct.certifications} onChange={e => setNewProduct({ ...newProduct, certifications: e.target.value })} placeholder="e.g. Organic, ISO 22000" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Describe the product, its origin, and key attributes…" rows={3} className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-3 flex items-center gap-2"><Upload className="h-4 w-4" /> Product media</label>
                  <MediaUploadZone images={uploadedImages} video={uploadedVideo} onImages={setUploadedImages} onVideo={setUploadedVideo} />
                </div>

                {/* Fee status */}
                {payStep === 'paying' && (
                  <div className="flex items-center gap-3 p-3 bg-ledger-50 border border-ledger-200 rounded-lg">
                    <div className="w-4 h-4 border-2 border-ledger-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-ledger-700 text-xs">Waiting for MetaMask confirmation…</p>
                  </div>
                )}
                {payStep === 'paid' && feeTxHash && <FeeBanner txHash={feeTxHash} />}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAdd(false); setPayStep('idle'); setFeeTxHash(''); }} className="px-5 py-2.5 border border-line rounded-lg text-muted hover:text-ink text-sm font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting || payStep === 'paying'} className="flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 text-white font-semibold rounded-lg transition-all text-sm bg-ledger-700 hover:bg-ledger-800">
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

      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <h3 className="text-ink font-semibold">Registered products</h3>
        </div>
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-10 w-10 text-faint mx-auto mb-3" />
            <p className="text-muted text-sm">No products yet. Register your first product above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((p, i) => {
              const unreadReviews = reviewCounts[p.id] || 0;
              return (
                <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-mist cursor-pointer transition-colors group" onClick={() => navigate(`/product/${p.id}`)}>
                    <div className="flex items-center gap-4">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} className="w-12 h-12 rounded-lg object-cover border border-line" alt={p.name} />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-ledger-50 border border-ledger-200 flex items-center justify-center">
                          <Package className="h-5 w-5 text-ledger-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-ink font-semibold text-sm group-hover:text-ledger-700 transition-colors">{p.name}</p>
                        <p className="text-muted text-xs mt-0.5">ID: {p.id} · {p.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-faint mb-1">Risk Score</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-mist overflow-hidden">
                            <div className={`h-full rounded-full ${p.riskScore > 50 ? 'bg-recalled' : 'bg-genuine'}`} style={{ width: `${p.riskScore}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${p.riskScore > 50 ? 'text-recalled' : 'text-genuine'}`}>{p.riskScore}</span>
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                      {/* Chat / review indicator */}
                      <div className="relative">
                        <MessageCircle className={`h-4 w-4 transition-colors ${unreadReviews > 0 ? 'text-caution' : 'text-faint group-hover:text-muted'}`} />
                        {unreadReviews > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-caution rounded-full text-[8px] font-bold text-white flex items-center justify-center leading-none">
                            {unreadReviews > 9 ? '9+' : unreadReviews}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-faint group-hover:text-muted transition-colors" />
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
        <h1 className="display-md text-[2rem] sm:text-[2.4rem] text-ink">Shipments</h1>
        <p className="text-muted text-sm mt-1">Log each product’s condition when you receive it.</p>
      </div>

      <WalletGuard walletAddress={profile?.walletAddress} />

      <div className="bg-paper border border-line rounded-2xl p-5">
        <h3 className="text-ink font-semibold mb-3 text-sm">Look up a product</h3>
        <div className="flex gap-3">
          <input type="text" placeholder="Enter Product ID (e.g., CCA-12345)" value={searchId} onChange={e => setSearchId(e.target.value)} className="flex-1 px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
          <button onClick={() => navigate(`/product/${searchId}`)} className="px-5 py-3 bg-ledger-700 hover:bg-ledger-800 text-white font-semibold rounded-lg transition-colors text-sm">Search</button>
        </div>
      </div>

      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <h3 className="text-ink font-semibold">Active shipments</h3>
        </div>
        {products.length === 0 ? (
          <div className="py-14 text-center"><p className="text-muted text-sm">No active shipments.</p></div>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((p, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="px-6 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="cursor-pointer flex-1 min-w-0" onClick={() => navigate(`/product/${p.id}`)}>
                    <p className="text-ink font-semibold text-sm hover:text-ledger-800 transition-colors truncate">{p.name}</p>
                    <p className="text-muted text-xs mt-0.5">{p.id} · Risk: <span className={p.riskScore > 50 ? 'text-recalled' : 'text-genuine'}>{p.riskScore}</span></p>
                  </div>
                  <StatusBadge status={p.status} />
                  <button
                    onClick={() => { setConditionModal({ productId: p.id, riskScore: p.riskScore }); setConditionForm({ temperature: '', humidity: '', conditionGrade: 'good', visibleDamage: 'no', notes: '' }); }}
                    disabled={processing === p.id}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-genuine-bg hover:bg-genuine/15 border border-genuine/25 text-genuine text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {processing === p.id ? (
                      <><div className="w-3 h-3 border border-genuine border-t-transparent rounded-full animate-spin" /> Logging…</>
                    ) : (
                      <><Plus className="h-3 w-3" /> Log condition</>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-paper border border-line rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="text-ink font-bold text-lg">Log product condition</h2>
                  <p className="text-muted text-sm mt-0.5">Record the condition of <span className="text-ledger-700 font-mono">{conditionModal.productId}</span> as received</p>
                </div>
                <button onClick={() => setConditionModal(null)} className="text-muted hover:text-ink transition-colors p-1"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleHandoff} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Temperature (°C)</label>
                    <input type="number" step="0.1" required value={conditionForm.temperature} onChange={e => setConditionForm(f => ({ ...f, temperature: e.target.value }))} placeholder="e.g. 4.0" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Humidity (%)</label>
                    <input type="number" step="1" min="0" max="100" required value={conditionForm.humidity} onChange={e => setConditionForm(f => ({ ...f, humidity: e.target.value }))} placeholder="e.g. 65" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Condition grade</label>
                    <select value={conditionForm.conditionGrade} onChange={e => setConditionForm(f => ({ ...f, conditionGrade: e.target.value }))} className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-ledger-500 transition-all text-sm">
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Visible damage?</label>
                    <select value={conditionForm.visibleDamage} onChange={e => setConditionForm(f => ({ ...f, visibleDamage: e.target.value }))} className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-ledger-500 transition-all text-sm">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Observations / notes</label>
                  <textarea rows={3} value={conditionForm.notes} onChange={e => setConditionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe product condition, packaging integrity, any concerns…" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm resize-none" />
                </div>

                {(conditionForm.conditionGrade === 'poor' || conditionForm.visibleDamage === 'yes') && (
                  <div className="flex gap-3 p-3 bg-caution-bg border border-caution/25 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-caution shrink-0 mt-0.5" />
                    <p className="text-caution text-xs">Poor condition or visible damage will increase the product's risk score and may trigger a regulatory flag.</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setConditionModal(null)} className="px-5 py-2.5 border border-line rounded-lg text-muted hover:text-ink text-sm font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={!!processing} className="flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 text-white font-semibold rounded-lg transition-all text-sm bg-ledger-700 hover:bg-ledger-800">
                    {processing ? <span className="animate-pulse">Submitting…</span> : <><Wallet className="h-4 w-4" /> Pay &amp; Log condition</>}
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
        <h1 className="display-md text-[2rem] sm:text-[2.4rem] text-ink">Oversight</h1>
        <p className="text-muted text-sm mt-1">Review flagged products and trace a recall across every outlet.</p>
      </div>

      <WalletGuard walletAddress={profile?.walletAddress} />

      {/* Flagged products */}
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-recalled" />
          <h3 className="text-ink font-semibold">Flagged products</h3>
          {flagged.length > 0 && <span className="ml-auto px-2.5 py-0.5 bg-recalled-bg border border-recalled/25 text-recalled text-xs font-bold rounded-full">{flagged.length}</span>}
        </div>
        {flagged.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="h-10 w-10 text-genuine/40 mx-auto mb-3" />
            <p className="text-muted text-sm">All clear — no flagged products.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {flagged.map((p, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="px-6 py-5 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="cursor-pointer flex-1" onClick={() => navigate(`/product/${p.id}`)}>
                    <p className="text-ink font-semibold hover:text-ledger-800 transition-colors">{p.name} <span className="text-faint font-normal text-sm">({p.id})</span></p>
                    <p className="text-muted text-xs mt-1">Producer: {p.producerName} · Risk Score: <span className="text-recalled font-semibold">{p.riskScore}/100</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={!!processing} onClick={() => handleDecision(p.id, 'approved')} className="flex items-center gap-1.5 px-4 py-2 bg-genuine-bg hover:bg-genuine/15 border border-genuine/25 text-genuine text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                      {processing === p.id ? <div className="w-3 h-3 border border-genuine border-t-transparent rounded-full animate-spin" /> : <Wallet className="h-3 w-3" />}
                      Approve
                    </button>
                    <button disabled={!!processing} onClick={() => handleDecision(p.id, 'rejected')} className="flex items-center gap-1.5 px-4 py-2 bg-recalled-bg hover:bg-recalled/15 border border-recalled/25 text-recalled text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                      {processing === p.id ? <div className="w-3 h-3 border border-recalled border-t-transparent rounded-full animate-spin" /> : <Wallet className="h-3 w-3" />}
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

      {/* ── Recall trace ── */}
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center gap-2">
          <Zap className="h-5 w-5 text-caution" />
          <h3 className="text-ink font-semibold">Recall trace</h3>
          <span className="ml-auto text-faint text-xs">Trace affected products across the full chain</span>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-muted text-sm">Simulate a product recall by searching the chain for affected batches. Measures blockchain trace speed vs estimated traditional database approach.</p>

          <form onSubmit={runRecallSim} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Product ID (exact)</label>
              <input type="text" value={recallForm.productId} onChange={e => setRecallForm(f => ({ ...f, productId: e.target.value }))} placeholder="e.g. CCA-12345" className="w-full px-4 py-2.5 bg-paper border border-line rounded-lg text-ink placeholder-faint text-sm focus:outline-none focus:border-caution transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Category (partial match)</label>
              <input type="text" value={recallForm.category} onChange={e => setRecallForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. seafood" className="w-full px-4 py-2.5 bg-paper border border-line rounded-lg text-ink placeholder-faint text-sm focus:outline-none focus:border-caution transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Registered from</label>
              <input type="date" value={recallForm.dateFrom} onChange={e => setRecallForm(f => ({ ...f, dateFrom: e.target.value }))} className="w-full px-4 py-2.5 bg-paper border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-caution transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Registered to</label>
              <input type="date" value={recallForm.dateTo} onChange={e => setRecallForm(f => ({ ...f, dateTo: e.target.value }))} className="w-full px-4 py-2.5 bg-paper border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-caution transition-all" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={recallRunning} className="flex items-center gap-2 px-6 py-2.5 bg-caution-bg hover:bg-caution/15 border border-caution/25 text-caution font-semibold text-sm rounded-lg transition-all disabled:opacity-50">
                {recallRunning ? <><div className="w-4 h-4 border-2 border-caution border-t-transparent rounded-full animate-spin" />Running simulation…</> : <><Search className="h-4 w-4" />Run Recall trace</>}
              </button>
            </div>
          </form>

          {recallError && <p className="text-recalled text-sm">{recallError}</p>}

          {/* Results */}
          <AnimatePresence>
            {recallResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Performance comparison */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Affected products', val: String(recallResult.affectedCount), color: 'text-caution' },
                    { label: 'Events scanned', val: String(recallResult.totalEventsScanned), color: 'text-ledger-600' },
                    { label: 'Blockchain Time', val: `${recallResult.blockchainMs}ms`, color: 'text-genuine' },
                    { label: 'Traditional Est.', val: `${recallResult.estimatedTraditionalMs}ms`, color: 'text-recalled' },
                  ].map(s => (
                    <div key={s.label} className="bg-paper border border-line rounded-lg p-3 text-center">
                      <p className="text-faint text-sm mb-1">{s.label}</p>
                      <p className={`display tnum text-[2rem] ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Speedup badge */}
                <div className="flex items-center gap-3 p-3 bg-genuine-bg border border-genuine/25 rounded-lg">
                  <Zap className="h-4 w-4 text-genuine shrink-0" />
                  <div>
                    <p className="text-genuine text-sm font-semibold">{recallResult.speedupLabel}</p>
                    <p className="text-genuine text-xs mt-0.5">Simulation ID: {recallResult.simulationId} · {new Date(recallResult.ranAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Trace per product */}
                {recallResult.affectedCount === 0 ? (
                  <p className="text-muted text-sm text-center py-4">No products matched the recall criteria.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted text-sm font-semibold">Affected product traces</p>
                    {recallResult.traces.map((t: any) => (
                      <div key={t.productId} className="bg-paper border border-line rounded-lg overflow-hidden">
                        <button
                          className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-mist transition-colors"
                          onClick={() => setExpandedTrace(expandedTrace === t.productId ? null : t.productId)}
                        >
                          <div className="text-left">
                            <p className="text-ink font-semibold text-sm">{t.name} <span className="text-faint font-normal">({t.productId})</span></p>
                            <p className="text-muted text-xs mt-0.5">{t.producerName} · {t.category} · Last at: {t.currentLocation} · {t.eventsCount} events{t.anomalyCount > 0 ? ` · ⚠ ${t.anomalyCount} anomalies` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full border capitalize ${t.riskScore > 50 ? 'bg-recalled-bg border-recalled/25 text-recalled' : 'bg-genuine-bg border-genuine/25 text-genuine'}`}>{t.riskScore} risk</span>
                            <ChevronRight className={`h-4 w-4 text-faint transition-transform ${expandedTrace === t.productId ? 'rotate-90' : ''}`} />
                          </div>
                        </button>
                        <AnimatePresence>
                          {expandedTrace === t.productId && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-2 border-t border-line">
                                <p className="text-faint text-sm pt-3 mb-2">Full audit chain</p>
                                {t.chainSummary.map((step: any, j: number) => (
                                  <div key={j} className="flex items-start gap-3 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${step.type === 'CREATED' ? 'bg-genuine' : step.type === 'HANDOFF' ? 'bg-sky-700' : 'bg-ledger-400'}`} />
                                    <div className="flex-1">
                                      <span className="text-ink font-semibold">{step.type}</span>
                                      <span className="text-muted"> by {step.actor} ({step.role})</span>
                                      {step.location && <span className="text-faint"> · {step.location}</span>}
                                      {step.hasAnomalies && <span className="text-caution ml-1">⚠</span>}
                                    </div>
                                    <span className="text-faint shrink-0 font-mono">{step.hash}</span>
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
      <div className="w-20 h-20 rounded-3xl border border-ledger-200 flex items-center justify-center bg-ledger-50">
        <Package className="h-10 w-10 text-ledger-600" />
      </div>
      <div>
        <h1 className="display-md text-[2rem] sm:text-[2.4rem] text-ink mb-3">Check before you buy</h1>
        <p className="text-muted max-w-md">Enter the code on any pack to see whether it’s genuine, still safe, or recalled.</p>
      </div>
      <button onClick={() => navigate('/verify')} className="flex items-center gap-2 px-8 py-4 text-white font-bold rounded-2xl text-lg transition-all bg-ledger-700 hover:bg-ledger-800">
        <Package className="h-5 w-5" /> Check a product
      </button>
    </div>
  );
}
