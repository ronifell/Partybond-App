import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
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
import { WordmarkPartybond } from '../components/ui/WordmarkPartybond';
import { requestPasswordReset } from '../api/auth';
import { getApiError } from '../api/client';
import { colors, gradient } from '../theme/tokens';
import { APP_LOGO } from '../theme/assets';

export function ForgotPasswordScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const value = identifier.trim();
    if (value.length < 2) return;
    setLoading(true);
    try {
      await requestPasswordReset(value);
      setSent(true);
      navigation.navigate('ResetPassword', { identifier: value });
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'rate_limited') {
        Alert.alert(t('auth.forgot.rateLimitedTitle'), t('auth.forgot.rateLimitedBody'));
      } else {
        Alert.alert(t('auth.errors.generic'), apiErr.message || t('auth.errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <LoginBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={12}
                style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="chevron-back" size={26} color="#fff" />
              </Pressable>
              <LanguagePill />
            </View>

            <View style={styles.hero}>
              {APP_LOGO ? (
                <View style={styles.logoGlow}>
                  <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
                </View>
              ) : (
                <LinearGradient
                  colors={gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoFallback}
                >
                  <Text style={styles.logoFallbackText}>P</Text>
                </LinearGradient>
              )}
              <WordmarkPartybond size={30} letterSpacing={1.5} />
              <Text style={styles.tagline}>
                {t('auth.loginTagline')}{' '}
                <Text style={styles.taglineHighlight}>{t('auth.loginTaglineHighlight')}</Text>
              </Text>
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.title}>{t('auth.forgot.title')}</Text>
              <Text style={styles.subtitle}>{t('auth.forgot.subtitle')}</Text>
            </View>

            <Input
              label={t('auth.emailOrUsername')}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoComplete="username"
              placeholder={t('auth.emailOrUsernamePlaceholder')}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.brand.purple} />}
            />

            <View style={styles.cta}>
              <GradientButton
                title={sent ? t('auth.forgot.continue') : t('auth.forgot.send')}
                onPress={
                  sent
                    ? () => navigation.navigate('ResetPassword', { identifier: identifier.trim() })
                    : onSubmit
                }
                loading={loading}
                disabled={identifier.trim().length < 2}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.forgot.remember')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={styles.loginLink}>{t('auth.logIn')}</Text>
            </Pressable>

            <View style={styles.secureCard}>
              <LinearGradient
                colors={['rgba(123,63,242,0.35)', 'rgba(255,77,166,0.25)', 'rgba(0,209,255,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.secureBorder}
              >
                <View style={styles.secureInner}>
                  <View style={styles.secureIcon}>
                    <Ionicons name="shield-checkmark-outline" size={22} color={colors.brand.purple} />
                  </View>
                  <View style={styles.secureText}>
                    <Text style={styles.secureTitle}>{t('auth.forgot.secureTitle')}</Text>
                    <Text style={styles.secureBody}>{t('auth.forgot.secureBody')}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070710',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    shadowColor: '#7B3FF2',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    marginBottom: 10,
  },
  logo: {
    width: 90,
    height: 90,
  },
  logoFallback: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoFallbackText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
  },
  tagline: {
    color: colors.ink.secondary,
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  taglineHighlight: {
    color: colors.brand.blue,
    fontWeight: '700',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.ink.secondary,
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cta: {
    marginTop: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dividerText: {
    color: colors.ink.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  loginLink: {
    color: colors.brand.pink,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  secureCard: {
    marginTop: 24,
  },
  secureBorder: {
    borderRadius: 16,
    padding: 1.5,
  },
  secureInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(17, 9, 31, 0.92)',
    borderRadius: 14.5,
    padding: 14,
  },
  secureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 63, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureText: {
    flex: 1,
    minWidth: 0,
  },
  secureTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  secureBody: {
    color: colors.ink.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
