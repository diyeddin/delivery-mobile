// src/types.ts
// 1. Define the specific screens inside Profile
export type ProfileStackParamList = {
  ProfileMain: undefined; // The menu screen
  Orders: undefined;
  Addresses: undefined;
  Payments: undefined;
  Privacy: undefined;
  Notifications: undefined;
};

// 2. Update the MainTab to know about this stack
export type MainTabParamList = {
  HomeTab: undefined;
  Cart: undefined;
  ProfileTab: undefined; // Renamed from "Profile" to "ProfileTab" to avoid confusion
};

// 3. Update the HomeStack (Keep it same, just ensure Root stuff is still there if needed)
export type HomeStackParamList = {
  HomeMain: undefined;
  StoreDetails: { storeId: number; name: string };
  ProductDetails: { productId: number; name: string; price: number; description: string; image_url?: string };
  Login: undefined;
  Checkout: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
};