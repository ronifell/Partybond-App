import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromConstants = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

// Preferred source: `.env` via Expo's public env vars.
// Example: EXPO_PUBLIC_API_URL=http://18.231.112.145:4000
const fromProcessEnv = process.env.EXPO_PUBLIC_API_URL;

// Default backend URL for when no env/config is provided.
const defaultUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_URL = fromProcessEnv ?? fromConstants ?? defaultUrl;
export const SOCKET_URL = API_URL;
