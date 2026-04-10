import { Router, Response, Request } from 'express';
import { Contact } from '../models/Contact.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    await Contact.create({ name, email, subject, message });
    res.json({ success: true, message: 'Message received. We will get back to you shortly.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
