// Define the parameters for every screen in your Home Stack
export type HomeStackParamList = {
  HomeMain: undefined; // No params needed for the main list
  StoreDetails: { storeId: number; name: string }; // Details needs an ID and Name
  ProductDetails: { productId: number; name: string; price: number; description: string; image_url?: string };
  Login: undefined;
  MainTabs: undefined;
};