import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radii } from '../theme/tokens';

interface Props {
  /**
   * `compact` (default) shows a small collapsible strip suitable for the top of the chat.
   * `full` shows an always-expanded card with every tip, meant for the queue screen.
   */
  variant?: 'compact' | 'full';
  style?: object;
}

const TIP_KEYS = [
  'safety.tipPasswords',
  'safety.tipMoney',
  'safety.tipDocuments',
  'safety.tipNoRequest',
  'safety.tipReport',
] as const;

export function SafetyTipsCard({ variant = 'full', style }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(variant === 'full');

  const isCompact = variant === 'compact';

  return (
    <View style={[styles.card, isCompact && styles.compactCard, style]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        disabled={variant === 'full'}
        style={styles.header}
      >
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={14} color={colors.brand.purple} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{t('safety.title')}</Text>
          {isCompact ? (
            <Text style={styles.subtitle} numberOfLines={open ? undefined : 1}>
              {open ? t('safety.intro') : t('safety.compactHint')}
            </Text>
          ) : (
            <Text style={styles.subtitle}>{t('safety.intro')}</Text>
          )}
        </View>
        {isCompact ? (
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.ink.secondary}
          />
        ) : null}
      </Pressable>

      {open ? (
        <View style={styles.body}>
          {TIP_KEYS.map((k) => (
            <View key={k} style={styles.row}>
              <View style={styles.bullet} />
              <Text style={styles.rowText}>{t(k)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(123,63,242,0.28)',
    backgroundColor: 'rgba(18,18,26,0.94)',
    padding: 12,
    overflow: 'hidden',
  },
  compactCard: {
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: 'rgba(18,18,26,0.85)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(123,63,242,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  title: {
    color: colors.brand.purple,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.ink.secondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  body: {
    marginTop: 10,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    backgroundColor: colors.brand.purple,
  },
  rowText: {
    flex: 1,
    color: colors.ink.secondary,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
