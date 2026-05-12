import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { setFcmToken } from '../api/users';
import { useAuth } from '../store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushRegistration(): void {
  const token = useAuth((s) => s.token);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
            lightColor: '#7B3FF2',
          });
        }
        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (existing !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;
        // We use Firebase Admin / FCM (not Expo's push service), so request the
        // native device token directly. In Expo Go this may fail silently, which
        // is fine — push works once the user installs an EAS-built app.
        const deviceToken = await Notifications.getDevicePushTokenAsync().catch(() => null);
        const finalToken = (deviceToken?.data as string | undefined) ?? null;
        if (finalToken) await setFcmToken(finalToken);
      } catch {
        // silent — push is non-critical
      }
    })();
  }, [token]);
}
