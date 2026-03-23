'use client';

import { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  medicineId: string;
  quantity: number;
  price: number;
  total: number;
  medicineName?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  type: 'pickup' | 'delivery';
  totalAmount: number;
  estimatedPickupTime?: string;
  createdAt: string;
  items: OrderItem[];
  pharmacy?: {
    name: string;
    address: string;
    phone?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: <Clock size={16} /> },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-50', icon: <CheckCircle size={16} /> },
  preparing: { label: 'Preparing', color: 'text-indigo-700', bgColor: 'bg-indigo-50', icon: <Package size={16} /> },
  ready: { label: 'Ready', color: 'text-green-700', bgColor: 'bg-green-50', icon: <CheckCircle size={16} /> },
  completed: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <CheckCircle size={16} /> },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-50', icon: <XCircle size={16} /> },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('http://localhost:3000/api/v1/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
      } else {
        setError(data.error?.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );
  const pastOrders = orders.filter(o => 
    ['completed', 'cancelled'].includes(o.status)
  );
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReorder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/reorder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = '/cart';
      }
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium border-b-2 ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 font-medium border-b-2 ${
              activeTab === 'past'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Past ({pastOrders.length})
          </button>
        </div>

        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab === 'active' ? 'active' : 'past'} orders
            </h2>
            <p className="text-gray-500 mb-6">
              {activeTab === 'active'
                ? 'Your active orders will appear here'
                : 'Your completed orders will appear here'}
            </p>
            {activeTab === 'active' && (
              <a
                href="/search"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Search Medicines
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin size={16} className="mr-2" />
                      <span className="text-sm">{order.pharmacy?.name || 'Pharmacy'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {selectedOrder?.id === order.id && (
                    <div className="border-t border-gray-100 p-6 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.quantity}x {item.medicineName || 'Medicine'}
                              </span>
                              <span className="text-gray-900">₹{Number(item.total).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {order.type === 'pickup' ? <MapPin size={16} /> : <Package size={16} />}
                          <span>{order.type === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                        </div>
                        {order.pharmacy?.address && (
                          <p className="text-sm text-gray-500 mt-1 ml-6">{order.pharmacy.address}</p>
                        )}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => handleReorder(order.id)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Reorder
                        </button>
                        <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
