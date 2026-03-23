import jwt from 'jsonwebtoken';
import { redis } from '../config/redis.js';
import { config } from '../config/env.js';
import { userRepository, otpRepository } from '../repositories/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { User, AuthTokens } from '../types/index.js';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateTokens(userId: string, phone: string): AuthTokens {
  const token = jwt.sign({ id: userId, phone }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ id: userId, phone, type: 'refresh' }, config.jwt.secret, {
    expiresIn: '7d',
  });

  return { token, refreshToken, expiresIn: 604800 };
}

export class AuthService {
  async register(phone: string, name?: string, email?: string) {
    let user = await userRepository.findByPhone(phone);

    if (!user) {
      user = await userRepository.create({ phone, name, email });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpRepository.create({ phone, otp, purpose: 'login', expiresAt });
    await redis.setex(`otp:${phone}`, 300, otp);

    console.log(`OTP for ${phone}: ${otp}`);

    return { userId: user.id, otpSent: true };
  }

  async verifyOtp(phone: string, otp: string) {
    const storedOtp = await redis.get(`otp:${phone}`);

    if (!storedOtp || storedOtp !== otp) {
      throw new AppError(401, 'Invalid or expired OTP', 'INVALID_OTP');
    }

    const otpRecord = await otpRepository.findValid(phone, otp);

    if (!otpRecord) {
      throw new AppError(401, 'OTP expired', 'OTP_EXPIRED');
    }

    await otpRepository.markAsUsed(otpRecord.id);
    await redis.del(`otp:${phone}`);

    let user = await userRepository.findByPhone(phone);

    if (!user) {
      user = await userRepository.create({ phone, isVerified: true });
    } else {
      user = await userRepository.update(user.id, { isVerified: true, lastLoginAt: new Date() });
    }

    const tokens = generateTokens(user.id, user.phone);

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError(400, 'Refresh token required', 'REFRESH_TOKEN_REQUIRED');
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret) as { id: string; phone: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
    }

    return generateTokens(user.id, user.phone);
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodType: user.bloodType,
      allergies: user.allergies,
      chronicConditions: user.chronicConditions,
      isVerified: user.isVerified,
      preferredLanguage: user.preferredLanguage,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: Partial<User>) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const updated = await userRepository.update(userId, {
      name: data.name,
      email: data.email,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      bloodType: data.bloodType,
      allergies: data.allergies,
      chronicConditions: data.chronicConditions,
    });

    return {
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      email: updated.email,
    };
  }
}

export class UserService {
  async getAddresses(userId: string) {
    return userRepository.getAddresses(userId);
  }

  async addAddress(
    userId: string,
    data: {
      label?: string;
      fullName: string;
      phone?: string;
      addressLine1: string;
      addressLine2?: string;
      landmark?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      addressType?: string;
      isDefault?: boolean;
    }
  ) {
    if (data.isDefault) {
      const addresses = await userRepository.getAddresses(userId);
      for (const addr of addresses) {
        if (addr.isDefault) {
          await userRepository.updateAddress(addr.id, { isDefault: false });
        }
      }
    }

    return userRepository.createAddress(userId, data);
  }

  async updateAddress(id: string, userId: string, data: Partial<{ label: string; fullName: string }>) {
    const addresses = await userRepository.getAddresses(userId);
    const address = addresses.find((a) => a.id === id);

    if (!address) {
      throw new AppError(404, 'Address not found', 'ADDRESS_NOT_FOUND');
    }

    return userRepository.updateAddress(id, data);
  }

  async deleteAddress(id: string, userId: string) {
    const addresses = await userRepository.getAddresses(userId);
    const address = addresses.find((a) => a.id === id);

    if (!address) {
      throw new AppError(404, 'Address not found', 'ADDRESS_NOT_FOUND');
    }

    return userRepository.deleteAddress(id);
  }

  async setDefaultAddress(id: string, userId: string) {
    const addresses = await userRepository.getAddresses(userId);
    const address = addresses.find((a) => a.id === id);

    if (!address) {
      throw new AppError(404, 'Address not found', 'ADDRESS_NOT_FOUND');
    }

    return userRepository.setDefaultAddress(userId, id);
  }
}

export const authService = new AuthService();
export const userService = new UserService();
