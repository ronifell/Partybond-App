import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromConstants = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

const defaultUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_URL = fromConstants ?? defaultUrl;
export const SOCKET_URL = API_URL;
