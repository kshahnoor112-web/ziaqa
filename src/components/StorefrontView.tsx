import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import {
  Customer,
  MenuItem,
  ORDER_STATUSES,
  Order,
  OrderItem,
  Rider,
} from '../types/zaiqa';
import { formatCurrency, normalizePhone } from '../utils/zaiqaLogic';
import { OrderFormPayload, OrderModal } from './OrderModal';
import { FoodImage, StatusBadge } from './StatusBadge';
import { VideoHero } from './VideoHero';

interface StorefrontViewProps {
  categories: string[];
  menuItems: MenuItem[];
  orders: Order[];
  customers: Customer[];
  riders: Rider[];
  onCreateOrder: (payload: OrderFormPayload) => Order;
  onNavigateView: (view: 'storefront' | 'admin' | 'rider') => void;
}

const PROGRESS_STATUSES = ORDER_STATUSES.filter((s) => s !== 'Cancelled');

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  categories,
  menuItems,
  orders,
  customers,
  riders,
  onCreateOrder,
  onNavigateView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lookupInput, setLookupInput] = useState<string>('ZQ-1001');
  const [quickCart, setQuickCart] = useState<OrderItem[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [recentPlacedOrder, setRecentPlacedOrder] = useState<Order | null>(null);

  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const matchedOrder = useMemo(() => {
    const q = lookupInput.trim();
    if (!q) return null;
    const lowerQ = q.toLowerCase();
    const normQ = normalizePhone(q);

    const byId = orders.find((o) => o.id.toLowerCase() === lowerQ);
    if (byId) return byId;

    if (normQ.length >= 7) {
      const byPhone = orders
        .filter((o) => normalizePhone(o.customerPhone).includes(normQ))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return byPhone[0] ?? null;
    }
    return null;
  }, [lookupInput, orders]);

  const matchedRider = useMemo(() => {
    if (!matchedOrder?.riderId) return null;
    return riders.find((r) => r.id === matchedOrder.riderId) ?? null;
  }, [matchedOrder, riders]);

  const addToQuickCart = (item: MenuItem) => {
    if (item.availability === 'Out of Stock') return;
    setQuickCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQty = (menuItemId: string, delta: number) => {
    setQuickCart((prev) =>
      prev
        .map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const cartCount = quickCart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = quickCart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handleSaveQuickOrder = (payload: OrderFormPayload) => {
    const created = onCreateOrder(payload);
    setRecentPlacedOrder(created);
    setLookupInput(created.id);
    setQuickCart([]);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900">
      {/* Continuous Video Showcase Hero */}
      <VideoHero
        onQuickOrder={() => setIsOrderModalOpen(true)}
        onBrowseMenu={() => scrollToSection('menu')}
      />

      {/* Post-order Confirmation Banner */}
      {recentPlacedOrder && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  Order {recentPlacedOrder.id} received for {recentPlacedOrder.customerName}
                </p>
                <p className="text-xs text-emerald-800 font-mono tabular-nums">
                  Total Bill: {formatCurrency(recentPlacedOrder.totalBill)} · Status:{' '}
                  {recentPlacedOrder.status}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLookupInput(recentPlacedOrder.id);
                scrollToSection('track-order');
              }}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Track Order {recentPlacedOrder.id}
            </button>
          </div>
        </div>
      )}

      {/* Order Status Lookup Section */}
      <section id="track-order" className="max-w-7xl mx-auto px-6 py-12 border-b border-stone-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold tracking-wider text-amber-700">
              Live Order Tracking
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              Check Your ZAIQA Order Status
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Enter your ZAIQA Order ID or phone number to see live kitchen preparation and rider
              dispatch updates.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder="Enter Order ID (e.g. ZQ-1001) or Phone"
                  aria-label="Order ID or phone number lookup"
                  className="w-full rounded-lg border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>Quick lookup:</span>
              {orders.slice(0, 4).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setLookupInput(o.id)}
                  className={`font-mono px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                    lookupInput.toUpperCase() === o.id
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {o.id}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            {matchedOrder ? (
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2.5 text-xs text-stone-500 mb-1">
                      <span className="font-mono font-semibold text-stone-900">
                        {matchedOrder.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{matchedOrder.source} Order</span>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      {matchedOrder.customerName}
                    </h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
                      <span>{matchedOrder.deliveryAddress}</span>
                    </p>
                  </div>

                  <StatusBadge status={matchedOrder.status} />
                </div>

                {/* 8-Status Progress Timeline */}
                {matchedOrder.status === 'Cancelled' ? (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
                    This order was marked as Cancelled. Contact ZAIQA counter for assistance.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {PROGRESS_STATUSES.map((step, idx) => {
                      const currentIdx = (PROGRESS_STATUSES as readonly string[]).indexOf(
                        matchedOrder.status
                      );
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div
                          key={step}
                          className={`rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-50 text-amber-950 font-semibold'
                              : isDone
                              ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900 font-medium'
                              : 'border-stone-200 bg-stone-50 text-stone-400'
                          }`}
                        >
                          <div className="font-mono text-[11px] mb-0.5 tabular-nums">
                            0{idx + 1}
                          </div>
                          <div className="leading-tight">{step}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-stone-100 text-sm">
                  <div className="text-stone-600">
                    {matchedOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(' · ')}
                  </div>
                  <div className="font-mono tabular-nums font-bold text-stone-900 whitespace-nowrap shrink-0">
                    Total: {formatCurrency(matchedOrder.totalBill)}
                  </div>
                </div>

                {matchedRider && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-xs">
                    <div className="flex items-center gap-2 text-stone-800 font-medium">
                      <Truck className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                      <span>Assigned Rider: {matchedRider.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-stone-500">{matchedRider.vehicleNotes}</span>
                    </div>
                    <a
                      href={`tel:${matchedRider.phone}`}
                      className="inline-flex items-center gap-1.5 font-mono font-semibold text-amber-800 hover:text-amber-900"
                    >
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{matchedRider.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-stone-800 mb-1">
                  No matching order found for "{lookupInput}"
                </p>
                <p className="text-xs text-stone-500">
                  Check your Order ID (e.g. ZQ-1001) or enter the phone number used when ordering.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Menu Showcase Section */}
      <section id="menu" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-wider text-amber-700 mb-2">
              ZAIQA Kitchen Menu
            </p>
            <h2 className="font-display text-3xl font-bold text-stone-900">
              Signature Shawarma, Smash Burgers &amp; Wood-Fired Pizza
            </h2>
          </div>

          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="inline-flex items-center gap-3 rounded-lg bg-[#141210] px-5 py-3 text-sm font-semibold text-amber-400 hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>
                Complete Order ({cartCount} {cartCount === 1 ? 'item' : 'items'}) ·{' '}
                <span className="font-mono tabular-nums">{formatCurrency(cartSubtotal)}</span>
              </span>
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter menu by food category"
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-8"
        >
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#141210] text-amber-400'
                  : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 3-Column Menu Grid */}
        {filteredMenu.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-sm text-stone-500">
            No items listed under {selectedCategory} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map((item) => {
              const inCartQty =
                quickCart.find((i) => i.menuItemId === item.id)?.quantity ?? 0;
              const isOut = item.availability === 'Out of Stock';

              return (
                <article
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] w-full bg-stone-900 overflow-hidden relative">
                    <FoodImage
                      src={item.imageUrl}
                      alt={item.name}
                      titleFallback={item.name}
                      className={`w-full h-full object-cover ${isOut ? 'opacity-50 grayscale' : ''}`}
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-1.5">
                        <span className="font-medium text-amber-800">{item.category}</span>
                        <span
                          className={
                            isOut ? 'font-semibold text-rose-700' : 'font-medium text-emerald-700'
                          }
                        >
                          {item.availability}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-stone-900 mb-1.5">
                        {item.name}
                      </h3>
                      <p className="text-sm text-stone-600 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
                      <span className="text-base font-bold font-mono tabular-nums text-stone-900">
                        {formatCurrency(item.price)}
                      </span>

                      {inCartQty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                            className="w-8 h-8 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-6 text-center text-sm font-mono font-semibold tabular-nums">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToQuickCart(item)}
                            aria-label={`Add another ${item.name}`}
                            className="w-8 h-8 rounded-md bg-[#141210] text-amber-400 flex items-center justify-center hover:bg-stone-800 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={() => addToQuickCart(item)}
                          className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {isOut ? 'Unavailable' : 'Add to Order'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Clean Footer */}
      <footer className="bg-[#141210] text-stone-300 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-xl font-bold text-white tracking-tight">ZAIQA</p>
            <p className="text-xs text-stone-400 mt-1">
              WhatsApp &amp; Phone Dispatch · Fresh Kitchen Operations · Lahore
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => onNavigateView('admin')}
              className="text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Owner &amp; Staff Admin
            </button>
            <button
              type="button"
              onClick={() => onNavigateView('rider')}
              className="text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Delivery Rider Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Storefront Quick Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveQuickOrder}
        menuItems={menuItems}
        categories={categories}
        customers={customers}
        orders={orders}
        riders={riders}
        initialItems={quickCart}
        defaultSource="Storefront"
        allowStatusAndRider={false}
      />
    </div>
  );
};
