'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface StockItem {
  id: string;
  medicineId: string;
  medicineName: string;
  category: string;
  stock: number;
  reorderLevel: number;
  price: number;
  isLowStock: boolean;
}

export default function InventoryPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInventory();
  }, [search, filter]);

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter === 'lowStock') params.append('lowStock', 'true');
      
      const response = await fetch(`/api/v1/pharmacy/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setItems(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await fetch(`/api/v1/pharmacy/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchInventory();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add Stock
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <select 
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Items</option>
          <option value="lowStock">Low Stock</option>
          <option value="outOfStock">Out of Stock</option>
          <option value="available">Available</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Reorder Level</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="loading-cell">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">No items found</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="medicine-name">
                      <strong>{item.medicineName}</strong>
                    </div>
                  </td>
                  <td>{item.category || '-'}</td>
                  <td>
                    <span className={item.isLowStock ? 'stock-warning' : ''}>
                      {item.stock}
                    </span>
                  </td>
                  <td>{item.reorderLevel}</td>
                  <td>₹{item.price}</td>
                  <td>
                    {item.isLowStock ? (
                      <span className="status-badge status-pending">
                        <AlertTriangle size={12} />
                        Low Stock
                      </span>
                    ) : item.stock === 0 ? (
                      <span className="status-badge status-cancelled">Out of Stock</span>
                    ) : (
                      <span className="status-badge status-confirmed">Available</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        title="Delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
