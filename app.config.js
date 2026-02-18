import 'dotenv/config';

export default {
  expo: {
    name: "mall-delivery-mobile",
    slug: "mall-delivery-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1E3A8A"
    },
    // ios: {
    //   supportsTablet: true,
    //   bundleIdentifier: "com.diyeddin.malldelivery",
    //   config: {
    //     googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS
    //   }
    // },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1E3A8A"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.diyeddin.malldelivery",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      "expo-localization",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow the app to use your location to navigate to customers."
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "eeaf0dd4-34f1-4e72-b113-7dc2cbf3b43b"
      }
    },
    owner: "diyeddin"
  }
};