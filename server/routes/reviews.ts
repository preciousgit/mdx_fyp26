import { Router, Response } from 'express';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

function toReviewResponse(doc: any) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    productId: doc.productId,
    userId: doc.userId,
    userName: doc.userName,
    userRole: doc.userRole,
    rating: doc.rating,
    comment: doc.comment,
    likes: doc.likes || [],
    dislikes: doc.dislikes || [],
    likeCount: (doc.likes || []).length,
    dislikeCount: (doc.dislikes || []).length,
    replies: (doc.replies || []).map((r: any) => ({
      id: String(r._id),
      userId: r.userId,
      userName: r.userName,
      userRole: r.userRole,
      comment: r.comment,
      likes: r.likes || [],
      dislikes: r.dislikes || [],
      likeCount: (r.likes || []).length,
      dislikeCount: (r.dislikes || []).length,
      createdAt: r.createdAt,
    })),
    timestamp: doc.createdAt,
  };
}

// GET /api/reviews?productId=xxx
router.get('/', async (req, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.productId) filter.productId = req.query.productId;
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews.map(toReviewResponse));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reviews - Create a review
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    const user = await User.findById(req.userId) as any;

    const review = await Review.create({
      productId,
      userId: req.userId,
      userName: user?.name || 'Anonymous',
      userRole: user?.role || 'consumer',
      rating,
      comment,
      likes: [],
      dislikes: [],
      replies: [],
    });

    // Update product review aggregate score
    const allReviews = await Review.find({ productId }).select('rating').lean() as any[];
    const allRatings = allReviews.map((r: any) => r.rating);
    const avgScore = allRatings.length ? Math.round((allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length) * 10) / 10 : 0;
    await Product.findByIdAndUpdate(productId, { reviewScore: avgScore, reviewCount: allRatings.length });

    // Notify all stakeholders
    const product = await Product.findById(productId).lean() as any;
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const snippet = comment?.length > 80 ? comment.slice(0, 80) + '…' : comment;
    const reviewId = review._id.toString();
    const notifPayload = {
      title: `New review on ${product?.name || productId}`,
      message: `${user?.name || 'Anonymous'} rated ${stars} — "${snippet}"`,
      type: 'REVIEW',
      link: `/product/${productId}#review-${reviewId}`,
      read: false,
    };

    const recipientSet = new Set<string>();
    if (product?.producerId) recipientSet.add(String(product.producerId));
    const regulators = await User.find({ role: 'regulator' }).select('_id').lean() as any[];
    regulators.forEach((r: any) => recipientSet.add(r._id.toString()));
    const distributors = await User.find({ role: 'distributor' }).select('_id').lean() as any[];
    distributors.forEach((d: any) => recipientSet.add(d._id.toString()));
    const otherReviews = await Review.find({ productId }).select('userId').lean() as any[];
    otherReviews.forEach((r: any) => {
      if (r.userId && r.userId !== req.userId) recipientSet.add(String(r.userId));
    });

    const recipients = Array.from(recipientSet);
    if (recipients.length > 0) {
      await Notification.insertMany(recipients.map(userId => ({ userId, ...notifPayload }))).catch((err: any) => {
        console.error(`[REVIEW] Failed to create notifications:`, err.message);
      });
    }

    res.json(toReviewResponse(review));
  } catch (error: any) {
    console.error('[REVIEW] Error creating review:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reviews/:reviewId/replies - Add a reply to a review
router.post('/:reviewId/replies', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const user = await User.findById(req.userId) as any;
    const replyId = crypto.randomBytes(12).toString('hex');

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        $push: {
          replies: {
            _id: replyId,
            userId: req.userId,
            userName: user?.name || 'Anonymous',
            userRole: user?.role || 'consumer',
            comment,
            likes: [],
            dislikes: [],
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(toReviewResponse(review));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reviews/:reviewId/like - Like a review
router.post('/:reviewId/like', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userIdStr = String(req.userId);

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const likes = (review.likes as string[]).filter(id => id !== userIdStr);
    const dislikes = (review.dislikes as string[]).filter(id => id !== userIdStr);
    if (!(review.likes as string[]).includes(userIdStr)) likes.push(userIdStr);

    await Review.updateOne({ _id: review._id }, { $set: { likes, dislikes } });
    const updated = await Review.findById(review._id);
    res.json(toReviewResponse(updated));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reviews/:reviewId/dislike - Dislike a review
router.post('/:reviewId/dislike', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userIdStr = String(req.userId);

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const likes = (review.likes as string[]).filter(id => id !== userIdStr);
    const dislikes = (review.dislikes as string[]).filter(id => id !== userIdStr);
    if (!(review.dislikes as string[]).includes(userIdStr)) dislikes.push(userIdStr);

    await Review.updateOne({ _id: review._id }, { $set: { likes, dislikes } });
    const updated = await Review.findById(review._id);
    res.json(toReviewResponse(updated));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reviews/:reviewId/replies/:replyId/like - Like a reply
router.post('/:reviewId/replies/:replyId/like', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId, replyId } = req.params;
    const userIdStr = String(req.userId);

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const replies = (review.replies as any[]).map((r: any) => {
      if (String(r._id) !== replyId) return r.toObject ? r.toObject() : r;
      const likes = (r.likes as string[]).filter((id: string) => id !== userIdStr);
      const dislikes = (r.dislikes as string[]).filter((id: string) => id !== userIdStr);
      if (!(r.likes as string[]).includes(userIdStr)) likes.push(userIdStr);
      return { ...(r.toObject ? r.toObject() : r), likes, dislikes };
    });

    await Review.updateOne({ _id: review._id }, { $set: { replies } });
    const updated = await Review.findById(review._id);
    res.json(toReviewResponse(updated));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reviews/:reviewId/replies/:replyId/dislike - Dislike a reply
router.post('/:reviewId/replies/:replyId/dislike', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId, replyId } = req.params;
    const userIdStr = String(req.userId);

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const replies = (review.replies as any[]).map((r: any) => {
      if (String(r._id) !== replyId) return r.toObject ? r.toObject() : r;
      const likes = (r.likes as string[]).filter((id: string) => id !== userIdStr);
      const dislikes = (r.dislikes as string[]).filter((id: string) => id !== userIdStr);
      if (!(r.dislikes as string[]).includes(userIdStr)) dislikes.push(userIdStr);
      return { ...(r.toObject ? r.toObject() : r), likes, dislikes };
    });

    await Review.updateOne({ _id: review._id }, { $set: { replies } });
    const updated = await Review.findById(review._id);
    res.json(toReviewResponse(updated));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
