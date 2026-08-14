import { Order } from '../types';
import { fetchLiveOrders } from './supabase';

export interface CustomerUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  wishlistProductIds: string[];
  createdAt: string;
}

interface StoredCustomerAccount extends CustomerUser {
  passwordHash: string;
}

const STORAGE_KEY_CUSTOMERS = 'pureherbex_customers_db';
const STORAGE_KEY_CURRENT_USER = 'pureherbex_current_customer';

// Helper to get all registered customers
function getAllCustomers(): StoredCustomerAccount[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

// 1. Get Logged In Customer
export function getCurrentCustomer(): CustomerUser | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

// 2. Register New Customer
export async function registerCustomer(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  city?: string;
  address?: string;
}): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const customers = getAllCustomers();

  if (customers.some(c => c.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An account with this email already exists. Please log in.' };
  }

  if (params.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const newCustomer: StoredCustomerAccount = {
    id: 'cust-' + Date.now(),
    email: cleanEmail,
    fullName: params.fullName.trim(),
    phone: params.phone.trim(),
    city: params.city || 'Lahore',
    address: params.address || '',
    wishlistProductIds: [],
    createdAt: new Date().toISOString(),
    passwordHash: btoa(params.password) // Simple reversible encoding for client-side storage
  };

  customers.push(newCustomer);
  localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));

  const { passwordHash, ...userSafe } = newCustomer;
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(userSafe));
  return { success: true, user: userSafe };
}

// 3. Login Existing Customer
export async function loginCustomer(params: {
  email: string;
  password: string;
}): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const customers = getAllCustomers();
  const user = customers.find(c => c.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { success: false, error: 'No account found with this email address.' };
  }

  if (user.passwordHash !== btoa(params.password)) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  const { passwordHash, ...userSafe } = user;
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(userSafe));
  return { success: true, user: userSafe };
}

// 4. Logout Customer
export function logoutCustomer(): void {
  localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
}

// 5. Update Profile
export function updateCustomerProfile(updates: Partial<CustomerUser>): CustomerUser | null {
  const current = getCurrentCustomer();
  if (!current) return null;

  const updated: CustomerUser = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updated));

  const customers = getAllCustomers();
  const idx = customers.findIndex(c => c.id === current.id);
  if (idx >= 0) {
    customers[idx] = { ...customers[idx], ...updates };
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  }

  return updated;
}

// 6. Toggle Wishlist Item
export function toggleWishlistProduct(productId: string): string[] {
  const current = getCurrentCustomer();
  let wishlist: string[] = [];

  if (current) {
    const exists = current.wishlistProductIds.includes(productId);
    wishlist = exists 
      ? current.wishlistProductIds.filter(id => id !== productId)
      : [...current.wishlistProductIds, productId];
    updateCustomerProfile({ wishlistProductIds: wishlist });
  } else {
    // Guest wishlist storage
    try {
      const guestSaved = localStorage.getItem('pureherbex_guest_wishlist');
      const guestList: string[] = guestSaved ? JSON.parse(guestSaved) : [];
      const exists = guestList.includes(productId);
      wishlist = exists ? guestList.filter(id => id !== productId) : [...guestList, productId];
      localStorage.setItem('pureherbex_guest_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }

  return wishlist;
}

// 7. Get Customer Wishlist
export function getCustomerWishlist(): string[] {
  const current = getCurrentCustomer();
  if (current) return current.wishlistProductIds || [];
  try {
    const guestSaved = localStorage.getItem('pureherbex_guest_wishlist');
    if (guestSaved) return JSON.parse(guestSaved);
  } catch (e) {}
  return [];
}

// 8. Fetch Orders for Current Customer
export async function getCustomerOrders(emailOrPhone?: string): Promise<Order[]> {
  try {
    const liveData = await fetchLiveOrders();
    const allOrders = liveData.orders || [];
    if (!emailOrPhone) {
      const current = getCurrentCustomer();
      if (!current) return [];
      const cleanPhone = current.phone.replace(/[^0-9]/g, '');
      return allOrders.filter(o => {
        const orderPhone = (o.phone || '').replace(/[^0-9]/g, '');
        return (cleanPhone && orderPhone.includes(cleanPhone)) || (o.fullName.toLowerCase() === current.fullName.toLowerCase());
      });
    }
    const cleanQuery = emailOrPhone.trim().toLowerCase();
    const cleanNum = cleanQuery.replace(/[^0-9]/g, '');
    return allOrders.filter(o => {
      const orderPhone = (o.phone || '').replace(/[^0-9]/g, '');
      return (cleanNum && orderPhone.includes(cleanNum)) || o.fullName.toLowerCase().includes(cleanQuery);
    });
  } catch (err) {
    return [];
  }
}
