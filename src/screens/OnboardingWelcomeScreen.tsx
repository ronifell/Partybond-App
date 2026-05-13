import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { OnboardingBackground } from '../components/ui/OnboardingBackground';
import { LanguagePill } from '../components/ui/LanguagePill';
import { WordmarkPartybond } from '../components/ui/WordmarkPartybond';
import { GradientButton } from '../components/ui/GradientButton';
import { colors, gradient } from '../theme/tokens';
import { APP_LOGO } from '../theme/assets';

export function OnboardingWelcomeScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: '#070710' }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingTop: 4,
              marginBottom: 8,
            }}
          >
            <LanguagePill />
          </View>

          <View
            style={{
              flex: 1,
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingTop: 8,
              paddingBottom: 16,
            }}
          >
            <View
              style={{
                alignItems: 'center',
                marginBottom: 28,
                marginTop: -20,
              }}
            >
              {APP_LOGO ? (
                <View
                  style={{
                    shadowColor: '#7B3FF2',
                    shadowOpacity: 0.6,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 14,
                    marginBottom: 10,
                  }}
                >
                  <Image source={APP_LOGO} style={{ width: 90, height: 90 }} resizeMode="contain" />
                </View>
              ) : (
                <LinearGradient
                  colors={gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    shadowColor: '#7B3FF2',
                    shadowOpacity: 0.6,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 14,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 48, fontWeight: '900' }}>P</Text>
                </LinearGradient>
              )}

              <WordmarkPartybond size={30} letterSpacing={1.5} />

              <Text
                style={{
                  color: colors.ink.secondary,
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: '500',
                  textAlign: 'center',
                  paddingHorizontal: 12,
                }}
              >
                {t('auth.loginTagline')}{' '}
                <Text style={{ color: colors.brand.pink, fontWeight: '700' }}>
                  {t('auth.loginTaglineHighlight')}
                </Text>
              </Text>
            </View>
          </View>

          <GradientButton
            title={t('onboarding.welcomeCta')}
            onPress={() => navigation.navigate('OnboardingName')}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
