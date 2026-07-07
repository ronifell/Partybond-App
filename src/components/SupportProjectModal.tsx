import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import {
  SUPPORT_CNPJ,
  SUPPORT_EMAIL,
  SUPPORT_LEGAL_NAME,
  SUPPORT_PIX_KEY,
} from '../config/support';
import { GradientButton } from './ui/GradientButton';
import { colors, gradient } from '../theme/tokens';

const MODAL_RADIUS_OUTER = 24;
const MODAL_RADIUS_INNER = 22;

interface Props {
  visible: boolean;
  onClose: () => void;
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: 'rgba(123,63,242,0.14)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={colors.brand.purple} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            color: colors.ink.secondary,
            fontSize: 10,
            fontWeight: '800',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: colors.ink.primary,
            fontSize: 14,
            lineHeight: 20,
            fontWeight: '700',
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {content}
    </Pressable>
  );
}

export function SupportProjectModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { height: winH } = useWindowDimensions();
  const [pixCopied, setPixCopied] = useState(false);

  const copyPix = async () => {
    await Clipboard.setStringAsync(SUPPORT_PIX_KEY);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 1800);
  };

  const openEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) throw new Error('unsupported');
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('support.title'), t('support.emailOpenFailed'));
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(4, 4, 10, 0.88)',
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: winH * 0.9 }}>
          <LinearGradient
            colors={gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: MODAL_RADIUS_OUTER,
              padding: 2,
            }}
          >
            <View
              style={{
                borderRadius: MODAL_RADIUS_INNER,
                backgroundColor: '#070710',
                maxHeight: winH * 0.9 - 4,
                overflow: 'hidden',
              }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 4 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingHorizontal: 16,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,77,166,0.18)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(255,77,166,0.45)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="heart" size={18} color={colors.brand.pink} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                    <Text
                      style={{
                        color: colors.ink.primary,
                        fontSize: 18,
                        fontWeight: '800',
                        letterSpacing: -0.3,
                      }}
                    >
                      {t('support.title')}
                    </Text>
                    <Text
                      style={{
                        color: colors.ink.secondary,
                        fontSize: 12,
                        lineHeight: 16,
                        marginTop: 4,
                        fontWeight: '500',
                      }}
                    >
                      {t('support.subtitle')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onClose}
                    hitSlop={10}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons name="close" size={18} color={colors.ink.secondary} />
                  </Pressable>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 10 }}>
                  <Text style={missionTextStyle}>{t('support.mission1')}</Text>
                  <Text style={missionTextStyle}>{t('support.mission2')}</Text>
                  <Text style={taglineTextStyle}>{t('support.mission3')}</Text>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                  <Text style={sectionLabelStyle}>{t('support.companySection')}</Text>
                  <View style={infoCardStyle}>
                    <InfoRow
                      icon="business-outline"
                      label={t('support.legalNameLabel')}
                      value={SUPPORT_LEGAL_NAME}
                    />
                    <View style={infoDividerStyle} />
                    <InfoRow
                      icon="document-text-outline"
                      label={t('support.cnpjLabel')}
                      value={SUPPORT_CNPJ}
                    />
                    <View style={infoDividerStyle} />
                    <InfoRow
                      icon="mail-outline"
                      label={t('support.emailLabel')}
                      value={SUPPORT_EMAIL}
                      onPress={() => void openEmail()}
                    />
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                  <Text style={sectionLabelStyle}>{t('support.transparencyTitle')}</Text>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 13,
                      lineHeight: 19,
                      fontWeight: '500',
                    }}
                  >
                    {t('support.transparencyBody')}
                  </Text>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                  <Text style={sectionLabelStyle}>{t('support.donationSection')}</Text>
                  <View style={infoCardStyle}>
                    <Text
                      style={{
                        color: colors.ink.secondary,
                        fontSize: 10,
                        fontWeight: '800',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('support.pixLabel')}
                    </Text>
                    <Text
                      style={{
                        color: colors.ink.primary,
                        fontSize: 16,
                        lineHeight: 22,
                        fontWeight: '800',
                        marginTop: 4,
                        letterSpacing: 0.2,
                      }}
                      selectable
                    >
                      {SUPPORT_PIX_KEY}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 11,
                      lineHeight: 16,
                      fontWeight: '500',
                      marginTop: 8,
                    }}
                  >
                    {t('support.disclaimer')}
                  </Text>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                  <GradientButton
                    size="md"
                    title={pixCopied ? t('support.pixCopied') : t('support.copyPix')}
                    onPress={() => void copyPix()}
                    leftAdornment={<Ionicons name="heart" size={18} color="#fff" />}
                  />
                </View>
              </ScrollView>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const missionTextStyle = {
  color: colors.ink.primary,
  fontSize: 14,
  lineHeight: 21,
  fontWeight: '600' as const,
};

const taglineTextStyle = {
  color: colors.brand.purple,
  fontSize: 15,
  lineHeight: 22,
  fontWeight: '800' as const,
  letterSpacing: -0.2,
  marginTop: 2,
};

const sectionLabelStyle = {
  color: 'rgba(197, 168, 255, 0.95)',
  fontSize: 10,
  fontWeight: '800' as const,
  letterSpacing: 1,
  marginBottom: 8,
};

const infoCardStyle = {
  borderRadius: 14,
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.10)',
  backgroundColor: 'rgba(255,255,255,0.04)',
  padding: 12,
  gap: 10,
};

const infoDividerStyle = {
  height: 1,
  backgroundColor: 'rgba(255,255,255,0.08)',
};
