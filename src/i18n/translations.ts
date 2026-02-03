// src/i18n/translations.ts

export const translations = {
  en: {
    // General
    appName: "Mall Delivery",
    welcome: "Welcome",
    loading: "Loading...",
    
    // Tabs
    home: "Home",
    market: "Market",
    cart: "Cart",
    profile: "Profile",
    
    // Actions
    login: "Login",
    logout: "Logout",
    addToCart: "Add to Cart",
    checkout: "Checkout",
    
    // Profile
    language: "Language",
    changeLanguage: "Change Language",
    paymentMethods: "Payment Methods",
    addresses: "Addresses",
    orders: "Orders",
    privacy: "Privacy Policy",
    
    // Checkout
    summary: "Summary",
    total: "Total",
    placeOrder: "Place Order",
  },
  ar: {
    // General
    appName: "توصيل المول",
    welcome: "مرحباً",
    loading: "جاري التحميل...",
    
    // Tabs
    home: "الرئيسية",
    market: "المتجر",
    cart: "السلة",
    profile: "حسابي",
    
    // Actions
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    addToCart: "إضافة للسلة",
    checkout: "إتمام الشراء",
    
    // Profile
    language: "اللغة",
    changeLanguage: "تغيير اللغة",
    paymentMethods: "طرق الدفع",
    addresses: "العناوين",
    orders: "طلباتي",
    privacy: "سياسة الخصوصية",

    // Checkout
    summary: "الملخص",
    total: "المجموع",
    placeOrder: "تأكيد الطلب",
  }
};

export type Language = 'en' | 'ar';