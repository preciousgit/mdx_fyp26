import { Router, Response } from 'express';
import { Product } from '../models/Product.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

function toProductResponse(doc: any) {
  return {
    id: doc._id,
    producerId: doc.producerId,
    producerName: doc.producerName,
    name: doc.name,
    description: doc.description,
    category: doc.category,
    packagingType: doc.packagingType,
    weight: doc.weight,
    size: doc.size,
    status: doc.status,
    riskScore: doc.riskScore,
    images: doc.images || [],
    video: doc.video || '',
    createdAt: doc.createdAt,
  };
}

// GET /api/products
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.producerId) filter.producerId = req.query.producerId;
    if (req.query.status) {
      const statuses = (req.query.status as string).split(',');
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products.map(toProductResponse));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(toProductResponse(product));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id, producerId, producerName, name, description, category, packagingType, weight, size, images, video } = req.body;
    const product = await Product.create({
      _id: id,
      producerId,
      producerName,
      name,
      description,
      category,
      packagingType,
      weight,
      size,
      status: 'registered',
      riskScore: 0,
      images: images || [],
      video: video || '',
    });
    res.json(toProductResponse(product));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, riskScore } = req.body;
    const update: any = {};
    if (status !== undefined) update.status = status;
    if (riskScore !== undefined) update.riskScore = riskScore;

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(toProductResponse(product));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
