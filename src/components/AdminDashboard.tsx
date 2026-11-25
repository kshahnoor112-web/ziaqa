import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  Download,
  Edit3,
  Fuel,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Truck,
  Upload,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import {
  AppState,
  CustomerWithStats,
  MenuItem,
  ORDER_STATUSES,
  Order,
  OrderStatus,
  Rider,
  RiderExpense,
  UserSession,
} from '../types/zaiqa';
import {
  buildBackupJson,
  computePhase1Summary,
  computeRiderDailyStats,
  enrichCustomersWithStats,
  filterOrders,
  formatCurrency,
  getLocalDateKey,
  parseBackupJson,
} from '../utils/zaiqaLogic';
import { MenuManagerModal } from './MenuManagerModal';
import { OrderFormPayload, OrderModal } from './OrderModal';
import { FoodImage, StatusBadge } from './StatusBadge';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'menu'
  | 'riders'
  | 'customers'
  | 'phase2'
  | 'phase3';

interface AdminDashboardProps {
  session: UserSession;
  state: AppState;
  onCreateOrder: (payload: OrderFormPayload) => Order;
  onUpdateOrder: (orderId: string, payload: OrderFormPayload) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAssignRider: (orderId: string, riderId: string | null) => void;
  onUpsertMenuItem: (item: Omit<MenuItem, 'id'> & { id?: string }) => void;
  onDeleteMenuItem: (id: string) => void;
  onAddCategory: (category: string) => void;
  onUpsertRider: (rider: Omit<Rider, 'id'> & { id?: string }) => void;
  onAddRiderExpense: (expense: Omit<RiderExpense, 'id' | 'createdAt'>) => void;
  onImportState: (nextState: AppState) => void;
  onResetSeed: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  state,
  onCreateOrder,
  onUpdateOrder,
  onUpdateOrderStatus,
  onAssignRider,
  onUpsertMenuItem,
  onDeleteMenuItem,
  onAddCategory,
  onUpsertRider,
  onAddRiderExpense,
  onImportState,
  onResetSeed,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerHistory, setSelectedCustomerHistory] =
    useState<CustomerWithStats | null>(null);

  // Rider form state
  const [riderFormOpen, setRiderFormOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderVehicle, setRiderVehicle] = useState('');
  const [riderPin, setRiderPin] = useState('1122');
  const [riderActive, setRiderActive] = useState(true);

  // Rider expense form state
  const [expRiderId, setExpRiderId] = useState(state.riders[0]?.id ?? '');
  const [expCategory, setExpCategory] = useState<'Petrol' | 'Maintenance' | 'Other'>('Petrol');
  const [expAmount, setExpAmount] = useState('');
  const [expNote, setExpNote] = useState('');

  // Backup / Reset notice
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const todayKey = getLocalDateKey(new Date());
  const summary = useMemo(
    () => computePhase1Summary(state.orders, state.customers),
    [state.orders, state.customers]
  );

  const customersWithStats = useMemo(
    () => enrichCustomersWithStats(state.customers, state.orders),
    [state.customers, state.orders]
  );

  const repeatCustomerIds = useMemo(
    () => new Set(customersWithStats.filter((c) => c.isRepeatCustomer).map((c) => c.id)),
    [customersWithStats]
  );

  const filteredOrders = useMemo(
    () => filterOrders(state.orders, orderSearch, orderStatusFilter),
    [state.orders, orderSearch, orderStatusFilter]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: state.orders.length };
    for (const s of ORDER_STATUSES) {
      counts[s] = state.orders.filter((o) => o.status === s).length;
    }
    return counts;
  }, [state.orders]);

  const filteredMenu = useMemo(() => {
    if (menuCategoryFilter === 'All') return state.menuItems;
    return state.menuItems.filter((item) => item.category === menuCategoryFilter);
  }, [state.menuItems, menuCategoryFilter]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const sorted = [...customersWithStats].sort((a, b) => b.totalOrders - a.totalOrders);
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.addresses.some((a) => a.toLowerCase().includes(q))
    );
  }, [customersWithStats, customerSearch]);

  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = (payload: OrderFormPayload) => {
    if (editingOrder) {
      onUpdateOrder(editingOrder.id, payload);
      setNotice({ type: 'success', text: `Order ${editingOrder.id} updated.` });
    } else {
      const created = onCreateOrder(payload);
      setNotice({ type: 'success', text: `Order ${created.id} created.` });
    }
  };

  const handleExportBackup = () => {
    const json = buildBackupJson(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zaiqa-backup-${todayKey}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice({ type: 'success', text: `Exported JSON backup (zaiqa-backup-${todayKey}.json).` });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') throw new Error('Invalid file');
        const nextState = parseBackupJson(reader.result);
        onImportState(nextState);
        setNotice({ type: 'success', text: 'Backup restored successfully.' });
      } catch {
        setNotice({ type: 'error', text: 'Invalid ZAIQA JSON backup file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setNewCategoryInput('');
    setNotice({ type: 'success', text: `Category "${trimmed}" added.` });
  };

  const openRiderForm = (rider?: Rider) => {
    if (rider) {
      setEditingRider(rider);
      setRiderName(rider.name);
      setRiderPhone(rider.phone);
      setRiderVehicle(rider.vehicleNotes);
      setRiderPin(rider.pin);
      setRiderActive(rider.active);
    } else {
      setEditingRider(null);
      setRiderName('');
      setRiderPhone('');
      setRiderVehicle('');
      setRiderPin('4455');
      setRiderActive(true);
    }
    setRiderFormOpen(true);
  };

  const handleSaveRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderName.trim() || !riderPhone.trim()) return;
    onUpsertRider({
      id: editingRider?.id,
      name: riderName.trim(),
      phone: riderPhone.trim(),
      vehicleNotes: riderVehicle.trim() || 'Motorcycle',
      pin: riderPin.trim() || '1234',
      active: riderActive,
    });
    setRiderFormOpen(false);
    setNotice({
      type: 'success',
      text: editingRider ? `Rider ${riderName} updated.` : `Rider ${riderName} added.`,
    });
  };

  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRider = expRiderId || state.riders[0]?.id;
    const amt = Number.parseFloat(expAmount);
    if (!targetRider || !Number.isFinite(amt) || amt <= 0) return;
    onAddRiderExpense({
      riderId: targetRider,
      amount: amt,
      category: expCategory,
      note: expNote.trim() || `${expCategory} log`,
      date: todayKey,
    });
    setExpAmount('');
    setExpNote('');
    setNotice({ type: 'success', text: `Logged ${formatCurrency(amt)} rider expense.` });
  };

  const navItems: {
    id: AdminTab;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Phase 1 Overview', Icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', Icon: ClipboardList },
    { id: 'menu', label: 'Food Menu', Icon: UtensilsCrossed },
    { id: 'riders', label: 'Riders & Expenses', Icon: Truck },
    { id: 'customers', label: 'Customers', Icon: Users },
    { id: 'phase2', label: 'Phase 2: Accounts', Icon: Wallet },
    { id: 'phase3', label: 'Phase 3: Automation', Icon: MessageSquare },
  ];

  return (
    <div className="min-h-[calc(100vh-69px)] bg-[#FAF9F6] flex flex-col lg:flex-row">
      {/* Admin Sidebar */}
      <aside className="lg:w-64 bg-[#141210] text-stone-300 border-b lg:border-b-0 lg:border-r border-stone-800 shrink-0">
        <div className="p-5 border-b border-stone-800 flex items-center justify-between lg:block">
          <div>
            <p className="text-xs font-medium text-amber-400">Owner Workspace</p>
            <p className="text-sm font-semibold text-white mt-0.5 truncate">{session.name}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>

        <nav
          aria-label="Admin sections"
          className="p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible"
        >
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-semibold'
                    : 'text-stone-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block p-4 mt-auto border-t border-stone-800">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-stone-700 text-xs font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
        {/* Contextual Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
          <div>
            <p className="text-xs font-medium text-stone-500">
              ZAIQA Operations · {todayKey}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export JSON Backup</span>
            </button>
            <button
              type="button"
              onClick={handleOpenNewOrder}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>New Order</span>
            </button>
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-xs font-medium ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
              className="p-1 hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Phase 1 Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <p className="text-xs font-medium text-stone-500">Orders Today</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
                  {summary.totalOrdersToday}
                </p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <p className="text-xs font-medium text-stone-500">Active Deliveries</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1.5">
                  {summary.activeDeliveries}
                </p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <p className="text-xs font-medium text-stone-500">Delivered Orders</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1.5">
                  {summary.deliveredOrders}
                </p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <p className="text-xs font-medium text-stone-500">Repeat Customers</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
                  {summary.repeatCustomersCount}
                </p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <p className="text-xs font-medium text-stone-500">Total Sales</p>
                <p className="text-xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
                  {formatCurrency(summary.totalSales)}
                </p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <p className="text-xs font-medium text-stone-500">Delivery Charges</p>
                <p className="text-xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
                  {formatCurrency(summary.totalDeliveryCharges)}
                </p>
              </div>
            </div>

            {/* 8-Status Pipeline Quick View */}
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-sm font-bold text-stone-900">Order Pipeline by Status</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                >
                  Open Full Orders Queue
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setOrderStatusFilter(status);
                      setActiveTab('orders');
                    }}
                    className="text-left p-3 rounded-lg border border-stone-200 bg-[#FAF9F6] hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    <p className="text-lg font-bold font-mono tabular-nums text-stone-900">
                      {statusCounts[status] ?? 0}
                    </p>
                    <p className="text-[11px] font-medium text-stone-600 mt-0.5 leading-tight">
                      {status}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-900">Recent Active Orders</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                >
                  Manage All Orders
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned Rider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filterOrders(state.orders, '', 'All')
                      .slice(0, 5)
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-stone-50/80">
                          <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                            {order.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-stone-900">{order.customerName}</div>
                            <div className="text-xs text-stone-500 font-mono">
                              {order.customerPhone}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums font-semibold">
                            {formatCurrency(order.totalBill)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={order.status} compact />
                          </td>
                          <td className="py-3 px-4 text-xs text-stone-600">
                            {state.riders.find((r) => r.id === order.riderId)?.name ?? 'Unassigned'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Persistence & Backup Bar */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Local Data Persistence &amp; JSON Backup
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  All Phase 1 orders, menu items, customers, and rider records are saved in
                  browser storage. Export a JSON snapshot anytime.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportFile}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Restore JSON</span>
                </button>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset Sample Data</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetSeed();
                        setConfirmReset(false);
                        setNotice({ type: 'success', text: 'Sample seed data restored.' });
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            {/* Search & Status Filters */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, customer name, phone, or address..."
                    aria-label="Search orders"
                    className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewOrder}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#141210] text-amber-400 text-xs font-semibold hover:bg-stone-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Enter WhatsApp / Phone Order</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['All', ...ORDER_STATUSES].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      orderStatusFilter === status
                        ? 'bg-[#141210] text-amber-400'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {status} ({statusCounts[status] ?? 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-sm text-stone-500">
                No orders match your current search or status filter.
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                        <th className="py-3 px-4">Order</th>
                        <th className="py-3 px-4">Customer &amp; Address</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4">Bill Breakdown</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Rider</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 align-top">
                      {filteredOrders.map((order) => {
                        const isRepeat = repeatCustomerIds.has(order.customerId);
                        return (
                          <tr key={order.id} className="hover:bg-stone-50/70">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-bold text-stone-900">{order.id}</div>
                              <div className="text-xs text-stone-500 mt-0.5">{order.source}</div>
                            </td>
                            <td className="py-3.5 px-4 min-w-[210px]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-stone-900">
                                  {order.customerName}
                                </span>
                                {isRepeat && (
                                  <span className="text-[11px] font-semibold text-amber-800">
                                    · Repeat Customer
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono text-stone-500">
                                {order.customerPhone}
                              </div>
                              <div className="text-xs text-stone-600 mt-1 line-clamp-2">
                                {order.deliveryAddress}
                              </div>
                              {order.specialInstructions && (
                                <div className="text-[11px] text-amber-900 mt-1">
                                  Note: {order.specialInstructions}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 min-w-[180px] text-xs text-stone-700 space-y-0.5">
                              {order.items.map((item) => (
                                <div key={`${order.id}-${item.menuItemId}`}>
                                  {item.quantity}x {item.name}
                                </div>
                              ))}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-xs">
                              <div className="text-stone-500">
                                Sub: {formatCurrency(order.subtotal)}
                              </div>
                              <div className="text-stone-500">
                                Del: {formatCurrency(order.deliveryCharge)}
                              </div>
                              <div className="font-bold text-stone-900 text-sm mt-0.5">
                                {formatCurrency(order.totalBill)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                aria-label={`Status for ${order.id}`}
                                value={order.status}
                                onChange={(e) =>
                                  onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                                }
                                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                aria-label={`Assign rider for ${order.id}`}
                                value={order.riderId ?? ''}
                                onChange={(e) =>
                                  onAssignRider(order.id, e.target.value || null)
                                }
                                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="">Unassigned</option>
                                {state.riders.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditOrder(order)}
                                  aria-label={`Edit ${order.id}`}
                                  className="px-2.5 py-1.5 rounded-md border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
                                >
                                  Edit
                                </button>
                                {order.status !== 'Cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateOrderStatus(order.id, 'Cancelled')}
                                    aria-label={`Cancel ${order.id}`}
                                    className="px-2.5 py-1.5 rounded-md border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FOOD MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {['All', ...state.categories].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMenuCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      menuCategoryFilter === cat
                        ? 'bg-[#141210] text-amber-400'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <form onSubmit={handleAddCategorySubmit} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="New category..."
                    aria-label="New menu category name"
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Add Category
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setEditingMenuItem(null);
                    setIsMenuModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-semibold hover:bg-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Add Menu Item</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredMenu.map((item) => {
                const isAvailable = item.availability === 'Available';
                return (
                  <article
                    key={item.id}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-stone-900 overflow-hidden">
                      <FoodImage
                        src={item.imageUrl}
                        alt={item.name}
                        titleFallback={item.name}
                        className={`w-full h-full object-cover ${
                          !isAvailable ? 'opacity-50 grayscale' : ''
                        }`}
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-amber-800">{item.category}</span>
                          <span
                            className={`font-semibold ${
                              isAvailable ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {item.availability}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-stone-900">{item.name}</h3>
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                        <span className="font-mono font-bold tabular-nums text-sm text-stone-900">
                          {formatCurrency(item.price)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpsertMenuItem({
                                ...item,
                                availability: isAvailable ? 'Out of Stock' : 'Available',
                              })
                            }
                            className="px-2.5 py-1.5 rounded-md border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
                          >
                            {isAvailable ? 'Mark Out' : 'Mark Available'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMenuItem(item);
                              setIsMenuModalOpen(true);
                            }}
                            aria-label={`Edit ${item.name}`}
                            className="p-1.5 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-100 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMenuItem(item.id)}
                            aria-label={`Delete ${item.name}`}
                            className="p-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: RIDERS & EXPENSES */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                Delivery Riders &amp; Daily Records ({todayKey})
              </h2>
              <button
                type="button"
                onClick={() => openRiderForm()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141210] text-amber-400 text-xs font-semibold hover:bg-stone-800 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Rider</span>
              </button>
            </div>

            {/* Add/Edit Rider Inline Form */}
            {riderFormOpen && (
              <form
                onSubmit={handleSaveRider}
                className="bg-white border border-amber-300 rounded-xl p-5 space-y-4"
              >
                <h3 className="text-sm font-bold text-stone-900">
                  {editingRider ? `Edit Rider: ${editingRider.name}` : 'Add New Delivery Rider'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label
                      htmlFor="rider-name-field"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Name *
                    </label>
                    <input
                      id="rider-name-field"
                      type="text"
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rider-phone-field"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Phone *
                    </label>
                    <input
                      id="rider-phone-field"
                      type="tel"
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      required
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rider-vehicle-field"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Vehicle / Notes
                    </label>
                    <input
                      id="rider-vehicle-field"
                      type="text"
                      value={riderVehicle}
                      onChange={(e) => setRiderVehicle(e.target.value)}
                      placeholder="Honda 70 · Plate #"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rider-pin-field"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Login PIN
                    </label>
                    <input
                      id="rider-pin-field"
                      type="text"
                      value={riderPin}
                      onChange={(e) => setRiderPin(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={riderActive}
                      onChange={(e) => setRiderActive(e.target.checked)}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Rider is Active for Dispatch</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRiderFormOpen(false)}
                      className="px-3.5 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-semibold hover:bg-amber-400 cursor-pointer"
                    >
                      Save Rider
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Daily Rider Performance Table */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                      <th className="py-3 px-4">Rider</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Assigned</th>
                      <th className="py-3 px-4 text-right">Delivered</th>
                      <th className="py-3 px-4 text-right">Delivery Fees</th>
                      <th className="py-3 px-4 text-right">Petrol / Expenses</th>
                      <th className="py-3 px-4 text-right">Net Delivery</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {state.riders.map((rider) => {
                      const stats = computeRiderDailyStats(
                        rider.id,
                        state.orders,
                        state.riderExpenses,
                        todayKey
                      );
                      return (
                        <tr key={rider.id} className="hover:bg-stone-50/70">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-900">{rider.name}</div>
                            <div className="text-xs text-stone-500 font-mono">
                              {rider.phone} · PIN {rider.pin}
                            </div>
                            <div className="text-xs text-stone-500">{rider.vehicleNotes}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => onUpsertRider({ ...rider, active: !rider.active })}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer ${
                                rider.active
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-stone-100 border-stone-200 text-stone-600'
                              }`}
                            >
                              {rider.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {stats.assignedCount}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                            {stats.deliveredCount}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {formatCurrency(stats.deliveryChargesCollected)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-rose-700">
                            {formatCurrency(stats.petrolExpenses)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold">
                            {formatCurrency(stats.netDeliveryBalance)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openRiderForm(rider)}
                              className="px-2.5 py-1.5 rounded-md border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Log Petrol / Delivery Expense */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4">
                  <Fuel className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  <span>Log Rider Petrol / Delivery Expense</span>
                </h3>
                <form onSubmit={handleLogExpense} className="space-y-3">
                  <div>
                    <label
                      htmlFor="admin-exp-rider"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Rider
                    </label>
                    <select
                      id="admin-exp-rider"
                      value={expRiderId}
                      onChange={(e) => setExpRiderId(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                    >
                      {state.riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="admin-exp-cat"
                        className="block text-xs font-semibold text-stone-700 mb-1"
                      >
                        Category
                      </label>
                      <select
                        id="admin-exp-cat"
                        value={expCategory}
                        onChange={(e) =>
                          setExpCategory(e.target.value as 'Petrol' | 'Maintenance' | 'Other')
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
                        htmlFor="admin-exp-amt"
                        className="block text-xs font-semibold text-stone-700 mb-1"
                      >
                        Amount (Rs.)
                      </label>
                      <input
                        id="admin-exp-amt"
                        type="number"
                        min="1"
                        required
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        placeholder="500"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono tabular-nums"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="admin-exp-note"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Note
                    </label>
                    <input
                      id="admin-exp-note"
                      type="text"
                      value={expNote}
                      onChange={(e) => setExpNote(e.target.value)}
                      placeholder="Fuel receipt or shift note"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-semibold hover:bg-amber-400 cursor-pointer"
                  >
                    Record Expense
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-stone-900 mb-3">Rider Expense Ledger</h3>
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                  {state.riderExpenses
                    .slice()
                    .sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((exp) => {
                      const rider = state.riders.find((r) => r.id === exp.riderId);
                      return (
                        <div
                          key={exp.id}
                          className="py-3 flex items-center justify-between gap-4 text-sm"
                        >
                          <div>
                            <p className="font-semibold text-stone-900">
                              {rider?.name ?? 'Rider'} · {exp.category}
                            </p>
                            <p className="text-xs text-stone-500">
                              {exp.date} · {exp.note}
                            </p>
                          </div>
                          <span className="font-mono font-bold tabular-nums text-stone-900">
                            {formatCurrency(exp.amount)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER DATABASE */}
        {activeTab === 'customers' && (
          <div className="space-y-5">
            <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer by name, phone, or address..."
                  aria-label="Search customers"
                  className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-xs text-stone-500 tabular-nums">
                {filteredCustomers.length} customers ·{' '}
                {filteredCustomers.filter((c) => c.isRepeatCustomer).length} repeat customers (2+
                orders)
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Saved Addresses</th>
                      <th className="py-3 px-4 text-right">Total Orders</th>
                      <th className="py-3 px-4 text-right">Total Spent</th>
                      <th className="py-3 px-4">Promo Status</th>
                      <th className="py-3 px-4 text-right">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-stone-50/70">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-stone-900">{cust.name}</span>
                            {cust.isRepeatCustomer && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-[11px] font-semibold text-amber-900">
                                Repeat Customer
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-stone-500 mt-0.5">
                            {cust.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-600 max-w-xs">
                          {cust.addresses.map((addr) => (
                            <div key={addr} className="truncate">
                              {addr}
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold">
                          {cust.totalOrders}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold">
                          {formatCurrency(cust.totalSpent)}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span
                            className={
                              cust.promoOptIn ? 'text-emerald-700 font-medium' : 'text-stone-500'
                            }
                          >
                            {cust.promoOptIn ? 'Promo Ready' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerHistory(cust)}
                            className="px-3 py-1.5 rounded-md border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer whitespace-nowrap"
                          >
                            View History ({cust.orderHistory.length})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PHASE 2 UPCOMING (ACCOUNTS & P&L) */}
        {activeTab === 'phase2' && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                Upcoming Module · Phase 2
              </p>
              <h2 className="font-display text-2xl font-bold text-stone-900">
                Accounts, Expense Ledger &amp; Profit / Loss (P&amp;L)
              </h2>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Phase 1 already captures order sales, delivery fees, and rider petrol expenses in a
                clean schema. Phase 2 will connect kitchen ingredient bills, staff salaries, and
                automated daily P&amp;L statements directly to these records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5">
                <BarChart3 className="w-5 h-5 text-amber-600 mb-3" aria-hidden="true" />
                <h3 className="text-sm font-bold text-stone-900">Daily P&amp;L Statement</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Gross sales minus kitchen COGS, packaging, rider fuel, and fixed overheads.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5">
                <Wallet className="w-5 h-5 text-amber-600 mb-3" aria-hidden="true" />
                <h3 className="text-sm font-bold text-stone-900">Cash &amp; Rider Settlement</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  End-of-shift COD reconciliation per rider against collected delivery fees and
                  petrol slips.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5">
                <ClipboardList className="w-5 h-5 text-amber-600 mb-3" aria-hidden="true" />
                <h3 className="text-sm font-bold text-stone-900">Vendor &amp; Inventory Bills</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Track chicken, bread, cheese, and oil supplier invoices by category.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PHASE 3 UPCOMING (ONLINE ORDERING, LOYALTY & WHATSAPP) */}
        {activeTab === 'phase3' && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                Upcoming Module · Phase 3
              </p>
              <h2 className="font-display text-2xl font-bold text-stone-900">
                Online Customer Ordering, Loyalty &amp; WhatsApp Automation
              </h2>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Your Phase 1 customer directory already tracks repeat buyers and promo opt-ins.
                Phase 3 will activate automated WhatsApp status updates, digital loyalty points,
                and direct self-service checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5">
                <MessageSquare className="w-5 h-5 text-amber-600 mb-3" aria-hidden="true" />
                <h3 className="text-sm font-bold text-stone-900">WhatsApp Status Alerts</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Automatic customer messages when an order moves to Confirmed, Preparing, or Out
                  for Delivery.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5">
                <Users className="w-5 h-5 text-amber-600 mb-3" aria-hidden="true" />
                <h3 className="text-sm font-bold text-stone-900">Repeat Customer Loyalty</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Reward tagged Repeat Customers with points, combo vouchers, and promotional
                  broadcasts.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5">
                <Truck className="w-5 h-5 text-amber-600 mb-3" aria-hidden="true" />
                <h3 className="text-sm font-bold text-stone-900">Self-Serve Online Checkout</h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Expand the Storefront menu into full customer accounts with saved addresses and
                  one-tap reorder.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrder}
        menuItems={state.menuItems}
        categories={state.categories}
        customers={state.customers}
        orders={state.orders}
        riders={state.riders}
        editingOrder={editingOrder}
        defaultSource="WhatsApp"
        allowStatusAndRider={true}
      />

      {/* Add / Edit Menu Item Modal */}
      <MenuManagerModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onSave={onUpsertMenuItem}
        categories={state.categories}
        editingItem={editingMenuItem}
      />

      {/* Customer Order History Modal */}
      {selectedCustomerHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cust-history-title"
        >
          <div className="bg-white border border-stone-200 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 bg-[#141210] text-white">
              <div>
                <h2 id="cust-history-title" className="text-base font-semibold">
                  {selectedCustomerHistory.name} · Order History
                </h2>
                <p className="text-xs text-stone-400 font-mono">
                  {selectedCustomerHistory.phone} · {selectedCustomerHistory.totalOrders} orders
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerHistory(null)}
                aria-label="Close customer order history"
                className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {selectedCustomerHistory.orderHistory.length === 0 ? (
                <p className="text-sm text-stone-500 text-center py-6">No orders recorded yet.</p>
              ) : (
                selectedCustomerHistory.orderHistory.map((ord) => (
                  <div
                    key={ord.id}
                    className="border border-stone-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-mono font-bold text-stone-900">{ord.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{getLocalDateKey(ord.createdAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ord.source}</span>
                      </div>
                      <p className="text-xs text-stone-700 mt-1">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">{ord.deliveryAddress}</p>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                      <StatusBadge status={ord.status} compact />
                      <span className="font-mono font-bold tabular-nums text-sm text-stone-900">
                        {formatCurrency(ord.totalBill)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
