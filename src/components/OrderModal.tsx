import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Search, UserCheck, X } from 'lucide-react';
import {
  Customer,
  MenuItem,
  ORDER_STATUSES,
  Order,
  OrderItem,
  OrderSource,
  OrderStatus,
  Rider,
} from '../types/zaiqa';
import {
  calculateOrderTotals,
  findCustomerByPhone,
  formatCurrency,
  generateNextOrderId,
} from '../utils/zaiqaLogic';

export interface OrderFormPayload {
  id?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  deliveryCharge: number;
  specialInstructions: string;
  status: OrderStatus;
  riderId: string | null;
  source: OrderSource;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: OrderFormPayload) => void;
  menuItems: MenuItem[];
  categories: string[];
  customers: Customer[];
  orders: Order[];
  riders: Rider[];
  editingOrder?: Order | null;
  initialItems?: OrderItem[];
  defaultSource?: OrderSource;
  allowStatusAndRider?: boolean;
}

const EMPTY_ITEMS: OrderItem[] = [];

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  menuItems,
  categories,
  customers,
  orders,
  riders,
  editingOrder = null,
  initialItems = EMPTY_ITEMS,
  defaultSource = 'WhatsApp',
  allowStatusAndRider = true,
}) => {
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState<string>('120');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [status, setStatus] = useState<OrderStatus>('New Order');
  const [riderId, setRiderId] = useState<string>('');
  const [source, setSource] = useState<OrderSource>(defaultSource);
  const [menuFilterCat, setMenuFilterCat] = useState<string>('All');
  const [menuQuery, setMenuQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setMenuFilterCat('All');
    setMenuQuery('');

    if (editingOrder) {
      setCustomerPhone(editingOrder.customerPhone);
      setCustomerName(editingOrder.customerName);
      setDeliveryAddress(editingOrder.deliveryAddress);
      setSelectedItems(editingOrder.items.map((item) => ({ ...item })));
      setDeliveryCharge(String(editingOrder.deliveryCharge));
      setSpecialInstructions(editingOrder.specialInstructions);
      setStatus(editingOrder.status);
      setRiderId(editingOrder.riderId ?? '');
      setSource(editingOrder.source);
    } else {
      setCustomerPhone('');
      setCustomerName('');
      setDeliveryAddress('');
      setSelectedItems(initialItems.map((item) => ({ ...item })));
      setDeliveryCharge('120');
      setSpecialInstructions('');
      setStatus('New Order');
      setRiderId('');
      setSource(defaultSource);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingOrder?.id]);

  const matchedCustomer = useMemo(
    () => findCustomerByPhone(customers, customerPhone),
    [customers, customerPhone]
  );

  const matchedOrderCount = useMemo(() => {
    if (!matchedCustomer) return 0;
    return orders.filter(
      (o) => o.customerId === matchedCustomer.id && o.status !== 'Cancelled'
    ).length;
  }, [matchedCustomer, orders]);

  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    const match = findCustomerByPhone(customers, value);
    if (match && !editingOrder) {
      setCustomerName(match.name);
      if (match.addresses.length > 0 && !deliveryAddress.trim()) {
        setDeliveryAddress(match.addresses[0]);
      }
    }
  };

  const previewOrderId = useMemo(
    () => (editingOrder ? editingOrder.id : generateNextOrderId(orders)),
    [editingOrder, orders]
  );

  const numericDelivery = Math.max(0, Number.parseFloat(deliveryCharge) || 0);
  const totals = useMemo(
    () => calculateOrderTotals(selectedItems, numericDelivery),
    [selectedItems, numericDelivery]
  );

  const filteredMenu = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (menuFilterCat !== 'All' && item.category !== menuFilterCat) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    });
  }, [menuItems, menuFilterCat, menuQuery]);

  const getItemQuantity = (menuItemId: string): number =>
    selectedItems.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0;

  const updateItemQuantity = (menuItem: MenuItem, delta: number) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem.id);
      if (!existing) {
        if (delta <= 0) return prev;
        return [
          ...prev,
          {
            menuItemId: menuItem.id,
            name: menuItem.name,
            unitPrice: menuItem.price,
            quantity: delta,
          },
        ];
      }
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((i) => i.menuItemId !== menuItem.id);
      }
      return prev.map((i) =>
        i.menuItemId === menuItem.id ? { ...i, quantity: nextQty } : i
      );
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      setErrorMsg('Please enter the customer phone number.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Please enter the customer name.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('Please enter the complete delivery address.');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMsg('Please select at least one food item for this order.');
      return;
    }

    onSave({
      id: editingOrder?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      items: selectedItems,
      deliveryCharge: numericDelivery,
      specialInstructions: specialInstructions.trim(),
      status: riderId && status === 'New Order' ? 'Assigned to Rider' : status,
      riderId: riderId || null,
      source,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#141210] text-white">
          <div>
            <p className="text-xs font-mono text-amber-400 tabular-nums">{previewOrderId}</p>
            <h2 id="order-modal-title" className="text-lg font-semibold">
              {editingOrder ? `Edit Order ${editingOrder.id}` : 'Create New Order'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order modal"
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          {/* Customer Details & Auto-Match */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="order-phone"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Customer Phone Number *
                </label>
                <input
                  id="order-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {matchedCustomer && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                    <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="font-medium">
                      Existing customer matched ({matchedCustomer.name})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{matchedOrderCount} orders</span>
                    {matchedOrderCount >= 2 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-amber-800">Repeat Customer</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="order-name"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Customer Name *
                </label>
                <input
                  id="order-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="order-address"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Complete Delivery Address *
                </label>
                <textarea
                  id="order-address"
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House/Flat #, Street, Block, Area, Landmark"
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {matchedCustomer && matchedCustomer.addresses.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {matchedCustomer.addresses.map((addr) => (
                      <button
                        key={addr}
                        type="button"
                        onClick={() => setDeliveryAddress(addr)}
                        className="text-xs px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer truncate max-w-xs"
                      >
                        Use: {addr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="order-source"
                    className="block text-xs font-semibold text-stone-700 mb-1.5"
                  >
                    Order Channel
                  </label>
                  <select
                    id="order-source"
                    value={source}
                    onChange={(e) => setSource(e.target.value as OrderSource)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Storefront">Storefront</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="order-delivery-charge"
                    className="block text-xs font-semibold text-stone-700 mb-1.5"
                  >
                    Delivery Charges (Rs.)
                  </label>
                  <input
                    id="order-delivery-charge"
                    type="number"
                    min="0"
                    step="10"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm font-mono tabular-nums text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {allowStatusAndRider && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="order-status"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Order Status
                    </label>
                    <select
                      id="order-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as OrderStatus)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="order-rider"
                      className="block text-xs font-semibold text-stone-700 mb-1.5"
                    >
                      Assign Rider
                    </label>
                    <select
                      id="order-rider"
                      value={riderId}
                      onChange={(e) => setRiderId(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Unassigned</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {!r.active ? '(Inactive)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="order-instructions"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Special Instructions
                </label>
                <textarea
                  id="order-instructions"
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Spice level, extra sauces, gate call notes..."
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Food Item Selector */}
          <div className="border-t border-stone-200 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-stone-900">Select Food Items</h3>
              <div className="relative w-full sm:w-64">
                <Search
                  className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={menuQuery}
                  onChange={(e) => setMenuQuery(e.target.value)}
                  placeholder="Search menu items..."
                  aria-label="Search menu items"
                  className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              {['All', ...categories].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMenuFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    menuFilterCat === cat
                      ? 'bg-[#141210] text-amber-400'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Picker Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {filteredMenu.map((item) => {
                const qty = getItemQuantity(item.id);
                const unavailable = item.availability === 'Out of Stock';
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                      qty > 0
                        ? 'border-amber-400 bg-amber-50/40'
                        : 'border-stone-200 bg-white'
                    } ${unavailable ? 'opacity-60' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-500 tabular-nums">
                        {item.category} · {formatCurrency(item.price)}
                        {unavailable ? ' · Out of Stock' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={qty === 0}
                        onClick={() => updateItemQuantity(item, -1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="w-7 h-7 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center text-sm font-mono font-semibold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => updateItemQuantity(item, 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="w-7 h-7 rounded-md bg-[#141210] text-amber-400 flex items-center justify-center hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary Breakdown */}
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-6 text-stone-600">
                <span>Items ({selectedItems.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="font-mono tabular-nums font-medium text-stone-900">
                  Subtotal: {formatCurrency(totals.subtotal)}
                </span>
                <span className="font-mono tabular-nums font-medium text-stone-900">
                  Delivery: {formatCurrency(totals.deliveryCharge)}
                </span>
              </div>
              <p className="text-base font-bold text-stone-900 font-mono tabular-nums">
                Total Bill: {formatCurrency(totals.totalBill)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-amber-500 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {editingOrder ? 'Save Order Changes' : 'Confirm & Save Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
