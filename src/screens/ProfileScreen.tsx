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
import { BottomTabBar, useBottomTabBarHeight } from '../components/BottomTabBar';
import { useMainTabs } from '../hooks/useMainTabs';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../store/authStore';
import { fetchGames } from '../api/games';
import { colors, gradient } from '../theme/tokens';
import { ProfileGameListRow } from '../components/ProfileGameListRow';

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
  const tabs = useMainTabs(navigation, 'profile');
  const tabBarHeight = useBottomTabBarHeight();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });

  const activeGamesList = useMemo(() => games.filter((g) => g.status === 'active'), [games]);

  // Placeholder values until the backend tracks these.
  const level = 1;
  const xpCurrent = 0;
  const xpNext = 1000;
  const xpPercent = Math.min(100, (xpCurrent / xpNext) * 100);

  return (
    <Screen padded={false}>
      {/* Top header */}
        <View
        style={{
          paddingHorizontal: 8,
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
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: tabBarHeight + 16,
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
            <View style={{ flex: 1, minWidth: 0 }}>
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
                {user?.isPremium ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: 'rgba(255,210,63,0.18)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,210,63,0.5)',
                    }}
                  >
                    <Ionicons name="star" size={10} color="#FFD23F" />
                    <Text style={{ color: '#FFD23F', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>
                      {t('profile.premiumBadge')}
                    </Text>
                  </View>
                ) : null}
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

          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            hitSlop={8}
            style={({ pressed }) => ({
              marginTop: 8,
              marginLeft: 2,
              alignSelf: 'flex-start',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                color: colors.brand.purple,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              Click here to enter what you are looking for
            </Text>
          </Pressable>

          {user?.lookingFor ? (
            <View
              style={{
                marginTop: 12,
                marginLeft: 2,
                maxWidth: '100%',
                alignSelf: 'flex-start',
              }}
            >
              <View
                style={{
                  transform: [{ rotateZ: '-6deg' }],
                }}
              >
                <Text
                  style={{
                    color: 'rgba(232, 220, 255, 0.95)',
                    fontSize: 13,
                    fontWeight: '700',
                    fontStyle: 'italic',
                    lineHeight: 19,
                    letterSpacing: 0.25,
                  }}
                >
                  {user.lookingFor}
                </Text>
              </View>
            </View>
          ) : null}

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

        {/* Active games — parallelogram rows; tap to edit that game's profile */}
        <Card
          variant="dark"
          padding={10}
          radius={18}
          style={{
            borderTopWidth: 2,
            borderTopColor: 'rgba(123, 63, 242, 0.65)',
            shadowColor: '#7B3FF2',
            shadowOpacity: 0.2,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: -2 },
          }}
        >
          <Text
            style={{
              color: colors.brand.pink,
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {t('profile.yourGamesSection')}
          </Text>
          <Text
            style={{
              color: colors.ink.secondary,
              fontSize: 11,
              fontWeight: '500',
              marginBottom: 8,
              lineHeight: 15,
            }}
          >
            {t('profile.yourGamesHint')}
          </Text>
          {activeGamesList.length === 0 ? (
            <Text style={{ color: colors.ink.secondary, fontSize: 13 }}>{t('profile.noGameSelected')}</Text>
          ) : (
            <View style={{ gap: 6, marginHorizontal: -2 }}>
              {activeGamesList.map((game) => (
                <ProfileGameListRow
                  key={game.id}
                  game={game}
                  gameProfile={user?.gameProfiles.find((p) => p.gameId === game.id) ?? null}
                  isDefault={user?.selectedGame === game.id}
                  onPress={() => navigation.navigate('EditGameProfile', { gameId: game.id })}
                />
              ))}
            </View>
          )}
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
              icon={user?.isPremium ? 'star' : 'star-outline'}
              iconColor="#FFD23F"
              label={
                user?.isPremium
                  ? t('profile.menuPremiumActive')
                  : t('profile.menuPremiumUpgrade')
              }
              badge={user?.isPremium ? t('profile.menuPremiumBadge') : undefined}
              onPress={() => navigation.navigate('Premium')}
            />
            <MenuRow
              icon="gift-outline"
              iconColor="#FF4DA6"
              label={t('profile.menuInviteFriends')}
              onPress={() => navigation.navigate('InviteFriends')}
            />
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
      </ScrollView>

      <BottomTabBar active="profile" tabs={tabs} />
    </Screen>
  );
}
