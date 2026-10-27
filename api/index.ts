import { connectDB } from '../server/db.js';
import app from '../server/index.js';

let connection: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
  try {
    // Reuse one connection per warm function instance; retry on the next request if it failed.
    connection = connection ?? connectDB();
    await connection;
  } catch (err) {
    connection = null;
    console.error('[api] database connection failed', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Service temporarily unavailable. Please try again shortly.' }));
    return;
  }
  return app(req, res);
}
