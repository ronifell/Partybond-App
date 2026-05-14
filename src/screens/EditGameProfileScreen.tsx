import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { setGameProfile } from '../api/users';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';
import { colors, gradient } from '../theme/tokens';
import { getGameImage } from '../theme/assets';

/** Hero banner height for game artwork (compact layout). */
const HERO_HEIGHT = Math.round(118 * 1.3);
const CARD_RADIUS_OUTER = 18;
const CARD_RADIUS_INNER = 16;

function GradientTitle({ text, width }: { text: string; width: number }) {
  const gid = useMemo(() => `egp-title-${Math.random().toString(36).slice(2, 9)}`, []);
  const h = 32;
  return (
    <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
      <Defs>
        <SvgLinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FF4DA6" />
          <Stop offset="0.45" stopColor="#7B3FF2" />
          <Stop offset="1" stopColor="#00D1FF" />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gid})`}
        fontSize={22}
        fontWeight="800"
        fontStyle="italic"
        x="0"
        y={24}
      >
        {text}
      </SvgText>
    </Svg>
  );
}

export function EditGameProfileScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  const gameId = (route.params as { gameId: string }).gameId;
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  const game = games.find((g) => g.id === gameId);
  const gameName = game?.name ?? gameId.replace(/_/g, ' ');

  const genreLabel = t(`gameProfile.genres.${gameId}`, {
    defaultValue: t('gameProfile.genreDefault'),
  });

  const existing = user?.gameProfiles.find((p) => p.gameId === gameId);

  const [nickname, setNickname] = useState(existing?.nickname ?? '');
  const [playerId, setPlayerId] = useState(existing?.playerId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleSvgW = winW - 28 - 36 - 8;
  const heroImage = getGameImage(gameId);

  const nicknameOk = nickname.trim().length > 0;
  const playerIdOk = playerId.trim().length > 0;

  const checkSlot = (ok: boolean) =>
    ok ? (
      <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
    ) : null;

  const onSave = async () => {
    if (!nickname.trim() || !playerId.trim()) {
      setError(t('auth.errors.generic'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await setGameProfile({
        gameId,
        nickname: nickname.trim(),
        playerId: playerId.trim(),
      });
      setUser(updated);
      navigation.goBack();
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const steps: Array<{ n: number; icon: keyof typeof Ionicons.glyphMap; labelKey: string }> = [
    { n: 1, icon: 'phone-portrait-outline', labelKey: 'gameProfile.step1' },
    { n: 2, icon: 'person-outline', labelKey: 'gameProfile.step2' },
    { n: 3, icon: 'copy-outline', labelKey: 'gameProfile.step3' },
    { n: 4, icon: 'clipboard-outline', labelKey: 'gameProfile.step4' },
  ];

  return (
    <Screen scroll={false} keyboard padded={false} background={false}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 8,
            paddingHorizontal: 12,
            paddingTop: insets.top,
          }}
          keyboardShouldPersistTaps="handled"
        >
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.06)',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
              <GradientTitle text={t('gameProfile.screenTitle')} width={titleSvgW} />
            </View>
          </View>
          <Text
            style={{
              color: colors.ink.secondary,
              fontSize: 11,
              lineHeight: 15,
              marginTop: 3,
              marginLeft: 44,
              marginRight: 2,
              fontWeight: '500',
            }}
          >
            {t('gameProfile.screenSubtitle')}
          </Text>
        </View>

        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: CARD_RADIUS_OUTER,
            padding: 2,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              borderRadius: CARD_RADIUS_INNER,
              backgroundColor: '#0B0914',
              overflow: 'hidden',
            }}
          >
            {heroImage ? (
              <ImageBackground
                source={heroImage}
                style={{ width: '100%', height: HERO_HEIGHT }}
                resizeMode="cover"
                imageStyle={{
                  borderTopLeftRadius: CARD_RADIUS_INNER - 1,
                  borderTopRightRadius: CARD_RADIUS_INNER - 1,
                }}
              >
                {/* Light overlay so artwork stays vivid; stronger tint only at the bottom for labels. */}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.72)']}
                  locations={[0, 0.55, 1]}
                  style={{ flex: 1, paddingHorizontal: 10, paddingBottom: 8, paddingTop: 6, justifyContent: 'flex-end' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 17,
                        fontWeight: '900',
                        letterSpacing: -0.3,
                        textShadowColor: 'rgba(0,0,0,0.85)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 8,
                      }}
                    >
                      {gameName}
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(0,200,83,0.22)',
                        borderWidth: 1,
                        borderColor: 'rgba(0,200,83,0.55)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ color: '#7CECA1', fontSize: 10, fontWeight: '800' }}>
                        {t('common.active')}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: 'rgba(240,240,248,0.95)',
                      fontSize: 11,
                      fontWeight: '600',
                      marginTop: 3,
                      textShadowColor: 'rgba(0,0,0,0.75)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    {genreLabel}
                  </Text>
                </LinearGradient>
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={['#2A1838', '#0B0914']}
                style={{
                  width: '100%',
                  height: HERO_HEIGHT,
                  padding: 10,
                  justifyContent: 'flex-end',
                  borderTopLeftRadius: CARD_RADIUS_INNER - 1,
                  borderTopRightRadius: CARD_RADIUS_INNER - 1,
                }}
              >
                <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>{gameName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View
                    style={{
                      backgroundColor: 'rgba(0,200,83,0.22)',
                      borderWidth: 1,
                      borderColor: 'rgba(0,200,83,0.55)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ color: '#7CECA1', fontSize: 11, fontWeight: '800' }}>
                      {t('common.active')}
                    </Text>
                  </View>
                  <Text style={{ color: colors.ink.secondary, fontSize: 11, fontWeight: '600' }}>
                    {genreLabel}
                  </Text>
                </View>
              </LinearGradient>
            )}

            <View style={{ paddingHorizontal: 12, paddingTop: 2, paddingBottom: 6 }}>
              <Pressable
                onPress={() => navigation.navigate('Profile')}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 2,
                  marginBottom: 2,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: 'rgba(123,63,242,0.55)',
                  backgroundColor: pressed ? 'rgba(123,63,242,0.18)' : 'rgba(123,63,242,0.08)',
                })}
              >
                <Ionicons name="swap-horizontal" size={16} color={colors.brand.purple} />
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                  {t('gameProfile.changeGame')}
                </Text>
              </Pressable>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 12 }} />

            <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, gap: 8 }}>
              <Text
                style={{
                  color: colors.ink.primary,
                  fontSize: 14,
                  fontWeight: '800',
                  letterSpacing: -0.2,
                }}
              >
                {t('gameProfile.inGameSection')}
              </Text>

              <Input
                compact
                label={t('gameProfile.nicknameLabel')}
                value={nickname}
                onChangeText={setNickname}
                placeholder={t('onboarding.nicknamePlaceholder')}
                hint={t('gameProfile.nicknameHint')}
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.brand.purple} />}
                rightSlot={checkSlot(nicknameOk)}
              />
              <Input
                compact
                label={t('gameProfile.playerIdLabel')}
                value={playerId}
                onChangeText={setPlayerId}
                placeholder={t('onboarding.playerIdPlaceholder')}
                hint={t('gameProfile.playerIdHint')}
                leftIcon={<Ionicons name="phone-portrait-outline" size={18} color={colors.brand.purple} />}
                rightSlot={checkSlot(playerIdOk)}
              />

              <View style={{ marginTop: 0 }}>
                <Text
                  style={{
                    color: colors.ink.primary,
                    fontSize: 13,
                    fontWeight: '800',
                    marginBottom: 6,
                  }}
                >
                  {t('gameProfile.stepsHeading')}
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 4,
                    paddingRight: 6,
                  }}
                >
                  {steps.map((s, idx) => (
                    <React.Fragment key={s.n}>
                      <View style={{ width: 84, alignItems: 'center' }}>
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: 'rgba(123,63,242,0.35)',
                            borderWidth: 1.5,
                            borderColor: 'rgba(123,63,242,0.65)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>{s.n}</Text>
                        </View>
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons name={s.icon} size={18} color={colors.brand.blue} />
                        </View>
                        <Text
                          style={{
                            color: colors.ink.secondary,
                            fontSize: 9,
                            fontWeight: '600',
                            textAlign: 'center',
                            lineHeight: 12,
                          }}
                          numberOfLines={3}
                        >
                          {t(s.labelKey, { game: gameName })}
                        </Text>
                      </View>
                      {idx < steps.length - 1 ? (
                        <View style={{ paddingTop: 22, opacity: 0.45 }}>
                          <Ionicons name="chevron-forward" size={14} color={colors.ink.secondary} />
                        </View>
                      ) : null}
                    </React.Fragment>
                  ))}
                </ScrollView>
              </View>

              {error ? (
                <Text style={{ color: colors.status.error, fontSize: 11, fontWeight: '600' }}>{error}</Text>
              ) : null}

              <GradientButton
                size="md"
                title={t('gameProfile.saveProfile')}
                onPress={onSave}
                loading={loading}
                leftAdornment={<Ionicons name="save-outline" size={20} color="#fff" />}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 0,
                }}
              >
                <Ionicons name="lock-closed-outline" size={14} color={colors.ink.disabled} />
                <Text
                  style={{
                    color: colors.ink.disabled,
                    fontSize: 10,
                    fontWeight: '500',
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  {t('gameProfile.secureNote')}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        </ScrollView>
      </View>
    </Screen>
  );
}
