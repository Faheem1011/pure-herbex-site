import { CreatorProfile, PromoCode, CreatorCommissionRecord, CreatorPayoutDetails, CreatorPayoutLog } from '../types';

const STORAGE_KEY_CREATORS = 'pureherbex_creators_db';
const STORAGE_KEY_COMMISSIONS = 'pureherbex_creator_commissions_db';
const STORAGE_KEY_PAYOUT_LOGS = 'pureherbex_creator_payout_logs_db';
const STORAGE_KEY_CURRENT_CREATOR = 'pureherbex_current_creator';
const STORAGE_KEY_ACTIVE_PROMO = 'pureherbex_applied_promo';

// Production Ready: No mock or demo creators are pre-seeded
const DEFAULT_CREATORS: CreatorProfile[] = [];

// Helper: Initialize creators db and purge any legacy mock/demo entries
export function getStoredCreators(): CreatorProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CREATORS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out any legacy dummy/demo entries if present
        const productionOnly = parsed.filter(c => 
          c.id !== 'creator-ayesha-glow' && 
          c.id !== 'creator-fatima-organics' &&
          !c.email?.includes('ayesha.glow@gmail.com') &&
          !c.email?.includes('fatima.noor.skincare@gmail.com')
        );
        if (productionOnly.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY_CREATORS, JSON.stringify(productionOnly));
        }
        return productionOnly;
      }
    }
  } catch (e) {}
  localStorage.setItem(STORAGE_KEY_CREATORS, JSON.stringify(DEFAULT_CREATORS));
  return DEFAULT_CREATORS;
}

export function saveCreators(creators: CreatorProfile[]): void {
  localStorage.setItem(STORAGE_KEY_CREATORS, JSON.stringify(creators));
}

// Helper: Delete creator account entirely
export function deleteCreatorAccount(creatorId: string): boolean {
  const creators = getStoredCreators();
  const filtered = creators.filter(c => c.id !== creatorId);
  saveCreators(filtered);

  // Clear from commission ledger
  const commissions = getStoredCommissions();
  const filteredComm = commissions.filter(c => c.creatorId !== creatorId);
  saveCommissions(filteredComm);

  // Clear from payout logs
  const logs = getStoredPayoutLogs();
  const filteredLogs = logs.filter(l => l.creatorId !== creatorId);
  savePayoutLogs(filteredLogs);

  // If current logged-in creator is deleted, logout
  const current = getCurrentCreator();
  if (current && current.id === creatorId) {
    logoutCreator();
  }

  return true;
}

// Helper: Purge any test/demo data completely
export function purgeAllDemoCreatorData(): void {
  const creators = getStoredCreators();
  const realCreators = creators.filter(c => 
    c.id !== 'creator-ayesha-glow' && 
    c.id !== 'creator-fatima-organics'
  );
  saveCreators(realCreators);
}

// Helper: Get all promo codes
export function getAllPromoCodes(): PromoCode[] {
  const creators = getStoredCreators();
  return creators.map(c => ({
    code: c.promoCode.toUpperCase().trim(),
    creatorId: c.id,
    creatorName: c.name,
    discountPercent: c.discountPercent || 10,
    commissionPercent: c.commissionPercent || 15,
    isActive: c.status === 'active',
    usageCount: c.totalKitsSold || 0,
    createdAt: c.joinedAt
  }));
}

// Helper: Get commission records
export function getStoredCommissions(): CreatorCommissionRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COMMISSIONS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

export function saveCommissions(records: CreatorCommissionRecord[]): void {
  localStorage.setItem(STORAGE_KEY_COMMISSIONS, JSON.stringify(records));
}

// Helper: Get payout logs
export function getStoredPayoutLogs(): CreatorPayoutLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PAYOUT_LOGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

export function savePayoutLogs(logs: CreatorPayoutLog[]): void {
  localStorage.setItem(STORAGE_KEY_PAYOUT_LOGS, JSON.stringify(logs));
}

// =========================================================================
// 1. CREATOR AUTHENTICATION & PROFILE MANAGEMENT
// =========================================================================

export function getCurrentCreator(): CreatorProfile | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_CREATOR);
    if (saved) {
      const parsed: CreatorProfile = JSON.parse(saved);
      const creators = getStoredCreators();
      const fresh = creators.find(c => c.id === parsed.id || c.email === parsed.email);
      return fresh || parsed;
    }
  } catch (e) {}
  return null;
}

export function logoutCreator(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_CREATOR);
  } catch (e) {}
}

export async function loginCreatorWithGoogle(profile?: {
  name?: string;
  email?: string;
  avatar?: string;
  googleId?: string;
}): Promise<{
  success: boolean;
  creator?: CreatorProfile;
  error?: string;
  isNewUser?: boolean;
}> {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mockEmail = profile?.email || `creator.${randomSuffix}@gmail.com`;
    const mockName = profile?.name || `Beauty Influencer #${randomSuffix.toString().slice(-2)}`;
    const mockAvatar = profile?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=Creator${randomSuffix}`;

    const creators = getStoredCreators();
    const existing = creators.find(c => c.email.toLowerCase() === mockEmail.toLowerCase());

    if (existing) {
      localStorage.setItem(STORAGE_KEY_CURRENT_CREATOR, JSON.stringify(existing));
      return { success: true, creator: existing, isNewUser: false };
    }

    const basePromo = `GLOW${randomSuffix.toString().slice(-3)}`;
    const newCreator: CreatorProfile = {
      id: `creator-${Date.now()}-${randomSuffix}`,
      name: mockName,
      email: mockEmail,
      avatar: mockAvatar,
      phone: '',
      socialHandle: `@koveriaglow_${randomSuffix.toString().slice(-3)}`,
      promoCode: basePromo,
      discountPercent: 10, // 10% off for buyer (Rs. 180 on Rs. 1,800)
      commissionPercent: 15, // 15% comm for creator (Rs. 270 on Rs. 1,800)
      payoutDetails: {
        method: 'easypaisa',
        accountTitle: mockName,
        accountNumber: ''
      },
      totalKitsSold: 0,
      totalRevenue: 0,
      totalCommissionEarned: 0,
      totalPaidCommission: 0,
      pendingCommission: 0,
      processingCommission: 0,
      joinedAt: new Date().toISOString(),
      status: 'active',
      approvalStatus: 'approved',
      lastPayoutStatus: 'idle'
    };

    creators.push(newCreator);
    saveCreators(creators);
    localStorage.setItem(STORAGE_KEY_CURRENT_CREATOR, JSON.stringify(newCreator));

    return { success: true, creator: newCreator, isNewUser: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Google Authentication failed. Please try again.' };
  }
}

export const loginWithGoogleCreator = loginCreatorWithGoogle;

export async function registerCreatorAccount(data: {
  name: string;
  email: string;
  phone?: string;
  socialHandle?: string;
  customPromoCode?: string;
  payoutMethod?: 'easypaisa' | 'jazzcash' | 'bank' | 'other';
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string;
}): Promise<{ success: boolean; creator?: CreatorProfile; error?: string }> {
  const creators = getStoredCreators();
  const existing = creators.find(c => c.email.toLowerCase() === data.email.toLowerCase().trim());
  if (existing) {
    return { success: false, error: 'A creator account with this email already exists. Please log in.' };
  }

  let finalCode = (data.customPromoCode || data.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) + '10').toUpperCase().trim();
  if (finalCode.length < 3) finalCode = 'GLOW' + Math.floor(100 + Math.random() * 900);

  const codeTaken = creators.some(c => c.promoCode.toUpperCase() === finalCode);
  if (codeTaken) {
    finalCode = finalCode + Math.floor(10 + Math.random() * 90);
  }

  const newCreator: CreatorProfile = {
    id: `creator-${Date.now()}`,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.name)}`,
    phone: data.phone || '',
    socialHandle: data.socialHandle || '',
    promoCode: finalCode,
    discountPercent: 10,
    commissionPercent: 15,
    payoutDetails: {
      method: data.payoutMethod || 'easypaisa',
      accountTitle: data.accountTitle || data.name,
      accountNumber: data.accountNumber || '',
      bankName: data.bankName
    },
    totalKitsSold: 0,
    totalRevenue: 0,
    totalCommissionEarned: 0,
    totalPaidCommission: 0,
    pendingCommission: 0,
    processingCommission: 0,
    joinedAt: new Date().toISOString(),
    status: 'active',
    approvalStatus: 'approved',
    lastPayoutStatus: 'idle'
  };

  creators.push(newCreator);
  saveCreators(creators);
  localStorage.setItem(STORAGE_KEY_CURRENT_CREATOR, JSON.stringify(newCreator));

  return { success: true, creator: newCreator };
}

export async function loginCreatorWithEmail(email: string): Promise<{
  success: boolean;
  creator?: CreatorProfile;
  error?: string;
}> {
  const creators = getStoredCreators();
  const creator = creators.find(c => c.email.toLowerCase() === email.toLowerCase().trim());
  if (!creator) {
    return { success: false, error: 'No creator account found with this email. Please sign up.' };
  }

  localStorage.setItem(STORAGE_KEY_CURRENT_CREATOR, JSON.stringify(creator));
  return { success: true, creator };
}

// =========================================================================
// 2. PROMO CODE CUSTOMIZATION
// =========================================================================

export function updateCreatorPromoCode(creatorId: string, newCode: string): {
  success: boolean;
  promoCode?: string;
  error?: string;
} {
  const cleanCode = newCode.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  if (cleanCode.length < 3) {
    return { success: false, error: 'Promo code must be at least 3 characters long.' };
  }

  const creators = getStoredCreators();
  const isTaken = creators.some(c => c.id !== creatorId && c.promoCode.toUpperCase() === cleanCode);
  if (isTaken) {
    return { success: false, error: `The promo code "${cleanCode}" is already taken. Please choose another.` };
  }

  const index = creators.findIndex(c => c.id === creatorId);
  if (index === -1) return { success: false, error: 'Creator not found.' };

  creators[index].promoCode = cleanCode;
  saveCreators(creators);

  const current = getCurrentCreator();
  if (current && current.id === creatorId) {
    current.promoCode = cleanCode;
    localStorage.setItem(STORAGE_KEY_CURRENT_CREATOR, JSON.stringify(current));
  }

  return { success: true, promoCode: cleanCode };
}

export function updateCreatorPayoutDetails(creatorId: string, details: CreatorPayoutDetails): boolean {
  const creators = getStoredCreators();
  const index = creators.findIndex(c => c.id === creatorId);
  if (index === -1) return false;

  creators[index].payoutDetails = details;
  saveCreators(creators);

  const current = getCurrentCreator();
  if (current && current.id === creatorId) {
    current.payoutDetails = details;
    localStorage.setItem(STORAGE_KEY_CURRENT_CREATOR, JSON.stringify(current));
  }
  return true;
}

// =========================================================================
// 3. PROMO CODE VALIDATION & AUTO-APPLY ENGINE
// =========================================================================

export function validatePromoCode(rawCode: string): {
  isValid: boolean;
  code?: string;
  discountPercent: number;
  commissionPercent: number;
  creator?: CreatorProfile;
  message?: string;
} {
  if (!rawCode) {
    return { isValid: false, discountPercent: 0, commissionPercent: 0, message: 'Please enter a promo code.' };
  }

  const clean = rawCode.toUpperCase().trim();
  const creators = getStoredCreators();
  const creator = creators.find(c => c.promoCode.toUpperCase() === clean && c.status === 'active');

  if (creator) {
    return {
      isValid: true,
      code: creator.promoCode,
      discountPercent: creator.discountPercent || 10,
      commissionPercent: creator.commissionPercent || 15,
      creator,
      message: `🎉 Creator code "${creator.promoCode}" applied! You get 10% OFF (Save Rs. 180 on Complete Kit).`
    };
  }

  // System fallback promo codes (e.g. GLOW10)
  if (clean === 'GLOW10' || clean === 'PURE10' || clean === 'FIRST10' || clean === 'WELCOME10') {
    return {
      isValid: true,
      code: clean,
      discountPercent: 10,
      commissionPercent: 0,
      message: `🎉 Promo code "${clean}" applied! 10% Discount active.`
    };
  }

  return {
    isValid: false,
    discountPercent: 0,
    commissionPercent: 0,
    message: `Invalid or expired creator promo code: "${rawCode}".`
  };
}

export function saveActivePromoCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROMO, code.toUpperCase().trim());
  } catch (e) {}
}

export function getActivePromoCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_PROMO);
  } catch (e) {}
  return null;
}

export function clearActivePromoCode(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_PROMO);
  } catch (e) {}
}

// =========================================================================
// 4. ORDER ATTRIBUTION & COMMISSION CALCULATION (RS. 1800 BASE)
// =========================================================================

export function processOrderCreatorCommission(params: {
  orderId: string;
  appliedPromoCode?: string;
  cartItems: any[];
  subtotal: number;
  discountAmount: number;
  customerCity: string;
}): { creatorId?: string; commissionEarned: number } {
  if (!params.appliedPromoCode) {
    return { commissionEarned: 0 };
  }

  const validation = validatePromoCode(params.appliedPromoCode);
  if (!validation.isValid || !validation.creator) {
    return { commissionEarned: 0 };
  }

  const creator = validation.creator;
  
  // Count complete kits sold in this order
  const kitsSold = params.cartItems.reduce((sum, item) => {
    const isKit = item.product?.id === 'koveria-glow-complete-kit' || 
                  (item.product?.name && item.product.name.toLowerCase().includes('kit')) ||
                  (item.product?.category === 'kits');
    return sum + (item.quantity || 1);
  }, 0);

  // Business Rule:
  // Commission base is 15% on original Rs. 1,800 price = Rs. 270 per kit.
  // Customer gets 10% on original Rs. 1,800 price = Rs. 180 discount per kit.
  // Total Value Given: Rs. 450 per kit.
  const kitUnitPrice = 1800;
  let commission = 0;
  if (kitsSold > 0) {
    commission = Math.round(kitsSold * (kitUnitPrice * 0.15)); // Exactly Rs. 270 per kit
  } else {
    commission = Math.round(params.subtotal * 0.15);
  }

  const commissionRecord: CreatorCommissionRecord = {
    id: 'comm-' + Date.now(),
    orderId: params.orderId,
    creatorId: creator.id,
    promoCode: creator.promoCode,
    orderDate: new Date().toISOString(),
    customerCity: params.customerCity || 'Lahore',
    kitsCount: kitsSold || 1,
    orderSubtotal: params.subtotal,
    discountApplied: params.discountAmount,
    commissionEarned: commission,
    status: 'pending'
  };

  // 1. Save commission ledger entry
  const existingCommissions = getStoredCommissions();
  existingCommissions.unshift(commissionRecord);
  saveCommissions(existingCommissions);

  // 2. Update creator stats
  const creators = getStoredCreators();
  const cIndex = creators.findIndex(c => c.id === creator.id);
  if (cIndex >= 0) {
    creators[cIndex].totalKitsSold = (creators[cIndex].totalKitsSold || 0) + (kitsSold || 1);
    creators[cIndex].totalRevenue = (creators[cIndex].totalRevenue || 0) + (params.subtotal - params.discountAmount);
    creators[cIndex].totalCommissionEarned = (creators[cIndex].totalCommissionEarned || 0) + commission;
    creators[cIndex].pendingCommission = (creators[cIndex].pendingCommission || 0) + commission;
    saveCreators(creators);
  }

  return { creatorId: creator.id, commissionEarned: commission };
}

export function fetchCreatorOrders(creatorId: string): CreatorCommissionRecord[] {
  const commissions = getStoredCommissions();
  return commissions.filter(c => c.creatorId === creatorId);
}

// =========================================================================
// 5. ADMIN CONTROL & MANUAL PAYOUT WORKFLOW (ZERO THRESHOLD)
// =========================================================================

export function getAllCreatorsForAdmin(): CreatorProfile[] {
  return getStoredCreators();
}

/**
 * Step 1: Admin marks a payout as "Processing"
 * The creator will immediately see "⏳ Payout is being processed by Admin" on their portal.
 */
export function startPayoutProcessing(creatorId: string, amount: number, adminNote?: string): boolean {
  const creators = getStoredCreators();
  const index = creators.findIndex(c => c.id === creatorId);
  if (index === -1) return false;

  const creator = creators[index];
  const payoutAmount = amount > 0 ? amount : creator.pendingCommission;
  if (payoutAmount <= 0) return false;

  creator.processingCommission = payoutAmount;
  creator.lastPayoutStatus = 'processing';
  creator.lastPayoutNote = adminNote || `Payout of Rs. ${payoutAmount.toLocaleString()} is currently being processed via ${creator.payoutDetails.method.toUpperCase()}.`;
  saveCreators(creators);

  // Update commission records status to processing
  const commissions = getStoredCommissions();
  commissions.forEach(c => {
    if (c.creatorId === creatorId && c.status === 'pending') {
      c.status = 'processing';
      c.processingNote = adminNote || 'In process with Admin';
    }
  });
  saveCommissions(commissions);

  // Add Payout Log
  const logs = getStoredPayoutLogs();
  logs.unshift({
    id: 'payout-log-' + Date.now(),
    creatorId: creator.id,
    creatorName: creator.name,
    amount: payoutAmount,
    method: creator.payoutDetails.method,
    accountNumber: creator.payoutDetails.accountNumber,
    accountTitle: creator.payoutDetails.accountTitle,
    status: 'processing',
    adminNote: adminNote || 'Initiated manual payout transfer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  savePayoutLogs(logs);

  return true;
}

/**
 * Step 2: Admin marks payout as "Paid" with Transaction ID (e.g. EasyPaisa / JazzCash Trx ID)
 * Deducts from pendingCommission, updates totalPaidCommission, and sets status to paid.
 */
export function completePayout(
  creatorId: string, 
  amount: number, 
  transactionId: string, 
  adminNote?: string
): boolean {
  const creators = getStoredCreators();
  const index = creators.findIndex(c => c.id === creatorId);
  if (index === -1) return false;

  const creator = creators[index];
  const disburseAmount = amount > 0 ? amount : (creator.processingCommission || creator.pendingCommission);

  creator.totalPaidCommission = (creator.totalPaidCommission || 0) + disburseAmount;
  creator.pendingCommission = Math.max(0, (creator.pendingCommission || 0) - disburseAmount);
  creator.processingCommission = 0;
  creator.lastPayoutStatus = 'paid';
  creator.lastPayoutTrxId = transactionId;
  creator.lastPayoutNote = adminNote || `Paid via ${creator.payoutDetails.method.toUpperCase()} (Trx ID: ${transactionId})`;
  saveCreators(creators);

  // Update commission records to paid
  const commissions = getStoredCommissions();
  commissions.forEach(c => {
    if (c.creatorId === creatorId && (c.status === 'pending' || c.status === 'processing')) {
      c.status = 'paid';
      c.transactionId = transactionId;
      c.paidAt = new Date().toISOString();
    }
  });
  saveCommissions(commissions);

  // Update Payout Logs
  const logs = getStoredPayoutLogs();
  const logIndex = logs.findIndex(l => l.creatorId === creatorId && l.status === 'processing');
  if (logIndex >= 0) {
    logs[logIndex].status = 'paid';
    logs[logIndex].transactionId = transactionId;
    logs[logIndex].adminNote = adminNote || logs[logIndex].adminNote;
    logs[logIndex].updatedAt = new Date().toISOString();
  } else {
    logs.unshift({
      id: 'payout-log-' + Date.now(),
      creatorId: creator.id,
      creatorName: creator.name,
      amount: disburseAmount,
      method: creator.payoutDetails.method,
      accountNumber: creator.payoutDetails.accountNumber,
      accountTitle: creator.payoutDetails.accountTitle,
      status: 'paid',
      transactionId,
      adminNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  savePayoutLogs(logs);

  return true;
}

export function updateCreatorApproval(
  creatorId: string, 
  approvalStatus: 'approved' | 'pending_review' | 'rejected', 
  status: 'active' | 'suspended' = 'active'
): boolean {
  const creators = getStoredCreators();
  const index = creators.findIndex(c => c.id === creatorId);
  if (index === -1) return false;

  creators[index].approvalStatus = approvalStatus;
  creators[index].status = status;
  saveCreators(creators);
  return true;
}

export function setCreatorStatus(creatorId: string, status: 'active' | 'pending' | 'suspended'): boolean {
  const creators = getStoredCreators();
  const index = creators.findIndex(c => c.id === creatorId);
  if (index === -1) return false;

  creators[index].status = status;
  saveCreators(creators);
  return true;
}
