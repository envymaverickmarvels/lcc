import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { AppError } from './errorHandler.js';

const WINDOW_MS = 60 * 1000;

const limits = {
  general: 100,
  auth: 5,
  search: 30,
  order: 10,
};

function getRateLimitKey(req: Request, type: string): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ratelimit:${type}:${ip}`;
}

export const rateLimiter = {
  general: async (req: Request, res: Response, next: NextFunction) => {
    await rateLimitMiddleware(req, res, next, 'general');
  },
  auth: async (req: Request, res: Response, next: NextFunction) => {
    await rateLimitMiddleware(req, res, next, 'auth');
  },
  search: async (req: Request, res: Response, next: NextFunction) => {
    await rateLimitMiddleware(req, res, next, 'search');
  },
  order: async (req: Request, res: Response, next: NextFunction) => {
    await rateLimitMiddleware(req, res, next, 'order');
  },
};

async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  type: string
) {
  try {
    const key = getRateLimitKey(req, type);
    const limit = limits[type as keyof typeof limits] || limits.general;
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.pexpire(key, WINDOW_MS);
    }
    
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    
    if (current > limit) {
      throw new AppError(429, 'Too many requests. Please try again later.', 'RATE_LIMITED');
    }
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    next();
  }
}
