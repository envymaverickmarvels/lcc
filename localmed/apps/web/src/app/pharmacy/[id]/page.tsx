'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Phone, Clock, Star, ShoppingCart, ChevronLeft } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  stock: number;
  price: number;
  requiresPrescription: boolean;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  openingTime: string;
  closingTime: string;
  is24h: boolean;
  isDelivery: boolean;
  rating: number;
  totalReviews: number;
  medicineCount: number;
}

export default function PharmacyDetailPage() {
  const params = useParams();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);

  useEffect(() => {
    fetchPharmacyDetails();
  }, [params.id]);

  const fetchPharmacyDetails = async () => {
    try {
      const [pharmacyRes, medicinesRes] = await Promise.all([
        fetch(`http://localhost:3000/api/v1/pharmacies/${params.id}`),
        fetch(`http://localhost:3000/api/v1/pharmacies/${params.id}/medicines?limit=50`),
      ]);

      const pharmacyData = await pharmacyRes.json();
      const medicinesData = await medicinesRes.json();

      if (pharmacyData.success) {
        setPharmacy(pharmacyData.data);
      }
      if (medicinesData.success) {
        setMedicines(medicinesData.data.medicines);
      }
    } catch (error) {
      console.error('Failed to fetch pharmacy:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine: Medicine) => {
    const existing = cart.find((item) => item.id === medicine.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { id: medicine.id, name: medicine.name, price: medicine.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const filteredMedicines = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading pharmacy details...</div>;
  }

  return (
    <div className="pharmacy-detail-page">
      <div className="pharmacy-header">
        <a href="/search" className="back-link">
          <ChevronLeft /> Back to Search
        </a>
        
        <div className="pharmacy-info">
          <h1>{pharmacy?.name}</h1>
          <div className="pharmacy-meta">
            <span className="rating">
              <Star size={16} />
              {pharmacy?.rating || 'New'} ({pharmacy?.totalReviews} reviews)
            </span>
            <span className="distance">
              <MapPin size={16} />
              {pharmacy?.address}
            </span>
          </div>
          
          <div className="pharmacy-badges">
            {pharmacy?.is24h && <span className="badge">24/7 Open</span>}
            {pharmacy?.isDelivery && <span className="badge">Delivery Available</span>}
            <span className="badge">{pharmacy?.medicineCount} Medicines</span>
          </div>
        </div>
      </div>

      <div className="pharmacy-content">
        <div className="medicines-section">
          <div className="section-header">
            <h2>Available Medicines</h2>
            <input
              type="text"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="medicine-search"
            />
          </div>

          <div className="medicines-grid">
            {filteredMedicines.map((medicine) => (
              <div key={medicine.id} className="medicine-card">
                <div className="medicine-info">
                  <h3>{medicine.name}</h3>
                  {medicine.genericName && (
                    <p className="generic-name">{medicine.genericName}</p>
                  )}
                  {medicine.category && (
                    <span className="category">{medicine.category}</span>
                  )}
                </div>
                <div className="medicine-stock">
                  <span className={medicine.stock > 10 ? 'in-stock' : medicine.stock > 0 ? 'low-stock' : 'out-of-stock'}>
                    {medicine.stock > 0 ? `${medicine.stock} in stock` : 'Out of stock'}
                  </span>
                  <span className="price">₹{medicine.price}</span>
                </div>
                {medicine.requiresPrescription && (
                  <span className="rx-required">Rx Required</span>
                )}
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(medicine)}
                  disabled={medicine.stock === 0}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-sidebar">
          <div className="cart-card">
            <h3>Your Cart</h3>
            {cart.length === 0 ? (
              <p className="empty-cart">Cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">₹{item.price} x {item.quantity}</span>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <span>Total</span>
                  <span className="total-amount">₹{getCartTotal()}</span>
                </div>
                <a href="/checkout" className="checkout-btn">
                  Proceed to Checkout
                </a>
              </>
            )}
          </div>

          <div className="pharmacy-contact">
            <h3>Contact</h3>
            {pharmacy?.phone && (
              <div className="contact-item">
                <Phone size={16} />
                <span>{pharmacy.phone}</span>
              </div>
            )}
            <div className="contact-item">
              <Clock size={16} />
              <span>
                {pharmacy?.is24h
                  ? 'Open 24/7'
                  : `${pharmacy?.openingTime} - ${pharmacy?.closingTime}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
