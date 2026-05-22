import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, gradient } from '../theme/tokens';

interface Props {
  gameName: string;
  onDismiss: () => void;
  onGoToProfile: () => void;
}

/**
 * Centered modal when the user tries to match without an in-game profile for that title.
 */
export function GameProfileRequiredNotice({ gameName, onDismiss, onGoToProfile }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 360);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel={t('common.cancel')} />
        <View style={[styles.card, { width: cardWidth }]}>
          <LinearGradient
            colors={['rgba(36, 22, 52, 0.98)', 'rgba(14, 12, 24, 0.99)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="person-add-outline" size={24} color={colors.brand.pink} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('home.joinNeedsProfileTitle')}</Text>
              </View>
              <Pressable
                onPress={onDismiss}
                hitSlop={10}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                accessibilityLabel={t('common.cancel')}
              >
                <Ionicons name="close" size={20} color={colors.ink.secondary} />
              </Pressable>
            </View>

            <Text style={styles.body}>{t('home.joinNeedsProfileBody', { game: gameName })}</Text>
            <Text style={styles.hint}>{t('home.joinNeedsProfileHint')}</Text>

            <Pressable
              onPress={onGoToProfile}
              style={({ pressed }) => [styles.ctaWrap, pressed && styles.ctaPressed]}
            >
              <LinearGradient
                colors={gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Ionicons name="arrow-forward-circle" size={22} color="white" />
                <Text style={styles.ctaText}>{t('home.joinNeedsProfileCta')}</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 166, 0.5)',
    shadowColor: '#FF4DA6',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
  },
  cardGradient: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 77, 166, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 166, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    color: colors.ink.primary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  body: {
    color: colors.ink.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  hint: {
    color: colors.ink.secondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    opacity: 0.95,
  },
  ctaWrap: {
    marginTop: 18,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  ctaGradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
