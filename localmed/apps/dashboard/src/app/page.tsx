'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Clock, AlertTriangle, DollarSign, Package, TrendingUp } from 'lucide-react';

interface Stats {
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockItems: number;
  todayRevenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    lowStockItems: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/pharmacy/orders/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="date">{new Date().toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <h3>Today's Orders</h3>
          <div className="value">{stats.todayOrders}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <h3>Pending Orders</h3>
          <div className="value warning">{stats.pendingOrders}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <TrendingUp size={24} />
          </div>
          <h3>Completed Orders</h3>
          <div className="value success">{stats.completedOrders}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon error">
            <AlertTriangle size={24} />
          </div>
          <h3>Low Stock Items</h3>
          <div className="value error">{stats.lowStockItems}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <h3>Today's Revenue</h3>
          <div className="value">₹{stats.todayRevenue.toLocaleString('en-IN')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <h3>Total Products</h3>
          <div className="value">156</div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Recent Orders</h2>
          <a href="/orders" className="btn btn-outline">View All</a>
        </div>
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
            <tr>
              <td>LM-20260323-001</td>
              <td>Rahul Sharma</td>
              <td>2 items</td>
              <td>₹156</td>
              <td><span className="status-badge status-confirmed">Confirmed</span></td>
              <td>10:30 AM</td>
            </tr>
            <tr>
              <td>LM-20260323-002</td>
              <td>Priya Gupta</td>
              <td>1 item</td>
              <td>₹89</td>
              <td><span className="status-badge status-pending">Pending</span></td>
              <td>10:15 AM</td>
            </tr>
            <tr>
              <td>LM-20260323-003</td>
              <td>Amit Kumar</td>
              <td>3 items</td>
              <td>₹320</td>
              <td><span className="status-badge status-ready">Ready</span></td>
              <td>09:45 AM</td>
            </tr>
            <tr>
              <td>LM-20260323-004</td>
              <td>Sanjay Singh</td>
              <td>1 item</td>
              <td>₹45</td>
              <td><span className="status-badge status-completed">Completed</span></td>
              <td>09:30 AM</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Low Stock Alerts</h2>
          <a href="/inventory?lowStock=true" className="btn btn-outline">View All</a>
        </div>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Paracetamol 650</td>
              <td>5</td>
              <td>10</td>
              <td><span className="status-badge status-cancelled">Critical</span></td>
              <td><button className="btn btn-primary btn-sm">Restock</button></td>
            </tr>
            <tr>
              <td>Amlodipine 5mg</td>
              <td>8</td>
              <td>10</td>
              <td><span className="status-badge status-pending">Low</span></td>
              <td><button className="btn btn-primary btn-sm">Restock</button></td>
            </tr>
            <tr>
              <td>Metformin 500mg</td>
              <td>10</td>
              <td>15</td>
              <td><span className="status-badge status-pending">Low</span></td>
              <td><button className="btn btn-primary btn-sm">Restock</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
