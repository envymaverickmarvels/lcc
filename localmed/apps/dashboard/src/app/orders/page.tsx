'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Phone, MapPin, Clock, Check, X } from 'lucide-react';

interface OrderItem {
  id: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  totalAmount: number;
  estimatedPickupTime: string;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/v1/pharmacy/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/v1/pharmacy/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      preparing: 'status-preparing',
      ready: 'status-ready',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return statusMap[status] || 'status-pending';
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Orders</h1>
      </div>

      <div className="filter-bar">
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="orders-layout">
        <div className="table-container orders-list">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="loading-cell">Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={selectedOrder?.id === order.id ? 'selected' : ''}
                  >
                    <td className="order-number">{order.orderNumber}</td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.customer.name || 'Unknown'}</strong>
                        <span>{order.customer.phone}</span>
                      </div>
                    </td>
                    <td>{order.items.length} items</td>
                    <td>₹{order.totalAmount}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="time">
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <div className="order-details">
            <div className="details-header">
              <h2>{selectedOrder.orderNumber}</h2>
              <button 
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="customer-details">
              <h3>Customer Details</h3>
              <p><strong>{selectedOrder.customer.name || 'Unknown'}</strong></p>
              <p><Phone size={14} /> {selectedOrder.customer.phone}</p>
            </div>

            <div className="order-items">
              <h3>Items</h3>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="order-item">
                  <div>
                    <strong>{item.medicineName}</strong>
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <span>₹{item.total}</span>
                </div>
              ))}
              <div className="order-total">
                <span>Total</span>
                <strong>₹{selectedOrder.totalAmount}</strong>
              </div>
            </div>

            <div className="order-actions">
              {selectedOrder.status === 'confirmed' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => updateStatus(selectedOrder.id, 'preparing')}
                >
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => updateStatus(selectedOrder.id, 'ready')}
                >
                  Mark as Ready
                </button>
              )}
              {selectedOrder.status === 'ready' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => updateStatus(selectedOrder.id, 'completed')}
                >
                  Complete Order
                </button>
              )}
              {['pending', 'confirmed'].includes(selectedOrder.status) && (
                <button 
                  className="btn btn-outline cancel"
                  onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
