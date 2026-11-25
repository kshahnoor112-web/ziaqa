import React, { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginView } from './components/LoginView';
import { OrderFormPayload } from './components/OrderModal';
import { RiderView } from './components/RiderView';
import { StorefrontView } from './components/StorefrontView';
import {
  SESSION_STORAGE_KEY,
  createInitialSeedState,
  loadAppState,
  saveAppState,
} from './data/seedData';
import {
  AppState,
  MenuItem,
  Order,
  OrderStatus,
  Rider,
  RiderExpense,
  UserRole,
  UserSession,
} from './types/zaiqa';
import {
  calculateOrderTotals,
  findCustomerByPhone,
  generateNextOrderId,
} from './utils/zaiqaLogic';

type ActiveRoute = 'storefront' | 'admin' | 'rider';

function loadSession(): UserSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [session, setSession] = useState<UserSession | null>(() => loadSession());
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>('storefront');
  const [preferredLoginRole, setPreferredLoginRole] = useState<UserRole>('admin');

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    try {
      if (session) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures
    }
  }, [session]);

  const navigateTo = (route: ActiveRoute, sectionId?: string) => {
    if (route === 'admin') setPreferredLoginRole('admin');
    if (route === 'rider') setPreferredLoginRole('rider');
    setActiveRoute(route);
    if (route === 'storefront' && sectionId) {
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  const handleLogin = (nextSession: UserSession) => {
    setSession(nextSession);
    setActiveRoute(nextSession.role === 'admin' ? 'admin' : 'rider');
  };

  const handleLogout = () => {
    setSession(null);
    setActiveRoute('storefront');
  };

  const handleCreateOrder = (payload: OrderFormPayload): Order => {
    const nowIso = new Date().toISOString();
    const totals = calculateOrderTotals(payload.items, payload.deliveryCharge);
    const existingCustomer = findCustomerByPhone(state.customers, payload.customerPhone);
    const newId = generateNextOrderId(state.orders);

    const customerId = existingCustomer
      ? existingCustomer.id
      : `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder: Order = {
      id: newId,
      customerId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      deliveryAddress: payload.deliveryAddress,
      items: payload.items,
      subtotal: totals.subtotal,
      deliveryCharge: totals.deliveryCharge,
      totalBill: totals.totalBill,
      specialInstructions: payload.specialInstructions,
      status: payload.status,
      riderId: payload.riderId,
      source: payload.source,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setState((prev) => {
      let nextCustomers = prev.customers;
      if (existingCustomer) {
        nextCustomers = prev.customers.map((c) => {
          if (c.id !== existingCustomer.id) return c;
          const hasAddr = c.addresses.some(
            (a) => a.trim().toLowerCase() === payload.deliveryAddress.trim().toLowerCase()
          );
          return {
            ...c,
            name: payload.customerName || c.name,
            addresses: hasAddr ? c.addresses : [...c.addresses, payload.deliveryAddress],
          };
        });
      } else {
        nextCustomers = [
          {
            id: customerId,
            name: payload.customerName,
            phone: payload.customerPhone,
            addresses: [payload.deliveryAddress],
            notes: '',
            promoOptIn: true,
            createdAt: nowIso,
          },
          ...prev.customers,
        ];
      }

      return {
        ...prev,
        customers: nextCustomers,
        orders: [newOrder, ...prev.orders],
      };
    });

    return newOrder;
  };

  const handleUpdateOrder = (orderId: string, payload: OrderFormPayload) => {
    const nowIso = new Date().toISOString();
    const totals = calculateOrderTotals(payload.items, payload.deliveryCharge);
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              customerName: payload.customerName,
              customerPhone: payload.customerPhone,
              deliveryAddress: payload.deliveryAddress,
              items: payload.items,
              subtotal: totals.subtotal,
              deliveryCharge: totals.deliveryCharge,
              totalBill: totals.totalBill,
              specialInstructions: payload.specialInstructions,
              status: payload.status,
              riderId: payload.riderId,
              source: payload.source,
              updatedAt: nowIso,
            }
          : o
      ),
    }));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: nowIso } : o
      ),
    }));
  };

  const handleAssignRider = (orderId: string, riderId: string | null) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        const shouldAdvance =
          riderId &&
          (o.status === 'New Order' ||
            o.status === 'Confirmed' ||
            o.status === 'Preparing' ||
            o.status === 'Ready for Pickup');
        return {
          ...o,
          riderId,
          status: shouldAdvance ? 'Assigned to Rider' : o.status,
          updatedAt: nowIso,
        };
      }),
    }));
  };

  const handleUpsertMenuItem = (item: Omit<MenuItem, 'id'> & { id?: string }) => {
    setState((prev) => {
      if (item.id) {
        return {
          ...prev,
          menuItems: prev.menuItems.map((m) =>
            m.id === item.id ? ({ ...item, id: item.id } as MenuItem) : m
          ),
        };
      }
      const created: MenuItem = {
        ...item,
        id: `menu-${Date.now()}`,
      };
      return {
        ...prev,
        menuItems: [created, ...prev.menuItems],
      };
    });
  };

  const handleDeleteMenuItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      menuItems: prev.menuItems.filter((m) => m.id !== id),
    }));
  };

  const handleAddCategory = (category: string) => {
    setState((prev) => {
      if (prev.categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        categories: [...prev.categories, category],
      };
    });
  };

  const handleUpsertRider = (rider: Omit<Rider, 'id'> & { id?: string }) => {
    setState((prev) => {
      if (rider.id) {
        return {
          ...prev,
          riders: prev.riders.map((r) =>
            r.id === rider.id ? ({ ...rider, id: rider.id } as Rider) : r
          ),
        };
      }
      return {
        ...prev,
        riders: [...prev.riders, { ...rider, id: `rider-${Date.now()}` }],
      };
    });
  };

  const handleAddRiderExpense = (expense: Omit<RiderExpense, 'id' | 'createdAt'>) => {
    const newExpense: RiderExpense = {
      ...expense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      riderExpenses: [newExpense, ...prev.riderExpenses],
    }));
  };

  const handlePrimaryCta = () => {
    if (activeRoute === 'storefront') {
      navigateTo('admin');
      return;
    }
    navigateTo('storefront');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-[#141210] text-white border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('storefront')}
            className="font-display text-xl font-bold tracking-tight text-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ZAIQA
          </button>

          {/* Zone 2: Clean single-line text nav links */}
          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm font-medium text-stone-300 overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => navigateTo('storefront')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
                activeRoute === 'storefront'
                  ? 'border-amber-400 text-white'
                  : 'border-transparent'
              }`}
            >
              Storefront
            </button>
            <button
              type="button"
              onClick={() => navigateTo('storefront', 'menu')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 border-transparent"
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => navigateTo('storefront', 'track-order')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 border-transparent"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
                activeRoute === 'admin'
                  ? 'border-amber-400 text-white'
                  : 'border-transparent'
              }`}
            >
              Admin Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigateTo('rider')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
                activeRoute === 'rider'
                  ? 'border-amber-400 text-white'
                  : 'border-transparent'
              }`}
            >
              Rider View
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="hidden md:flex items-center shrink-0">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeRoute === 'storefront' ? 'Staff Portal' : 'Live Storefront'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1">
        {activeRoute === 'storefront' && (
          <StorefrontView
            categories={state.categories}
            menuItems={state.menuItems}
            orders={state.orders}
            customers={state.customers}
            riders={state.riders}
            onCreateOrder={handleCreateOrder}
            onNavigateView={(view) => navigateTo(view)}
          />
        )}

        {activeRoute === 'admin' &&
          (session?.role === 'admin' ? (
            <AdminDashboard
              session={session}
              state={state}
              onCreateOrder={handleCreateOrder}
              onUpdateOrder={handleUpdateOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAssignRider={handleAssignRider}
              onUpsertMenuItem={handleUpsertMenuItem}
              onDeleteMenuItem={handleDeleteMenuItem}
              onAddCategory={handleAddCategory}
              onUpsertRider={handleUpsertRider}
              onAddRiderExpense={handleAddRiderExpense}
              onImportState={(nextState) => setState(nextState)}
              onResetSeed={() => setState(createInitialSeedState())}
              onLogout={handleLogout}
            />
          ) : (
            <LoginView
              preferredRole={preferredLoginRole}
              riders={state.riders}
              onLogin={handleLogin}
              onBackToStorefront={() => navigateTo('storefront')}
            />
          ))}

        {activeRoute === 'rider' &&
          (session?.role === 'rider' ? (
            <RiderView
              session={session}
              riders={state.riders}
              orders={state.orders}
              riderExpenses={state.riderExpenses}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAddRiderExpense={handleAddRiderExpense}
              onSwitchDemoRider={(rider) =>
                setSession({ role: 'rider', name: rider.name, riderId: rider.id })
              }
              onLogout={handleLogout}
            />
          ) : (
            <LoginView
              preferredRole="rider"
              riders={state.riders}
              onLogin={handleLogin}
              onBackToStorefront={() => navigateTo('storefront')}
            />
          ))}
      </main>
    </div>
  );
}
