'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Bell, Globe, HelpCircle, FileText, Star, LogOut, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('http://localhost:3000/api/v1/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/api/v1/users/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || user?.phone?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h1>
                  <p className="text-gray-500">{user?.phone}</p>
                  {user?.email && <p className="text-gray-500">{user.email}</p>}
                  {user?.isVerified && (
                    <span className="inline-flex items-center gap-1 text-green-600 text-sm mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Account</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                <button
                  onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Edit Profile</p>
                    <p className="text-sm text-gray-500">Update your personal information</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <button
                  onClick={() => setActiveSection(activeSection === 'addresses' ? null : 'addresses')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <MapPin size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Saved Addresses</p>
                    <p className="text-sm text-gray-500">{addresses.length} addresses saved</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <a
                  href="/prescriptions"
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">My Prescriptions</p>
                    <p className="text-sm text-gray-500">View uploaded prescriptions</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Bell size={20} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Notifications</p>
                    <p className="text-sm text-gray-500">Manage notification settings</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Globe size={20} className="text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Language</p>
                    <p className="text-sm text-gray-500">English</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Support</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <HelpCircle size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Help & FAQ</p>
                    <p className="text-sm text-gray-500">Get help with LocalMed</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText size={20} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Terms & Privacy</p>
                    <p className="text-sm text-gray-500">Legal information</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <Star size={20} className="text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Rate the App</p>
                    <p className="text-sm text-gray-500">Share your feedback</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-xl mt-6 hover:bg-red-100 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Orders</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Saved Addresses</span>
                  <span className="font-semibold text-gray-900">{addresses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Prescriptions</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center">LocalMed v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
