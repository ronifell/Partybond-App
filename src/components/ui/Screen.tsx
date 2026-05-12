import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppBackground } from './AppBackground';
import { ArenaBackground } from './ArenaBackground';
import { LoginBackground } from './LoginBackground';
import { APP_BACKGROUND_IMAGE } from '../../theme/appBackground';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  keyboard?: boolean;
  /** Set to false on a screen if you don't want the global background. */
  background?: boolean;
  /**
   * When true, use the auth hero background (`background.png`) instead of the
   * post-login app background from `appBackground.ts`.
   */
  authBackground?: boolean;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  keyboard = false,
  background = true,
  authBackground = false,
}: Props) {
  const inner = padded ? <View className="px-5 pt-2 pb-8 flex-1">{children}</View> : children;

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  ) : (
    inner
  );

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="light" translucent backgroundColor="transparent" />
      {background ? (
        authBackground ? (
          <LoginBackground />
        ) : APP_BACKGROUND_IMAGE ? (
          <AppBackground />
        ) : (
          <ArenaBackground />
        )
      ) : null}
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {keyboard ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
          >
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </SafeAreaView>
    </View>
  );
}
