import type { Request, Response, NextFunction } from 'express';
import { authService, userService } from '../services/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const getParam = (param: string | string[] | undefined): string => param as string;

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
      });

      const { phone, name, email } = schema.parse(req.body);
      const result = await authService.register(phone, name, email);

      res.status(201).json({
        success: true,
        message: 'OTP sent to registered phone',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
        otp: z.string().length(6).regex(/^\d+$/),
      });

      const { phone, otp } = schema.parse(req.body);
      const result = await authService.verifyOtp(phone, otp);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: AuthRequest, res: Response) {
    res.json({ success: true, message: 'Logged out successfully' });
  }
}

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.id);

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
        dateOfBirth: z.coerce.date().optional(),
        gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
        bloodType: z.string().optional(),
        allergies: z.array(z.string()).optional(),
        chronicConditions: z.array(z.string()).optional(),
      });

      const data = schema.parse(req.body);
      const user = await authService.updateProfile(req.user!.id, data);

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getAddresses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addresses = await userService.getAddresses(req.user!.id);
      res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        label: z.enum(['Home', 'Work', 'Other']).default('Home'),
        fullName: z.string().min(1).max(255),
        phone: z.string().optional(),
        addressLine1: z.string().min(1).max(255),
        addressLine2: z.string().optional(),
        landmark: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.string().min(1).max(100),
        postalCode: z.string().min(1).max(20),
        country: z.string().default('India'),
        addressType: z.enum(['delivery', 'pickup']).default('delivery'),
        isDefault: z.boolean().default(false),
      });

      const data = schema.parse(req.body);
      const address = await userService.addAddress(req.user!.id, data);

      res.status(201).json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const schema = z.object({
        label: z.string().optional(),
        fullName: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const address = await userService.updateAddress(id, req.user!.id, data);

      res.json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      await userService.deleteAddress(id, req.user!.id);

      res.json({ success: true, message: 'Address deleted' });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const address = await userService.setDefaultAddress(id, req.user!.id);

      res.json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export const userController = new UserController();
