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
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { LoginBackground } from '../components/ui/LoginBackground';
import { LanguagePill } from '../components/ui/LanguagePill';
import { WordmarkPartybond } from '../components/ui/WordmarkPartybond';
import { VerificationCodeInput } from '../components/ui/VerificationCodeInput';
import { requestPasswordReset, resetPassword } from '../api/auth';
import { getApiError } from '../api/client';
import { colors } from '../theme/tokens';
import { APP_LOGO } from '../theme/assets';

export function ResetPasswordScreen({ navigation, route }: NativeStackScreenProps<any>) {
  const { t } = useTranslation();
  const identifier = (route.params as { identifier?: string })?.identifier ?? '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onResend = async () => {
    if (!identifier.trim()) return;
    setResending(true);
    try {
      await requestPasswordReset(identifier.trim());
      Alert.alert(t('auth.forgot.sentTitle'), t('auth.forgot.codeSentBody'));
    } catch (err) {
      const apiErr = getApiError(err);
      Alert.alert(t('auth.errors.generic'), apiErr.message || t('auth.errors.generic'));
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async () => {
    if (code.length !== 6) {
      Alert.alert(t('auth.reset.codeIncompleteTitle'), t('auth.reset.codeIncompleteBody'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('auth.reset.tooShortTitle'), t('auth.reset.tooShortBody'));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t('auth.reset.mismatchTitle'), t('auth.reset.mismatchBody'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(identifier.trim(), code, password);
      Alert.alert(t('auth.reset.successTitle'), t('auth.reset.successBody'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'invalid_reset_code') {
        Alert.alert(t('auth.reset.invalidCodeTitle'), t('auth.reset.invalidCodeBody'));
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
              ) : null}
              <WordmarkPartybond size={28} letterSpacing={1.5} />
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.title}>{t('auth.reset.verifyTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.reset.verifySubtitle')}</Text>
            </View>

            <VerificationCodeInput value={code} onChange={setCode} />

            <Pressable
              onPress={onResend}
              disabled={resending || !identifier}
              style={({ pressed }) => ({
                marginTop: 16,
                opacity: resending || !identifier ? 0.5 : pressed ? 0.7 : 1,
              })}
            >
              <Text style={styles.resend}>
                {resending ? t('common.loading') : t('auth.reset.resendCode')}
              </Text>
            </Pressable>

            <View style={[styles.passwordBlock, { gap: 12 }]}>
              <Input
                label={t('auth.reset.newPassword')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                passwordToggle
                placeholder={t('auth.passwordPlaceholder')}
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={20} color={colors.brand.purple} />
                }
              />
              <Input
                label={t('auth.reset.confirmPassword')}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                passwordToggle
                placeholder={t('auth.reset.confirmPlaceholder')}
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={20} color={colors.brand.purple} />
                }
              />
            </View>

            <View style={styles.cta}>
              <GradientButton
                title={t('auth.reset.submit')}
                onPress={onSubmit}
                loading={loading}
                disabled={code.length !== 6 || password.length < 6}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070710' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginBottom: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 16 },
  logoGlow: {
    shadowColor: '#7B3FF2',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    marginBottom: 10,
  },
  logo: { width: 72, height: 72 },
  formHeader: { alignItems: 'center', marginBottom: 24 },
  title: {
    color: '#fff',
    fontSize: 22,
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
  resend: {
    color: colors.brand.pink,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  passwordBlock: {
    marginTop: 24,
  },
  cta: { marginTop: 18 },
});
