import { Router, Response } from 'express';
import { Notification } from '../models/Notification.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

function toNotifResponse(doc: any) {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    title: doc.title,
    message: doc.message,
    read: doc.read,
    type: doc.type,
    link: doc.link || '',
    timestamp: doc.createdAt,
  };
}

// GET /api/notifications  (authenticated user's notifications)
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notifs = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(notifs.map(toNotifResponse));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/notifications
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, message, type, link } = req.body;
    const notif = await Notification.create({ userId, title, message, type: type || 'SYSTEM', link: link || '', read: false });
    res.json(toNotifResponse(notif));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/notifications/review-counts  — unread REVIEW notif count grouped by productId (from link)
router.get('/review-counts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notifs = await Notification.find({ userId: req.userId, type: 'REVIEW', read: false }).lean();
    const counts: Record<string, number> = {};
    for (const n of notifs) {
      // link is /product/:id
      const match = (n as any).link?.match(/\/product\/(.+)/);
      if (match) counts[match[1]] = (counts[match[1]] || 0) + 1;
    }
    res.json(counts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/notifications/:id  (mark as read)
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notif) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    res.json(toNotifResponse(notif));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
