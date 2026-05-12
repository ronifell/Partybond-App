import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { LoginBackground } from '../components/ui/LoginBackground';
import { LanguagePill } from '../components/ui/LanguagePill';
import { OAuthButton } from '../components/ui/OAuthButton';
import { WordmarkPartybond } from '../components/ui/WordmarkPartybond';
import { login } from '../api/auth';
import { useAuth } from '../store/authStore';
import { getApiError } from '../api/client';
import { colors, gradient } from '../theme/tokens';
import { APP_LOGO } from '../theme/assets';

export function LoginScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), password);
      await setSession(res.token, res.user);
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'invalid_credentials') {
        setError(t('auth.errors.invalidCredentials'));
      } else {
        setError(apiErr.message || t('auth.errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const showSoon = (label: string) =>
    Alert.alert(label, t('common.comingSoonMessage'));

  return (
    <View style={{ flex: 1, backgroundColor: '#070710' }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <LoginBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top bar — language pill on the right */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                paddingTop: 4,
                marginBottom: 4,
              }}
            >
              <LanguagePill />
            </View>

            {/* Hero: logo + gradient wordmark + tagline */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
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
                }}
              >
                {t('auth.loginTagline')}{' '}
                <Text style={{ color: colors.brand.pink, fontWeight: '700' }}>{t('auth.loginTaglineHighlight')}</Text>
              </Text>
            </View>

            {/* Welcome */}
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.3,
                }}
              >
                {t('auth.loginTitle')}
              </Text>
              <Text
                style={{
                  color: colors.ink.secondary,
                  marginTop: 4,
                  fontSize: 13,
                }}
              >
                {t('auth.loginSubtitle')}
              </Text>
            </View>

            {/* Inputs */}
            <View style={{ gap: 12 }}>
              <Input
                label={t('auth.emailOrUsername')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder={t('auth.emailOrUsernamePlaceholder')}
                leftIcon={<Ionicons name="person-outline" size={20} color={colors.brand.purple} />}
              />
              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                passwordToggle
                placeholder={t('auth.passwordPlaceholder')}
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={20} color={colors.brand.purple} />
                }
              />
              <Pressable
                onPress={() => showSoon(t('auth.forgotPassword'))}
                style={({ pressed }) => ({
                  alignSelf: 'flex-end',
                  opacity: pressed ? 0.6 : 1,
                  marginTop: -4,
                })}
              >
                <Text style={{ color: colors.brand.pink, fontWeight: '700', fontSize: 13 }}>
                  {t('auth.forgotPassword')}
                </Text>
              </Pressable>
              {error ? (
                <Text style={{ color: colors.status.error, fontSize: 13, fontWeight: '600' }}>
                  {error}
                </Text>
              ) : null}
            </View>

            {/* CTA */}
            <View style={{ marginTop: 14 }}>
              <GradientButton title={t('auth.logIn')} onPress={onSubmit} loading={loading} />
            </View>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 16,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.14)' }} />
              <Text
                style={{
                  color: colors.ink.secondary,
                  fontSize: 12,
                  fontWeight: '500',
                  letterSpacing: 0.4,
                }}
              >
                {t('auth.oauthDivider')}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.14)' }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <OAuthButton
                provider="google"
                half
                onPress={() => showSoon(t('auth.oauthGoogle'))}
              />
              <OAuthButton
                provider="apple"
                half
                onPress={() => showSoon(t('auth.oauthApple'))}
              />
            </View>

            {/* Sign up link */}
            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={({ pressed }) => ({ marginTop: 16, opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={{ color: colors.ink.secondary, textAlign: 'center', fontSize: 14 }}>
                {t('auth.noAccount')}{' '}
                <Text style={{ color: colors.brand.pink, fontWeight: '800' }}>{t('auth.signUp')}</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
