import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { GradientButton } from './ui/GradientButton';
import { colors, gradient } from '../theme/tokens';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * One-time beta notice — inline card (no modal backdrop) so surrounding layout stays clear.
 */
export function BetaPeakHoursNotice({ visible, onDismiss, style }: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.outerBorder}
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('betaNotice.title')}</Text>
            <Pressable
              onPress={onDismiss}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Ionicons name="close" size={18} color={colors.ink.secondary} />
            </Pressable>
          </View>

          <Text style={styles.body}>{t('betaNotice.body1')}</Text>
          <Text style={styles.body}>
            {t('betaNotice.body2Prefix')}
            <Text style={styles.hoursHighlight}>{t('betaNotice.hours')}</Text>
            {t('betaNotice.body2Suffix')}
          </Text>

          <Text style={styles.highlightLine}>{t('betaNotice.peakLine')}</Text>
          <Text style={styles.footer}>{t('betaNotice.footer')}</Text>

          <GradientButton
            size="sm"
            title={t('betaNotice.cta')}
            onPress={onDismiss}
            style={{ marginTop: 12 }}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  outerBorder: {
    borderRadius: 18,
    padding: 1.5,
    shadowColor: '#7B3FF2',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  card: {
    borderRadius: 16.5,
    backgroundColor: 'rgba(10, 8, 20, 0.97)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: colors.ink.primary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  body: {
    color: colors.ink.secondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    marginTop: 4,
  },
  hoursHighlight: {
    color: colors.brand.purple,
    fontWeight: '900',
    fontSize: 14,
    backgroundColor: 'rgba(123, 63, 242, 0.22)',
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  highlightLine: {
    color: 'rgba(197, 168, 255, 0.95)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 10,
  },
  footer: {
    color: colors.ink.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
});
