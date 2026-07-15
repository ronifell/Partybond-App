import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_E164 } from '../config/support';
import { colors, radii } from '../theme/tokens';

interface Props {
  style?: object;
}

/** Small tap-to-open WhatsApp support footer, shown at the bottom of scrollable pages. */
export function SupportFooter({ style }: Props) {
  const { t } = useTranslation();

  const openWhatsapp = async () => {
    const text = encodeURIComponent(t('supportFooter.whatsappGreeting'));
    const url = `whatsapp://send?phone=${SUPPORT_WHATSAPP_E164}&text=${text}`;
    const webUrl = `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${text}`;
    try {
      const supported = await Linking.canOpenURL(url);
      await Linking.openURL(supported ? url : webUrl);
    } catch {
      Alert.alert(t('supportFooter.title'), t('supportFooter.openFailed'));
    }
  };

  return (
    <Pressable
      onPress={() => void openWhatsapp()}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={t('supportFooter.title')}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>
          {t('supportFooter.title')}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {t('supportFooter.body', { phone: SUPPORT_WHATSAPP_DISPLAY })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.ink.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.28)',
    backgroundColor: 'rgba(18,18,26,0.85)',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(37,211,102,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.ink.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  body: {
    color: colors.ink.secondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
});
