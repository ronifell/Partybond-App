import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persists dismissal so the beta peak-hours notice is shown only once. */
export const BETA_PEAK_HOURS_NOTICE_KEY = '@partybond/beta_peak_hours_notice_dismissed';

export async function isBetaPeakHoursNoticeDismissed(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BETA_PEAK_HOURS_NOTICE_KEY);
  return value === '1';
}

export async function dismissBetaPeakHoursNotice(): Promise<void> {
  await AsyncStorage.setItem(BETA_PEAK_HOURS_NOTICE_KEY, '1');
}
