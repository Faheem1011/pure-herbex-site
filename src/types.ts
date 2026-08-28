export interface Product {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: 'kits' | 'facepack' | 'toner' | 'rosewater' | 'lipcare' | 'bodycare' | 'scrub' | 'serum';
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

export interface CreatorPayoutDetails {
  method: 'easypaisa' | 'jazzcash' | 'bank' | 'other';
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  socialHandle?: string; // @handle or URL
  promoCode: string; // e.g. AYESHA10
  discountPercent: number; // 10%
  commissionPercent: number; // 15%
  payoutDetails: CreatorPayoutDetails;
  totalKitsSold: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalPaidCommission: number;
  pendingCommission: number;
  processingCommission?: number;
  joinedAt: string;
  status: 'active' | 'pending' | 'suspended';
  approvalStatus?: 'approved' | 'pending_review' | 'rejected';
  lastPayoutStatus?: 'idle' | 'processing' | 'paid';
  lastPayoutNote?: string;
  lastPayoutTrxId?: string;
}

export interface PromoCode {
  code: string;
  creatorId: string;
  creatorName: string;
  discountPercent: number; // 10
  commissionPercent: number; // 15
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface CreatorCommissionRecord {
  id: string;
  orderId: string;
  creatorId: string;
  promoCode: string;
  orderDate: string;
  customerCity: string;
  kitsCount: number;
  orderSubtotal: number;
  discountApplied: number;
  commissionEarned: number; // 15% on kits
  status: 'pending' | 'processing' | 'paid';
  processingNote?: string;
  transactionId?: string;
  paidAt?: string;
}

export interface CreatorPayoutLog {
  id: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  method: string;
  accountNumber: string;
  accountTitle: string;
  status: 'processing' | 'paid';
  transactionId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
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
  appliedPromoCode?: string;
  creatorId?: string;
  creatorCommissionAmount?: number;
  discountAmount?: number;
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

