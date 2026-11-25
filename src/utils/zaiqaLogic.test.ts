import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBackupJson,
  calculateOrderTotals,
  computePhase1Summary,
  computeRiderDailyStats,
  enrichCustomersWithStats,
  filterOrders,
  findCustomerByPhone,
  generateNextOrderId,
  getLocalDateKey,
  isRepeatCustomer,
  isValidOrderStatus,
  normalizePhone,
  parseBackupJson,
} from './zaiqaLogic';
import { AppState, Customer, ORDER_STATUSES, Order, RiderExpense } from '../types/zaiqa';

test('ORDER_STATUSES contains exact 8 required statuses in sequence', () => {
  assert.deepEqual(ORDER_STATUSES, [
    'New Order',
    'Confirmed',
    'Preparing',
    'Ready for Pickup',
    'Assigned to Rider',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ]);
  assert.equal(isValidOrderStatus('Preparing'), true);
  assert.equal(isValidOrderStatus('Pending'), false);
});

test('generateNextOrderId increments highest ZQ order number', () => {
  const sampleOrders = [
    { id: 'ZQ-1001' } as Order,
    { id: 'ZQ-1006' } as Order,
    { id: 'ZQ-1003' } as Order,
  ];
  assert.equal(generateNextOrderId([]), 'ZQ-1001');
  assert.equal(generateNextOrderId(sampleOrders), 'ZQ-1007');
});

test('calculateOrderTotals computes Subtotal + Delivery = Total Bill accurately', () => {
  const totals = calculateOrderTotals(
    [
      { menuItemId: 'm1', name: 'Zaiqa Shawarma', unitPrice: 450, quantity: 2 },
      { menuItemId: 'm2', name: 'Loaded Fries', unitPrice: 380, quantity: 1 },
    ],
    150
  );
  assert.equal(totals.subtotal, 1280);
  assert.equal(totals.deliveryCharge, 150);
  assert.equal(totals.totalBill, 1430);
});

test('findCustomerByPhone auto-matches normalized phone numbers', () => {
  const customers: Customer[] = [
    {
      id: 'c1',
      name: 'Ayesha Tariq',
      phone: '0300-1234567',
      addresses: ['House 14, Block H, Gulberg II'],
      notes: 'Extra garlic sauce',
      promoOptIn: true,
      createdAt: '2026-11-20T10:00:00Z',
    },
  ];

  assert.equal(normalizePhone('0300 123-4567'), '03001234567');
  const match = findCustomerByPhone(customers, '03001234567');
  assert.equal(match?.id, 'c1');
  assert.equal(match?.name, 'Ayesha Tariq');
  assert.equal(findCustomerByPhone(customers, '0311'), undefined);
});

test('isRepeatCustomer and enrichCustomersWithStats tag 2+ non-cancelled orders', () => {
  assert.equal(isRepeatCustomer(0), false);
  assert.equal(isRepeatCustomer(1), false);
  assert.equal(isRepeatCustomer(2), true);

  const customers: Customer[] = [
    {
      id: 'c1',
      name: 'Hamza Raza',
      phone: '03219876543',
      addresses: ['Street 4, DHA Phase 5'],
      notes: '',
      promoOptIn: true,
      createdAt: '2026-11-18T12:00:00Z',
    },
    {
      id: 'c2',
      name: 'Sana Khan',
      phone: '03331112222',
      addresses: ['Flat 9B, Johar Town'],
      notes: '',
      promoOptIn: false,
      createdAt: '2026-11-24T12:00:00Z',
    },
  ];

  const orders: Order[] = [
    {
      id: 'ZQ-1001',
      customerId: 'c1',
      customerName: 'Hamza Raza',
      customerPhone: '03219876543',
      deliveryAddress: 'Street 4, DHA Phase 5',
      items: [],
      subtotal: 900,
      deliveryCharge: 120,
      totalBill: 1020,
      specialInstructions: '',
      status: 'Delivered',
      riderId: 'r1',
      source: 'WhatsApp',
      createdAt: '2026-11-24T14:00:00Z',
      updatedAt: '2026-11-24T14:40:00Z',
    },
    {
      id: 'ZQ-1002',
      customerId: 'c1',
      customerName: 'Hamza Raza',
      customerPhone: '03219876543',
      deliveryAddress: 'Office 22, Cavalry Ground',
      items: [],
      subtotal: 650,
      deliveryCharge: 100,
      totalBill: 750,
      specialInstructions: '',
      status: 'Out for Delivery',
      riderId: 'r1',
      source: 'Phone Call',
      createdAt: '2026-11-25T10:00:00Z',
      updatedAt: '2026-11-25T10:20:00Z',
    },
    {
      id: 'ZQ-1003',
      customerId: 'c2',
      customerName: 'Sana Khan',
      customerPhone: '03331112222',
      deliveryAddress: 'Flat 9B, Johar Town',
      items: [],
      subtotal: 500,
      deliveryCharge: 100,
      totalBill: 600,
      specialInstructions: '',
      status: 'Cancelled',
      riderId: null,
      source: 'WhatsApp',
      createdAt: '2026-11-25T09:00:00Z',
      updatedAt: '2026-11-25T09:10:00Z',
    },
  ];

  const enriched = enrichCustomersWithStats(customers, orders);
  const c1 = enriched.find((c) => c.id === 'c1');
  const c2 = enriched.find((c) => c.id === 'c2');

  assert.equal(c1?.totalOrders, 2);
  assert.equal(c1?.isRepeatCustomer, true);
  assert.equal(c1?.addresses.length, 2);
  assert.equal(c2?.totalOrders, 0);
  assert.equal(c2?.isRepeatCustomer, false);
});

test('computePhase1Summary and computeRiderDailyStats aggregate metrics accurately', () => {
  const refDate = new Date('2026-11-25T12:00:00');
  const todayIso = refDate.toISOString();
  const todayKey = getLocalDateKey(refDate);

  const customers: Customer[] = [
    {
      id: 'c1',
      name: 'Hamza Raza',
      phone: '03219876543',
      addresses: ['DHA'],
      notes: '',
      promoOptIn: true,
      createdAt: todayIso,
    },
  ];

  const orders: Order[] = [
    {
      id: 'ZQ-1001',
      customerId: 'c1',
      customerName: 'Hamza Raza',
      customerPhone: '03219876543',
      deliveryAddress: 'DHA',
      items: [],
      subtotal: 1000,
      deliveryCharge: 150,
      totalBill: 1150,
      specialInstructions: '',
      status: 'Delivered',
      riderId: 'r1',
      source: 'WhatsApp',
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'ZQ-1002',
      customerId: 'c1',
      customerName: 'Hamza Raza',
      customerPhone: '03219876543',
      deliveryAddress: 'DHA',
      items: [],
      subtotal: 800,
      deliveryCharge: 100,
      totalBill: 900,
      specialInstructions: '',
      status: 'Out for Delivery',
      riderId: 'r1',
      source: 'Phone Call',
      createdAt: todayIso,
      updatedAt: todayIso,
    },
  ];

  const expenses: RiderExpense[] = [
    {
      id: 'exp-1',
      riderId: 'r1',
      amount: 350,
      category: 'Petrol',
      note: 'Morning fuel refill',
      date: todayKey,
      createdAt: todayIso,
    },
  ];

  const summary = computePhase1Summary(orders, customers, refDate);
  assert.equal(summary.totalOrdersToday, 2);
  assert.equal(summary.activeDeliveries, 1);
  assert.equal(summary.deliveredOrders, 1);
  assert.equal(summary.repeatCustomersCount, 1);
  assert.equal(summary.totalSales, 2050);
  assert.equal(summary.totalDeliveryCharges, 250);

  const riderStats = computeRiderDailyStats('r1', orders, expenses, todayKey);
  assert.equal(riderStats.assignedCount, 2);
  assert.equal(riderStats.deliveredCount, 1);
  assert.equal(riderStats.inTransitCount, 1);
  assert.equal(riderStats.deliveryChargesCollected, 150);
  assert.equal(riderStats.petrolExpenses, 350);
  assert.equal(riderStats.netDeliveryBalance, -200);
});

test('filterOrders and JSON backup round-trip preserve state', () => {
  const orders: Order[] = [
    {
      id: 'ZQ-1001',
      customerId: 'c1',
      customerName: 'Ayesha',
      customerPhone: '03001234567',
      deliveryAddress: 'Gulberg',
      items: [],
      subtotal: 500,
      deliveryCharge: 100,
      totalBill: 600,
      specialInstructions: '',
      status: 'New Order',
      riderId: null,
      source: 'WhatsApp',
      createdAt: '2026-11-25T10:00:00Z',
      updatedAt: '2026-11-25T10:00:00Z',
    },
  ];

  assert.equal(filterOrders(orders, 'ZQ-1001', 'All').length, 1);
  assert.equal(filterOrders(orders, 'ayesha', 'New Order').length, 1);
  assert.equal(filterOrders(orders, 'ayesha', 'Delivered').length, 0);

  const state: AppState = {
    categories: ['Shawarma', 'Burgers'],
    menuItems: [],
    orders,
    customers: [],
    riders: [],
    riderExpenses: [],
  };

  const json = buildBackupJson(state);
  const parsed = parseBackupJson(json);
  assert.equal(parsed.orders[0].id, 'ZQ-1001');
  assert.deepEqual(parsed.categories, ['Shawarma', 'Burgers']);
});
