import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/tokens';

interface Props {
  value: string;
  onChange: (code: string) => void;
  length?: number;
}

export function VerificationCodeInput({ value, onChange, length = 6 }: Props) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const setCode = (raw: string) => {
    onChange(raw.replace(/\D/g, '').slice(0, length));
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.wrap}>
      <View style={styles.row}>
        {Array.from({ length }, (_, i) => {
          const digit = value[i] ?? '';
          const active = value.length === i;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                digit ? styles.cellFilled : null,
                active ? styles.cellActive : null,
              ]}
            >
              <Text style={styles.digit}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={setCode}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cell: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 63, 242, 0.55)',
    backgroundColor: '#11091F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: colors.brand.purple,
    backgroundColor: '#1A0F2E',
  },
  cellActive: {
    borderColor: colors.brand.pink,
    shadowColor: colors.brand.purple,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  digit: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
