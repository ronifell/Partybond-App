import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Localization from 'expo-localization';
import * as Clipboard from 'expo-clipboard';

import { Screen } from '../components/ui/Screen';
import { Input } from '../components/ui/Input';
import { GradientButton } from '../components/ui/GradientButton';
import { Logo } from '../components/ui/Logo';
import { register } from '../api/auth';
import { getApiError } from '../api/client';
import { useAuth } from '../store/authStore';
import { MIN_USER_AGE, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../config/constants';
import { colors } from '../theme/tokens';
import { LegalConsentRow } from '../components/LegalConsentRow';
import { openLegalDocument } from '../utils/legal';

/** Invite codes are 8 base32-ish chars (server enforces). Loose client-side check. */
const INVITE_CODE_REGEX = /^[A-Z0-9]{6,16}$/;

function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}

export function RegisterScreen({ navigation }: NativeStackScreenProps<any>) {
  const { t, i18n } = useTranslation();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One-time clipboard probe — if the user copied an invite code from a chat,
  // offer it as a prefill. We do NOT silently auto-fill (privacy).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const has = await Clipboard.hasStringAsync();
        if (!has || cancelled) return;
        const raw = await Clipboard.getStringAsync();
        const candidate = normalizeInviteCode(raw ?? '');
        if (!cancelled && INVITE_CODE_REGEX.test(candidate)) {
          setInviteCode(candidate);
          setInviteOpen(true);
        }
      } catch {
        // Clipboard access may be denied; harmless.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async () => {
    setError(null);
    if (!acceptedTerms || !acceptedPrivacy) {
      setError(t('auth.errors.legalConsentRequired'));
      return;
    }
    const ageNum = Number(age);
    if (!email || !password || !name || !ageNum || ageNum < MIN_USER_AGE) {
      setError(t('auth.errors.ageTooYoung', { min: MIN_USER_AGE }));
      return;
    }
    setLoading(true);
    try {
      const locale = i18n.language || Localization.getLocales()[0]?.languageCode || 'en';
      const normalizedInvite = inviteCode ? normalizeInviteCode(inviteCode) : '';
      const res = await register({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        age: ageNum,
        locale,
        inviteCode: normalizedInvite || undefined,
      });
      await setSession(res.token, res.user);
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr.code === 'email_in_use') setError(t('auth.errors.emailInUse'));
      else setError(apiErr.message || t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard padded={false} authBackground>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: 'center',
          paddingVertical: 32,
          minHeight: 760,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Logo size={52} />
        </View>

        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Text
            style={{
              color: 'white',
              fontSize: 30,
              fontWeight: '800',
              letterSpacing: -0.5,
              textAlign: 'center',
            }}
          >
            {t('auth.registerTitle')}
          </Text>
          <Text
            style={{
              color: colors.ink.secondary,
              marginTop: 8,
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            {t('auth.registerSubtitle')}
          </Text>
        </View>

        <View style={{ gap: 16, marginBottom: 24 }}>
          <Input
            label={t('auth.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('auth.namePlaceholder')}
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.brand.purple} />}
          />
          <Input
            label={t('auth.age')}
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder={t('auth.agePlaceholder')}
            leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.brand.purple} />}
          />
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={t('auth.emailPlaceholder')}
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.brand.purple} />}
          />
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t('auth.passwordHint')}
            leftIcon={
              <Ionicons name="lock-closed-outline" size={20} color={colors.brand.purple} />
            }
          />

          {inviteOpen ? (
            <Input
              label={t('auth.inviteCode')}
              value={inviteCode}
              onChangeText={(v) => setInviteCode(normalizeInviteCode(v))}
              autoCapitalize="characters"
              placeholder={t('auth.inviteCodePlaceholder')}
              leftIcon={<Ionicons name="gift-outline" size={20} color={colors.brand.pink} />}
            />
          ) : (
            <Pressable
              onPress={() => setInviteOpen(true)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="gift-outline" size={14} color={colors.brand.pink} />
              <Text style={{ color: colors.brand.pink, fontSize: 13, fontWeight: '700' }}>
                {t('auth.haveInviteCode')}
              </Text>
            </Pressable>
          )}

          {error ? (
            <Text style={{ color: colors.status.error, fontSize: 13, fontWeight: '600' }}>
              {error}
            </Text>
          ) : null}

          <View style={{ gap: 12, marginTop: 4 }}>
            <LegalConsentRow
              checked={acceptedTerms}
              onToggle={() => setAcceptedTerms((v) => !v)}
              prefix={t('auth.legal.acceptTermsPrefix')}
              linkLabel={t('auth.legal.termsLink')}
              suffix={t('auth.legal.acceptTermsSuffix')}
              onOpenLink={() => void openLegalDocument(TERMS_OF_USE_URL)}
            />
            <LegalConsentRow
              checked={acceptedPrivacy}
              onToggle={() => setAcceptedPrivacy((v) => !v)}
              prefix={t('auth.legal.acceptPrivacyPrefix')}
              linkLabel={t('auth.legal.privacyLink')}
              suffix={t('auth.legal.acceptPrivacySuffix')}
              onOpenLink={() => void openLegalDocument(PRIVACY_POLICY_URL)}
            />
          </View>
        </View>

        <GradientButton
          title={t('auth.register')}
          onPress={onSubmit}
          loading={loading}
          disabled={!acceptedTerms || !acceptedPrivacy}
          leftAdornment={<Ionicons name="flash" size={18} color="white" />}
        />

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({ marginTop: 24, opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: colors.ink.secondary, textAlign: 'center', fontSize: 14 }}>
            {t('auth.hasAccount')}{' '}
            <Text style={{ color: colors.brand.blue, fontWeight: '700' }}>
              {t('auth.signIn')}
            </Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
