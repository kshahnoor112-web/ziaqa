export const ORDER_STATUSES = [
  'New Order',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Assigned to Rider',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DEFAULT_CATEGORIES = [
  'Shawarma',
  'Burgers',
  'Pizza',
  'Fries',
  'Nuggets',
  'Other',
] as const;

export type AvailabilityStatus = 'Available' | 'Out of Stock';

export type OrderSource = 'WhatsApp' | 'Phone Call' | 'Storefront';

export type UserRole = 'admin' | 'rider';

export interface UserSession {
  role: UserRole;
  name: string;
  riderId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  availability: AvailabilityStatus;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string; // e.g. ZQ-1001
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  totalBill: number;
  specialInstructions: string;
  status: OrderStatus;
  riderId: string | null;
  source: OrderSource;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  addresses: string[];
  notes: string;
  promoOptIn: boolean;
  createdAt: string;
}

export interface CustomerWithStats extends Customer {
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  isRepeatCustomer: boolean;
  lastOrderAt: string | null;
  orderHistory: Order[];
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleNotes: string;
  active: boolean;
  pin: string;
}

export interface RiderExpense {
  id: string;
  riderId: string;
  amount: number;
  category: 'Petrol' | 'Maintenance' | 'Other';
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface AppState {
  categories: string[];
  menuItems: MenuItem[];
  orders: Order[];
  customers: Customer[];
  riders: Rider[];
  riderExpenses: RiderExpense[];
}
