import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images and videos are allowed'));
  },
});

const router = Router();

router.post('/', requireAuth, upload.array('files', 10), (req: AuthRequest, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const urls = files.map(f => `/uploads/${f.filename}`);
    res.json({ urls });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
