import { Router, Response } from 'express';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

function toEventResponse(doc: any) {
  return {
    id: doc._id,
    productId: doc.productId,
    type: doc.type,
    actorId: doc.actorId,
    actorName: doc.actorName,
    actorRole: doc.actorRole,
    data: doc.data,
    previousHash: doc.previousHash,
    hash: doc.hash,
    timestamp: doc.createdAt,
  };
}

// ─── Anomaly detection ─────────────────────────────────────────────────────────
async function detectAnomalies(type: string, data: any, productId: string, actorId: string): Promise<string[]> {
  const anomalies: string[] = [];
  if (type !== 'HANDOFF' || !data) return anomalies;

  // Temperature bounds
  if (data.temperature !== undefined) {
    if (data.temperature < -30 || data.temperature > 80) {
      anomalies.push(`Impossible temperature value: ${data.temperature}°C (sensor error suspected)`);
    } else if (data.temperature > 28) {
      anomalies.push(`High temperature: ${data.temperature}°C — cold-chain breach risk`);
    } else if (data.temperature < 0) {
      anomalies.push(`Sub-zero temperature: ${data.temperature}°C — verify storage requirement`);
    }
  }

  // Humidity bounds
  if (data.humidity !== undefined) {
    if (data.humidity < 0 || data.humidity > 100) {
      anomalies.push(`Invalid humidity value: ${data.humidity}% (sensor fault suspected)`);
    } else if (data.humidity > 85) {
      anomalies.push(`Critical humidity: ${data.humidity}% — spoilage and mould risk`);
    }
  }

  // Rapid duplicate: same actor + same product within 10 minutes
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await Event.findOne({ productId, actorId, createdAt: { $gte: tenMinAgo } });
  if (recent) {
    anomalies.push('Rapid re-submission: same actor logged an event within 10 minutes — verify authenticity');
  }

  return anomalies;
}

// GET /api/events?productId=xxx
router.get('/', async (req, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.productId) filter.productId = req.query.productId as string;
    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json(events.map(toEventResponse));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/events/latest?productId=xxx
router.get('/latest', async (req, res: Response) => {
  try {
    const event = await Event.findOne({ productId: req.query.productId as string }).sort({ createdAt: -1 });
    res.json({ hash: event ? event.hash : '0' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/events
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id, productId, type, actorId, actorName, actorRole, data, previousHash, hash } = req.body;

    // Always resolve the actor's real profile address so the audit trail
    // shows their actual location, not a placeholder like "Producer Facility"
    let resolvedLocation = data?.location || '';
    const GENERIC = /^(producer facility|distributor hub|regulatory office|warehouse|facility|hub|location|address)$/i;
    if (!resolvedLocation || GENERIC.test(resolvedLocation.trim())) {
      const actor = await User.findById(actorId).select('address').lean() as any;
      if (actor?.address) resolvedLocation = actor.address;
    }
    const locationEnrichedData = { ...data, location: resolvedLocation };

    // Run anomaly detection and embed results into event data
    const anomalies = await detectAnomalies(type, locationEnrichedData, productId, actorId);
    const enrichedData = anomalies.length > 0 ? { ...locationEnrichedData, anomalies } : locationEnrichedData;

    const event = await Event.create({
      _id: id,
      productId,
      type,
      actorId,
      actorName,
      actorRole,
      data: enrichedData,
      previousHash,
      hash,
    });
    res.json(toEventResponse(event));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
