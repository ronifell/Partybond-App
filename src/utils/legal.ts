import { Linking } from 'react-native';

/** Opens a legal document URL in the device browser. */
export async function openLegalDocument(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}
