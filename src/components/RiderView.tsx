import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Fuel,
  LogOut,
  MapPin,
  Phone,
  Truck,
  UserCheck,
} from 'lucide-react';
import {
  Order,
  OrderStatus,
  Rider,
  RiderExpense,
  UserSession,
} from '../types/zaiqa';
import {
  computeRiderDailyStats,
  formatCurrency,
  getLocalDateKey,
} from '../utils/zaiqaLogic';
import { StatusBadge } from './StatusBadge';

interface RiderViewProps {
  session: UserSession;
  riders: Rider[];
  orders: Order[];
  riderExpenses: RiderExpense[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAddRiderExpense: (expense: Omit<RiderExpense, 'id' | 'createdAt'>) => void;
  onSwitchDemoRider: (rider: Rider) => void;
  onLogout: () => void;
}

const RIDER_ALLOWED_STATUSES: OrderStatus[] = [
  'Assigned to Rider',
  'Out for Delivery',
  'Delivered',
];

export const RiderView: React.FC<RiderViewProps> = ({
  session,
  riders,
  orders,
  riderExpenses,
  onUpdateOrderStatus,
  onAddRiderExpense,
  onSwitchDemoRider,
  onLogout,
}) => {
  const todayKey = getLocalDateKey(new Date());
  const currentRider = useMemo(
    () => riders.find((r) => r.id === session.riderId) ?? riders[0],
    [riders, session.riderId]
  );

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Petrol' | 'Maintenance' | 'Other'>(
    'Petrol'
  );
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseError, setExpenseError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');

  const assignedOrders = useMemo(() => {
    if (!currentRider) return [];
    return orders
      .filter((o) => o.riderId === currentRider.id && o.status !== 'Cancelled')
      .filter((o) => (statusFilter === 'active' ? o.status !== 'Delivered' : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentRider, statusFilter]);

  const dailyStats = useMemo(() => {
    if (!currentRider) {
      return {
        assignedCount: 0,
        inTransitCount: 0,
        deliveredCount: 0,
        deliveryChargesCollected: 0,
        codCollectedTotal: 0,
        petrolExpenses: 0,
        netDeliveryBalance: 0,
      };
    }
    return computeRiderDailyStats(currentRider.id, orders, riderExpenses, todayKey);
  }, [currentRider, orders, riderExpenses, todayKey]);

  const myExpenses = useMemo(() => {
    if (!currentRider) return [];
    return riderExpenses
      .filter((e) => e.riderId === currentRider.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [riderExpenses, currentRider]);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRider) return;
    const amt = Number.parseFloat(expenseAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setExpenseError('Enter a valid expense amount in Rs.');
      return;
    }
    setExpenseError('');
    onAddRiderExpense({
      riderId: currentRider.id,
      amount: amt,
      category: expenseCategory,
      note: expenseNote.trim() || `${expenseCategory} expense`,
      date: todayKey,
    });
    setExpenseAmount('');
    setExpenseNote('');
  };

  if (!currentRider) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-sm text-stone-600">No rider profile found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-69px)] bg-[#FAF9F6] pb-16">
      {/* Rider Identity Banner */}
      <div className="bg-[#141210] text-white border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-amber-400">
              Delivery Rider Dispatch · {todayKey}
            </p>
            <h1 className="font-display text-2xl font-bold mt-1">{currentRider.name}</h1>
            <p className="text-xs text-stone-400 mt-1">
              {currentRider.phone} · {currentRider.vehicleNotes}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="demo-rider-switch" className="sr-only">
              Switch rider profile
            </label>
            <select
              id="demo-rider-switch"
              value={currentRider.id}
              onChange={(e) => {
                const found = riders.find((r) => r.id === e.target.value);
                if (found) onSwitchDemoRider(found);
              }}
              className="rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  Rider: {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 px-3.5 py-2 text-xs font-medium text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Rider Daily KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="text-xs text-stone-500 font-medium">Assigned Today</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1">
              {dailyStats.assignedCount}
            </p>
            <p className="text-xs text-stone-500 mt-1 tabular-nums">
              {dailyStats.inTransitCount} active in queue
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="text-xs text-stone-500 font-medium">Delivered Today</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              {dailyStats.deliveredCount}
            </p>
            <p className="text-xs text-stone-500 mt-1 tabular-nums">
              COD: {formatCurrency(dailyStats.codCollectedTotal)}
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="text-xs text-stone-500 font-medium">Delivery Fees Collected</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {formatCurrency(dailyStats.deliveryChargesCollected)}
            </p>
            <p className="text-xs text-stone-500 mt-1">From delivered orders</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="text-xs text-stone-500 font-medium">Petrol / Expenses</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1">
              {formatCurrency(dailyStats.petrolExpenses)}
            </p>
            <p className="text-xs text-stone-500 mt-1 tabular-nums">
              Net: {formatCurrency(dailyStats.netDeliveryBalance)}
            </p>
          </div>
        </div>

        {/* Assigned Orders Queue */}
        <section aria-label="Assigned Delivery Orders" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-stone-900">
              My Assigned Deliveries ({assignedOrders.length})
            </h2>
            <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Active Queue
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Assigned
              </button>
            </div>
          </div>

          {assignedOrders.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
              <UserCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-stone-800">
                No {statusFilter === 'active' ? 'active' : ''} deliveries assigned right now
              </p>
              <p className="text-xs text-stone-500 mt-1">
                New orders assigned to {currentRider.name} by the counter will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedOrders.map((order) => (
                <article
                  key={order.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-mono font-bold text-stone-900">{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{order.source}</span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-0.5">
                        {order.customerName}
                      </h3>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="flex items-start gap-2 text-stone-700">
                        <MapPin
                          className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{order.deliveryAddress}</span>
                      </p>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-800 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Call {order.customerPhone}</span>
                      </a>
                      {order.specialInstructions && (
                        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                          Note: {order.specialInstructions}
                        </p>
                      )}
                    </div>

                    <div className="bg-[#FAF9F6] border border-stone-200 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-stone-700">Order Items</p>
                      <ul className="text-xs text-stone-600 space-y-1">
                        {order.items.map((item) => (
                          <li
                            key={`${order.id}-${item.menuItemId}`}
                            className="flex justify-between gap-2"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-mono tabular-nums">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-bold text-stone-900 font-mono tabular-nums">
                        <span>Collect Total (incl. {formatCurrency(order.deliveryCharge)} fee)</span>
                        <span>{formatCurrency(order.totalBill)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile-Friendly Status Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`rider-status-${order.id}`}
                        className="text-xs font-medium text-stone-600"
                      >
                        Update Status:
                      </label>
                      <select
                        id={`rider-status-${order.id}`}
                        value={order.status}
                        onChange={(e) =>
                          onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {RIDER_ALLOWED_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {order.status !== 'Out for Delivery' && order.status !== 'Delivered' && (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, 'Out for Delivery')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141210] text-amber-400 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Mark Out for Delivery</span>
                        </button>
                      )}
                      {order.status !== 'Delivered' && (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, 'Delivered')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Mark Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Petrol & Delivery Expense Logger */}
        <section
          aria-label="Log Petrol and Delivery Expenses"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-stone-200"
        >
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 mb-4">
              <Fuel className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>Log Petrol / Delivery Expense</span>
            </h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              {expenseError && (
                <p role="alert" className="text-xs text-rose-700 font-medium">
                  {expenseError}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rider-expense-cat"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="rider-expense-cat"
                    value={expenseCategory}
                    onChange={(e) =>
                      setExpenseCategory(e.target.value as 'Petrol' | 'Maintenance' | 'Other')
                    }
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="rider-expense-amount"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    Amount (Rs.)
                  </label>
                  <input
                    id="rider-expense-amount"
                    type="number"
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="rider-expense-note"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Note / Pump Details
                </label>
                <input
                  id="rider-expense-note"
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="e.g. PSO Liberty petrol refill"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Save Expense Entry
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5">
            <h3 className="text-base font-bold text-stone-900 mb-3">Recent Expense Entries</h3>
            {myExpenses.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                No expenses logged yet.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {myExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-medium text-stone-900">
                        {exp.category} · <span className="text-stone-600">{exp.note}</span>
                      </p>
                      <p className="text-xs text-stone-400 font-mono">{exp.date}</p>
                    </div>
                    <span className="font-mono font-semibold tabular-nums text-stone-900">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
