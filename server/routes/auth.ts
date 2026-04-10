import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

function toUserResponse(user: any) {
  return {
    uid: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    companyName: user.companyName || '',
    companyPrefix: user.companyPrefix || '',
    documentsVerified: user.documentsVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    walletAddress: user.walletAddress || '',
    address: user.address || '',
    avatar: user.avatar || '',
    createdAt: user.createdAt,
  };
}

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const { email, password, role, name, companyName, companyPrefix } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      role,
      name,
      companyName: companyName || '',
      companyPrefix: companyPrefix ? companyPrefix.toUpperCase() : '',
      documentsVerified: false,
      twoFactorEnabled: false,
    });
    const token = makeToken(user._id.toString());
    res.json({ token, user: toUserResponse(user) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = makeToken(user._id.toString());
    res.json({ token, user: toUserResponse(user) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Send one-time setup notifications if profile is incomplete
    const uid = user._id.toString();
    const roles = ['producer', 'distributor', 'regulator'];
    if (roles.includes(user.role)) {
      const existingSetup = await Notification.findOne({ userId: uid, type: 'SETUP' });
      if (!existingSetup) {
        // First time — send welcome + setup prompts
        const tasks: any[] = [
          { title: 'Welcome to TrustChain', message: `Your account is ready. Complete your profile to get started.`, type: 'SETUP', link: '/profile' },
        ];
        if (!user.address) {
          tasks.push({ title: 'Set your address', message: 'Add your Address / Location in your profile. It will appear on every audit trail event you create and enables the live map view.', type: 'SETUP', link: '/profile' });
        }
        if (!user.walletAddress) {
          tasks.push({ title: 'Connect your wallet', message: 'Connect a MetaMask wallet in your profile to pay platform fees and perform on-chain actions (Register, Handoff, Approve/Reject).', type: 'SETUP', link: '/profile' });
        }
        await Notification.insertMany(tasks.map(t => ({ userId: uid, ...t, read: false })));
      } else {
        // Already seen welcome — check if fields were completed since last check and send completion notification
        const addressPending = await Notification.findOne({ userId: uid, type: 'SETUP', title: 'Set your address', read: false });
        if (addressPending && user.address) {
          await Notification.findByIdAndUpdate(addressPending._id, { read: true });
          await Notification.create({ userId: uid, title: 'Address saved', message: `Your location "${user.address}" is now set and will appear on all audit trail events.`, type: 'SETUP_DONE', link: '/profile', read: false });
        }
        const walletPending = await Notification.findOne({ userId: uid, type: 'SETUP', title: 'Connect your wallet', read: false });
        if (walletPending && user.walletAddress) {
          await Notification.findByIdAndUpdate(walletPending._id, { read: true });
          await Notification.create({ userId: uid, title: 'Wallet connected', message: `MetaMask wallet ${user.walletAddress.slice(0,6)}…${user.walletAddress.slice(-4)} is linked to your account.`, type: 'SETUP_DONE', link: '/profile', read: false });
        }
      }
    }

    res.json(toUserResponse(user));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, companyName, phoneNumber, twoFactorEnabled, documentsVerified, walletAddress, address, avatar } = req.body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (companyName !== undefined) update.companyName = companyName;
    if (phoneNumber !== undefined) update.phoneNumber = phoneNumber;
    if (twoFactorEnabled !== undefined) update.twoFactorEnabled = twoFactorEnabled;
    if (documentsVerified !== undefined) update.documentsVerified = documentsVerified;
    if (walletAddress !== undefined) update.walletAddress = walletAddress;
    if (address !== undefined) update.address = address;
    if (avatar !== undefined) update.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(toUserResponse(user));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
