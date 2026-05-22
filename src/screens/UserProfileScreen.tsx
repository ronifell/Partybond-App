import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TeamScreenBackground } from '../components/ui/TeamScreenBackground';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { Avatar } from '../components/ui/Avatar';
import { GradientButton } from '../components/ui/GradientButton';
import { blockUser, fetchPublicUser, openDirectChat, reportUser } from '../api/social';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';

/** Bright icon accents — aligned with Recent Players action buttons */
const ACCENT = {
  blue: { icon: colors.brand.blue, bg: 'rgba(0,209,255,0.18)', label: '#5BC4E8' },
  purple: { icon: colors.brand.purple, bg: 'rgba(123,63,242,0.22)', label: '#A98AF5' },
  pink: { icon: colors.brand.pink, bg: 'rgba(255,77,166,0.2)', label: '#FF7DBF' },
  gold: { icon: '#E8A84A', bg: 'rgba(232,168,74,0.2)', label: '#F5C878' },
  mint: { icon: '#00E676', bg: 'rgba(0,230,118,0.15)', label: '#7CECA1' },
  coral: { icon: '#FF8A65', bg: 'rgba(255,138,101,0.18)', label: '#FFAB91' },
} as const;

type AccentKey = keyof typeof ACCENT;

const GAME_CARD_RADIUS = 18;
const GAME_IMAGE_WIDTH = 108;
const CARD_PADDING = 8;

const GAME_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  free_fire: 'flame',
  elden_ring_nightreign: 'skull',
  valorant: 'aperture',
  cod_mobile: 'rocket',
  league_of_legends: 'trophy',
  fortnite: 'thunderstorm',
  counter_strike_2: 'scan-circle',
  ea_sports_fc_26: 'football',
  minecraft: 'cube',
  roblox: 'shapes',
  pubg_mobile: 'shield',
  mobile_legends: 'planet',
};

/** Nested tile — matches Profile tab overview / menu row boxes */
const NESTED_TILE = {
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.10)',
  backgroundColor: 'rgba(10, 10, 18, 0.75)',
} as const;

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function InfoTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: AccentKey;
}) {
  const a = ACCENT[accent];
  return (
    <View style={styles.infoTile}>
      <View style={[styles.iconOrb, { backgroundColor: a.bg }]}>
        <Ionicons name={icon} size={18} color={a.icon} />
      </View>
      <View style={styles.infoTileText}>
        <Text style={[styles.infoLabel, { color: a.label }]}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function QuickActionTile({
  icon,
  label,
  accent,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent: AccentKey;
  onPress: () => void;
}) {
  const a = ACCENT[accent];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickTile,
        { opacity: pressed ? 0.88 : 1, backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : NESTED_TILE.backgroundColor },
      ]}
    >
      <View style={[styles.iconOrbLg, { backgroundColor: a.bg }]}>
        <Ionicons name={icon} size={20} color={a.icon} />
      </View>
      <Text style={[styles.quickLabel, { color: a.label }]}>{label}</Text>
    </Pressable>
  );
}

export function UserProfileScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const viewer = useAuth((s) => s.user);
  const { userId, gameId: routeGameId } = route.params as {
    userId: string;
    gameId?: string;
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [gameCardContentHeight, setGameCardContentHeight] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ['public-user', userId],
    queryFn: () => fetchPublicUser(userId),
  });

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const gameProfile = useMemo(() => {
    if (!profile?.gameProfiles.length) return null;
    const preferredId = routeGameId ?? viewer?.selectedGame;
    const match =
      (preferredId && profile.gameProfiles.find((p) => p.gameId === preferredId)) ??
      profile.gameProfiles[0];
    if (!match) return null;
    return {
      ...match,
      gameName: games.find((g) => g.id === match.gameId)?.name ?? match.gameId,
    };
  }, [profile, routeGameId, viewer?.selectedGame, games]);

  const onChat = async () => {
    if (!profile) return;
    const conv = await openDirectChat(userId);
    navigation.navigate('Chat', { conversationId: conv.id, title: profile.name, type: 'direct' });
  };

  const onBlock = () => {
    Alert.alert(t('moderation.blockTitle'), t('moderation.blockConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('moderation.block'),
        style: 'destructive',
        onPress: async () => {
          await blockUser(userId);
          navigation.goBack();
        },
      },
    ]);
  };

  const onReport = () => {
    Alert.alert(t('moderation.reportTitle'), t('moderation.reportConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('moderation.report'),
        onPress: async () => {
          await reportUser(userId, 'other');
          setMenuOpen(false);
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <TeamScreenBackground style={styles.centered}>
        <Text style={{ color: colors.ink.secondary }}>{t('common.loading')}</Text>
      </TeamScreenBackground>
    );
  }

  const isOnline = profile.isOnline;

  return (
    <TeamScreenBackground style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.brand.blue} />
            </Pressable>
            <Logo size={32} showText />
          </View>
          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            hitSlop={12}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.brand.pink} />
          </Pressable>
        </View>

        {menuOpen ? (
          <View style={styles.menuWrap}>
            <Card variant="dark" padding={0} radius={18}>
              <Pressable onPress={onBlock} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
                <View style={[styles.iconOrbSm, { backgroundColor: ACCENT.coral.bg }]}>
                  <Ionicons name="ban-outline" size={16} color={ACCENT.coral.icon} />
                </View>
                <Text style={[styles.menuText, { color: ACCENT.coral.label }]}>{t('moderation.block')}</Text>
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable onPress={onReport} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
                <View style={[styles.iconOrbSm, { backgroundColor: ACCENT.purple.bg }]}>
                  <Ionicons name="flag-outline" size={16} color={ACCENT.purple.icon} />
                </View>
                <Text style={[styles.menuText, { color: ACCENT.purple.label }]}>{t('moderation.report')}</Text>
              </Pressable>
            </Card>
          </View>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.heroRow}>
            <View style={styles.avatarWrap}>
              <Avatar uri={profile.photoUrl} name={profile.name} size={96} glow={false} />
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: isOnline ? ACCENT.mint.icon : '#5C5C6A' },
                ]}
              />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.name} numberOfLines={2}>
                {profile.name}
              </Text>
              <View style={[styles.statusPill, isOnline ? styles.pillOnline : styles.pillOffline]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? ACCENT.mint.icon : colors.ink.disabled },
                  ]}
                />
                <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
                  {isOnline ? t('recent.online') : t('recent.offline')}
                </Text>
              </View>
            </View>
          </View>

          <Card variant="dark" padding={CARD_PADDING} radius={18}>
            <SectionLabel>{t('playerProfile.detailsTitle')}</SectionLabel>
            <View style={styles.tilesStack}>
              <InfoTile
                icon="person-outline"
                label={t('playerProfile.username')}
                value={profile.name}
                accent="blue"
              />
              <InfoTile
                icon="mail-outline"
                label={t('playerProfile.email')}
                value={profile.email}
                accent="pink"
              />
              <InfoTile
                icon="calendar-outline"
                label={t('playerProfile.age')}
                value={String(profile.age)}
                accent="mint"
              />
            </View>
          </Card>

          {gameProfile ? (
            <Card variant="dark" padding={0} radius={GAME_CARD_RADIUS}>
              <View style={styles.gameCardRow}>
                <View
                  style={[
                    styles.gameImageCol,
                    gameCardContentHeight > 0 && { height: gameCardContentHeight },
                  ]}
                >
                  <View style={styles.gameImageInner}>
                    {getGameImage(gameProfile.gameId) ? (
                      <Image
                        source={getGameImage(gameProfile.gameId)!}
                        style={styles.gameImageFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={[...gradient.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gameImageFallback}
                      >
                        <Ionicons
                          name={GAME_ICONS[gameProfile.gameId] ?? 'game-controller'}
                          size={32}
                          color="#fff"
                        />
                      </LinearGradient>
                    )}
                  </View>
                </View>
                <View
                  style={styles.gameCardContent}
                  onLayout={(e) => {
                    const h = Math.round(e.nativeEvent.layout.height);
                    if (h > 0 && h !== gameCardContentHeight) setGameCardContentHeight(h);
                  }}
                >
                  <SectionLabel>{t('playerProfile.gameInfoTitle')}</SectionLabel>
                  <Text style={[styles.gameName, { color: ACCENT.gold.label }]} numberOfLines={1}>
                    {gameProfile.gameName}
                  </Text>
                  <View style={styles.tilesStack}>
                    <InfoTile
                      icon="person-circle-outline"
                      label={t('playerProfile.inGameNickname')}
                      value={gameProfile.nickname}
                      accent="purple"
                    />
                    <InfoTile
                      icon="id-card-outline"
                      label={t('playerProfile.inGameId')}
                      value={gameProfile.playerId}
                      accent="coral"
                    />
                  </View>
                </View>
              </View>
            </Card>
          ) : (
            <Card variant="dark" padding={CARD_PADDING} radius={18}>
              <SectionLabel>{t('playerProfile.gameInfoTitle')}</SectionLabel>
              <Text style={styles.gameEmpty}>{t('playerProfile.gameInfoEmpty')}</Text>
            </Card>
          )}

          <Card variant="dark" padding={CARD_PADDING} radius={18}>
            <SectionLabel>{t('playerProfile.actionsTitle')}</SectionLabel>
            <View style={styles.quickRow}>
              <QuickActionTile
                icon="chatbubble-outline"
                label={t('playerProfile.message')}
                accent="blue"
                onPress={() => void onChat()}
              />
              <QuickActionTile
                icon="people-outline"
                label={t('playerProfile.inviteGroup')}
                accent="pink"
                onPress={() =>
                  navigation.navigate('AddToGroup', { userId, name: profile.name })
                }
              />
            </View>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            title={t('playerProfile.inviteGroup')}
            onPress={() =>
              navigation.navigate('AddToGroup', { userId, name: profile.name })
            }
            leftAdornment={<Ionicons name="person-add" size={18} color="#fff" />}
          />
        </View>
      </SafeAreaView>
    </TeamScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(10, 10, 18, 0.92)',
  },
  menuWrap: {
    marginHorizontal: 12,
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  menuText: { fontWeight: '700', fontSize: 14, flex: 1 },
  scroll: { paddingHorizontal: 12, paddingBottom: 128, gap: 8 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
    marginBottom: 0,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.bg.base,
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 6,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillOnline: {
    borderColor: 'rgba(0,230,118,0.45)',
    backgroundColor: 'rgba(0,230,118,0.12)',
  },
  pillOffline: {
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: colors.ink.disabled, fontSize: 11, fontWeight: '800' },
  statusTextOnline: { color: ACCENT.mint.icon },
  sectionLabel: {
    color: colors.brand.pink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  tilesStack: { gap: 6 },
  infoTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: NESTED_TILE.borderRadius,
    borderWidth: NESTED_TILE.borderWidth,
    borderColor: NESTED_TILE.borderColor,
    backgroundColor: NESTED_TILE.backgroundColor,
  },
  iconOrb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOrbLg: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconOrbSm: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTileText: { flex: 1, minWidth: 0 },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  gameCardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gameImageCol: {
    width: GAME_IMAGE_WIDTH,
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor: '#1A1230',
    borderTopLeftRadius: GAME_CARD_RADIUS,
    borderBottomLeftRadius: GAME_CARD_RADIUS,
    overflow: 'hidden',
  },
  gameImageInner: {
    flex: 1,
    width: GAME_IMAGE_WIDTH,
    minHeight: 1,
  },
  gameImageFill: {
    width: '100%',
    height: '100%',
  },
  gameImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameCardContent: {
    flex: 1,
    minWidth: 0,
    padding: CARD_PADDING,
    gap: 2,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  gameEmpty: {
    color: colors.ink.secondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 6,
    borderRadius: NESTED_TILE.borderRadius,
    borderWidth: NESTED_TILE.borderWidth,
    borderColor: NESTED_TILE.borderColor,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
});
