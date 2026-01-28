import { registerRootComponent } from 'expo';

import App from './App';

// --- ADD THIS BLOCK ---
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// This suppresses the "Reading from value during render" warning
configureReanimatedLogger({
  strict: false, 
  level: ReanimatedLogLevel.warn,
});
// ----------------------

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
