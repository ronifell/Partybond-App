import React, { useState } from 'react';
import { Pressable, View, Text, Modal, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/tokens';

const LANGS: Array<{ code: 'en' | 'pt'; label: string; short: string }> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt', label: 'Português', short: 'PT' },
];

/**
 * Compact language switcher pill. Shows current language code (e.g. "EN ▾"),
 * opens a small popover when tapped.
 */
export function LanguagePill() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.22)',
          backgroundColor: 'rgba(10, 10, 18, 0.92)',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Ionicons name="globe-outline" size={14} color="white" />
        <Text style={{ color: 'white', fontWeight: '700', fontSize: 13, letterSpacing: 0.4 }}>
          {current.short}
        </Text>
        <Ionicons name="chevron-down" size={12} color="white" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              borderRadius: 18,
              overflow: 'hidden',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.18)',
              minWidth: 220,
            }}
          >
            <BlurView
              intensity={Platform.OS === 'android' ? 90 : 50}
              tint="dark"
              style={{ borderRadius: 18 }}
            >
              <View style={{ backgroundColor: 'rgba(10, 10, 18, 0.95)' }}>
                {LANGS.map((l, i) => {
                  const selected = l.code === i18n.language;
                  return (
                    <Pressable
                      key={l.code}
                      onPress={async () => {
                        await i18n.changeLanguage(l.code);
                        setOpen(false);
                      }}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 18,
                        paddingVertical: 16,
                        borderBottomWidth: i < LANGS.length - 1 ? 1 : 0,
                        borderBottomColor: 'rgba(255,255,255,0.10)',
                        backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'transparent',
                      })}
                    >
                      <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
                        {l.label}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={colors.brand.purple} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </BlurView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
