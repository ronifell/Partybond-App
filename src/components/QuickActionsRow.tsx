import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export type QuickActionAccent = {
  border: string;
  shadow: string;
};

/** Distinct border colors — index matches action order on Home. */
export const QUICK_ACTION_ACCENTS: readonly QuickActionAccent[] = [
  { border: 'rgba(255, 77, 166, 0.7)', shadow: '#FF4DA6' },
  { border: 'rgba(14, 165, 233, 0.7)', shadow: '#0EA5E9' },
  { border: 'rgba(168, 85, 247, 0.7)', shadow: '#A855F7' },
  { border: 'rgba(16, 185, 129, 0.7)', shadow: '#10B981' },
] as const;

interface Action {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  accent?: QuickActionAccent;
  /** @deprecated Ignored — tiles share one background; borders vary by index. */
  primary?: boolean;
}

interface Props {
  actions: ReadonlyArray<Action>;
}

export function QuickActionsRow({ actions }: Props) {
  return (
    <View style={styles.row}>
      {actions.map((a, i) => (
        <ActionTile key={`${a.label}-${i}`} action={a} index={i} />
      ))}
    </View>
  );
}

function ActionTile({ action, index }: { action: Action; index: number }) {
  const accent = action.accent ?? QUICK_ACTION_ACCENTS[index % QUICK_ACTION_ACCENTS.length]!;

  return (
    <Pressable
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          borderColor: accent.border,
          shadowColor: accent.shadow,
        },
        pressed && styles.tilePressed,
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 18}
        tint="dark"
        style={styles.blur}
      >
        <View style={styles.inner}>
          <LinearGradient
            colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sheen}
            pointerEvents="none"
          />
          <View style={styles.content}>
            <Ionicons name={action.icon} size={22} color="white" />
            <Text style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tilePressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  blur: {
    borderRadius: 18,
  },
  inner: {
    backgroundColor: 'rgba(10, 10, 18, 0.92)',
    borderRadius: 18,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  content: {
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  label: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
