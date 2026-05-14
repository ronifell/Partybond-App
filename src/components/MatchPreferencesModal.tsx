import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { SegmentToggle } from './ui/SegmentToggle';
import { GradientButton } from './ui/GradientButton';
import type { MatchLobbyPreferences, SessionMode, SessionSkillTier } from '../api/types';
import { SESSION_SKILL_TIERS } from '../api/types';
import { colors } from '../theme/tokens';

const MODES: SessionMode[] = ['casual', 'competitive'];

const LABEL_STYLE = {
  color: colors.ink.secondary,
  marginBottom: 10,
  fontSize: 12,
  fontWeight: '700' as const,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
};

function tierLabelKey(tier: SessionSkillTier): string {
  switch (tier) {
    case 'beginner':
      return 'matchPrefs.tierBeginner';
    case 'intermediate':
      return 'matchPrefs.tierIntermediate';
    case 'advanced':
      return 'matchPrefs.tierAdvanced';
    case 'veteran':
      return 'matchPrefs.tierVeteran';
    default:
      return 'matchPrefs.tierBeginner';
  }
}

interface Props {
  visible: boolean;
  gameName?: string;
  onClose: () => void;
  onConfirm: (prefs: MatchLobbyPreferences) => void;
}

export function MatchPreferencesModal({ visible, gameName, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const { height: winH } = useWindowDimensions();
  const [mode, setMode] = useState<SessionMode>('casual');
  const [skillTier, setSkillTier] = useState<SessionSkillTier>('beginner');

  useEffect(() => {
    if (visible) {
      setMode('casual');
      setSkillTier('beginner');
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(5,5,12,0.82)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: winH * 0.88,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(16,14,28,0.97)',
            overflow: 'hidden',
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>
                  {t('matchPrefs.title')}
                </Text>
                {gameName ? (
                  <Text style={{ color: colors.brand.purple, fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                    {gameName}
                  </Text>
                ) : null}
                <Text style={{ color: colors.ink.secondary, fontSize: 13, lineHeight: 19, marginTop: 10 }}>
                  {t('matchPrefs.subtitle')}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
                <Ionicons name="close" size={26} color={colors.ink.secondary} />
              </Pressable>
            </View>

            <View style={{ marginTop: 22 }}>
              <Text style={LABEL_STYLE}>{t('matchPrefs.modeLabel')}</Text>
              <SegmentToggle
                value={mode}
                onChange={setMode}
                options={MODES.map((m) => ({ value: m, label: t(`createSession.${m}`) }))}
              />
            </View>

            <View style={{ marginTop: 22 }}>
              <Text style={LABEL_STYLE}>{t('matchPrefs.skillLabel')}</Text>
              <Text style={{ color: colors.ink.secondary, fontSize: 12, marginBottom: 12, lineHeight: 17 }}>
                {t('matchPrefs.skillHint')}
              </Text>
              <View style={{ gap: 8 }}>
                {SESSION_SKILL_TIERS.map((tier) => {
                  const selected = skillTier === tier;
                  return (
                    <Pressable
                      key={tier}
                      onPress={() => setSkillTier(tier)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: selected ? colors.brand.purple : 'rgba(255,255,255,0.12)',
                        backgroundColor: selected ? 'rgba(123,63,242,0.18)' : 'rgba(10,10,18,0.75)',
                        opacity: pressed ? 0.9 : 1,
                      })}
                    >
                      <Text
                        style={{ color: colors.ink.primary, fontWeight: '700', fontSize: 15, flex: 1 }}
                        numberOfLines={2}
                      >
                        {t(tierLabelKey(tier))}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={22} color={colors.brand.purple} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={22} color={colors.ink.secondary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: 26, gap: 10 }}>
              <GradientButton
                title={t('matchPrefs.confirm')}
                onPress={() => onConfirm({ gameMode: mode, skillTier })}
              />
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  paddingVertical: 12,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: colors.ink.secondary, fontSize: 15, fontWeight: '600' }}>
                  {t('matchPrefs.cancel')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
