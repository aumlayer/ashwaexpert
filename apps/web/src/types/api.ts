// API Types for Ashva Experts

// ============ Common Types ============
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// ============ Availability Types ============
export interface AvailabilityCheckRequest {
  pincode: string;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  pincode: string;
  city: string;
  state: string;
  locality?: string;
  estimatedInstallDays: number;
  message?: string;
}

// ============ Plan Types ============
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  monthlyPrice: number;
  originalPrice?: number;
  depositAmount: number;
  lockInMonths: number;
  category: "home" | "pg" | "office" | "apartment";
  purifierType: "ro" | "ro-uv" | "ro-uv-copper" | "ro-alkaline" | "ro-uv-alkaline";
  features: string[];
  inclusions: PlanInclusion[];
  specs: PlanSpecs;
  badge?: string;
  bestFor: string;
  imageUrl: string;
  isPopular: boolean;
  isActive: boolean;
  prepaidOptions: PrepaidOption[];
}

export interface PlanInclusion {
  title: string;
  description: string;
  icon: string;
}

export interface PlanSpecs {
  stages: number;
  tankCapacity: string;
  maxTds: number;
  warranty: string;
  purificationRate: string;
}

export interface PrepaidOption {
  months: number;
  discountPercent: number;
  totalPrice: number;
  savingsAmount: number;
}

// ============ Lead Types ============
export interface Lead {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  pincode: string;
  source: "website" | "whatsapp" | "callback" | "exit_intent" | "corporate";
  status: "new" | "contacted" | "scheduled" | "converted" | "lost";
  notes?: string;
  createdAt: string;
}

export interface CreateLeadRequest {
  name?: string;
  phone: string;
  email?: string;
  pincode: string;
  source: Lead["source"];
  message?: string;
}

// ============ Subscription Types ============
export interface Subscription {
  id: string;
  planId: string;
  plan: Plan;
  status: "pending" | "active" | "paused" | "cancelled";
  startDate: string;
  nextBillingDate: string;
  monthlyAmount: number;
  address: Address;
  device?: Device;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface Device {
  id: string;
  serialNumber: string;
  model: string;
  installedDate: string;
}

// ============ Checkout Types ============
export interface CheckoutRequest {
  planId: string;
  tenureMonths: number;
  customer: CustomerDetails;
  address: Address;
  installationSlot: InstallationSlot;
  couponCode?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  alternatePhone?: string;
}

export interface InstallationSlot {
  date: string;
  timeSlot: "morning" | "afternoon" | "evening";
}

export interface CheckoutResponse {
  orderId: string;
  subscriptionId: string;
  paymentUrl?: string;
  amount: number;
  status: "pending" | "confirmed";
}

// ============ Service Ticket Types ============
export interface ServiceTicket {
  id: string;
  subscriptionId: string;
  category: "maintenance" | "repair" | "complaint" | "relocation" | "other";
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  preferredSlot?: InstallationSlot;
  assignedTechnician?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ============ Testimonial Types ============
export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  avatarUrl?: string;
  planName?: string;
  verifiedCustomer: boolean;
}

// ============ FAQ Types ============
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

// ============ City Types ============
export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  isActive: boolean;
  pincodes: string[];
  localContent?: {
    headline: string;
    description: string;
    waterQuality: string;
  };
}
