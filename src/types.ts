export interface Product {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: 'kits' | 'facepack' | 'toner' | 'rosewater';
  image: string;
  badge?: string;
  description: string;
  benefits: string[];
  ingredients: string[];
  usage: string;
  size: string;
  inStock: boolean;
  isBestseller?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  location: string;
  productName: string;
}

export interface Order {
  id: string;
  orderDate: string;
  fullName: string;
  address: string;
  city: string;
  phone: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  courier: 'Leopards COD (Run Couriers)';
  trackingNumber: string;
  status: 'Pending' | 'Booked via Leopards' | 'Dispatched' | 'Delivered' | 'Cancelled';
}

export interface OrderStatus {
  orderId: string;
  status: 'Pending' | 'Booked via Leopards' | 'Dispatched' | 'Delivered';
  customerName: string;
  courierTrackingCode: string;
  estimatedDelivery: string;
  items: string[];
  totalAmount: number;
}
