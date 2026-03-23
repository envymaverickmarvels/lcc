import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  }

  async create(data: { phone: string; name?: string; email?: string; isVerified?: boolean }) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Partial<Prisma.UserUpdateInput>) {
    return prisma.user.update({ where: { id }, data });
  }

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(userId: string, data: Partial<Prisma.AddressCreateInput>) {
    return prisma.address.create({
      data: { ...data, userId } as Prisma.AddressCreateInput,
    });
  }

  async updateAddress(id: string, data: Partial<Prisma.AddressUpdateInput>) {
    return prisma.address.update({ where: { id }, data });
  }

  async deleteAddress(id: string) {
    return prisma.address.delete({ where: { id } });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    return prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}

export class PharmacyRepository {
  async findById(id: string) {
    return prisma.pharmacy.findUnique({
      where: { id },
      include: {
        operatingHours: true,
        photos: { where: { isPrimary: true }, take: 1 },
      },
    });
  }

  async findByOwnerId(ownerId: string) {
    return prisma.pharmacy.findFirst({ where: { ownerId } });
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number,
    options?: { is24h?: boolean; limit?: number; offset?: number }
  ) {
    const radiusMeters = radiusKm * 1000;
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const pharmacies = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        address: string;
        phone: string | null;
        openingTime: string;
        closingTime: string;
        is24h: boolean;
        rating: Prisma.Decimal;
        totalReviews: number;
        distance: number;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        p.address,
        p.phone,
        p."openingTime",
        p."closingTime",
        p."is24h",
        p.rating,
        p."totalReviews",
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000 as distance
      FROM pharmacies p
      WHERE p.is_active = TRUE
        AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
        ${options?.is24h ? Prisma.sql`AND p."is24h" = true` : Prisma.sql``}
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return pharmacies;
  }

  async find24h(lat: number, lng: number, radiusKm: number) {
    const radiusMeters = radiusKm * 1000;

    const pharmacies = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        address: string;
        phone: string | null;
        rating: Prisma.Decimal;
        distance: number;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        p.address,
        p.phone,
        p.rating,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000 as distance
      FROM pharmacies p
      WHERE p.is_active = TRUE
        AND p."is24h" = true
        AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
      ORDER BY distance ASC
      LIMIT 50
    `;

    return pharmacies;
  }

  async update(id: string, data: Partial<Prisma.PharmacyUpdateInput>) {
    return prisma.pharmacy.update({ where: { id }, data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(data: any) {
    return prisma.pharmacy.create({ data });
  }

  async getMedicines(
    pharmacyId: string,
    options?: { search?: string; category?: string; limit?: number; offset?: number }
  ) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const stockItems = await prisma.pharmacyStock.findMany({
      where: {
        pharmacyId,
        isAvailable: true,
        stockQuantity: { gt: 0 },
        ...(options?.search && {
          medicine: {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { genericName: { contains: options.search, mode: 'insensitive' } },
            ],
          },
        }),
        ...(options?.category && {
          medicine: { category: options.category },
        }),
      },
      include: { medicine: true },
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    });

    return stockItems;
  }

  async getMedicineCount(pharmacyId: string) {
    return prisma.pharmacyStock.count({
      where: { pharmacyId, isAvailable: true, stockQuantity: { gt: 0 } },
    });
  }
}

export class MedicineRepository {
  async findById(id: string) {
    return prisma.medicine.findUnique({
      where: { id },
      include: {
        alternatives: { include: { alternative: true } },
      },
    });
  }

  async findByName(name: string) {
    return prisma.medicine.findFirst({
      where: {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { genericName: { contains: name, mode: 'insensitive' } },
        ],
      },
    });
  }

  async search(query: string, options?: { category?: string; limit?: number }) {
    const limit = options?.limit || 20;

    return prisma.medicine.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
          { manufacturer: { contains: query, mode: 'insensitive' } },
        ],
        ...(options?.category && { category: options.category }),
      },
      take: limit,
    });
  }

  async getSuggestions(query: string, limit = 10) {
    return prisma.medicine.findMany({
      where: {
        OR: [
          { name: { startsWith: query, mode: 'insensitive' } },
          { genericName: { startsWith: query, mode: 'insensitive' } },
        ],
      },
      select: { name: true, genericName: true, manufacturer: true, category: true },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async getCategories() {
    return prisma.medicineCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 50,
    });
  }

  async findEssential() {
    return prisma.medicine.findMany({
      where: { isEssential: true },
      take: 20,
    });
  }

  async findByIds(ids: string[]) {
    return prisma.medicine.findMany({
      where: { id: { in: ids } },
    });
  }
}

export class StockRepository {
  async findByPharmacyAndMedicine(pharmacyId: string, medicineId: string) {
    return prisma.pharmacyStock.findFirst({
      where: { pharmacyId, medicineId },
    });
  }

  async findAvailable(pharmacyId: string, medicineIds: string[]) {
    return prisma.pharmacyStock.findMany({
      where: {
        pharmacyId,
        medicineId: { in: medicineIds },
        isAvailable: true,
        stockQuantity: { gt: 0 },
      },
      include: { medicine: true },
    });
  }

  async searchNearbyWithStock(
    medicineIds: string[],
    lat: number,
    lng: number,
    radiusKm: number,
    options?: { is24h?: boolean; sortBy?: 'distance' | 'price' | 'rating'; limit?: number; offset?: number }
  ) {
    const radiusMeters = radiusKm * 1000;
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    let orderBy;
    switch (options?.sortBy) {
      case 'price':
        orderBy = Prisma.sql`ps.selling_price ASC`;
        break;
      case 'rating':
        orderBy = Prisma.sql`p.rating DESC`;
        break;
      default:
        orderBy = Prisma.sql`distance ASC`;
    }

    const pharmacies = await prisma.$queryRaw<
      Array<{
        pharmacyId: string;
        name: string;
        address: string;
        phone: string | null;
        openingTime: string;
        closingTime: string;
        is24h: boolean;
        rating: Prisma.Decimal;
        distance: number;
        stock: number;
        price: Prisma.Decimal;
      }>
    >`
      SELECT 
        p.id as "pharmacyId",
        p.name,
        p.address,
        p.phone,
        p."openingTime",
        p."closingTime",
        p."is24h",
        p.rating,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000 as distance,
        ps.stock_quantity as stock,
        ps.selling_price as price
      FROM pharmacies p
      JOIN pharmacy_stock ps ON p.id = ps.pharmacy_id
      WHERE ps.medicine_id IN (${Prisma.join(medicineIds)})
        AND ps.stock_quantity > 0
        AND p.is_active = TRUE
        AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
        ${options?.is24h ? Prisma.sql`AND p."is24h" = true` : Prisma.sql``}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return pharmacies;
  }

  async create(data: Partial<Prisma.PharmacyStockCreateInput>) {
    return prisma.pharmacyStock.create({
      data: data as Prisma.PharmacyStockCreateInput,
    });
  }

  async update(id: string, data: Partial<Prisma.PharmacyStockUpdateInput>) {
    return prisma.pharmacyStock.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.pharmacyStock.delete({ where: { id } });
  }

  async findByPharmacy(pharmacyId: string, options?: { lowStock?: boolean; limit?: number; offset?: number }) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return prisma.pharmacyStock.findMany({
      where: {
        pharmacyId,
        ...(options?.lowStock && {
          isAvailable: true,
          stockQuantity: { lte: 10 },
        }),
      },
      include: { medicine: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countByPharmacy(pharmacyId: string, options?: { lowStock?: boolean }) {
    return prisma.pharmacyStock.count({
      where: {
        pharmacyId,
        ...(options?.lowStock && {
          isAvailable: true,
          stockQuantity: { lte: 10 },
        }),
      },
    });
  }

  async decrementStock(id: string, quantity: number) {
    return prisma.pharmacyStock.update({
      where: { id },
      data: { stockQuantity: { decrement: quantity } },
    });
  }
}

export class OrderRepository {
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { medicine: true } },
        pharmacy: { select: { name: true, phone: true, address: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  async findByUser(userId: string, options?: { status?: string; limit?: number; offset?: number }) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return prisma.order.findMany({
      where: { userId, ...(options?.status && { status: options.status }) },
      include: {
        items: true,
        pharmacy: { select: { name: true, address: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findByPharmacy(pharmacyId: string, options?: { status?: string; limit?: number; offset?: number }) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return prisma.order.findMany({
      where: { pharmacyId, ...(options?.status && { status: options.status }) },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async create(data: Partial<Prisma.OrderCreateInput>) {
    return prisma.order.create({
      data: data as Prisma.OrderCreateInput,
      include: {
        items: true,
        pharmacy: { select: { name: true, phone: true, address: true } },
      },
    });
  }

  async update(id: string, data: Partial<Prisma.OrderUpdateInput>) {
    return prisma.order.update({ where: { id }, data });
  }

  async countByUser(userId: string) {
    return prisma.order.count({ where: { userId } });
  }

  async countByPharmacy(pharmacyId: string, options?: { status?: string; since?: Date }) {
    return prisma.order.count({
      where: {
        pharmacyId,
        ...(options?.status && { status: options.status }),
        ...(options?.since && { createdAt: { gte: options.since } }),
      },
    });
  }

  async getTodayStats(pharmacyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, completedOrders, todayRevenue] = await Promise.all([
      prisma.order.count({ where: { pharmacyId, createdAt: { gte: today } } }),
      prisma.order.count({ where: { pharmacyId, status: 'confirmed' } }),
      prisma.order.count({ where: { pharmacyId, status: 'completed' } }),
      prisma.order.aggregate({
        where: { pharmacyId, status: 'completed', createdAt: { gte: today } },
        _sum: { totalAmount: true },
      }),
    ]);

    return { todayOrders, pendingOrders, completedOrders, todayRevenue: todayRevenue._sum.totalAmount || 0 };
  }

  async getAnalytics(pharmacyId: string, startDate: Date) {
    const [totalOrders, completedOrders, cancelledOrders, totalRevenue, topMedicines, dailyOrders] =
      await Promise.all([
        prisma.order.count({ where: { pharmacyId, createdAt: { gte: startDate } } }),
        prisma.order.count({ where: { pharmacyId, status: 'completed', createdAt: { gte: startDate } } }),
        prisma.order.count({ where: { pharmacyId, status: 'cancelled', createdAt: { gte: startDate } } }),
        prisma.order.aggregate({
          where: { pharmacyId, status: 'completed', createdAt: { gte: startDate } },
          _sum: { totalAmount: true },
        }),
        prisma.orderItem.groupBy({
          by: ['medicineName'],
          where: { order: { pharmacyId, createdAt: { gte: startDate } } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        }),
        prisma.$queryRaw<
          Array<{ date: Date; orders: bigint; revenue: Prisma.Decimal }>
        >`
          SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
          FROM orders
          WHERE pharmacy_id = ${pharmacyId}
            AND created_at >= ${startDate}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
      ]);

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      topMedicines,
      dailyOrders,
    };
  }
}

export class PrescriptionRepository {
  async findById(id: string) {
    return prisma.prescription.findUnique({
      where: { id },
      include: { medicines: { include: { medicine: true } } },
    });
  }

  async findByUser(userId: string, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return prisma.prescription.findMany({
      where: { userId },
      include: { medicines: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async create(data: { userId: string; imageUrl: string; thumbnailUrl?: string; status: string }) {
    return prisma.prescription.create({ data });
  }

  async update(id: string, data: Partial<Prisma.PrescriptionUpdateInput>) {
    return prisma.prescription.update({ where: { id }, data });
  }

  async addMedicine(
    prescriptionId: string,
    data: Partial<Prisma.PrescriptionMedicineCreateInput>
  ) {
    return prisma.prescriptionMedicine.create({
      data: { ...data, prescriptionId } as Prisma.PrescriptionMedicineCreateInput,
    });
  }

  async updateMedicine(id: string, data: Partial<Prisma.PrescriptionMedicineUpdateInput>) {
    return prisma.prescriptionMedicine.update({ where: { id }, data });
  }

  async findMedicineById(id: string) {
    return prisma.prescriptionMedicine.findUnique({ where: { id } });
  }
}

export class NotificationRepository {
  async findByUser(userId: string, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async create(data: { userId: string; type: string; title: string; message: string; data?: Prisma.InputJsonValue }) {
    return prisma.notification.create({ data });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export class OtpRepository {
  async create(data: { phone: string; otp: string; purpose: string; expiresAt: Date }) {
    return prisma.otp.create({ data });
  }

  async findValid(phone: string, otp: string) {
    return prisma.otp.findFirst({
      where: { phone, otp, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsUsed(id: string) {
    return prisma.otp.update({ where: { id }, data: { isUsed: true } });
  }
}

export class ReviewRepository {
  async create(data: { pharmacyId: string; userId: string; rating: number; comment?: string }) {
    return prisma.pharmacyReview.create({ data });
  }

  async findByPharmacy(pharmacyId: string, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return prisma.pharmacyReview.findMany({
      where: { pharmacyId },
      include: { pharmacy: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getAverageRating(pharmacyId: string) {
    const result = await prisma.pharmacyReview.aggregate({
      where: { pharmacyId },
      _avg: { rating: true },
      _count: true,
    });
    return { average: result._avg.rating || 0, count: result._count };
  }
}

export const userRepository = new UserRepository();
export const pharmacyRepository = new PharmacyRepository();
export const medicineRepository = new MedicineRepository();
export const stockRepository = new StockRepository();
export const orderRepository = new OrderRepository();
export const prescriptionRepository = new PrescriptionRepository();
export const notificationRepository = new NotificationRepository();
export const otpRepository = new OtpRepository();
export const reviewRepository = new ReviewRepository();
