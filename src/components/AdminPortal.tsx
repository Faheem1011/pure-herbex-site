import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Package, DollarSign, Printer, Search, RefreshCw, X, LogOut, Lock, Plus, Edit2, Trash2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order, Product } from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';

export const AdminPortal: React.FC = () => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'database'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0 });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterCity, setFilterCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Products State (initialized with cached or default products)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pureherbex_products_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_PRODUCTS;
  });

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'kits' | 'facepack' | 'toner' | 'rosewater'>('kits');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOrigPrice, setNewProdOrigPrice] = useState('');
  const [newProdSubtitle, setNewProdSubtitle] = useState('');
  const [newProdTagline, setNewProdTagline] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdSize, setNewProdSize] = useState('');
  const [newProdImage, setNewProdImage] = useState('/images/glow-kit.png');

  // Database Config State
  const [dbProvider, setDbProvider] = useState<'json' | 'supabase' | 'mongodb'>('json');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [mongoUri, setMongoUri] = useState('');
  const [dbConfigMessage, setDbConfigMessage] = useState('');
  const [loadingDbConfig, setLoadingDbConfig] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pureherbex_admin_auth') === 'true';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Fetch Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          localStorage.setItem('pureherbex_products_db', JSON.stringify(data.products));
          return;
        }
      }
    } catch (err) {
      console.warn('API unavailable, using default products list.', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch DB Config
  const fetchDbConfig = async () => {
    try {
      const res = await fetch('/api/db-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setDbProvider(data.config.provider || 'json');
          setSupabaseUrl(data.config.supabaseUrl || '');
          setSupabaseKey(data.config.supabaseKey || '');
          setMongoUri(data.config.mongoUri || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch db config', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchProducts();
      fetchDbConfig();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@pureherbex.com' && password === 'PureHerbex2026!') {
      setIsAuthenticated(true);
      localStorage.setItem('pureherbex_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid admin credentials. Access Denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pureherbex_admin_auth');
    setEmail('');
    setPassword('');
    window.location.href = '/';
  };

  // Order Handlers
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
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

  // Product CRUD Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem: Product = {
      id: newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
      name: newProdName,
      subtitle: newProdSubtitle || newProdName,
      tagline: newProdTagline || 'Pure Botanical Formula',
      price: Number(newProdPrice),
      originalPrice: newProdOrigPrice ? Number(newProdOrigPrice) : Number(newProdPrice),
      rating: 5.0,
      reviewCount: 1,
      category: newProdCategory,
      image: newProdImage || '/images/glow-kit.png',
      badge: 'NEW',
      description: newProdDescription || 'Artisanal natural botanical skincare formula.',
      benefits: ['✴️ Handcrafted organic formula'],
      ingredients: ['Organic Botanicals'],
      usage: 'Apply daily to clean skin.',
      size: newProdSize || 'Standard Size',
      inStock: true,
      isBestseller: false
    };

    const updated = [createdItem, ...products];
    setProducts(updated);
    localStorage.setItem('pureherbex_products_db', JSON.stringify(updated));
    setIsAddModalOpen(false);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdOrigPrice('');
    setNewProdSubtitle('');
    setNewProdTagline('');
    setNewProdDescription('');
    setNewProdSize('');

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdItem)
      });
    } catch (err) {
      console.warn('Backend API update delayed, saved locally.', err);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    setProducts(updated);
    localStorage.setItem('pureherbex_products_db', JSON.stringify(updated));
    setEditingProduct(null);

    try {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
    } catch (err) {
      console.warn('Backend API update delayed, saved locally.', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product from the database?')) return;

    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    localStorage.setItem('pureherbex_products_db', JSON.stringify(updated));

    try {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Backend API update delayed, deleted locally.', err);
    }
  };

  // DB Config Handler
  const handleSaveDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDbConfig(true);
    setDbConfigMessage('');

    try {
      const res = await fetch('/api/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: dbProvider,
          supabaseUrl,
          supabaseKey,
          mongoUri
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDbConfigMessage(data.message || 'Database settings updated successfully!');
      }
    } catch (err) {
      setDbConfigMessage('Failed to connect or save database settings.');
    } finally {
      setLoadingDbConfig(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesCity = filterCity === 'All' || o.city.toLowerCase() === filterCity.toLowerCase();
    const matchesSearch = o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.phone.includes(searchQuery) || 
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

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
              Koveria Glow by Pure Herbex Store Manager
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-sun-dark mb-1">Admin Email</label>
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

            {authError && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold p-3 rounded-xl text-center">
                {authError}
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
      <div className="max-w-7xl mx-auto bg-sun-cream border-4 border-sun-dark rounded-3xl p-6 sm:p-8 shadow-retro-lg relative space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b-4 border-sun-dark pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sun-yellow rounded-2xl border-2 border-sun-dark shadow-retro-sm">
              <ShieldCheck className="w-8 h-8 text-sun-dark" />
            </div>
            <div>
              <span className="badge-sticker text-[10px] uppercase">INTERNAL SECURE CONTROL</span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-sun-dark">
                PURE HERBEX <span className="text-amber-600">ADMIN DESK</span>
              </h2>
              <div className="text-xs font-bold text-sun-brown flex flex-wrap items-center gap-2">
                <span>Run Couriers Integration: <strong>Active (Code 6943)</strong></span>
                <span>•</span>
                <span>DB Driver: <strong className="text-emerald-700 uppercase">{dbProvider} Database</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { fetchOrders(); fetchProducts(); }}
              className="p-2.5 bg-sun-sand rounded-full border-2 border-sun-dark hover:bg-sun-yellow transition-colors flex items-center gap-1 text-xs font-bold"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${(loadingOrders || loadingProducts) ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-red-100 text-red-700 rounded-full border-2 border-sun-dark hover:bg-red-200 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b-2 border-sun-dark pb-4">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase border-2 border-sun-dark transition-all ${
              activeTab === 'orders' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-brown hover:bg-sun-yellow/40'
            }`}
          >
            📦 Customer Orders ({orders.length})
          </button>

          <button 
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase border-2 border-sun-dark transition-all ${
              activeTab === 'products' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-brown hover:bg-sun-yellow/40'
            }`}
          >
            🏷️ Products & Price Control ({products.length})
          </button>

          <button 
            onClick={() => setActiveTab('database')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase border-2 border-sun-dark transition-all ${
              activeTab === 'database' ? 'bg-sun-yellow text-sun-dark shadow-retro-sm' : 'bg-sun-sand text-sun-brown hover:bg-sun-yellow/40'
            }`}
          >
            ⚙️ Hostinger Database Setup
          </button>
        </div>

        {/* ========================================== */}
        {/* TAB 1: ORDERS MANAGEMENT */}
        {/* ========================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="flex flex-col sm:flex-row gap-4">
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
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: PRODUCTS CATALOG & PRICE CONTROL */}
        {/* ========================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-sun-brown" />
                <input 
                  type="text" 
                  placeholder="Filter products by title or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-sun-sand border-2 border-sun-dark rounded-full pl-9 pr-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sun-yellow"
                />
              </div>

              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-sun-yellow text-sun-dark font-black px-4 py-2.5 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 text-xs uppercase flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Product To DB
              </button>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto border-2 border-sun-dark rounded-2xl bg-sun-cream shadow-retro-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sun-yellow text-sun-dark font-black text-xs uppercase border-b-2 border-sun-dark">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Selling Price</th>
                    <th className="p-3">Original Price</th>
                    <th className="p-3">Stock Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-sun-dark/20 text-xs font-medium text-sun-dark">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-sun-sand transition-colors">
                      <td className="p-3 flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 object-contain rounded-lg border border-sun-dark/30 bg-sun-sand" />
                        <div>
                          <div className="font-bold text-sun-dark">{prod.name}</div>
                          <div className="text-[10px] text-sun-brown truncate max-w-xs">{prod.subtitle}</div>
                        </div>
                      </td>

                      <td className="p-3 uppercase text-[10px] font-black tracking-wider text-amber-800">
                        {prod.category}
                      </td>

                      <td className="p-3 font-black text-sm text-sun-dark">
                        Rs. {prod.price.toLocaleString()}
                      </td>

                      <td className="p-3 font-bold text-gray-500">
                        Rs. {prod.originalPrice?.toLocaleString() || prod.price.toLocaleString()}
                      </td>

                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          prod.inStock ? 'bg-emerald-100 text-emerald-800 border-emerald-500' : 'bg-red-100 text-red-800 border-red-500'
                        }`}>
                          {prod.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingProduct(prod)}
                            className="p-1.5 bg-sun-sand rounded-lg border border-sun-dark hover:bg-sun-yellow text-sun-dark"
                            title="Edit Price & Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 bg-red-100 rounded-lg border border-red-500 hover:bg-red-200 text-red-700"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: HOSTINGER DATABASE SETUP & CONFIG */}
        {/* ========================================== */}
        {activeTab === 'database' && (
          <div className="bg-sun-sand p-6 sm:p-8 rounded-2xl border-2 border-sun-dark space-y-6">
            <div className="space-y-2 border-b-2 border-sun-dark pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-amber-700" />
                <h3 className="font-display font-black text-xl text-sun-dark uppercase">
                  HOSTINGER DATABASE CONNECTIVITY & DRIVER SETUP
                </h3>
              </div>
              <p className="text-xs font-bold text-sun-brown">
                Connect your backend database (Supabase or MongoDB Atlas) as configured on Hostinger to synchronize your products, prices, and orders directly with cloud storage.
              </p>
            </div>

            <form onSubmit={handleSaveDbConfig} className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-black uppercase text-sun-dark mb-3">Select Active Database Driver</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                    dbProvider === 'json' ? 'bg-sun-yellow border-sun-dark shadow-retro-sm' : 'bg-sun-cream border-sun-dark/40 hover:bg-sun-cream/80'
                  }`}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value="json" 
                      checked={dbProvider === 'json'} 
                      onChange={() => setDbProvider('json')} 
                      className="sr-only" 
                    />
                    <span className="font-black text-xs uppercase">Local JSON DB (Zero Setup)</span>
                    <span className="text-[10px] text-sun-brown text-center font-medium">Internal fast storage (`db.json`)</span>
                  </label>

                  <label className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                    dbProvider === 'supabase' ? 'bg-emerald-200 border-emerald-800 shadow-retro-sm' : 'bg-sun-cream border-sun-dark/40 hover:bg-sun-cream/80'
                  }`}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value="supabase" 
                      checked={dbProvider === 'supabase'} 
                      onChange={() => setDbProvider('supabase')} 
                      className="sr-only" 
                    />
                    <span className="font-black text-xs uppercase text-emerald-900">Supabase Database</span>
                    <span className="text-[10px] text-emerald-800 text-center font-medium">Hostinger Supabase REST API integration</span>
                  </label>

                  <label className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${
                    dbProvider === 'mongodb' ? 'bg-emerald-200 border-emerald-800 shadow-retro-sm' : 'bg-sun-cream border-sun-dark/40 hover:bg-sun-cream/80'
                  }`}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value="mongodb" 
                      checked={dbProvider === 'mongodb'} 
                      onChange={() => setDbProvider('mongodb')} 
                      className="sr-only" 
                    />
                    <span className="font-black text-xs uppercase text-emerald-900">MongoDB Atlas</span>
                    <span className="text-[10px] text-emerald-800 text-center font-medium">Hostinger MongoDB Atlas connection URI</span>
                  </label>
                </div>
              </div>

              {/* Supabase Config Fields */}
              {dbProvider === 'supabase' && (
                <div className="bg-sun-cream p-5 rounded-2xl border-2 border-emerald-700 space-y-4">
                  <h4 className="font-black text-xs text-emerald-900 uppercase">Supabase Connection Parameters</h4>
                  <div>
                    <label className="block text-[11px] font-bold text-sun-dark mb-1">Supabase Project URL</label>
                    <input 
                      type="text" 
                      placeholder="Enter your Supabase Project URL..."
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full bg-sun-sand border border-sun-dark rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sun-dark mb-1">Supabase Anon Key / Service Key</label>
                    <input 
                      type="password" 
                      placeholder="Enter your Supabase Key..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full bg-sun-sand border border-sun-dark rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* MongoDB Atlas Config Fields */}
              {dbProvider === 'mongodb' && (
                <div className="bg-sun-cream p-5 rounded-2xl border-2 border-emerald-700 space-y-4">
                  <h4 className="font-black text-xs text-emerald-900 uppercase">MongoDB Atlas Connection String</h4>
                  <div>
                    <label className="block text-[11px] font-bold text-sun-dark mb-1">MongoDB Connection URI</label>
                    <input 
                      type="password" 
                      placeholder="Enter your MongoDB Atlas Connection URI..."
                      value={mongoUri}
                      onChange={(e) => setMongoUri(e.target.value)}
                      className="w-full bg-sun-sand border border-sun-dark rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {dbConfigMessage && (
                <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-900 text-xs font-bold p-3 rounded-xl text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  {dbConfigMessage}
                </div>
              )}

              <button 
                type="submit"
                disabled={loadingDbConfig}
                className="bg-sun-dark text-sun-yellow font-black px-6 py-3 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-900 text-xs uppercase tracking-wider flex items-center gap-2"
              >
                {loadingDbConfig ? 'Testing Connection...' : 'Save & Test Database Connection'}
              </button>
            </form>
          </div>
        )}

        {/* Printable Leopards COD Label Modal */}
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

              <button 
                onClick={() => window.print()}
                className="w-full bg-black text-white py-2 rounded-lg font-sans font-bold text-xs uppercase"
              >
                Print Label
              </button>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/80">
            <div className="bg-sun-cream border-4 border-sun-dark p-6 rounded-3xl max-w-lg w-full shadow-retro-lg space-y-4 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-1 font-black text-sun-dark hover:text-amber-700"
              >
                ✕
              </button>

              <h3 className="font-display font-black text-xl uppercase text-sun-dark">Add New Product To DB</h3>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-sun-dark mb-1">Product Name</label>
                  <input type="text" required value={newProdName} onChange={e => setNewProdName(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" placeholder="e.g. Glowing Sun Serum" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sun-dark mb-1">Category</label>
                    <select value={newProdCategory} onChange={e => setNewProdCategory(e.target.value as any)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2">
                      <option value="kits">Kits</option>
                      <option value="facepack">Face Pack</option>
                      <option value="toner">Toner</option>
                      <option value="rosewater">Rose Water</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sun-dark mb-1">Selling Price (Rs.)</label>
                    <input type="number" required value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" placeholder="1500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sun-dark mb-1">Original Price (Rs.) [For Discount]</label>
                    <input type="number" value={newProdOrigPrice} onChange={e => setNewProdOrigPrice(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" placeholder="1800" />
                  </div>

                  <div>
                    <label className="block text-sun-dark mb-1">Offer Badge (e.g. 15% OFF)</label>
                    <input type="text" value={newProdTagline} onChange={e => setNewProdTagline(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" placeholder="🎁 SPECIAL OFFER - 15% OFF" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sun-dark mb-1">Size / Weight</label>
                    <input type="text" value={newProdSize} onChange={e => setNewProdSize(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" placeholder="100g / 3.5 oz" />
                  </div>

                  <div>
                    <label className="block text-sun-dark mb-1">Image URL / Path</label>
                    <input type="text" value={newProdImage} onChange={e => setNewProdImage(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 font-mono text-[11px]" placeholder="/images/glow-kit.png" />
                  </div>
                </div>

                <div>
                  <label className="block text-sun-dark mb-1">Subtitle</label>
                  <input type="text" value={newProdSubtitle} onChange={e => setNewProdSubtitle(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" placeholder="Artisanal Herbal Mask" />
                </div>

                <div>
                  <label className="block text-sun-dark mb-1">Description</label>
                  <textarea value={newProdDescription} onChange={e => setNewProdDescription(e.target.value)} className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 h-20" placeholder="Product details..." />
                </div>

                <button type="submit" className="w-full bg-sun-yellow text-sun-dark font-black py-3 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase">
                  Save Product To Database
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sun-dark/80">
            <div className="bg-sun-cream border-4 border-sun-dark p-6 rounded-3xl max-w-lg w-full shadow-retro-lg space-y-4 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-4 right-4 p-1 font-black text-sun-dark hover:text-amber-700 text-lg"
              >
                ✕
              </button>

              <h3 className="font-display font-black text-xl uppercase text-sun-dark">Edit Product Details & Offers</h3>

              <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-sun-dark mb-1">Product Title / Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editingProduct.name} 
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} 
                    className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sun-dark mb-1">Selling Price (Rs.)</label>
                    <input 
                      type="number" 
                      required 
                      value={editingProduct.price} 
                      onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} 
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 font-black text-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-sun-dark mb-1">Original Price (Rs.) [Offer Discount]</label>
                    <input 
                      type="number" 
                      value={editingProduct.originalPrice || editingProduct.price} 
                      onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })} 
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sun-dark mb-1">Offer / Discount Badge</label>
                    <input 
                      type="text" 
                      value={editingProduct.badge || ''} 
                      onChange={e => setEditingProduct({ ...editingProduct, badge: e.target.value })} 
                      placeholder="🎁 SAVE RS. 300 / 15% OFF"
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" 
                    />
                  </div>

                  <div>
                    <label className="block text-sun-dark mb-1">Image Path / URL</label>
                    <input 
                      type="text" 
                      value={editingProduct.image} 
                      onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} 
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 font-mono text-[11px]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sun-dark mb-1">Subtitle</label>
                  <input 
                    type="text" 
                    value={editingProduct.subtitle} 
                    onChange={e => setEditingProduct({ ...editingProduct, subtitle: e.target.value })} 
                    className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2" 
                  />
                </div>

                <div>
                  <label className="block text-sun-dark mb-1">Description</label>
                  <textarea 
                    value={editingProduct.description} 
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} 
                    className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2 h-20" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sun-dark mb-1">Stock Availability</label>
                    <select 
                      value={editingProduct.inStock ? 'true' : 'false'} 
                      onChange={e => setEditingProduct({ ...editingProduct, inStock: e.target.value === 'true' })}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2"
                    >
                      <option value="true">IN STOCK (Available)</option>
                      <option value="false">OUT OF STOCK (Disabled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sun-dark mb-1">Bestseller Status</label>
                    <select 
                      value={editingProduct.isBestseller ? 'true' : 'false'} 
                      onChange={e => setEditingProduct({ ...editingProduct, isBestseller: e.target.value === 'true' })}
                      className="w-full bg-sun-sand border-2 border-sun-dark rounded-xl px-3 py-2"
                    >
                      <option value="true">Featured Bestseller</option>
                      <option value="false">Standard Item</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-sun-yellow text-sun-dark font-black py-3 rounded-full border-2 border-sun-dark shadow-retro hover:bg-amber-400 uppercase">
                  Update Database Record
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

