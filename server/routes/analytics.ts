import { Router, Response } from 'express';
import { Event } from '../models/Event.js';
import { Product } from '../models/Product.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ─── Risk forecast for a single product ───────────────────────────────────────
// GET /api/analytics/forecast/:productId
router.get('/forecast/:productId', async (req, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }

    const events = await Event.find({ productId }).sort({ createdAt: 1 });
    const handoffs = events.filter(e => e.type === 'HANDOFF');

    if (handoffs.length === 0) {
      res.json({
        currentRisk: product.riskScore,
        predictedRiskScore: product.riskScore,
        trend: 'stable',
        confidence: 'low',
        factors: ['No handoff events recorded yet'],
        recommendation: 'Awaiting first distribution scan.',
        dataPoints: [],
      });
      return;
    }

    const temps: number[] = handoffs.map(e => e.data?.temperature).filter((t): t is number => t !== undefined);
    const humidities: number[] = handoffs.map(e => e.data?.humidity).filter((h): h is number => h !== undefined);

    // Category risk multiplier
    const highRiskCats = ['meat', 'dairy', 'seafood', 'poultry', 'fresh', 'fish', 'egg'];
    const categoryMultiplier = highRiskCats.some(c => product.category?.toLowerCase().includes(c)) ? 1.35 : 1.0;

    let additionalRisk = 0;
    const factors: string[] = [];

    // Temperature analysis
    if (temps.length > 0) {
      const latest = temps[temps.length - 1];
      if (latest > 25) { additionalRisk += 20; factors.push(`High temperature at last scan: ${latest}°C`); }
      else if (latest < 2) { additionalRisk += 15; factors.push(`Near-freezing temperature at last scan: ${latest}°C`); }

      if (temps.length >= 2) {
        const delta = latest - temps[0];
        if (delta > 8) { additionalRisk += 12; factors.push(`Temperature rising trend: +${delta.toFixed(1)}°C over chain`); }
        else if (delta < -8) { factors.push(`Temperature falling trend: ${delta.toFixed(1)}°C — verify intended`); }
      }

      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      if (avgTemp > 20) { additionalRisk += 8; factors.push(`Average chain temperature elevated: ${avgTemp.toFixed(1)}°C`); }
    }

    // Humidity analysis
    if (humidities.length > 0) {
      const latest = humidities[humidities.length - 1];
      if (latest > 85) { additionalRisk += 12; factors.push(`Critical humidity at last scan: ${latest}%`); }
      else if (latest > 70) { additionalRisk += 6; factors.push(`Elevated humidity at last scan: ${latest}%`); }
    }

    // Handoff volume risk (more hand-offs = more exposure points)
    if (handoffs.length >= 4) {
      additionalRisk += 5 * (handoffs.length - 3);
      factors.push(`${handoffs.length} chain handoffs increase contamination exposure`);
    }

    // Transit time for perishables
    if (events.length > 1 && categoryMultiplier > 1) {
      const ageHours = (Date.now() - new Date(events[0].createdAt).getTime()) / 3_600_000;
      if (ageHours > 72) { additionalRisk += 15; factors.push(`Extended time in chain: ${Math.round(ageHours)}h`); }
      else if (ageHours > 48) { additionalRisk += 7; factors.push(`Moderate chain duration: ${Math.round(ageHours)}h`); }
    }

    // Anomaly count
    const anomalyEvents = events.filter(e => Array.isArray(e.data?.anomalies) && e.data.anomalies.length > 0);
    if (anomalyEvents.length > 0) {
      additionalRisk += 10 * anomalyEvents.length;
      factors.push(`${anomalyEvents.length} anomalous event(s) detected in history`);
    }

    const scaledAdditional = Math.min(additionalRisk * categoryMultiplier, 45);
    const predictedRiskScore = Math.min(100, Math.round(product.riskScore + scaledAdditional));
    const delta = predictedRiskScore - product.riskScore;
    const trend = delta > 8 ? 'rising' : delta < -8 ? 'falling' : 'stable';
    const confidence = events.length >= 6 ? 'high' : events.length >= 3 ? 'medium' : 'low';

    if (factors.length === 0) factors.push('All monitored parameters within acceptable range');

    const recommendation =
      predictedRiskScore > 70 ? 'Immediate regulatory inspection recommended — high contamination risk projected.' :
      predictedRiskScore > 45 ? 'Schedule quality inspection at next transit point.' :
      'Product tracking on track. Continue standard monitoring protocol.';

    const dataPoints = handoffs.map((e, i) => ({
      index: i + 1,
      temperature: e.data?.temperature ?? null,
      humidity: e.data?.humidity ?? null,
      anomalies: e.data?.anomalies ?? [],
      timestamp: e.createdAt,
      actorName: e.actorName,
    }));

    res.json({ currentRisk: product.riskScore, predictedRiskScore, trend, confidence, factors, recommendation, dataPoints });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Portfolio-level BI analytics ─────────────────────────────────────────────
// GET /api/analytics/portfolio
router.get('/portfolio', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.find({});
    const total = products.length;
    const highRisk = products.filter(p => p.riskScore > 50).length;
    const flagged = products.filter(p => p.status === 'flagged').length;
    const approved = products.filter(p => p.status === 'approved').length;
    const rejected = products.filter(p => p.status === 'rejected').length;
    const inTransit = products.filter(p => p.status === 'in-transit').length;
    const registered = products.filter(p => p.status === 'registered').length;

    // Category risk breakdown
    const catMap: Record<string, { count: number; totalRisk: number }> = {};
    products.forEach(p => {
      const cat = (p.category || 'Uncategorised').toLowerCase();
      if (!catMap[cat]) catMap[cat] = { count: 0, totalRisk: 0 };
      catMap[cat].count++;
      catMap[cat].totalRisk += p.riskScore;
    });
    const categories = Object.entries(catMap)
      .map(([name, d]) => ({ name, count: d.count, avgRisk: Math.round(d.totalRisk / d.count) }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 8);

    // Event activity last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3_600_000);
    const recentEvents = await Event.find({ createdAt: { $gte: sevenDaysAgo } });
    const eventsByDay: Record<string, number> = {};
    for (let d = 6; d >= 0; d--) {
      const day = new Date(Date.now() - d * 24 * 3_600_000).toISOString().slice(0, 10);
      eventsByDay[day] = 0;
    }
    recentEvents.forEach(e => {
      const day = new Date(e.createdAt).toISOString().slice(0, 10);
      if (day in eventsByDay) eventsByDay[day]++;
    });

    // Anomaly count
    const allEvents = await Event.find({ 'data.anomalies.0': { $exists: true } });
    const totalAnomalies = allEvents.reduce((sum, e) => sum + (e.data?.anomalies?.length || 0), 0);

    // Top risk products
    const topRisk = products
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map(p => ({ id: p._id, name: p.name, riskScore: p.riskScore, status: p.status, category: p.category }));

    const complianceRate = total > 0 ? Math.round(((total - flagged) / total) * 100) : 100;

    res.json({ total, highRisk, flagged, approved, rejected, inTransit, registered, categories, eventsByDay, totalAnomalies, topRisk, complianceRate });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Flat rows for GraphicWalker ──────────────────────────────────────────────
// GET /api/analytics/rows  — one row per product, enriched with event stats
router.get('/rows', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.find({}).lean() as any[];
    const allEvents = await Event.find({}).lean() as any[];

    // Build per-product event stats
    const eventMap: Record<string, any[]> = {};
    for (const e of allEvents) {
      if (!eventMap[e.productId]) eventMap[e.productId] = [];
      eventMap[e.productId].push(e);
    }

    const rows = products.map((p: any) => {
      const events = eventMap[p._id] || [];
      const handoffs = events.filter((e: any) => e.type === 'HANDOFF');
      const temps = handoffs.map((e: any) => e.data?.temperature).filter((t: any) => typeof t === 'number');
      const humidities = handoffs.map((e: any) => e.data?.humidity).filter((h: any) => typeof h === 'number');
      const anomalyCount = events.reduce((n: number, e: any) => n + (Array.isArray(e.data?.anomalies) ? e.data.anomalies.length : 0), 0);
      const avgTemp = temps.length ? parseFloat((temps.reduce((a: number, b: number) => a + b, 0) / temps.length).toFixed(1)) : null;
      const avgHumidity = humidities.length ? parseFloat((humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length).toFixed(1)) : null;
      const createdAt = new Date(p.createdAt);
      return {
        productId: p._id,
        name: p.name,
        category: p.category || 'uncategorised',
        status: p.status,
        riskScore: p.riskScore,
        totalEvents: events.length,
        handoffCount: handoffs.length,
        anomalyCount,
        avgTemperature: avgTemp,
        avgHumidity: avgHumidity,
        producerName: p.producerName,
        createdDate: createdAt.toISOString().slice(0, 10),
        createdMonth: `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`,
      };
    });

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Recall simulation ─────────────────────────────────────────────────────────
// POST /api/analytics/recall-simulation
router.post('/recall-simulation', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const startTime = Date.now();
    const { productId, producerId, category, dateFrom, dateTo } = req.body;

    if (!productId && !producerId && !category) {
      res.status(400).json({ message: 'Provide at least one of: productId, producerId, category.' });
      return;
    }

    const filter: any = {};
    if (productId) filter._id = productId;
    if (producerId) filter.producerId = producerId;
    if (category) filter.category = { $regex: new RegExp(category, 'i') };
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const affected = await Product.find(filter);

    const traces = await Promise.all(affected.map(async (p) => {
      const events = await Event.find({ productId: p._id }).sort({ createdAt: 1 });
      const locations = events.map(e => e.data?.location).filter(Boolean);
      const anomalyCount = events.reduce((n, e) => n + (e.data?.anomalies?.length || 0), 0);
      return {
        productId: p._id,
        name: p.name,
        producerName: p.producerName,
        category: p.category,
        status: p.status,
        riskScore: p.riskScore,
        eventsCount: events.length,
        currentLocation: locations[locations.length - 1] || 'Unknown',
        anomalyCount,
        lastActivity: events[events.length - 1]?.createdAt || p.createdAt,
        chainSummary: events.map(e => ({
          type: e.type,
          actor: e.actorName,
          role: e.actorRole,
          location: e.data?.location || '—',
          timestamp: e.createdAt,
          hash: e.hash.slice(0, 10) + '…',
          hasAnomalies: (e.data?.anomalies?.length || 0) > 0,
        })),
      };
    }));

    const blockchainMs = Date.now() - startTime;
    const totalEvents = traces.reduce((s, t) => s + t.eventsCount, 0);

    // Estimate how long a traditional centralised DB approach would take:
    // Assumes: sequential JOIN queries per product (~80ms), no hash verification, manual cross-org reconciliation
    const estimatedTraditionalMs = Math.round(affected.length * 80 + totalEvents * 25 + 2000 + Math.random() * 1500);

    res.json({
      simulationId: `sim-${Date.now()}`,
      criteria: { productId, producerId, category, dateFrom, dateTo },
      affectedCount: affected.length,
      totalEventsScanned: totalEvents,
      blockchainMs,
      estimatedTraditionalMs,
      speedupLabel: estimatedTraditionalMs > blockchainMs
        ? `${Math.round(estimatedTraditionalMs / Math.max(blockchainMs, 1))}× faster than traditional DB`
        : 'Comparable to traditional DB',
      traces,
      ranAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
