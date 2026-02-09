// src/types.ts
import type { ReactNode } from 'react';

// ─── Data Models ────────────────────────────────────

export interface Store {
  id: number;
  name: string;
  description?: string;
  category: string;
  image_url: string;
  banner_url?: string;
  rating: number;
  review_count?: number;
  address?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  description: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product?: { name: string; image_url?: string };
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'canceled';

export interface Order {
  id: number;
  group_id?: string;
  created_at: string;
  total_price: number;
  status: OrderStatus;
  store: { name: string; image_url?: string };
  items: OrderItem[];
}

export interface OrderDetail extends Order {
  is_reviewed?: boolean;
  delivery_address?: string;
  note?: string;
  store: {
    id: number;
    name: string;
    image_url?: string;
    phone_number?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface OrderGroup {
  groupId: string;
  createdAt: string;
  totalPrice: number;
  orders: Order[];
}

export interface ActiveOrder {
  id: number;
  status: OrderStatus;
  total_price: number;
  store?: { name: string };
  items: OrderItem[];
}

export interface User {
  email: string;
  role: 'admin' | 'store_owner' | 'driver' | 'customer';
  sub: string;
  name?: string;
  id?: number;
  exp?: number;
}

export interface CartItemInput {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  store_id?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export type PlaceOrderResponse = Order | Order[];

export interface MenuRowProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

// ─── Navigation ─────────────────────────────────────

// Define the specific screens inside Profile
export type ProfileStackParamList = {
  ProfileMain: undefined; // The menu screen
  LanguageSettings: undefined;
  Orders: undefined;
  OrderDetails: { orderId: number };
  Addresses: undefined; // will be deprecated
  AddAddress: { addressToEdit?: Address } | undefined;
  Payments: undefined;
  Privacy: undefined;
  Notifications: undefined;
  Login: undefined;
  Register: undefined;
};

export interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// 1. Add the Address Interface
export interface Address {
  id: number;
  label: string;         // "Home", "Work"
  address_line: string;  // "123 Main St"
  instructions?: string;
  is_default: boolean;
}

// Update the MainTab to know about this stack
export type MainTabParamList = {
  HomeTab: undefined;
  Cart: undefined;
  ProfileTab: undefined; // Renamed from "Profile" to "ProfileTab" to avoid confusion
};

// Update the HomeStack (Keep it same, just ensure Root stuff is still there if needed)
export type HomeStackParamList = {
  HomeMain: undefined;
  MarketplaceMain: undefined;
  StoreDetails: { storeId: number; name: string };
  ProductDetails: { productId: number; name: string; price: number; description: string; image_url?: string, category?: string };
  Checkout: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  OrderDetails: { orderId: number };
  Addresses: undefined;
  AddAddress: { addressToEdit?: Address } | undefined;
  Search: { type: 'store' | 'product' };
};