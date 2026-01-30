// src/types.ts
// Define the specific screens inside Profile
export type ProfileStackParamList = {
  ProfileMain: undefined; // The menu screen
  Orders: undefined;
  OrderDetails: { orderId: number };
  Addresses: undefined; // will be deprecated
  AddAddress: { addressToEdit?: Address } | undefined;
  Payments: undefined;
  Privacy: undefined;
  Notifications: undefined;
};

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
  ProductDetails: { productId: number; name: string; price: number; description: string; image_url?: string };
  Login: undefined;
  Checkout: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  OrderDetails: { orderId: number };
  Addresses: undefined;
  AddAddress: { addressToEdit?: Address } | undefined;

};