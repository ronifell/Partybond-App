import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Image,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton } from './ui/GradientButton';
import type { MatchLobbyPreferences, PlayStyle, SessionMode } from '../api/types';
import { colors, gradient } from '../theme/tokens';
import { getGameImage } from '../theme/assets';

const MODES: SessionMode[] = ['casual', 'competitive'];

const MODAL_RADIUS_OUTER = 24;
const MODAL_RADIUS_INNER = 22;

/** Explicit array avoids Android native gradient issues with some readonly tuples. */
const PLAY_STYLE_GRADIENT_COLORS = ['#FF4DA6', '#7B3FF2', '#00D1FF'] as const;

const PLAY_STYLES: PlayStyle[] = ['relaxed', 'focused'];

interface Props {
  visible: boolean;
  /** Current game (from home card). */
  gameId?: string;
  gameName?: string;
  onClose: () => void;
  onConfirm: (prefs: MatchLobbyPreferences) => void;
}

export function MatchPreferencesModal({ visible, gameId, gameName, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const { height: winH } = useWindowDimensions();
  const [mode, setMode] = useState<SessionMode>('casual');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('relaxed');

  const genreLabel = useMemo(
    () =>
      gameId
        ? t(`gameProfile.genres.${gameId}`, { defaultValue: t('gameProfile.genreDefault') })
        : '',
    [gameId, t],
  );

  const heroImage = gameId ? getGameImage(gameId) : null;

  useEffect(() => {
    if (visible) {
      setMode('casual');
      setPlayStyle('relaxed');
    }
  }, [visible]);

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
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                {/* Drag handle */}
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

                {/* Header row */}
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
                      borderRadius: 18,
                      backgroundColor: 'rgba(123,63,242,0.22)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(123,63,242,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="locate" size={18} color={colors.brand.purple} />
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
                      {t('matchPrefs.title')}
                    </Text>
                    <Text
                      style={{
                        color: colors.ink.secondary,
                        fontSize: 12,
                        lineHeight: 16,
                        marginTop: 2,
                        fontWeight: '500',
                      }}
                    >
                      {t('matchPrefs.modalSubtitle')}
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

                {/* Game row */}
                {(gameName || gameId) && (
                  <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          overflow: 'hidden',
                          backgroundColor: '#1A1230',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.1)',
                        }}
                      >
                        {heroImage ? (
                          <Image source={heroImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <LinearGradient
                            colors={gradient.primary}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Ionicons name="game-controller" size={22} color="white" />
                          </LinearGradient>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                        <Text
                          style={{ color: colors.ink.primary, fontSize: 15, fontWeight: '800' }}
                          numberOfLines={1}
                        >
                          {gameName ?? gameId?.replace(/_/g, ' ')}
                        </Text>
                        {genreLabel ? (
                          <Text
                            style={{
                              color: colors.ink.secondary,
                              fontSize: 12,
                              fontWeight: '600',
                              marginTop: 3,
                            }}
                            numberOfLines={1}
                          >
                            {genreLabel}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.ink.secondary} />
                    </View>
                  </View>
                )}

                {/* Play style */}
                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                  <Text
                    style={{
                      color: 'rgba(197, 168, 255, 0.95)',
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                      marginBottom: 7,
                    }}
                  >
                    {t('matchPrefs.playStyleLabel')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {MODES.map((m) => {
                      const selected = mode === m;
                      const isCasual = m === 'casual';
                      return (
                        <Pressable
                          key={m}
                          onPress={() => setMode(m)}
                          style={({ pressed }) => [
                            {
                              flex: 1,
                              borderRadius: 14,
                              overflow: 'hidden',
                              opacity: pressed ? 0.92 : 1,
                            },
                            pressed ? { transform: [{ scale: 0.99 }] } : null,
                          ]}
                        >
                          {selected ? (
                            <View style={{ minHeight: 44, justifyContent: 'center' }}>
                              <LinearGradient
                                colors={[...PLAY_STYLE_GRADIENT_COLORS]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                              />
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  paddingVertical: 9,
                                  paddingHorizontal: 8,
                                  minHeight: 44,
                                }}
                              >
                                <Ionicons
                                  name={isCasual ? 'game-controller' : 'trophy'}
                                  size={18}
                                  color="white"
                                />
                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 14,
                                    fontWeight: '800',
                                    marginLeft: 6,
                                  }}
                                >
                                  {t(`createSession.${m}`)}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <View
                              style={{
                                paddingVertical: 9,
                                paddingHorizontal: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 44,
                                borderRadius: 14,
                                borderWidth: 1.5,
                                borderColor: 'rgba(255,255,255,0.14)',
                                backgroundColor: 'rgba(18,16,32,0.95)',
                              }}
                            >
                              <Ionicons
                                name={isCasual ? 'game-controller-outline' : 'trophy-outline'}
                                size={18}
                                color={colors.ink.secondary}
                              />
                              <Text
                                style={{
                                  color: colors.ink.primary,
                                  fontSize: 14,
                                  fontWeight: '700',
                                  marginLeft: 6,
                                }}
                              >
                                {t(`createSession.${m}`)}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* How you want to play today */}
                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                  <Text
                    style={{
                      color: 'rgba(197, 168, 255, 0.95)',
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    {t('matchPrefs.moodSectionLabel')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {PLAY_STYLES.map((style) => {
                      const selected = playStyle === style;
                      return (
                        <Pressable
                          key={style}
                          onPress={() => setPlayStyle(style)}
                          style={({ pressed }) => ({
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 14,
                            borderWidth: selected ? 2 : 1.5,
                            borderColor: selected ? colors.brand.purple : 'rgba(255,255,255,0.12)',
                            backgroundColor: selected ? 'rgba(123,63,242,0.14)' : 'rgba(255,255,255,0.04)',
                            alignItems: 'center',
                            opacity: pressed ? 0.9 : 1,
                          })}
                        >
                          <Ionicons
                            name={style === 'relaxed' ? 'leaf' : 'flash'}
                            size={20}
                            color={selected ? colors.brand.purple : colors.ink.secondary}
                          />
                          <Text
                            style={{
                              color: colors.ink.primary,
                              fontWeight: '800',
                              fontSize: 13,
                              marginTop: 6,
                            }}
                          >
                            {t(`matchPrefs.playStyle.${style}`)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 6 }}>
                  <GradientButton
                    size="md"
                    title={t('matchPrefs.confirm')}
                    onPress={() => onConfirm({ gameMode: mode, playStyle })}
                    leftAdornment={<Ionicons name="locate" size={20} color="#fff" />}
                  />
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      paddingVertical: 6,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ color: colors.ink.primary, fontSize: 14, fontWeight: '600' }}>
                      {t('matchPrefs.cancel')}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
