import {
  orderRepository,
  stockRepository,
  pharmacyRepository,
  userRepository,
  notificationRepository,
} from '../repositories/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type {
  CreateOrderInput,
  OrderWithItems,
  OrderStatus,
  PharmacyStats,
  AnalyticsData,
} from '../types/index.js';

export class OrderService {
  async create(userId: string, input: CreateOrderInput): Promise<OrderWithItems> {
    const pharmacy = await pharmacyRepository.findById(input.pharmacyId);

    if (!pharmacy || !pharmacy.isActive) {
      throw new AppError(404, 'Pharmacy not found or unavailable', 'PHARMACY_NOT_FOUND');
    }

    if (input.type === 'delivery' && !pharmacy.isDelivery) {
      throw new AppError(400, 'This pharmacy does not offer delivery', 'DELIVERY_NOT_AVAILABLE');
    }

    const medicineIds = input.items.map((i) => i.medicineId);
    const stockItems = await stockRepository.findAvailable(input.pharmacyId, medicineIds);

    for (const item of input.items) {
      const stock = stockItems.find((s) => s.medicineId === item.medicineId);
      if (!stock || stock.stockQuantity < item.quantity) {
        throw new AppError(
          409,
          `Medicine ${item.medicineId} is out of stock or insufficient`,
          'OUT_OF_STOCK'
        );
      }
    }

    const orderNumber = `LM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    let subtotal = 0;
    const orderItems = [];

    for (const item of input.items) {
      const stock = stockItems.find((s) => s.medicineId === item.medicineId)!;
      const total = Number(stock.sellingPrice) * item.quantity;
      subtotal += total;

      orderItems.push({
        medicineId: item.medicineId,
        pharmacyStockId: stock.id,
        medicineName: stock.medicine.name,
        quantity: item.quantity,
        price: stock.sellingPrice,
        total,
      });

      await stockRepository.decrementStock(stock.id, item.quantity);
    }

    const deliveryFee = input.type === 'delivery' && pharmacy.deliveryRadiusKm ? 50 : 0;
    const totalAmount = subtotal + deliveryFee;

    const estimatedPickupTime =
      input.type === 'pickup'
        ? new Date(Date.now() + 20 * 60 * 1000)
        : new Date(Date.now() + 45 * 60 * 1000);

    const order = await orderRepository.create({
      orderNumber,
      user: { connect: { id: userId } },
      pharmacy: { connect: { id: input.pharmacyId } },
      type: input.type,
      status: 'confirmed',
      deliveryAddress: input.deliveryAddress ? JSON.stringify(input.deliveryAddress) : undefined,
      subtotal,
      deliveryFee,
      totalAmount,
      prescriptionId: input.prescriptionId,
      notes: input.notes,
      estimatedPickupTime,
      items: {
        create: orderItems,
      },
    });

    await notificationRepository.create({
      userId,
      type: 'order_confirmed',
      title: 'Order Confirmed',
      message: `Your order ${orderNumber} has been confirmed.`,
      data: { orderId: order.id },
    });

    return order as unknown as OrderWithItems;
  }

  async getById(orderId: string, userId: string) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'Access denied', 'ACCESS_DENIED');
    }

    return this.formatOrder(order);
  }

  async getUserOrders(userId: string, options?: { status?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const orders = await orderRepository.findByUser(userId, { status: options?.status, limit, offset });
    const total = await orderRepository.countByUser(userId);

    return {
      orders: orders.map(this.formatOrder),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async cancel(orderId: string, userId: string, reason: string) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'Access denied', 'ACCESS_DENIED');
    }

    if (order.status === 'preparing' || order.status === 'ready' || order.status === 'completed') {
      throw new AppError(400, 'Cannot cancel order at this stage. Please call the pharmacy.', 'CANNOT_CANCEL');
    }

    await orderRepository.update(orderId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    return { success: true, message: 'Order cancelled successfully' };
  }

  async reorder(orderId: string, userId: string) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'Access denied', 'ACCESS_DENIED');
    }

    const items = order.items.map((item) => ({
      medicineId: item.medicineId,
      quantity: item.quantity,
    }));

    return {
      pharmacyId: order.pharmacyId,
      items,
      pharmacy: order.pharmacy,
    };
  }

  private formatOrder(order: {
    id: string;
    orderNumber: string;
    status: string;
    type: string;
    totalAmount: unknown;
    subtotal: unknown;
    deliveryFee: unknown;
    discount: unknown;
    notes: string | null;
    estimatedPickupTime: Date | null;
    pickedUpAt: Date | null;
    cancelledAt: Date | null;
    cancellationReason: string | null;
    createdAt: Date;
    items: Array<{
      id: string;
      medicineId: string;
      quantity: number;
      price: unknown;
      total: unknown;
      medicine?: { id: string; name: string };
    }>;
    pharmacy?: { name: string; phone: string | null; address: string };
    user?: { id: string; name: string | null; phone: string | null };
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      totalAmount: Number(order.totalAmount),
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      discount: Number(order.discount),
      notes: order.notes,
      estimatedPickupTime: order.estimatedPickupTime,
      pickedUpAt: order.pickedUpAt,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        medicineId: item.medicineId,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
        medicineName: item.medicine?.name,
      })),
      pharmacy: order.pharmacy,
      customer: order.user,
    };
  }
}

export class PharmacyOrderService {
  async getPharmacyByOwner(ownerId: string) {
    const pharmacy = await pharmacyRepository.findByOwnerId(ownerId);

    if (!pharmacy) {
      throw new AppError(404, 'Pharmacy not found', 'PHARMACY_NOT_FOUND');
    }

    return pharmacy;
  }

  async getOrders(ownerId: string, options?: { status?: string; page?: number; limit?: number }) {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const orders = await orderRepository.findByPharmacy(pharmacy.id, {
      status: options?.status,
      limit,
      offset,
    });

    const total = await orderRepository.countByPharmacy(pharmacy.id, { status: options?.status });

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        totalAmount: Number(order.totalAmount),
        estimatedPickupTime: order.estimatedPickupTime,
        createdAt: order.createdAt,
        customer: order.user,
        items: order.items,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(ownerId: string): Promise<PharmacyStats> {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    const { todayOrders, pendingOrders, completedOrders, todayRevenue } =
      await orderRepository.getTodayStats(pharmacy.id);

    const lowStockCount = await stockRepository.countByPharmacy(pharmacy.id, { lowStock: true });

    return {
      todayOrders,
      pendingOrders,
      completedOrders,
      lowStockItems: lowStockCount,
      todayRevenue: Number(todayRevenue),
    };
  }

  async updateStatus(ownerId: string, orderId: string, status: OrderStatus) {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    const order = await orderRepository.findById(orderId);

    if (!order || order.pharmacyId !== pharmacy.id) {
      throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    const updateData: Record<string, unknown> = { status };

    if (status === 'completed') {
      updateData.pickedUpAt = new Date();
    }

    const updated = await orderRepository.update(orderId, updateData);

    const user = await userRepository.findById(order.userId);
    if (user) {
      const statusMessages: Record<string, { title: string; message: string }> = {
        preparing: { title: 'Order Being Prepared', message: `Your order ${order.orderNumber} is being prepared.` },
        ready: { title: 'Order Ready for Pickup', message: `Your order ${order.orderNumber} is ready!` },
        completed: { title: 'Order Completed', message: `Your order ${order.orderNumber} has been completed.` },
        cancelled: { title: 'Order Cancelled', message: `Your order ${order.orderNumber} has been cancelled.` },
      };

      const msg = statusMessages[status];
      if (msg) {
        await notificationRepository.create({
          userId: order.userId,
          type: `order_${status}`,
          title: msg.title,
          message: msg.message,
          data: { orderId },
        });
      }
    }

    return updated;
  }
}

export class InventoryService {
  async getPharmacyByOwner(ownerId: string) {
    const pharmacy = await pharmacyRepository.findByOwnerId(ownerId);

    if (!pharmacy) {
      throw new AppError(404, 'Pharmacy not found', 'PHARMACY_NOT_FOUND');
    }

    return pharmacy;
  }

  async getStock(
    ownerId: string,
    options?: { search?: string; category?: string; lowStock?: boolean; page?: number; limit?: number }
  ) {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const stockItems = await stockRepository.findByPharmacy(pharmacy.id, {
      lowStock: options?.lowStock,
      limit,
      offset,
    });

    const total = await stockRepository.countByPharmacy(pharmacy.id, { lowStock: options?.lowStock });

    return {
      items: stockItems.map((item) => ({
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.name,
        genericName: item.medicine.genericName,
        category: item.medicine.category,
        stock: item.stockQuantity,
        reorderLevel: item.reorderLevel,
        price: Number(item.sellingPrice),
        mrp: item.mrp ? Number(item.mrp) : undefined,
        expiryDate: item.expiryDate,
        isAvailable: item.isAvailable,
        isLowStock: item.stockQuantity <= item.reorderLevel,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async addStock(
    ownerId: string,
    data: {
      medicineId: string;
      stockQuantity: number;
      sellingPrice: number;
      mrp?: number;
      costPrice?: number;
      batchNumber?: string;
      expiryDate?: string;
      reorderLevel?: number;
    }
  ) {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    const existingStock = await stockRepository.findByPharmacyAndMedicine(pharmacy.id, data.medicineId);

    if (existingStock) {
      return stockRepository.update(existingStock.id, {
        stockQuantity: { increment: data.stockQuantity },
        sellingPrice: data.sellingPrice,
        mrp: data.mrp,
        costPrice: data.costPrice,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        isAvailable: true,
        lastRestockedAt: new Date(),
      });
    }

    return stockRepository.create({
      pharmacy: { connect: { id: pharmacy.id } },
      medicine: { connect: { id: data.medicineId } },
      stockQuantity: data.stockQuantity,
      sellingPrice: data.sellingPrice,
      mrp: data.mrp,
      costPrice: data.costPrice,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      reorderLevel: data.reorderLevel || 10,
      lastRestockedAt: new Date(),
    });
  }

  async updateStock(
    ownerId: string,
    stockId: string,
    data: { stockQuantity?: number; sellingPrice?: number; isAvailable?: boolean; reorderLevel?: number }
  ) {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    const stock = await stockRepository.findByPharmacyAndMedicine(pharmacy.id, '');

    if (!stock || stock.id !== stockId) {
      throw new AppError(404, 'Stock item not found', 'STOCK_NOT_FOUND');
    }

    return stockRepository.update(stockId, data);
  }

  async deleteStock(ownerId: string, stockId: string) {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    const stock = await stockRepository.findByPharmacyAndMedicine(pharmacy.id, '');

    if (!stock || stock.id !== stockId) {
      throw new AppError(404, 'Stock item not found', 'STOCK_NOT_FOUND');
    }

    return stockRepository.delete(stockId);
  }
}

export class AnalyticsService {
  async getPharmacyByOwner(ownerId: string) {
    const pharmacy = await pharmacyRepository.findByOwnerId(ownerId);

    if (!pharmacy) {
      throw new AppError(404, 'Pharmacy not found', 'PHARMACY_NOT_FOUND');
    }

    return pharmacy;
  }

  async getAnalytics(ownerId: string, period: '7d' | '30d' | '90d' = '7d'): Promise<AnalyticsData> {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const { totalOrders, completedOrders, cancelledOrders, totalRevenue, topMedicines, dailyOrders } =
      await orderRepository.getAnalytics(pharmacy.id, startDate);

    return {
      summary: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: Number(totalRevenue),
        completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0',
      },
      topMedicines: topMedicines.map((m) => ({
        name: m.medicineName || 'Unknown',
        quantity: m._sum.quantity || 0,
      })),
      dailyOrders: dailyOrders.map((d) => ({
        date: d.date,
        orders: Number(d.orders),
        revenue: Number(d.revenue) || 0,
      })),
    };
  }

  async getRevenue(ownerId: string, period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const pharmacy = await this.getPharmacyByOwner(ownerId);

    let startDate = new Date();
    let groupBy = 'day';

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        groupBy = 'week';
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = 'month';
        break;
    }

    return { pharmacyId: pharmacy.id, startDate, groupBy, period };
  }
}

export const orderService = new OrderService();
export const pharmacyOrderService = new PharmacyOrderService();
export const inventoryService = new InventoryService();
export const analyticsService = new AnalyticsService();
