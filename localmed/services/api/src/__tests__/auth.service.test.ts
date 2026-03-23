import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/auth.service.js';
import { userRepository, otpRepository } from '../repositories/index.js';

vi.mock('../repositories/index.js');
vi.mock('../config/redis.js', () => ({
  redis: {
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  },
}));
vi.mock('../config/env.js', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '7d',
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should create new user and send OTP', async () => {
      const mockUser = {
        id: 'user-123',
        phone: '+919876543210',
        name: 'Test User',
        isVerified: false,
      };

      (userRepository.findByPhone as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (userRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (otpRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'otp-1' });

      const result = await authService.register('+919876543210', 'Test User');

      expect(result).toEqual({
        userId: 'user-123',
        otpSent: true,
      });
      expect(userRepository.findByPhone).toHaveBeenCalledWith('+919876543210');
      expect(userRepository.create).toHaveBeenCalled();
      expect(otpRepository.create).toHaveBeenCalled();
    });

    it('should return existing user if phone exists', async () => {
      const mockUser = {
        id: 'user-123',
        phone: '+919876543210',
        name: 'Existing User',
        isVerified: true,
      };

      (userRepository.findByPhone as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (otpRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'otp-1' });

      const result = await authService.register('+919876543210');

      expect(result.userId).toBe('user-123');
      expect(result.otpSent).toBe(true);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return tokens', async () => {
      const mockUser = {
        id: 'user-123',
        phone: '+919876543210',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockRedis = await import('../config/redis.js');
      (mockRedis.redis.get as ReturnType<typeof vi.fn>).mockResolvedValue('123456');
      (otpRepository.findValid as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'otp-1',
        expiresAt: new Date(Date.now() + 300000),
      });
      (otpRepository.markAsUsed as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (userRepository.findByPhone as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (userRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      const result = await authService.verifyOtp('+919876543210', '123456');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe('user-123');
    });

    it('should throw error for invalid OTP', async () => {
      const mockRedis = await import('../config/redis.js');
      (mockRedis.redis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(authService.verifyOtp('+919876543210', '123456')).rejects.toThrow(
        'Invalid or expired OTP'
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-123',
        phone: '+919876543210',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: null,
        dateOfBirth: null,
        gender: null,
        bloodType: null,
        allergies: [],
        chronicConditions: [],
        isVerified: true,
        preferredLanguage: 'en',
        lastLoginAt: new Date(),
        createdAt: new Date(),
      };

      (userRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await authService.getProfile('user-123');

      expect(result.id).toBe('user-123');
      expect(result.phone).toBe('+919876543210');
    });

    it('should throw error if user not found', async () => {
      (userRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(authService.getProfile('user-123')).rejects.toThrow('User not found');
    });
  });
});
