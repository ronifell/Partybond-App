import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export function OnboardingBackBar({ navigation }: Props) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={12}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 4,
        marginLeft: -4,
        marginBottom: 4,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name="chevron-back" size={28} color="white" />
    </Pressable>
  );
}
