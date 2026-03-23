'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Star, Filter } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  requiresPrescription: boolean;
}

interface Pharmacy {
  pharmacyId: string;
  name: string;
  address: string;
  phone?: string;
  distance: number;
  stock: number;
  price: number;
  rating: number;
  isOpen: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [filters, setFilters] = useState({
    openNow: false,
    is24h: false,
    sortBy: 'distance' as 'distance' | 'price' | 'rating',
  });

  const searchMedicines = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/medicines/search?q=${encodeURIComponent(query)}&lat=28.6139&lng=77.2090&radius=5`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data.medicines);
        setPharmacies(data.data.pharmacies);
        if (data.data.medicines.length > 0) {
          setSelectedMedicine(data.data.medicines[0]);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async (q: string) => {
    if (q.length < 2) return;
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/medicines/suggestions?q=${encodeURIComponent(q)}&limit=10`
      );
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data.suggestions.map((name: string) => ({ id: name, name })));
      }
    } catch (error) {
      console.error('Suggestions failed:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchMedicines();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search medicines (e.g., Paracetamol, Aspirin)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filters">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })}
              />
              <span>Open Now</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.is24h}
                onChange={(e) => setFilters({ ...filters, is24h: e.target.checked })}
              />
              <span>24/7 Pharmacies</span>
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'distance' | 'price' | 'rating' })}
              className="sort-select"
            >
              <option value="distance">Nearest First</option>
              <option value="price">Lowest Price</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="search-content">
        <div className="results-sidebar">
          <h3>Medicines</h3>
          <div className="medicine-list">
            {loading ? (
              <div className="loading">Searching...</div>
            ) : medicines.length === 0 ? (
              <div className="empty">
                {query.length < 2 ? 'Type to search medicines' : 'No medicines found'}
              </div>
            ) : (
              medicines.map((med) => (
                <div
                  key={med.id}
                  className={`medicine-item ${selectedMedicine?.id === med.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMedicine(med)}
                >
                  <div className="medicine-name">{med.name}</div>
                  {med.genericName && (
                    <div className="medicine-generic">Generic: {med.genericName}</div>
                  )}
                  {med.manufacturer && (
                    <div className="medicine-manufacturer">{med.manufacturer}</div>
                  )}
                  {med.requiresPrescription && (
                    <span className="rx-badge">Rx Required</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="results-main">
          <h3>Pharmacies with Stock ({pharmacies.length})</h3>
          {pharmacies.length === 0 ? (
            <div className="empty-results">
              <p>Select a medicine to see nearby pharmacies</p>
            </div>
          ) : (
            <div className="pharmacy-list">
              {pharmacies.map((pharmacy) => (
                <div key={pharmacy.pharmacyId} className="pharmacy-card">
                  <div className="pharmacy-header">
                    <div className="pharmacy-info">
                      <h4>{pharmacy.name}</h4>
                      <div className="pharmacy-meta">
                        <span className="distance">
                          <MapPin size={14} />
                          {pharmacy.distance.toFixed(1)} km
                        </span>
                        <span className="rating">
                          <Star size={14} />
                          {pharmacy.rating || 'New'}
                        </span>
                      </div>
                    </div>
                    <div className="pharmacy-status">
                      {pharmacy.isOpen ? (
                        <span className="open-badge">Open</span>
                      ) : (
                        <span className="closed-badge">Closed</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pharmacy-address">
                    <MapPin size={14} />
                    {pharmacy.address}
                  </div>
                  
                  {selectedMedicine && (
                    <div className="stock-info">
                      <div className="stock-availability">
                        <span className={pharmacy.stock > 10 ? 'in-stock' : 'low-stock'}>
                          {pharmacy.stock} in stock
                        </span>
                      </div>
                      <div className="price-info">
                        <span className="price">₹{pharmacy.price}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pharmacy-actions">
                    <a href={`/pharmacy/${pharmacy.pharmacyId}`} className="view-btn">
                      View Details
                    </a>
                    <button className="reserve-btn">
                      Reserve Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
