import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { BottomTabBar, type TabKey } from '../components/BottomTabBar';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../store/authStore';
import { fetchGames } from '../api/games';
import { colors, gradient } from '../theme/tokens';
import { getGameImage } from '../theme/assets';

const TAB_BAR_HEIGHT = 90;

interface StatProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}

function StatRowItem({ icon, iconColor, value, label }: StatProps) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={{ color: 'white', fontSize: 15, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      <Text
        style={{
          color: colors.ink.secondary,
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

interface OverviewProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
}

function OverviewTile({ icon, color, value, label }: OverviewProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 3,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(10, 10, 18, 0.75)',
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: colors.ink.secondary, fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

interface MenuProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  badge?: string | number;
  onPress?: () => void;
  isLast?: boolean;
}

function MenuRow({ icon, iconColor, label, badge, onPress, isLast }: MenuProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
      })}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${iconColor}22`,
          marginRight: 10,
        }}
      >
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', flex: 1 }}>{label}</Text>
      {badge !== undefined ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: 'rgba(255, 77, 166, 0.18)',
            borderWidth: 1,
            borderColor: 'rgba(255, 77, 166, 0.45)',
            marginRight: 10,
          }}
        >
          <Text style={{ color: '#FFA1C9', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.ink.secondary} />
    </Pressable>
  );
}

export function ProfileScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const activeGame = useMemo(
    () => games.find((g) => g.id === user?.selectedGame) ?? null,
    [games, user?.selectedGame],
  );

  const activeGameProfile = useMemo(
    () => user?.gameProfiles.find((p) => p.gameId === user?.selectedGame) ?? null,
    [user],
  );

  // Placeholder values until the backend tracks these.
  const level = 1;
  const xpCurrent = 0;
  const xpNext = 1000;
  const xpPercent = Math.min(100, (xpCurrent / xpNext) * 100);

  const tabs: Array<{
    key: TabKey;
    icon: 'home' | 'calendar' | 'people' | 'chatbubble' | 'person';
    label: string;
    onPress?: () => void;
  }> = [
    { key: 'home', icon: 'home', label: t('tabs.home'), onPress: () => navigation.navigate('Home') },
    { key: 'sessions', icon: 'calendar', label: t('tabs.sessions'), onPress: () => navigation.navigate('Home') },
    { key: 'matches', icon: 'people', label: t('tabs.matches') },
    { key: 'messages', icon: 'chatbubble', label: t('tabs.messages') },
    { key: 'profile', icon: 'person', label: t('tabs.profile') },
  ];

  return (
    <Screen padded={false}>
      {/* Top header */}
        <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Logo size={26} showText />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => void logout()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(10, 10, 18, 0.92)',
              opacity: pressed ? 0.85 : 1,
            })}
            accessibilityLabel={t('settings.logout')}
          >
            <Ionicons name="log-out-outline" size={18} color="white" />
          </Pressable>
          <Pressable
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(10, 10, 18, 0.92)',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="notifications-outline" size={18} color="white" />
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: '#FF4DA6',
                borderWidth: 1.5,
                borderColor: '#070710',
                paddingHorizontal: 3,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 8, fontWeight: '800' }}>3</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: TAB_BAR_HEIGHT + 16,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — avatar + name + level + XP bar + stats row */}
        <View>
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View>
              <Avatar uri={user?.photoUrl} name={user?.name} size={72} />
              <View
                style={{
                  position: 'absolute',
                  right: 4,
                  bottom: 4,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.status.success,
                  borderWidth: 2.5,
                  borderColor: '#070710',
                  shadowColor: colors.status.success,
                  shadowOpacity: 0.7,
                  shadowRadius: 6,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 20,
                    fontWeight: '800',
                    letterSpacing: -0.4,
                  }}
                  numberOfLines={1}
                >
                  {user?.name ?? t('common.player')}
                </Text>
                <Ionicons name="create-outline" size={16} color={colors.brand.purple} />
              </View>
              {/* Level + XP bar */}
              <View style={{ marginTop: 5 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <LinearGradient
                    colors={['rgba(123,63,242,0.5)', 'rgba(0,209,255,0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'rgba(123,63,242,0.6)',
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: '800',
                        fontSize: 11,
                        letterSpacing: 0.3,
                      }}
                    >
                      {t('profile.level', { level })}
                    </Text>
                  </LinearGradient>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 11,
                      fontWeight: '600',
                    }}
                  >
                    {t('profile.xpProgress', { current: xpCurrent.toLocaleString(), total: xpNext.toLocaleString() })}
                  </Text>
                </View>
                <View
                  style={{
                    marginTop: 4,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.10)',
                    overflow: 'hidden',
                  }}
                >
                  <LinearGradient
                    colors={gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: `${Math.max(2, xpPercent)}%`,
                      height: '100%',
                      borderRadius: 999,
                    }}
                  />
                </View>
              </View>
            </View>
          </Pressable>

          {/* 4-up stats row (Rating, Matches, Wins, Win Rate) */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: 10,
              paddingVertical: 4,
            }}
          >
            <StatRowItem icon="star" iconColor="#FFD23F" value="0" label={t('profile.statRating')} />
            <StatRowItem icon="trophy" iconColor="#FF4DA6" value="0" label={t('profile.statMatches')} />
            <StatRowItem icon="ribbon" iconColor="#00D1FF" value="0" label={t('profile.statWins')} />
            <StatRowItem icon="flame" iconColor="#FF8A4D" value="0%" label={t('profile.statWinRate')} />
          </View>
        </View>

        {/* Active Game card */}
        <Card
          variant="dark"
          padding={12}
          radius={18}
          onPress={
            activeGame
              ? () => navigation.navigate('EditGameProfile', { gameId: activeGame.id })
              : undefined
          }
        >
          <Text
            style={{
              color: colors.brand.pink,
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {t('profile.activeGameSection')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#1A1230',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.10)',
              }}
            >
              {activeGame && getGameImage(activeGame.id) ? (
                <Image
                  source={getGameImage(activeGame.id)!}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="flame" size={26} color="white" />
                </LinearGradient>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>
                  {activeGame?.name ?? t('profile.noGameSelected')}
                </Text>
                {activeGameProfile ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(0,200,83,0.18)',
                      borderColor: 'rgba(0,200,83,0.5)',
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ color: '#7CECA1', fontSize: 10, fontWeight: '800' }}>
                      {t('profile.connected')}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 11,
                      fontWeight: '600',
                      width: 64,
                    }}
                  >
                    {t('profile.fieldNickname')}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {activeGameProfile?.nickname ?? '—'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 11,
                      fontWeight: '600',
                      width: 64,
                    }}
                  >
                    {t('profile.fieldPlayerId')}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    {activeGameProfile?.playerId ?? '—'}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.ink.secondary} />
          </View>
        </Card>

        {/* Current Status */}
        <Card variant="dark" padding={12} radius={18}>
          <Text
            style={{
              color: colors.brand.pink,
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {t('profile.currentStatusSection')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.status.success,
                    shadowColor: colors.status.success,
                    shadowOpacity: 0.8,
                    shadowRadius: 6,
                  }}
                />
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{t('profile.statusOnline')}</Text>
              </View>
              <Text
                style={{ color: colors.ink.secondary, fontSize: 11, marginTop: 2, fontWeight: '500' }}
              >
                {t('profile.statusReady')}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 11,
                paddingVertical: 7,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: 'rgba(123,63,242,0.55)',
                backgroundColor: pressed ? 'rgba(123,63,242,0.18)' : 'rgba(123,63,242,0.10)',
              })}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{t('profile.setStatus')}</Text>
              <Ionicons name="create-outline" size={14} color={colors.brand.purple} />
            </Pressable>
          </View>
        </Card>

        {/* Stats Overview */}
        <Card variant="dark" padding={12} radius={18}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: colors.brand.pink,
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {t('profile.statsOverviewSection')}
            </Text>
            <Pressable hitSlop={6}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: colors.brand.purple, fontSize: 11, fontWeight: '700' }}>
                  {t('profile.viewAll')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.brand.purple} />
              </View>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <OverviewTile icon="game-controller" color="#FF4DA6" value="0" label={t('profile.statMatches')} />
            <OverviewTile icon="trophy" color="#00D1FF" value="0" label={t('profile.statWins')} />
            <OverviewTile icon="locate" color="#FF4DA6" value="0%" label={t('profile.statWinRate')} />
            <OverviewTile icon="people" color="#7B3FF2" value="0" label={t('profile.statFriends')} />
          </View>
        </Card>

        {/* Menu list */}
        <Card variant="dark" padding={0} radius={18}>
          <View>
            <MenuRow
              icon="people-outline"
              iconColor="#00D1FF"
              label={t('profile.menuFriends')}
              badge={0}
            />
            <MenuRow icon="shield-checkmark-outline" iconColor="#FF4DA6" label={t('profile.menuPrivacy')} />
            <MenuRow icon="notifications-outline" iconColor="#FFC44D" label={t('profile.menuNotifications')} />
            <MenuRow
              icon="help-circle-outline"
              iconColor="#7B3FF2"
              label={t('profile.menuHelp')}
              isLast
            />
          </View>
        </Card>

        {/* Hide unused vars from TS */}
        <View style={{ display: 'none' }}>
          <Text>{t('common.appName')}</Text>
        </View>
      </ScrollView>

      <BottomTabBar active="profile" tabs={tabs} />
    </Screen>
  );
}
