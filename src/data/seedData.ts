import { AppState, DEFAULT_CATEGORIES } from '../types/zaiqa';
import { getLocalDateKey } from '../utils/zaiqaLogic';

export const STORAGE_KEY = 'zaiqa_pos_state_v1';
export const SESSION_STORAGE_KEY = 'zaiqa_pos_session_v1';

export const MEDIA_ASSETS = {
  showcaseVideo: '/assets/aistudio/WhatsApp_Video_2026-11-25_at_8.27.55_PM_acce48ee.mp4',
  shawarma: '/src/assets/images/food_shawarma_wrap_1795631292334.jpg',
  burger: '/src/assets/images/food_smash_burger_1795631293583.jpg',
  pizza: '/src/assets/images/food_artisan_pizza_1795631293451.jpg',
  fries: '/src/assets/images/food_loaded_fries_1795631294084.jpg',
  nuggets: '/src/assets/images/food_crispy_nuggets_1795631294790.jpg',
  drinks: '/src/assets/images/food_mint_drink_combo_1795631295619.jpg',
} as const;

export function createInitialSeedState(): AppState {
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const minsAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60 * 1000).toISOString();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  return {
    categories: [...DEFAULT_CATEGORIES],
    menuItems: [
      {
        id: 'menu-1',
        name: 'Zaiqa Charcoal Chicken Shawarma',
        category: 'Shawarma',
        description:
          'Flame-charred spiced chicken wrapped in warm artisan flatbread with creamy garlic toum and pickled turnips.',
        price: 480,
        imageUrl: MEDIA_ASSETS.shawarma,
        availability: 'Available',
      },
      {
        id: 'menu-2',
        name: 'Double Garlic Zinger Shawarma',
        category: 'Shawarma',
        description:
          'Crispy golden chicken fillet strips, signature double garlic sauce, jalapenos, and toasted pita.',
        price: 540,
        imageUrl: MEDIA_ASSETS.shawarma,
        availability: 'Available',
      },
      {
        id: 'menu-3',
        name: 'Zaiqa Double Smash Burger',
        category: 'Burgers',
        description:
          'Two seared beef patties with melted aged cheddar, caramelized onions, crisp lettuce, and smoky house sauce in brioche.',
        price: 780,
        imageUrl: MEDIA_ASSETS.burger,
        availability: 'Available',
      },
      {
        id: 'menu-4',
        name: 'Smoky Crispy Chicken Burger',
        category: 'Burgers',
        description:
          'Crunchy buttermilk chicken thigh, cheddar slice, tangy slaw, and chipotle mayo on a toasted sesame bun.',
        price: 640,
        imageUrl: MEDIA_ASSETS.burger,
        availability: 'Available',
      },
      {
        id: 'menu-5',
        name: 'Wood-Fired Chicken Tikka Pizza (12")',
        category: 'Pizza',
        description:
          'Blistered stone-baked dough topped with smoky chicken tikka, bubbling mozzarella, red onions, and fresh basil.',
        price: 1450,
        imageUrl: MEDIA_ASSETS.pizza,
        availability: 'Available',
      },
      {
        id: 'menu-6',
        name: 'Zaiqa Crown Crust Pizza (14")',
        category: 'Pizza',
        description:
          'Loaded stuffed-crust artisan pizza with roasted chicken, olives, sweet corn, and rich garlic herb marinara.',
        price: 1850,
        imageUrl: MEDIA_ASSETS.pizza,
        availability: 'Available',
      },
      {
        id: 'menu-7',
        name: 'Loaded Jalapeno Cheese Fries',
        category: 'Fries',
        description:
          'Crispy masala-dusted fries drenched in warm cheddar cheese sauce, sliced jalapenos, and herb seasoning.',
        price: 420,
        imageUrl: MEDIA_ASSETS.fries,
        availability: 'Available',
      },
      {
        id: 'menu-8',
        name: 'Classic Masala Crunch Fries',
        category: 'Fries',
        description:
          'Golden double-fried potatoes tossed in Zaiqa signature chaat spice blend with garlic mayo dip.',
        price: 280,
        imageUrl: MEDIA_ASSETS.fries,
        availability: 'Available',
      },
      {
        id: 'menu-9',
        name: 'Crispy Buttermilk Nuggets (8 pcs)',
        category: 'Nuggets',
        description:
          'Eight tender chicken breast nuggets fried to a golden crunch, served with creamy garlic mayo and smoky chili dip.',
        price: 520,
        imageUrl: MEDIA_ASSETS.nuggets,
        availability: 'Available',
      },
      {
        id: 'menu-10',
        name: 'Chilled Mint Lemonade & Peach Tea',
        category: 'Other',
        description:
          'House-pressed fresh mint lime cooler or spiced peach iced tea poured over crushed ice.',
        price: 260,
        imageUrl: MEDIA_ASSETS.drinks,
        availability: 'Available',
      },
    ],
    riders: [
      {
        id: 'rider-1',
        name: 'Bilal Ahmed',
        phone: '0301-4455667',
        vehicleNotes: 'Honda CD 70 · LEA-4821 · Thermal Bag #1',
        active: true,
        pin: '1122',
      },
      {
        id: 'rider-2',
        name: 'Usman Tariq',
        phone: '0322-7788990',
        vehicleNotes: 'Honda 125 · LEB-9014 · Evening Shift',
        active: true,
        pin: '2233',
      },
      {
        id: 'rider-3',
        name: 'Kamran Malik',
        phone: '0333-9900112',
        vehicleNotes: 'Suzuki 110 · Backup Weekend Rider',
        active: false,
        pin: '3344',
      },
    ],
    customers: [
      {
        id: 'cust-1',
        name: 'Ayesha Siddiqui',
        phone: '03001234567',
        addresses: [
          'House 14-B, Street 6, Gulberg III, Lahore',
          'Suite 302, Liberty Business Center, Gulberg',
        ],
        notes: 'Prefers extra garlic toum on shawarma. Ring doorbell once.',
        promoOptIn: true,
        createdAt: daysAgo(14),
      },
      {
        id: 'cust-2',
        name: 'Hamza Raza',
        phone: '03219876543',
        addresses: ['Plot 44, Sector Z, DHA Phase 3, Lahore'],
        notes: 'Regular weekend pizza & fries customer.',
        promoOptIn: true,
        createdAt: daysAgo(9),
      },
      {
        id: 'cust-3',
        name: 'Zainab Farooq',
        phone: '03455566778',
        addresses: ['Apartment 8, Maple Heights, Model Town'],
        notes: 'No jalapenos on fries.',
        promoOptIn: true,
        createdAt: daysAgo(4),
      },
      {
        id: 'cust-4',
        name: 'Saad Mahmood',
        phone: '03123344556',
        addresses: ['House 92, Block J-2, Johar Town'],
        notes: 'Cash on delivery.',
        promoOptIn: false,
        createdAt: daysAgo(1),
      },
    ],
    orders: [
      {
        id: 'ZQ-1001',
        customerId: 'cust-1',
        customerName: 'Ayesha Siddiqui',
        customerPhone: '03001234567',
        deliveryAddress: 'House 14-B, Street 6, Gulberg III, Lahore',
        items: [
          {
            menuItemId: 'menu-1',
            name: 'Zaiqa Charcoal Chicken Shawarma',
            unitPrice: 480,
            quantity: 2,
          },
          {
            menuItemId: 'menu-7',
            name: 'Loaded Jalapeno Cheese Fries',
            unitPrice: 420,
            quantity: 1,
          },
        ],
        subtotal: 1380,
        deliveryCharge: 120,
        totalBill: 1500,
        specialInstructions: 'Extra garlic dip please.',
        status: 'Out for Delivery',
        riderId: 'rider-1',
        source: 'WhatsApp',
        createdAt: minsAgo(38),
        updatedAt: minsAgo(12),
      },
      {
        id: 'ZQ-1002',
        customerId: 'cust-2',
        customerName: 'Hamza Raza',
        customerPhone: '03219876543',
        deliveryAddress: 'Plot 44, Sector Z, DHA Phase 3, Lahore',
        items: [
          {
            menuItemId: 'menu-5',
            name: 'Wood-Fired Chicken Tikka Pizza (12")',
            unitPrice: 1450,
            quantity: 1,
          },
          {
            menuItemId: 'menu-10',
            name: 'Chilled Mint Lemonade & Peach Tea',
            unitPrice: 260,
            quantity: 2,
          },
        ],
        subtotal: 1970,
        deliveryCharge: 150,
        totalBill: 2120,
        specialInstructions: 'Cut pizza into 8 slices.',
        status: 'Assigned to Rider',
        riderId: 'rider-1',
        source: 'Phone Call',
        createdAt: minsAgo(24),
        updatedAt: minsAgo(8),
      },
      {
        id: 'ZQ-1003',
        customerId: 'cust-3',
        customerName: 'Zainab Farooq',
        customerPhone: '03455566778',
        deliveryAddress: 'Apartment 8, Maple Heights, Model Town',
        items: [
          {
            menuItemId: 'menu-3',
            name: 'Zaiqa Double Smash Burger',
            unitPrice: 780,
            quantity: 2,
          },
          {
            menuItemId: 'menu-9',
            name: 'Crispy Buttermilk Nuggets (8 pcs)',
            unitPrice: 520,
            quantity: 1,
          },
        ],
        subtotal: 2080,
        deliveryCharge: 130,
        totalBill: 2210,
        specialInstructions: 'Call on arrival at apartment gate.',
        status: 'Preparing',
        riderId: null,
        source: 'WhatsApp',
        createdAt: minsAgo(16),
        updatedAt: minsAgo(5),
      },
      {
        id: 'ZQ-1004',
        customerId: 'cust-4',
        customerName: 'Saad Mahmood',
        customerPhone: '03123344556',
        deliveryAddress: 'House 92, Block J-2, Johar Town',
        items: [
          {
            menuItemId: 'menu-2',
            name: 'Double Garlic Zinger Shawarma',
            unitPrice: 540,
            quantity: 2,
          },
        ],
        subtotal: 1080,
        deliveryCharge: 100,
        totalBill: 1180,
        specialInstructions: 'Mild spice.',
        status: 'New Order',
        riderId: null,
        source: 'WhatsApp',
        createdAt: minsAgo(6),
        updatedAt: minsAgo(6),
      },
      {
        id: 'ZQ-1005',
        customerId: 'cust-1',
        customerName: 'Ayesha Siddiqui',
        customerPhone: '03001234567',
        deliveryAddress: 'Suite 302, Liberty Business Center, Gulberg',
        items: [
          {
            menuItemId: 'menu-4',
            name: 'Smoky Crispy Chicken Burger',
            unitPrice: 640,
            quantity: 2,
          },
          {
            menuItemId: 'menu-8',
            name: 'Classic Masala Crunch Fries',
            unitPrice: 280,
            quantity: 1,
          },
        ],
        subtotal: 1560,
        deliveryCharge: 100,
        totalBill: 1660,
        specialInstructions: 'Deliver to office reception.',
        status: 'Delivered',
        riderId: 'rider-2',
        source: 'Phone Call',
        createdAt: minsAgo(190),
        updatedAt: minsAgo(145),
      },
      {
        id: 'ZQ-1006',
        customerId: 'cust-2',
        customerName: 'Hamza Raza',
        customerPhone: '03219876543',
        deliveryAddress: 'Plot 44, Sector Z, DHA Phase 3, Lahore',
        items: [
          {
            menuItemId: 'menu-6',
            name: 'Zaiqa Crown Crust Pizza (14")',
            unitPrice: 1850,
            quantity: 1,
          },
        ],
        subtotal: 1850,
        deliveryCharge: 150,
        totalBill: 2000,
        specialInstructions: '',
        status: 'Delivered',
        riderId: 'rider-1',
        source: 'WhatsApp',
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
    ],
    riderExpenses: [
      {
        id: 'exp-101',
        riderId: 'rider-1',
        amount: 500,
        category: 'Petrol',
        note: 'Afternoon shift fuel refill (PSO Gulberg)',
        date: todayKey,
        createdAt: minsAgo(120),
      },
      {
        id: 'exp-102',
        riderId: 'rider-2',
        amount: 400,
        category: 'Petrol',
        note: 'Full tank top-up before lunch rush',
        date: todayKey,
        createdAt: minsAgo(240),
      },
    ],
  };
}

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const seed = createInitialSeedState();
    return {
      categories:
        Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : seed.categories,
      menuItems: Array.isArray(parsed.menuItems) ? parsed.menuItems : seed.menuItems,
      orders: Array.isArray(parsed.orders) ? parsed.orders : seed.orders,
      customers: Array.isArray(parsed.customers) ? parsed.customers : seed.customers,
      riders: Array.isArray(parsed.riders) ? parsed.riders : seed.riders,
      riderExpenses: Array.isArray(parsed.riderExpenses) ? parsed.riderExpenses : seed.riderExpenses,
    };
  } catch {
    return createInitialSeedState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors cleanly
  }
}
