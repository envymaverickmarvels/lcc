'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    completionRate: string;
  };
  topMedicines: Array<{ name: string; quantity: number }>;
  dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
}

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#9333ea'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/v1/pharmacy/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const statusData = [
    { name: 'Completed', value: data?.summary.completedOrders || 0 },
    { name: 'Cancelled', value: data?.summary.cancelledOrders || 0 },
  ];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics</h1>
        <select 
          className="filter-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="value">{data?.summary.totalOrders || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Revenue</h3>
          <div className="value">₹{(data?.summary.totalRevenue || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <div className="value success">{data?.summary.completionRate || 0}%</div>
        </div>
        <div className="stat-card">
          <h3>Cancelled</h3>
          <div className="value error">{data?.summary.cancelledOrders || 0}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h2>Orders & Revenue Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.dailyOrders || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="orders" fill="#2563eb" name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2>Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-container">
        <h2>Top Selling Medicines</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Medicine</th>
              <th>Quantity Sold</th>
            </tr>
          </thead>
          <tbody>
            {(data?.topMedicines || []).map((medicine, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{medicine.name}</td>
                <td>{medicine.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
