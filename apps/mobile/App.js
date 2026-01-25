// Import polyfills first - MUST be before any other imports
import './polyfills';

import registerRootComponent from 'expo/build/launch/registerRootComponent';
import Entry from 'expo-router/entry';

registerRootComponent(Entry);
