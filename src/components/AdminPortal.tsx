import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Package, DollarSign, Printer, Search, RefreshCw, X, LogOut, Lock } from 'lucide-react';
import { Order } from '../types';

export const AdminPortal: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterCity, setFilterCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setStats(data.stats);
      }
    } catch (err) {
      console.log('API Server offline. Please run "npm run server"');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@pureherbex.com' && password === 'PureHerbex2026!') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid admin credentials. Access Denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    window.location.href = '/';
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesCity = filterCity === 'All' || o.city.toLowerCase() === filterCity.toLowerCase();
    const matchesSearch = o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.phone.includes(searchQuery) || 
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  // Render Login Form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sun-sand flex items-center justify-center p-4">
        <div className="bg-sun-cream border-4 border-sun-dark p-8 rounded-3xl max-w-md w-full shadow-retro-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-sun-yellow text-sun-dark rounded-2xl border-2 border-sun-dark mx-auto flex items-center justify-center shadow-retro-sm">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-display font-black text-2xl text-sun-dark uppercase tracking-tight">
              ADMIN SECURE GATEWAY
            </h2>
            <p className="text-xs font-bold text-sun-brown">
              Koveria Glow by Pure Herbex Order Desk
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-sun-dark mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="admin@pureherbex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sun-yellow font-bold text-sun-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-sun-dark mb-1">Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sun-yellow font-bold text-sun-dark"
              />
            </div>

            {error && (
              <div className="bg-red-55 border-2 border-red-500 text-red-700 text-xs font-bold p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-sun-yellow text-sun-dark font-black py-3 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase text-xs tracking-wider"
            >
              Authorize & Access
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-xs font-bold text-sun-brown underline hover:text-sun-dark"
            >
              ← Back to Public Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  return (
    <div className="min-h-screen bg-sun-sand p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-8 shadow-retro-lg relative">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b-4 border-sun-dark pb-6 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sun-yellow rounded-2xl border-2 border-sun-dark shadow-retro-sm">
              <ShieldCheck className="w-8 h-8 text-sun-dark" />
            </div>
            <div>
              <span className="badge-sticker text-[10px] uppercase">INTERNAL SECURE CONTROL</span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-sun-dark">
                PURE HERBEX <span className="text-amber-600">ADMIN CONTROL DESK</span>
              </h2>
              <div className="text-xs font-bold text-sun-brown flex flex-wrap items-center gap-2">
                <span>Run Couriers Connection: <strong>Active (Code: 6943)</strong></span>
                <span>•</span>
                <span>Courier Service: <strong className="text-emerald-700">Leopards COD Pakistan</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchOrders}
              className="p-2.5 bg-sun-sand rounded-full border-2 border-sun-dark hover:bg-sun-yellow transition-colors flex items-center gap-1 text-xs font-bold"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-red-100 text-red-700 rounded-full border-2 border-sun-dark hover:bg-red-200 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-sun-sand p-4 rounded-2xl border-2 border-sun-dark shadow-retro-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-sun-brown">Total Sales (COD)</div>
              <div className="text-2xl font-black text-sun-dark">Rs. {stats.totalSales.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-sun-sand p-4 rounded-2xl border-2 border-sun-dark shadow-retro-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl border border-amber-500">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-sun-brown">Total Orders Booked</div>
              <div className="text-2xl font-black text-sun-dark">{stats.totalOrders} Orders</div>
            </div>
          </div>

          <div className="bg-sun-sand p-4 rounded-2xl border-2 border-sun-dark shadow-retro-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-xl border border-blue-500">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-sun-brown">Leopards Delivery Time</div>
              <div className="text-2xl font-black text-sun-dark">3 to 4 Days</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-sun-brown" />
            <input 
              type="text" 
              placeholder="Search by customer name, phone, or tracking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sun-sand border-2 border-sun-dark rounded-full pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sun-yellow"
            />
          </div>

          <select 
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-sun-sand border-2 border-sun-dark rounded-full px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sun-yellow"
          >
            <option value="All">All Pakistan Cities</option>
            <option value="Lahore">Lahore</option>
            <option value="Karachi">Karachi</option>
            <option value="Islamabad">Islamabad</option>
            <option value="Rawalpindi">Rawalpindi</option>
            <option value="Faisalabad">Faisalabad</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto border-2 border-sun-dark rounded-2xl bg-sun-cream shadow-retro-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sun-yellow text-sun-dark font-black text-xs uppercase border-b-2 border-sun-dark">
                <th className="p-3">Tracking ID</th>
                <th className="p-3">Customer Details</th>
                <th className="p-3">Items & Quantity</th>
                <th className="p-3">Amount (COD)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-sun-dark/20 text-xs font-medium text-sun-dark">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sun-brown font-bold">
                    No orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-sun-sand transition-colors">
                    <td className="p-3 font-mono font-black text-amber-800">
                      {order.trackingNumber}
                      <div className="text-[10px] text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-sun-dark">{order.fullName}</div>
                      <div className="text-[11px] text-sun-brown">{order.phone}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-xs">{order.address}, {order.city}</div>
                    </td>

                    <td className="p-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="font-bold text-[11px]">
                          • {item.quantity}x {item.product.name}
                        </div>
                      ))}
                    </td>

                    <td className="p-3 font-black">
                      Rs. {order.totalAmount.toLocaleString()}
                      <div className="text-[10px] text-emerald-700 font-bold">Incl. Rs. 150 Shipping</div>
                    </td>

                    <td className="p-3">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="bg-sun-cream border border-sun-dark text-[11px] font-bold rounded-lg px-2 py-1"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Booked via Leopards">Booked via Leopards</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-sun-dark text-sun-yellow font-bold text-[10px] px-3 py-1.5 rounded-full border border-sun-dark hover:bg-amber-900 transition-colors uppercase flex items-center gap-1 ml-auto"
                      >
                        <Printer className="w-3 h-3" /> Leopards Label
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Leopards COD Shipping Label Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/85">
            <div className="bg-white text-black p-6 rounded-2xl border-4 border-black max-w-md w-full font-mono text-xs space-y-4 relative">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute top-3 right-3 p-1 text-black font-black text-base"
              >
                ✕
              </button>

              <div className="border-b-2 border-black pb-2 text-center">
                <div className="font-bold text-sm">LEOPARDS COURIER SERVICES (RUN COURIERS COD)</div>
                <div className="font-black text-lg text-amber-800">TRACKING #: {selectedOrder.trackingNumber}</div>
                <div className="text-[10px]">Client Code: 6943 • Service: Leopards COD Standard</div>
              </div>

              <div className="space-y-1">
                <div><strong>DESTINATION:</strong> {selectedOrder.city.toUpperCase()}, PAKISTAN</div>
                <div><strong>CONSIGNEE:</strong> {selectedOrder.fullName}</div>
                <div><strong>PHONE:</strong> {selectedOrder.phone}</div>
                <div><strong>ADDRESS:</strong> {selectedOrder.address}</div>
              </div>

              <div className="border-t border-b border-black py-2 space-y-1">
                <div><strong>CONTENTS:</strong></div>
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx}>- {i.quantity}x {i.product.name}</div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-black pt-1">
                <span>COLLECT COD AMOUNT:</span>
                <span className="text-base">RS. {selectedOrder.totalAmount.toLocaleString()}</span>
              </div>

              <div className="text-[9px] text-center opacity-70">
                Pure Herbex Artisanal Botanical Skincare • www.pureherbex.com
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full bg-black text-white py-2 rounded-lg font-sans font-bold text-xs uppercase"
              >
                Print Label
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
