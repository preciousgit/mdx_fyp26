import { connectDB } from '../server/db.js';
import app from '../server/index.js';

let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
