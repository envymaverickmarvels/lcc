'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Clock, CreditCard, Shield } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  pharmacyId?: string;
  pharmacyName?: string;
}

interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getDeliveryFee = () => {
    return orderType === 'delivery' ? 50 : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const placeOrder = async () => {
    if (orderType === 'delivery' && (!address.fullName || !address.phone || !address.addressLine1)) {
      alert('Please fill in delivery address');
      return;
    }

    setPlacingOrder(true);
    try {
      const pharmacyId = cart[0]?.pharmacyId;
      if (!pharmacyId) {
        alert('No pharmacy selected');
        return;
      }

      const response = await fetch('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          pharmacyId,
          type: orderType,
          items: cart.map((item) => ({
            medicineId: item.id,
            quantity: item.quantity,
          })),
          deliveryAddress: orderType === 'delivery' ? address : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.removeItem('cart');
        router.push(`/orders?orderId=${data.data.orderId}`);
      } else {
        alert(data.error?.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading checkout...</div>;
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-content">
        <div className="checkout-form">
          <section className="order-type-section">
            <h2>Order Type</h2>
            <div className="type-options">
              <label className={`type-option ${orderType === 'pickup' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={orderType === 'pickup'}
                  onChange={() => setOrderType('pickup')}
                />
                <div className="type-content">
                  <h3>Pickup</h3>
                  <p>Collect from pharmacy</p>
                </div>
              </label>
              <label className={`type-option ${orderType === 'delivery' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="orderType"
                  value="delivery"
                  checked={orderType === 'delivery'}
                  onChange={() => setOrderType('delivery')}
                />
                <div className="type-content">
                  <h3>Delivery</h3>
                  <p>Delivered to your address</p>
                </div>
              </label>
            </div>
          </section>

          {orderType === 'delivery' && (
            <section className="address-section">
              <h2>Delivery Address</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    placeholder="Enter delivery address"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    placeholder="Postal code"
                  />
                </div>
              </div>
            </section>
          )}

          <section className="payment-section">
            <h2>Payment</h2>
            <div className="payment-options">
              <div className="payment-option selected">
                <CreditCard size={20} />
                <span>Pay at Pickup/Delivery</span>
              </div>
            </div>
            <div className="secure-notice">
              <Shield size={16} />
              <span>Your payment is secure with us</span>
            </div>
          </section>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-items">
            {cart.map((item) => (
              <div key={item.id} className="summary-item">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">x{item.quantity}</span>
                <span className="item-price">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{getSubtotal()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>₹{getDeliveryFee()}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{getTotal()}</span>
            </div>
          </div>

          <button
            className="place-order-btn"
            onClick={placeOrder}
            disabled={placingOrder}
          >
            {placingOrder ? 'Placing Order...' : `Place Order (₹${getTotal()})`}
          </button>
        </div>
      </div>
    </div>
  );
}
