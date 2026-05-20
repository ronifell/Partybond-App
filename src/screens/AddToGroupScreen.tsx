import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Avatar } from '../components/ui/Avatar';
import { HexagonFrame } from '../components/ui/HexagonFrame';
import { Logo } from '../components/ui/Logo';
import { getApiError } from '../api/client';
import { fetchGroups, inviteToGroup } from '../api/social';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { getGameImage, TEAM_SCREEN_BACKGROUND } from '../theme/assets';
import type { GroupSummary } from '../api/types';
import { colors, gradient } from '../theme/tokens';

const CARD_BG = '#12121A';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

function GradientPhrase({ text }: { text: string }) {
  const [pink, mid, blue] = gradient.primary;
  const width = Math.min(text.length * 16 + 20, 340);
  return (
    <Svg height={36} width={width}>
      <Defs>
        <SvgGradient id="inviteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={pink} />
          <Stop offset="50%" stopColor={mid} />
          <Stop offset="100%" stopColor={blue} />
        </SvgGradient>
      </Defs>
      <SvgText fill="url(#inviteGrad)" fontSize={30} fontWeight="800" x="0" y={30}>
        {text}
      </SvgText>
    </Svg>
  );
}

function GroupPickCard({
  group,
  selected,
  onPress,
  gameName,
  gameId,
  t,
}: {
  group: GroupSummary;
  selected: boolean;
  onPress: () => void;
  gameName: string;
  gameId: string | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const photo = group.photoUrl ?? group.members.find((m) => m.role === 'admin')?.photoUrl;

  const inner = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.groupCardInner, { opacity: pressed ? 0.92 : 1 }]}
    >
      <Avatar uri={photo} name={group.name} size={48} glow={false} />
      <View style={styles.groupCardInfo}>
        <Text style={styles.groupCardName}>{group.name}</Text>
        <View style={styles.groupCardMeta}>
          <Ionicons name="people-outline" size={13} color={colors.ink.disabled} />
          <Text style={styles.groupCardMetaText}>
            {t('inviteGroup.memberCount', { count: group.memberCount })}
          </Text>
        </View>
        {gameName ? (
          <View style={styles.groupCardMeta}>
            {gameId && getGameImage(gameId) ? (
              <Image source={getGameImage(gameId)!} style={styles.gameIcon} />
            ) : (
              <Ionicons name="game-controller" size={12} color={colors.brand.blue} />
            )}
            <Text style={styles.groupCardGame}>{gameName}</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
      </View>
    </Pressable>
  );

  if (selected) {
    return (
      <LinearGradient
        colors={[...gradient.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.groupCardGradient}
      >
        {inner}
      </LinearGradient>
    );
  }

  return <View style={styles.groupCard}>{inner}</View>;
}

export function AddToGroupScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const showTopToast = useNotificationStore((s) => s.showTopToast);
  const user = useAuth((s) => s.user);
  const { userId, name } = route.params as { userId: string; name: string };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const gameName = useMemo(() => {
    const id = user?.selectedGame;
    return games.find((g) => g.id === id)?.name ?? '';
  }, [games, user?.selectedGame]);

  const invitableGroups = useMemo(
    () => groups.filter((g) => !g.members.some((m) => m.id === userId)),
    [groups, userId],
  );

  const onSend = async () => {
    if (!selectedId) return;
    setSending(true);
    try {
      await inviteToGroup(selectedId, userId);
      showTopToast(t('inviteGroup.sendSuccessBody'));
      navigation.goBack();
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'already_member') {
        Alert.alert(t('inviteGroup.alreadyMemberTitle'), t('inviteGroup.alreadyMemberBody'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
        return;
      }
      Alert.alert(t('inviteGroup.sendFailedTitle'), apiErr.message || t('inviteGroup.sendFailedBody'));
    } finally {
      setSending(false);
    }
  };

  const footerBottom = Math.max(insets.bottom, 12);
  const heroMinHeight = 248 + insets.top;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={TEAM_SCREEN_BACKGROUND}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.52)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerBottom + 120 }}
      >
        <View style={[styles.hero, { minHeight: heroMinHeight, paddingTop: insets.top }]}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({ pressed }) => [styles.topBarSide, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <View style={styles.logoCenter}>
              <Logo size={28} showText />
            </View>
            <View style={styles.topBarSide} />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.inviteLine}>{t('inviteGroup.inviteName', { name })}</Text>
            <GradientPhrase text={t('inviteGroup.toAGroup')} />
            <Text style={styles.heroHint}>{t('inviteGroup.chooseGroup')}</Text>
          </View>
        </View>

        <View style={styles.listBlock}>
          {isLoading ? (
            <ActivityIndicator color={colors.brand.purple} style={{ marginTop: 24 }} />
          ) : invitableGroups.length === 0 ? (
            <Text style={styles.empty}>{t('inviteGroup.noInvitableGroups')}</Text>
          ) : (
            invitableGroups.map((g) => (
              <GroupPickCard
                key={g.id}
                group={g}
                selected={selectedId === g.id}
                onPress={() => setSelectedId(g.id)}
                gameName={gameName}
                gameId={user?.selectedGame ?? null}
                t={t}
              />
            ))
          )}

          <Pressable
            onPress={() => navigation.navigate('CreateGroup')}
            style={({ pressed }) => [styles.createRow, { opacity: pressed ? 0.9 : 1 }]}
          >
            <HexagonFrame size={44} accent="purple">
              <View style={styles.hexIcon}>
                <Ionicons name="add" size={22} color={colors.brand.purple} />
              </View>
            </HexagonFrame>
            <View style={styles.createText}>
              <Text style={styles.createTitle}>{t('inviteGroup.createTitle')}</Text>
              <Text style={styles.createBody}>
                {t('inviteGroup.createBody', { name })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.ink.disabled} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottom }]}>
        <Pressable
          onPress={onSend}
          disabled={!selectedId || sending}
          style={({ pressed }) => ({
            opacity: !selectedId || sending ? 0.45 : pressed ? 0.9 : 1,
          })}
        >
          <LinearGradient
            colors={[...gradient.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sendBtn}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.sendBtnText}>{t('inviteGroup.send')}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.ink.disabled} />
          <Text style={styles.secureText}>{t('inviteGroup.secure')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  hero: {
    marginHorizontal: 0,
    marginBottom: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 8,
    zIndex: 2,
  },
  topBarSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCenter: {
    flex: 1,
    alignItems: 'center',
  },
  heroTextBlock: {
    paddingBottom: 20,
    zIndex: 2,
  },
  inviteLine: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroHint: {
    color: colors.ink.secondary,
    fontSize: 13,
    marginTop: 8,
  },
  listBlock: {
    paddingHorizontal: 16,
    gap: 10,
  },
  groupCard: {
    borderRadius: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  groupCardGradient: {
    borderRadius: 16,
    padding: 2,
  },
  groupCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 14,
  },
  groupCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupCardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  groupCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  groupCardMetaText: {
    color: colors.ink.disabled,
    fontSize: 12,
  },
  groupCardGame: {
    color: colors.ink.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  gameIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.brand.blue,
    backgroundColor: colors.brand.blue,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  hexIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    flex: 1,
    minWidth: 0,
  },
  createTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  createBody: {
    color: colors.ink.disabled,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  empty: {
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  secureText: {
    color: colors.ink.disabled,
    fontSize: 11,
  },
});
