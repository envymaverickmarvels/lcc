'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Clock, MapPin, Phone, Mail } from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  is24h: boolean;
  isDelivery: boolean;
}

export default function SettingsPage() {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPharmacy();
  }, []);

  const fetchPharmacy = async () => {
    try {
      const response = await fetch('/api/v1/pharmacy/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPharmacy(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pharmacy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy) return;

    setSaving(true);
    try {
      const response = await fetch('/api/v1/pharmacy/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pharmacy),
      });
      const data = await response.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to update pharmacy:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h2>
            <Store size={20} />
            Pharmacy Information
          </h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Pharmacy Name</label>
              <input
                type="text"
                value={pharmacy?.name || ''}
                onChange={(e) => setPharmacy(prev => prev ? {...prev, name: e.target.value} : null)}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={pharmacy?.phone || ''}
                onChange={(e) => setPharmacy(prev => prev ? {...prev, phone: e.target.value} : null)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={pharmacy?.email || ''}
                onChange={(e) => setPharmacy(prev => prev ? {...prev, email: e.target.value} : null)}
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea
                value={pharmacy?.address || ''}
                onChange={(e) => setPharmacy(prev => prev ? {...prev, address: e.target.value} : null)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>
            <Clock size={20} />
            Operating Hours
          </h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Opening Time</label>
              <input
                type="time"
                value={pharmacy?.openingTime || '08:00'}
                onChange={(e) => setPharmacy(prev => prev ? {...prev, openingTime: e.target.value} : null)}
              />
            </div>

            <div className="form-group">
              <label>Closing Time</label>
              <input
                type="time"
                value={pharmacy?.closingTime || '22:00'}
                onChange={(e) => setPharmacy(prev => prev ? {...prev, closingTime: e.target.value} : null)}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={pharmacy?.is24h || false}
                  onChange={(e) => setPharmacy(prev => prev ? {...prev, is24h: e.target.checked} : null)}
                />
                <span>24-Hour Pharmacy</span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>
            <MapPin size={20} />
            Delivery Options
          </h2>
          
          <div className="form-group checkbox-group">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={pharmacy?.isDelivery || false}
                onChange={(e) => setPharmacy(prev => prev ? {...prev, isDelivery: e.target.checked} : null)}
              />
              <span>Enable Home Delivery</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="save-success">Changes saved successfully!</span>}
        </div>
      </form>
    </div>
  );
}
