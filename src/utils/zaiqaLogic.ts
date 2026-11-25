import {
  AppState,
  Customer,
  CustomerWithStats,
  ORDER_STATUSES,
  Order,
  OrderItem,
  OrderStatus,
  RiderExpense,
} from '../types/zaiqa';

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()+]/g, '').trim();
}

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rs. ${safe.toLocaleString('en-PK')}`;
}

export function isValidOrderStatus(status: string): status is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(status);
}

export function generateNextOrderId(orders: Order[]): string {
  let maxNumber = 1000;
  for (const order of orders) {
    const match = /^ZQ-(\d+)$/i.exec(order.id.trim());
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }
  return `ZQ-${maxNumber + 1}`;
}

export function calculateOrderTotals(
  items: OrderItem[],
  deliveryCharge: number
): { subtotal: number; deliveryCharge: number; totalBill: number } {
  const subtotal = items.reduce((sum, item) => {
    const qty = Math.max(0, Math.floor(item.quantity));
    const price = Math.max(0, item.unitPrice);
    return sum + qty * price;
  }, 0);
  const safeDelivery = Math.max(0, Number.isFinite(deliveryCharge) ? deliveryCharge : 0);
  return {
    subtotal,
    deliveryCharge: safeDelivery,
    totalBill: subtotal + safeDelivery,
  };
}

export function findCustomerByPhone(
  customers: Customer[],
  phoneInput: string
): Customer | undefined {
  const normalized = normalizePhone(phoneInput);
  if (!normalized || normalized.length < 7) return undefined;
  return customers.find((c) => normalizePhone(c.phone) === normalized);
}

export function isRepeatCustomer(orderCount: number): boolean {
  return orderCount >= 2;
}

export function enrichCustomersWithStats(
  customers: Customer[],
  orders: Order[]
): CustomerWithStats[] {
  return customers.map((customer) => {
    const normPhone = normalizePhone(customer.phone);
    const matchingOrders = orders
      .filter(
        (o) =>
          o.customerId === customer.id ||
          (normPhone.length >= 7 && normalizePhone(o.customerPhone) === normPhone)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeOrCompleted = matchingOrders.filter((o) => o.status !== 'Cancelled');
    const totalOrders = activeOrCompleted.length;
    const completedOrders = matchingOrders.filter((o) => o.status === 'Delivered').length;
    const totalSpent = activeOrCompleted.reduce((sum, o) => sum + o.totalBill, 0);

    const addressSet = new Set<string>(customer.addresses.filter((a) => a.trim().length > 0));
    for (const o of matchingOrders) {
      if (o.deliveryAddress.trim().length > 0) {
        addressSet.add(o.deliveryAddress.trim());
      }
    }

    return {
      ...customer,
      addresses: Array.from(addressSet),
      totalOrders,
      completedOrders,
      totalSpent,
      isRepeatCustomer: isRepeatCustomer(totalOrders),
      lastOrderAt: matchingOrders[0]?.createdAt ?? null,
      orderHistory: matchingOrders,
    };
  });
}

export function getLocalDateKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface Phase1Summary {
  totalOrdersToday: number;
  activeDeliveries: number;
  deliveredOrders: number;
  repeatCustomersCount: number;
  totalSales: number;
  totalDeliveryCharges: number;
}

const ACTIVE_DELIVERY_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'New Order',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Assigned to Rider',
  'Out for Delivery',
]);

export function computePhase1Summary(
  orders: Order[],
  customers: Customer[],
  referenceDate: Date = new Date()
): Phase1Summary {
  const todayKey = getLocalDateKey(referenceDate);
  const nonCancelled = orders.filter((o) => o.status !== 'Cancelled');
  const ordersToday = nonCancelled.filter((o) => getLocalDateKey(o.createdAt) === todayKey);

  const activeDeliveries = orders.filter((o) => ACTIVE_DELIVERY_STATUSES.has(o.status)).length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;

  const enrichedCustomers = enrichCustomersWithStats(customers, orders);
  const repeatCustomersCount = enrichedCustomers.filter((c) => c.isRepeatCustomer).length;

  const totalSales = nonCancelled.reduce((sum, o) => sum + o.totalBill, 0);
  const totalDeliveryCharges = nonCancelled.reduce((sum, o) => sum + o.deliveryCharge, 0);

  return {
    totalOrdersToday: ordersToday.length,
    activeDeliveries,
    deliveredOrders,
    repeatCustomersCount,
    totalSales,
    totalDeliveryCharges,
  };
}

export interface RiderDailyStats {
  assignedCount: number;
  inTransitCount: number;
  deliveredCount: number;
  deliveryChargesCollected: number;
  codCollectedTotal: number;
  petrolExpenses: number;
  netDeliveryBalance: number;
}

export function computeRiderDailyStats(
  riderId: string,
  orders: Order[],
  expenses: RiderExpense[],
  dateKey?: string
): RiderDailyStats {
  const targetDate = dateKey ?? getLocalDateKey(new Date());
  const riderOrders = orders.filter(
    (o) =>
      o.riderId === riderId &&
      o.status !== 'Cancelled' &&
      (!dateKey || getLocalDateKey(o.createdAt) === targetDate)
  );

  const delivered = riderOrders.filter((o) => o.status === 'Delivered');
  const inTransit = riderOrders.filter(
    (o) => o.status === 'Assigned to Rider' || o.status === 'Out for Delivery'
  );

  const deliveryChargesCollected = delivered.reduce((sum, o) => sum + o.deliveryCharge, 0);
  const codCollectedTotal = delivered.reduce((sum, o) => sum + o.totalBill, 0);

  const riderExpensesForDate = expenses.filter(
    (e) => e.riderId === riderId && (!dateKey || e.date === targetDate)
  );
  const petrolExpenses = riderExpensesForDate.reduce((sum, e) => sum + e.amount, 0);

  return {
    assignedCount: riderOrders.length,
    inTransitCount: inTransit.length,
    deliveredCount: delivered.length,
    deliveryChargesCollected,
    codCollectedTotal,
    petrolExpenses,
    netDeliveryBalance: deliveryChargesCollected - petrolExpenses,
  };
}

export function filterOrders(
  orders: Order[],
  query: string,
  statusFilter: string
): Order[] {
  const q = query.trim().toLowerCase();
  const normQ = normalizePhone(query);

  return orders
    .filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const matchesText =
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.deliveryAddress.toLowerCase().includes(q);
      const matchesPhone = normQ.length >= 3 && normalizePhone(order.customerPhone).includes(normQ);
      return matchesText || matchesPhone;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function buildBackupJson(state: AppState): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      system: 'ZAIQA-Phase-1',
      data: state,
    },
    null,
    2
  );
}

export function parseBackupJson(raw: string): AppState {
  const parsed = JSON.parse(raw) as { data?: Partial<AppState> } | Partial<AppState>;
  const candidate = ('data' in parsed && parsed.data ? parsed.data : parsed) as Partial<AppState>;

  if (
    !Array.isArray(candidate.menuItems) ||
    !Array.isArray(candidate.orders) ||
    !Array.isArray(candidate.customers) ||
    !Array.isArray(candidate.riders)
  ) {
    throw new Error('Invalid ZAIQA backup file structure.');
  }

  return {
    categories: Array.isArray(candidate.categories)
      ? candidate.categories
      : ['Shawarma', 'Burgers', 'Pizza', 'Fries', 'Nuggets', 'Other'],
    menuItems: candidate.menuItems,
    orders: candidate.orders,
    customers: candidate.customers,
    riders: candidate.riders,
    riderExpenses: Array.isArray(candidate.riderExpenses) ? candidate.riderExpenses : [],
  };
}
