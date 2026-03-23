'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  pharmacyId?: string;
  pharmacyName?: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getDeliveryFee = () => {
    return cart.length > 0 ? 50 : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  if (loading) {
    return <div className="loading">Loading cart...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <ShoppingCart size={64} />
          <h2>Your cart is empty</h2>
          <p>Add medicines from a pharmacy to get started</p>
          <Link href="/search" className="browse-btn">
            Browse Medicines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      <div className="cart-content">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="item-details">
                <h3>{item.name}</h3>
                {item.pharmacyName && (
                  <p className="pharmacy-name">from {item.pharmacyName}</p>
                )}
                <span className="item-price">₹{item.price} each</span>
              </div>

              <div className="quantity-controls">
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.id, 1)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="item-total">
                ₹{item.price * item.quantity}
              </div>

              <button
                className="remove-btn"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          
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

          <Link href="/checkout" className="checkout-btn">
            Proceed to Checkout
          </Link>

          <Link href="/search" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
