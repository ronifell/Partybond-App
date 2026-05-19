import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Modal,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Avatar } from '../components/ui/Avatar';
import { TeamScreenBackground } from '../components/ui/TeamScreenBackground';
import { GradientButton } from '../components/ui/GradientButton';
import { createGroup, fetchRecentPlayers } from '../api/social';
import { fetchGames } from '../api/games';
import { useAuth } from '../store/authStore';
import { getGameImage } from '../theme/assets';
import { colors, gradient } from '../theme/tokens';
import type { RecentPlayer } from '../api/types';

const PURE_BLACK = '#000000';
const INPUT_BG = '#14141C';
const INPUT_BORDER = 'rgba(255,255,255,0.08)';
const NAME_MAX = 24;
const DESC_MAX = 100;
const MAX_MEMBERS = 20;

type PlayerTab = 'recent' | 'friends';

function GroupPhotoPicker({
  uri,
  onPick,
  label,
}: {
  uri: string | null;
  onPick: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPick} style={styles.photoPickerOuter}>
      <LinearGradient
        colors={[...gradient.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.photoPickerRing}
      >
        <View style={styles.photoPickerInner}>
          {uri ? (
            <Image source={{ uri }} style={styles.photoPickerImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={22} color={colors.brand.purple} />
              <Text style={styles.photoPickerLabel}>{label}</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SelectablePlayerRow({
  player,
  selected,
  onToggle,
  t,
}: {
  player: RecentPlayer;
  selected: boolean;
  onToggle: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const gameImage = getGameImage(player.gameId);
  const online = player.isOnline;

  return (
    <View style={styles.playerRow}>
      <View style={styles.playerRowAvatar}>
        <Avatar uri={player.photoUrl} name={player.nickname} size={48} glow={false} />
        <View
          style={[
            styles.playerRowDot,
            { backgroundColor: online ? '#00E676' : '#5C5C6A' },
          ]}
        />
      </View>

      <View style={styles.playerRowInfo}>
        <Text style={styles.playerRowName} numberOfLines={1}>
          {player.nickname}
        </Text>
        <View style={styles.playerRowGame}>
          {gameImage ? (
            <Image source={gameImage} style={styles.playerRowGameIcon} />
          ) : (
            <Ionicons name="game-controller" size={12} color={colors.brand.blue} />
          )}
          <Text style={styles.playerRowGameName} numberOfLines={1}>
            {player.gameName}
          </Text>
          <View
            style={[
              styles.playerRowStatusDot,
              { backgroundColor: online ? '#00E676' : '#5C5C6A' },
            ]}
          />
          <Text style={styles.playerRowStatusText}>
            {online ? t('recent.online') : t('recent.offline')}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.addPlayerBtn,
          selected && styles.addPlayerBtnSelected,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons
          name={selected ? 'checkmark' : 'add'}
          size={20}
          color={selected ? '#fff' : colors.brand.purple}
        />
      </Pressable>
    </View>
  );
}

export function CreateGroupScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupPhotoUri, setGroupPhotoUri] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(user?.selectedGame ?? null);
  const [gamePickerOpen, setGamePickerOpen] = useState(false);
  const [playerTab, setPlayerTab] = useState<PlayerTab>('recent');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const { data: games = [] } = useQuery({ queryKey: ['games'], queryFn: fetchGames });
  const { data: recentPlayers = [] } = useQuery({
    queryKey: ['recent-players'],
    queryFn: fetchRecentPlayers,
  });

  const activeGames = useMemo(() => games.filter((g) => g.status === 'active'), [games]);

  const selectedGame = useMemo(
    () => activeGames.find((g) => g.id === selectedGameId) ?? activeGames[0],
    [activeGames, selectedGameId],
  );

  const filteredRecent = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recentPlayers;
    return recentPlayers.filter((p) => p.nickname.toLowerCase().includes(q));
  }, [recentPlayers, search]);

  const pickGroupPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setGroupPhotoUri(result.assets[0].uri);
    }
  };

  const togglePlayer = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else if (next.size < MAX_MEMBERS) next.add(userId);
      return next;
    });
  };

  const onCreate = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert(t('createGroup.title'), t('createGroup.nameTooShort'));
      return;
    }
    setCreating(true);
    try {
      const g = await createGroup(trimmed, [...selectedIds]);
      await qc.invalidateQueries({ queryKey: ['groups'] });
      navigation.replace('GroupDetail', { groupId: g.id, justCreated: true });
    } catch {
      Alert.alert(t('createGroup.title'), t('createGroup.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const footerBottom = Math.max(insets.bottom, 12);

  return (
    <TeamScreenBackground style={styles.root}>
      <StatusBar style="light" backgroundColor={PURE_BLACK} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [styles.headerIconBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('createGroup.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('createGroup.subtitle')}</Text>
          </View>
          <Pressable
            onPress={() => Alert.alert(t('createGroup.title'), t('createGroup.helpText'))}
            hitSlop={12}
            style={({ pressed }) => [styles.headerIconBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.ink.secondary} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={64}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: footerBottom + 88,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionLabel}>{t('createGroup.sectionInfo')}</Text>

            <View style={styles.groupInfoRow}>
              <GroupPhotoPicker
                uri={groupPhotoUri}
                onPick={pickGroupPhoto}
                label={t('createGroup.addPhoto')}
              />
              <View style={styles.groupInfoFields}>
                <Text style={styles.fieldLabel}>{t('createGroup.groupName')}</Text>
                <View style={styles.nameInputWrap}>
                  <TextInput
                    value={name}
                    onChangeText={(v) => setName(v.slice(0, NAME_MAX))}
                    placeholder={t('createGroup.groupNamePlaceholder')}
                    placeholderTextColor={colors.ink.disabled}
                    style={styles.textInput}
                  />
                  {name.length > 0 ? (
                    <Pressable onPress={() => setName('')} hitSlop={8}>
                      <Ionicons
                        name="remove-circle-outline"
                        size={20}
                        color={colors.ink.disabled}
                      />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.charCount}>
                  {t('createGroup.nameCount', { current: name.length, max: NAME_MAX })}
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t('createGroup.game')}</Text>
            <Pressable
              onPress={() => setGamePickerOpen(true)}
              style={({ pressed }) => [styles.gameSelect, { opacity: pressed ? 0.9 : 1 }]}
            >
              {selectedGame && getGameImage(selectedGame.id) ? (
                <Image source={getGameImage(selectedGame.id)!} style={styles.gameSelectIcon} />
              ) : (
                <Ionicons name="game-controller" size={18} color={colors.brand.blue} />
              )}
              <Text style={styles.gameSelectText}>
                {selectedGame?.name ?? t('createGroup.selectGame')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.ink.secondary} />
            </Pressable>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              {t('createGroup.descriptionLabel')}
            </Text>
            <View style={styles.descWrap}>
              <TextInput
                value={description}
                onChangeText={(v) => setDescription(v.slice(0, DESC_MAX))}
                placeholder={t('createGroup.descriptionPlaceholder')}
                placeholderTextColor={colors.ink.disabled}
                style={[styles.textInput, styles.descInput]}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.descCount}>
                {t('createGroup.descCount', { current: description.length, max: DESC_MAX })}
              </Text>
            </View>

            <View style={styles.playersSectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { marginTop: 22 }]}>
                  {t('createGroup.sectionPlayers')}
                </Text>
                <Text style={styles.playersHint}>{t('createGroup.playersHint')}</Text>
              </View>
              <Text style={styles.selectedCount}>
                {t('createGroup.selectedCount', {
                  count: selectedIds.size,
                  max: MAX_MEMBERS,
                })}
              </Text>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.ink.disabled} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('createGroup.searchPlaceholder')}
                placeholderTextColor={colors.ink.disabled}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.playerTabs}>
              <Pressable
                onPress={() => setPlayerTab('recent')}
                style={styles.playerTabBtn}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={playerTab === 'recent' ? colors.brand.purple : colors.ink.secondary}
                />
                <Text
                  style={[
                    styles.playerTabText,
                    playerTab === 'recent' && styles.playerTabTextActive,
                  ]}
                >
                  {t('createGroup.tabRecent')}
                </Text>
                {playerTab === 'recent' ? <View style={styles.playerTabUnderline} /> : null}
              </Pressable>
              <Pressable
                onPress={() => setPlayerTab('friends')}
                style={styles.playerTabBtn}
              >
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={playerTab === 'friends' ? colors.brand.purple : colors.ink.secondary}
                />
                <Text
                  style={[
                    styles.playerTabText,
                    playerTab === 'friends' && styles.playerTabTextActive,
                  ]}
                >
                  {t('createGroup.tabFriends')}
                </Text>
                {playerTab === 'friends' ? <View style={styles.playerTabUnderline} /> : null}
              </Pressable>
            </View>

            {playerTab === 'recent' ? (
              <View style={styles.playerList}>
                {filteredRecent.length === 0 ? (
                  <Text style={styles.emptyPlayers}>{t('createGroup.noRecentPlayers')}</Text>
                ) : (
                  filteredRecent.map((p) => (
                    <SelectablePlayerRow
                      key={p.userId}
                      player={p}
                      selected={selectedIds.has(p.userId)}
                      onToggle={() => togglePlayer(p.userId)}
                      t={t}
                    />
                  ))
                )}
              </View>
            ) : (
              <Text style={styles.emptyPlayers}>{t('createGroup.friendsEmpty')}</Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={[styles.footer, { paddingBottom: footerBottom }]}>
          <GradientButton
            title={t('createGroup.submit')}
            onPress={onCreate}
            loading={creating}
            disabled={name.trim().length < 2}
            size="lg"
            leftAdornment={<Ionicons name="people" size={20} color="#fff" />}
          />
        </View>
      </SafeAreaView>

      <Modal visible={gamePickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setGamePickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('createGroup.selectGame')}</Text>
            {activeGames.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => {
                  setSelectedGameId(g.id);
                  setGamePickerOpen(false);
                }}
                style={({ pressed }) => [
                  styles.modalGameRow,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                {getGameImage(g.id) ? (
                  <Image source={getGameImage(g.id)!} style={styles.gameSelectIcon} />
                ) : null}
                <Text style={styles.gameSelectText}>{g.name}</Text>
                {g.id === selectedGame?.id ? (
                  <Ionicons name="checkmark" size={20} color={colors.brand.purple} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </TeamScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.ink.secondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionLabel: {
    color: colors.brand.purple,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 12,
  },
  groupInfoRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  photoPickerOuter: {
    width: 88,
  },
  photoPickerRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 2,
  },
  photoPickerInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: '#0A0A12',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 4,
  },
  photoPickerImage: {
    width: '100%',
    height: '100%',
  },
  photoPickerLabel: {
    color: colors.ink.secondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  groupInfoFields: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    color: colors.ink.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  nameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 10,
  },
  charCount: {
    color: colors.ink.disabled,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  gameSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  gameSelectIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  gameSelectText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  descWrap: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 100,
  },
  descInput: {
    minHeight: 72,
    paddingVertical: 0,
  },
  descCount: {
    color: colors.ink.disabled,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  playersSectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  playersHint: {
    color: colors.ink.secondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  selectedCount: {
    color: colors.brand.purple,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 12,
    marginTop: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 10,
  },
  playerTabs: {
    flexDirection: 'row',
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  playerTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 10,
    position: 'relative',
  },
  playerTabText: {
    color: colors.ink.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  playerTabTextActive: {
    color: colors.brand.purple,
  },
  playerTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.brand.purple,
  },
  playerList: {
    marginTop: 12,
    gap: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  playerRowAvatar: {
    position: 'relative',
  },
  playerRowDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0D0D12',
  },
  playerRowInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  playerRowName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  playerRowGame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  playerRowGameIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  playerRowGameName: {
    color: colors.ink.secondary,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 100,
  },
  playerRowStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  playerRowStatusText: {
    color: colors.ink.disabled,
    fontSize: 11,
    fontWeight: '600',
  },
  addPlayerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  addPlayerBtnSelected: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.brand.purple,
  },
  emptyPlayers: {
    color: colors.ink.secondary,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 4,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
});
