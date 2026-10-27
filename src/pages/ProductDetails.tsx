import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  Package, ShieldCheck, Clock, Link as LinkIcon, Star, MessageSquare,
  ChevronLeft, AlertTriangle, CheckCircle, XCircle, Image as ImageIcon, Play,
  MapPin, ChevronDown, Maximize2, X, TrendingUp, TrendingDown, Minus,
  BarChart2, AlertCircle, Brain, ThumbsUp, ThumbsDown, Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  registered: { color: 'text-genuine bg-genuine-bg border-genuine/25', icon: CheckCircle, label: 'Registered' },
  'in-transit': { color: 'text-sky-800 bg-sky-50 border-sky-200', icon: Clock, label: 'In transit' },
  flagged: { color: 'text-recalled bg-recalled-bg border-recalled/25', icon: AlertTriangle, label: 'Flagged' },
  approved: { color: 'text-genuine bg-genuine-bg border-genuine/25', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'text-recalled bg-recalled-bg border-recalled/25', icon: XCircle, label: 'Rejected' },
  delivered: { color: 'text-muted bg-mist border-line', icon: Package, label: 'Delivered' },
};

const eventColor: Record<string, string> = {
  CREATED: 'bg-genuine',
  HANDOFF: 'bg-sky-700',
  INSPECTION: 'bg-ledger-400',
  CONSUMER_REPORT: 'bg-caution',
};

// ─── Geocode cache & rate-limit queue ─────────────────────────────────────────
const geocodeCache: Record<string, { lat: number; lon: number } | null> = {};
let geocodeQueue: Array<() => void> = [];
let geocodeRunning = false;

function enqueueGeocode(fn: () => void) {
  geocodeQueue.push(fn);
  if (!geocodeRunning) drainQueue();
}

function drainQueue() {
  if (!geocodeQueue.length) { geocodeRunning = false; return; }
  geocodeRunning = true;
  const next = geocodeQueue.shift()!;
  next();
  // Nominatim policy: max 1 req/sec
  setTimeout(drainQueue, 1100);
}

// ─── Map Widget ────────────────────────────────────────────────────────────────
function MapWidget({ location }: { location?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null | 'loading'>('loading');

  useEffect(() => {
    if (!location) { setCoords(null); return; }
    // Skip only if too short to be a real address (less than 5 chars)
    if (location.trim().length < 5) { setCoords(null); return; }
    if (location in geocodeCache) { setCoords(geocodeCache[location]); return; }
    setCoords('loading');
    enqueueGeocode(() => {
      // email param satisfies Nominatim's usage policy (User-Agent is a forbidden header in browsers)
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1&email=trustchain-app%40example.com`;
      fetch(url)
        .then(r => r.json())
        .then((data: any[]) => {
          const result = data[0] ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
          geocodeCache[location] = result;
          setCoords(result);
        })
        .catch(() => { geocodeCache[location] = null; setCoords(null); });
    });
  }, [location]);

  if (!location) return null;
  const hasCoords = coords && coords !== 'loading';
  const c = hasCoords ? (coords as { lat: number; lon: number }) : null;
  const mapSrc = c ? `https://www.openstreetmap.org/export/embed.html?bbox=${c.lon - 0.012},${c.lat - 0.009},${c.lon + 0.012},${c.lat + 0.009}&layer=mapnik&marker=${c.lat},${c.lon}` : null;
  const mapLarge = c ? `https://www.openstreetmap.org/export/embed.html?bbox=${c.lon - 0.04},${c.lat - 0.03},${c.lon + 0.04},${c.lat + 0.03}&layer=mapnik&marker=${c.lat},${c.lon}` : null;

  return (
    <>
      <div className="mt-2.5">
        <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1.5 text-[11px] text-muted hover:text-ledger-700 transition-colors">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[220px]">{location}</span>
          <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${coords === 'loading' ? 'animate-spin opacity-50' : ''}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="mt-2 rounded-lg overflow-hidden border border-line relative">
                {coords === 'loading' ? (
                  <div className="h-36 bg-paper flex items-center justify-center"><div className="w-5 h-5 border-2 border-ledger-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : mapSrc ? (
                  <>
                    <iframe src={mapSrc} className="w-full h-36 block" style={{ border: 0, pointerEvents: 'none' }} title={`Map: ${location}`} loading="lazy" />
                    <button onClick={() => setModalOpen(true)} className="absolute top-2 right-2 p-1.5 bg-paper/90 hover:bg-paper border border-line rounded-lg text-muted hover:text-ink transition-all" title="Expand map"><Maximize2 className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                  <div className="h-24 bg-paper flex flex-col items-center justify-center gap-2">
                    <MapPin className="h-4 w-4 text-faint" />
                    <p className="text-faint text-[10px]">Could not geocode this location</p>
                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(location || '')}`} target="_blank" rel="noopener noreferrer" className="text-ledger-600 hover:text-ledger-700 text-[10px] underline transition-colors">Search on Google Maps ↗</a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {modalOpen && mapLarge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }} className="bg-paper border border-line rounded-2xl overflow-hidden w-full max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-line flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ledger-600" />
                <span className="text-ink text-sm font-semibold truncate flex-1">{location}</span>
                <button onClick={() => setModalOpen(false)} className="text-muted hover:text-ink transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <iframe src={mapLarge} className="w-full h-96 block" style={{ border: 0 }} title={`Map: ${location}`} loading="lazy" />
              <div className="px-4 py-2.5 border-t border-line">
                <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(location)}`} target="_blank" rel="noopener noreferrer" className="text-ledger-600 hover:text-ledger-800 text-xs transition-colors">Open in OpenStreetMap ↗</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Risk Forecast Widget ──────────────────────────────────────────────────────
function RiskForecast({ productId }: { productId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.forecast(productId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return (
    <div className="bg-paper border border-line rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-ledger-600" />
        <h2 className="text-ink font-bold text-lg">Risk forecast</h2>
      </div>
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-ledger-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!data) return null;

  const TrendIcon = data.trend === 'rising' ? TrendingUp : data.trend === 'falling' ? TrendingDown : Minus;
  const trendColor = data.trend === 'rising' ? 'text-recalled' : data.trend === 'falling' ? 'text-genuine' : 'text-muted';
  const predictedColor = data.predictedRiskScore > 70 ? 'text-recalled' : data.predictedRiskScore > 40 ? 'text-caution' : 'text-genuine';
  const predictedBg = data.predictedRiskScore > 70 ? 'bg-recalled' : data.predictedRiskScore > 40 ? 'bg-caution' : 'bg-genuine';
  const confidenceColor = data.confidence === 'high' ? 'text-genuine bg-genuine-bg border-genuine/25' : data.confidence === 'medium' ? 'text-caution bg-caution-bg border-caution/25' : 'text-muted bg-mist border-line';

  return (
    <div className="bg-paper border border-line rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-ink font-bold text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-ledger-600" /> Risk forecast
        </h2>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${confidenceColor}`}>
          {data.confidence} confidence
        </span>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-paper border border-line rounded-lg px-4 py-3">
          <p className="text-muted text-sm mb-1">Current Risk</p>
          <p className={`display tnum text-[2rem] ${data.currentRisk > 50 ? 'text-recalled' : 'text-genuine'}`}>{data.currentRisk}<span className="text-sm font-normal text-faint">/100</span></p>
        </div>
        <div className="bg-paper border border-line rounded-lg px-4 py-3">
          <p className="text-muted text-sm mb-1">Predicted Risk</p>
          <div className="flex items-end gap-2">
            <p className={`display tnum text-[2rem] ${predictedColor}`}>{data.predictedRiskScore}<span className="text-sm font-normal text-faint">/100</span></p>
            <span className={`flex items-center gap-1 text-xs font-semibold mb-0.5 ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />{data.trend}
            </span>
          </div>
        </div>
      </div>

      {/* Predicted score bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>Forecast risk level</span>
          <span className={predictedColor}>{data.predictedRiskScore}%</span>
        </div>
        <div className="h-2.5 bg-mist rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.predictedRiskScore}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`h-full rounded-full ${predictedBg}`}
          />
        </div>
      </div>

      {/* Factors */}
      {data.factors?.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted text-sm">Contributing factors</p>
          <ul className="space-y-1.5">
            {data.factors.map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-ledger-400 mt-1.5 shrink-0" />
                <span className="text-ink">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${data.predictedRiskScore > 70 ? 'bg-recalled-bg border-recalled/25' : data.predictedRiskScore > 40 ? 'bg-caution-bg border-caution/25' : 'bg-genuine-bg border-genuine/25'}`}>
        <BarChart2 className={`h-4 w-4 shrink-0 mt-0.5 ${data.predictedRiskScore > 70 ? 'text-recalled' : data.predictedRiskScore > 40 ? 'text-caution' : 'text-genuine'}`} />
        <p className={`text-xs ${data.predictedRiskScore > 70 ? 'text-recalled' : data.predictedRiskScore > 40 ? 'text-caution' : 'text-genuine'}`}>{data.recommendation}</p>
      </div>

      {/* Mini trend chart (temp/humidity over handoffs) */}
      {data.dataPoints?.length > 0 && (
        <div>
          <p className="text-muted text-sm mb-3">Temperature trend across handoffs</p>
          <div className="flex items-end gap-1.5 h-16">
            {data.dataPoints.map((pt: any, i: number) => {
              const temp = pt.temperature ?? 0;
              const height = Math.max(4, Math.min(100, ((temp + 10) / 50) * 100));
              const color = temp > 25 ? 'bg-recalled' : temp < 2 ? 'bg-sky-700' : 'bg-genuine';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full rounded-t" style={{ height: `${height}%`, backgroundColor: undefined }} >
                    <div className={`w-full h-full rounded-t ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <span className="text-[9px] text-faint group-hover:text-muted transition-colors">{i + 1}</span>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-paper border border-line rounded-lg px-2 py-1 text-[10px] text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {pt.temperature !== null ? `${pt.temperature}°C` : '—'}
                    {pt.anomalies?.length > 0 && ' ⚠'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-faint mt-1">
            <span>Handoff 1</span><span>Handoff {data.dataPoints.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.products.get(id), api.events.list(id), api.reviews.list(id)])
      .then(([prod, evts, revs]) => { setProduct(prod); setEvents(evts); setReviews(revs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Handle hash navigation to specific review
  useEffect(() => {
    if (window.location.hash.startsWith('#review-')) {
      const reviewId = window.location.hash.slice(8); // Remove '#review-' prefix
      setTimeout(() => {
        const reviewElement = document.getElementById(`review-${reviewId}`);
        if (reviewElement) {
          reviewElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          reviewElement.classList.add('highlight-review');
        }
      }, 300);
    }
  }, [loading]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSubmittingReview(true);
    try {
      const review = await api.reviews.create({ productId: id, rating: newReview.rating, comment: newReview.comment });
      setReviews(prev => [review, ...prev]);
      setNewReview({ rating: 5, comment: '' });
    } catch (err) { console.error(err); }
    finally { setSubmittingReview(false); }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user) return;
    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const alreadyLiked = (r.likes || []).includes(user.uid);
      const likes = alreadyLiked ? r.likes.filter((id: string) => id !== user.uid) : [...(r.likes || []), user.uid];
      const dislikes = (r.dislikes || []).filter((id: string) => id !== user.uid);
      return { ...r, likes, dislikes, likeCount: likes.length, dislikeCount: dislikes.length };
    }));
    try {
      const updated = await api.reviews.like(reviewId);
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      api.reviews.list(id!).then(setReviews).catch(console.error);
    }
  };

  const handleDislikeReview = async (reviewId: string) => {
    if (!user) return;
    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const alreadyDisliked = (r.dislikes || []).includes(user.uid);
      const dislikes = alreadyDisliked ? r.dislikes.filter((id: string) => id !== user.uid) : [...(r.dislikes || []), user.uid];
      const likes = (r.likes || []).filter((id: string) => id !== user.uid);
      return { ...r, likes, dislikes, likeCount: likes.length, dislikeCount: dislikes.length };
    }));
    try {
      const updated = await api.reviews.dislike(reviewId);
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
    } catch (err) {
      console.error(err);
      api.reviews.list(id!).then(setReviews).catch(console.error);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!user || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const updated = await api.reviews.addReply(reviewId, replyText);
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
      setReplyText('');
      setReplyingTo(null);
    } catch (err) { console.error(err); }
    finally { setSubmittingReply(false); }
  };

  const handleLikeReply = async (reviewId: string, replyId: string) => {
    if (!user) return;
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const replies = (r.replies || []).map((rep: any) => {
        if (rep.id !== replyId) return rep;
        const alreadyLiked = (rep.likes || []).includes(user.uid);
        const likes = alreadyLiked ? rep.likes.filter((id: string) => id !== user.uid) : [...(rep.likes || []), user.uid];
        const dislikes = (rep.dislikes || []).filter((id: string) => id !== user.uid);
        return { ...rep, likes, dislikes, likeCount: likes.length, dislikeCount: dislikes.length };
      });
      return { ...r, replies };
    }));
    try {
      const updated = await api.reviews.likeReply(reviewId, replyId);
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
    } catch (err) { console.error(err); }
  };

  const handleDislikeReply = async (reviewId: string, replyId: string) => {
    if (!user) return;
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const replies = (r.replies || []).map((rep: any) => {
        if (rep.id !== replyId) return rep;
        const alreadyDisliked = (rep.dislikes || []).includes(user.uid);
        const dislikes = alreadyDisliked ? rep.dislikes.filter((id: string) => id !== user.uid) : [...(rep.dislikes || []), user.uid];
        const likes = (rep.likes || []).filter((id: string) => id !== user.uid);
        return { ...rep, likes, dislikes, likeCount: likes.length, dislikeCount: dislikes.length };
      });
      return { ...r, replies };
    }));
    try {
      const updated = await api.reviews.dislikeReply(reviewId, replyId);
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-ledger-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm">Loading product data…</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <XCircle className="h-12 w-12 text-recalled" />
      <p className="text-muted">Product not found.</p>
      <button onClick={() => navigate(-1)} className="text-ledger-600 hover:text-ledger-800 text-sm flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> Go back</button>
    </div>
  );

  const status = statusConfig[product.status] || statusConfig['registered'];
  const StatusIcon = status.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted hover:text-ink text-sm transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero card */}
      <div className="bg-paper border border-line rounded-2xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative bg-paper flex flex-col">
            {/* Image container */}
            <div className="relative flex-1 min-h-[320px] flex items-center justify-center overflow-hidden">
              {product.images?.length > 0 ? (
                <div className="w-full h-full relative">
                  <AnimatePresence mode="wait">
                    <motion.img key={activeImage} src={product.images[activeImage]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full object-cover" alt={product.name} />
                  </AnimatePresence>
                </div>
              ) : product.video ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted p-8"><Play className="h-12 w-12 text-ledger-600" /><p className="text-sm">Video available</p></div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-faint p-8"><ImageIcon className="h-12 w-12" /><p className="text-sm">No media</p></div>
              )}
            </div>

            {/* Image carousel */}
            {product.images?.length > 0 && (
              <div className="border-t border-line flex gap-2 p-3 overflow-x-auto bg-mist">
                {product.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-ledger-500' : 'border-line hover:border-ledger-300'}`}>
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-line bg-mist">
              <div className="text-center">
                <div className="text-base font-bold text-ledger-600">{reviews.length}</div>
                <p className="text-[10px] text-muted">Reviews</p>
              </div>
              <div className="text-center border-l border-r border-line">
                {reviews.length > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      {[1, 2, 3, 4, 5].map(s => {
                        const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
                        return <Star key={s} className={`h-3 w-3 ${s <= Math.round(avg) ? 'text-caution fill-current' : 'text-faint'}`} />;
                      })}
                    </div>
                    <div className="text-sm font-bold text-caution">{(reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)}<span className="text-faint text-[10px] font-normal">/5</span></div>
                  </>
                ) : (
                  <div className="text-base font-bold text-faint">—</div>
                )}
                <p className="text-[10px] text-muted">Avg Rating</p>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-genuine">{events.length}</div>
                <p className="text-[10px] text-muted">Handoffs</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="display-md text-[2rem] sm:text-[2.4rem] text-ink">{product.name}</h1>
                <p className="text-muted text-sm mt-1">by {product.producerName}</p>
              </div>
              <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.color}`}>
                <StatusIcon className="h-3.5 w-3.5" /> {status.label}
              </span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-paper border border-line rounded-lg">
              <code className="text-ledger-600 font-mono text-sm font-bold">{product.id}</code>
              <span className="text-faint text-xs ml-auto">Product ID</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Risk Score</span>
                <span className={`font-bold ${product.riskScore > 50 ? 'text-recalled' : 'text-genuine'}`}>{product.riskScore}/100</span>
              </div>
              <div className="h-2 bg-mist rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${product.riskScore}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${product.riskScore > 50 ? 'bg-recalled' : 'bg-genuine'}`} />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {[
                { label: 'Category', val: product.category },
                { label: 'Packaging', val: product.packagingType || 'N/A' },
                { label: 'Weight', val: product.weight || 'N/A' },
                { label: 'Size', val: product.size || 'N/A' },
                ...(product.batchNumber ? [{ label: 'Batch / lot', val: product.batchNumber }] : []),
                ...(product.barcode ? [{ label: 'Barcode / SKU', val: product.barcode }] : []),
                ...(product.origin ? [{ label: 'Origin', val: product.origin, full: true }] : []),
                ...(product.manufacturingDate ? [{ label: 'Manufactured', val: product.manufacturingDate }] : []),
                ...(product.expiryDate ? [{ label: 'Expiry / best before', val: product.expiryDate }] : []),
                ...(product.storageConditions ? [{ label: 'Storage', val: product.storageConditions, full: true }] : []),
                ...(product.allergens ? [{ label: 'Allergens', val: product.allergens, full: true }] : []),
                ...(product.certifications ? [{ label: 'Certifications', val: product.certifications, full: true }] : []),
                { label: 'Registered', val: product.createdAt ? format(new Date(product.createdAt), 'dd MMM yyyy') : '—', full: true },
              ].map(({ label, val, full }: any) => (
                <div key={label} className={`${full ? 'col-span-2' : ''} bg-paper border border-line rounded-lg px-3 py-2`}>
                  <dt className="text-faint text-sm mb-0.5">{label}</dt>
                  <dd className="text-ink text-sm font-medium">{val}</dd>
                </div>
              ))}
            </dl>

            {product.description && <p className="text-muted text-sm leading-relaxed border-t border-line pt-4">{product.description}</p>}
          </div>
        </div>
      </div>

      <RiskForecast productId={product.id} />

      {/* Audit trail */}
      <div className="bg-paper border border-line rounded-2xl p-6">
        <h2 className="text-ink font-bold text-lg flex items-center gap-2 mb-6">
          <LinkIcon className="h-5 w-5 text-ledger-600" /> Audit trail
          <span className="ml-auto text-faint text-xs font-normal">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        </h2>

        {events.length === 0 ? (
          <p className="text-faint text-sm text-center py-8">No events recorded yet.</p>
        ) : (
          <ol className="space-y-0">
            {events.map((evt, i) => {
              const anomalies: string[] = evt.data?.anomalies || [];
              return (
                <motion.li key={evt.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-4 relative">
                  {i < events.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-px bg-line" />}
                  <div className={`shrink-0 w-8 h-8 rounded-full ${eventColor[evt.type] || 'bg-faint'} flex items-center justify-center mt-1 z-10`}>
                    {evt.type === 'CREATED' ? <Package className="h-4 w-4 text-ink" /> : evt.type === 'HANDOFF' ? <Clock className="h-4 w-4 text-ink" /> : <ShieldCheck className="h-4 w-4 text-ink" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                      <span className="text-ink font-semibold text-sm">{evt.type}</span>
                      {anomalies.length > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-caution-bg border border-caution/25 text-caution text-[10px] font-bold rounded-full">
                          <AlertCircle className="h-3 w-3" /> {anomalies.length} anomaly{anomalies.length > 1 ? 'ies' : ''}
                        </span>
                      )}
                      <span className="text-muted text-xs">by {evt.actorName} ({evt.actorRole})</span>
                      <span className="ml-auto text-faint text-xs shrink-0">{evt.timestamp ? format(new Date(evt.timestamp), 'MMM d, h:mm a') : '—'}</span>
                    </div>

                    <div className="bg-paper border border-line rounded-lg p-3 space-y-1">
                      {Object.entries(evt.data || {}).filter(([k]) => k !== 'location' && k !== 'anomalies').map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-muted capitalize w-24 shrink-0">{k}:</span>
                          <span className="text-ink">{String(v)}</span>
                        </div>
                      ))}

                      {/* Anomaly details */}
                      {anomalies.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-caution/20 space-y-1">
                          {anomalies.map((a, j) => (
                            <div key={j} className="flex items-start gap-1.5 text-[10px] text-caution">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 mt-1 border-t border-line font-mono text-[10px] text-faint break-all">{evt.hash}</div>
                      <MapWidget location={evt.data?.location} />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-paper border border-line rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h2 className="text-ink font-bold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-ledger-600" /> Reviews & Discussion
          </h2>
          {reviews.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => {
                  const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
                  return <Star key={s} className={`h-4 w-4 ${s <= Math.round(avg) ? 'text-caution fill-current' : 'text-faint'}`} />;
                })}
              </div>
              <span className="text-caution font-bold">{(reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)}</span>
              <span className="text-faint text-xs">· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          ) : (
            <span className="text-faint text-xs">{reviews.length} reviews</span>
          )}
        </div>

        {user && (
          <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-paper border border-line rounded-2xl space-y-4">
            <h3 className="text-ink font-semibold text-sm">Leave a review</h3>
            <div className="flex items-center gap-2">
              <span className="text-muted text-sm">Rating:</span>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setNewReview({ ...newReview, rating: s })}>
                  <Star className={`h-5 w-5 transition-colors ${s <= newReview.rating ? 'text-caution fill-current' : 'text-faint hover:text-muted'}`} />
                </button>
              ))}
            </div>
            <textarea required rows={3} value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} placeholder="Share your experience or report an issue…" className="w-full px-4 py-3 bg-paper border border-line rounded-lg text-ink placeholder-faint focus:outline-none focus:border-ledger-500 transition-all text-sm resize-none" />
            <div className="flex justify-end">
              <button type="submit" disabled={submittingReview} className="flex items-center gap-2 px-5 py-2.5 bg-ledger-700 hover:bg-ledger-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-all text-sm">
                {submittingReview ? 'Posting…' : 'Post Review'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-faint text-sm text-center py-8">No reviews yet. Be the first to share!</p>
          ) : reviews.map((r, i) => (
            <motion.div
              id={`review-${r.id}`}
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-line rounded-lg p-4 highlight-review-target"
            >
              {/* Review header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-ledger-800 shrink-0 bg-ledger-100">{r.userName?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-ink font-semibold text-sm">{r.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ledger-50 border border-ledger-200 text-ledger-600 font-medium">@{r.userRole}</span>
                    </div>
                    {r.rating && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, j) => <Star key={j} className={`h-3 w-3 ${j < r.rating ? 'text-caution fill-current' : 'text-faint'}`} />)}
                        <span className="text-caution text-[10px] font-semibold ml-0.5">{r.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-faint text-[10px] shrink-0 mt-0.5">{r.timestamp ? format(new Date(r.timestamp), 'MMM dd, yyyy · h:mm a') : ''}</span>
              </div>

              {/* Comment text */}
              <p className="text-ink text-sm leading-relaxed mb-3">{r.comment}</p>

              {/* Like/Dislike buttons and reply count */}
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={() => handleLikeReview(r.id)}
                  className={`flex items-center gap-1 text-xs font-semibold transition-colors ${r.likes?.includes(user?.uid || '') ? 'text-genuine' : 'text-muted hover:text-genuine'}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{r.likeCount || 0}</span>
                </button>
                <button
                  onClick={() => handleDislikeReview(r.id)}
                  className={`flex items-center gap-1 text-xs font-semibold transition-colors ${r.dislikes?.includes(user?.uid || '') ? 'text-recalled' : 'text-muted hover:text-recalled'}`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{r.dislikeCount || 0}</span>
                </button>
                {user && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === r.id ? null : r.id)}
                    className="text-muted hover:text-ledger-700 text-xs font-semibold transition-colors"
                  >
                    Reply {r.replies?.length > 0 && `(${r.replies.length})`}
                  </button>
                )}
              </div>

              {/* Replies */}
              {r.replies && r.replies.length > 0 && (
                <div className="ml-4 border-l border-line pl-4 space-y-3 mb-3">
                  {r.replies.map(reply => (
                    <div key={reply.id} className="bg-paper rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-ledger-800 shrink-0 bg-ledger-100">{reply.userName?.[0]?.toUpperCase()}</div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-ink font-semibold text-xs">{reply.userName}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded-full bg-ledger-50 border border-ledger-200 text-ledger-600">@{reply.userRole}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-faint text-[9px] shrink-0">{reply.createdAt ? format(new Date(reply.createdAt), 'MMM dd · h:mm a') : ''}</span>
                      </div>
                      <p className="text-ink text-xs leading-relaxed mb-2">{reply.comment}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikeReply(r.id, reply.id)}
                          className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${reply.likes?.includes(user?.uid || '') ? 'text-genuine' : 'text-faint hover:text-genuine'}`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{reply.likeCount || 0}</span>
                        </button>
                        <button
                          onClick={() => handleDislikeReply(r.id, reply.id)}
                          className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${reply.dislikes?.includes(user?.uid || '') ? 'text-recalled' : 'text-faint hover:text-recalled'}`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span>{reply.dislikeCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo === r.id && user && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 px-3 py-2 bg-paper border border-line rounded-lg text-ink text-sm placeholder-faint focus:outline-none focus:border-ledger-500 transition-all"
                  />
                  <button
                    onClick={() => handleReply(r.id)}
                    disabled={submitingReply || !replyText.trim()}
                    className="px-3 py-2 bg-ledger-700 hover:bg-ledger-800 disabled:opacity-50 text-white rounded-lg transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
