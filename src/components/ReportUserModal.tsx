import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { getApiError } from '../api/client';
import {
  MAX_REPORT_ATTACHMENTS,
  REPORT_CATEGORIES,
  reportUser,
  type ReportAttachmentMeta,
  type ReportCategory,
} from '../api/social';
import { Input } from './ui/Input';
import { GradientButton } from './ui/GradientButton';
import { colors, gradient } from '../theme/tokens';

const MODAL_RADIUS_OUTER = 24;
const MODAL_RADIUS_INNER = 22;
const THUMB_SIZE = 76;

interface Props {
  visible: boolean;
  reportedId: string;
  reportedName: string;
  onClose: () => void;
}

export function ReportUserModal({ visible, reportedId, reportedName, onClose }: Props) {
  const { t } = useTranslation();
  const { height: winH } = useWindowDimensions();
  const [category, setCategory] = useState<ReportCategory>('other');
  const [details, setDetails] = useState('');
  const [images, setImages] = useState<ReportAttachmentMeta[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCategory('other');
      setDetails('');
      setImages([]);
      setSubmitting(false);
    }
  }, [visible]);

  const pickImages = async () => {
    if (images.length >= MAX_REPORT_ATTACHMENTS) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('moderation.reportTitle'), t('moderation.imagesPermissionDenied'));
      return;
    }

    const remaining = MAX_REPORT_ATTACHMENTS - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (result.canceled || !result.assets.length) return;

    const picked = result.assets.slice(0, remaining).map((asset) => ({
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      fileName: asset.fileName ?? null,
    }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_REPORT_ATTACHMENTS));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await reportUser(
        reportedId,
        category,
        details.trim() || undefined,
        images.length ? images : undefined,
      );
      onClose();
      Alert.alert(t('moderation.reportTitle'), t('moderation.reportSuccess'));
    } catch (err) {
      Alert.alert(t('moderation.reportTitle'), getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(4, 4, 10, 0.88)',
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: winH * 0.9 }}>
          <LinearGradient
            colors={gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: MODAL_RADIUS_OUTER,
              padding: 2,
            }}
          >
            <View
              style={{
                borderRadius: MODAL_RADIUS_INNER,
                backgroundColor: '#070710',
                maxHeight: winH * 0.9 - 4,
                overflow: 'hidden',
              }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 4 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingHorizontal: 16,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,77,166,0.18)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(255,77,166,0.45)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="flag" size={18} color={colors.brand.pink} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                    <Text
                      style={{
                        color: colors.ink.primary,
                        fontSize: 18,
                        fontWeight: '800',
                        letterSpacing: -0.3,
                      }}
                    >
                      {t('moderation.reportTitle')}
                    </Text>
                    <Text
                      style={{
                        color: colors.ink.secondary,
                        fontSize: 12,
                        lineHeight: 16,
                        marginTop: 4,
                        fontWeight: '500',
                      }}
                    >
                      {t('moderation.reportModalSubtitle', { name: reportedName })}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onClose}
                    hitSlop={10}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons name="close" size={18} color={colors.ink.secondary} />
                  </Pressable>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                  <Text
                    style={{
                      color: 'rgba(197, 168, 255, 0.95)',
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    {t('moderation.reasonLabel')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {REPORT_CATEGORIES.map((reason) => {
                      const selected = category === reason;
                      return (
                        <Pressable
                          key={reason}
                          onPress={() => setCategory(reason)}
                          style={({ pressed }) => ({
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 999,
                            borderWidth: selected ? 2 : 1.5,
                            borderColor: selected ? colors.brand.purple : 'rgba(255,255,255,0.12)',
                            backgroundColor: selected ? 'rgba(123,63,242,0.14)' : 'rgba(255,255,255,0.04)',
                            opacity: pressed ? 0.9 : 1,
                          })}
                        >
                          <Text
                            style={{
                              color: colors.ink.primary,
                              fontSize: 13,
                              fontWeight: '700',
                            }}
                          >
                            {t(`moderation.reason.${reason}`)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                  <Input
                    label={t('moderation.descriptionLabel')}
                    placeholder={t('moderation.descriptionPlaceholder')}
                    hint={t('moderation.descriptionHint')}
                    value={details}
                    onChangeText={setDetails}
                    multiline
                    maxLength={2000}
                  />
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                  <Text
                    style={{
                      color: 'rgba(197, 168, 255, 0.95)',
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {t('moderation.imagesLabel')}
                  </Text>
                  <Text
                    style={{
                      color: colors.ink.secondary,
                      fontSize: 11,
                      lineHeight: 15,
                      fontWeight: '500',
                      marginBottom: 10,
                    }}
                  >
                    {t('moderation.imagesHint')}
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {images.map((image, index) => (
                      <View
                        key={`${image.uri}-${index}`}
                        style={{
                          width: THUMB_SIZE,
                          height: THUMB_SIZE,
                          borderRadius: 12,
                          overflow: 'hidden',
                          borderWidth: 1.5,
                          borderColor: 'rgba(255,255,255,0.12)',
                        }}
                      >
                        <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} />
                        <Pressable
                          onPress={() => removeImage(index)}
                          hitSlop={6}
                          style={({ pressed }) => ({
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: 'rgba(4, 4, 10, 0.82)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.18)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </Pressable>
                      </View>
                    ))}

                    {images.length < MAX_REPORT_ATTACHMENTS ? (
                      <Pressable
                        onPress={() => void pickImages()}
                        style={({ pressed }) => ({
                          width: THUMB_SIZE,
                          height: THUMB_SIZE,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderStyle: 'dashed',
                          borderColor: 'rgba(123,63,242,0.55)',
                          backgroundColor: 'rgba(123,63,242,0.08)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.88 : 1,
                        })}
                      >
                        <Ionicons name="image-outline" size={22} color={colors.brand.purple} />
                        <Text
                          style={{
                            color: colors.brand.purple,
                            fontSize: 11,
                            fontWeight: '800',
                            marginTop: 4,
                          }}
                        >
                          {t('moderation.attach')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                  <GradientButton
                    size="md"
                    title={t('moderation.submitReport')}
                    loading={submitting}
                    onPress={() => void onSubmit()}
                    leftAdornment={<Ionicons name="send" size={18} color="#fff" />}
                  />
                </View>
              </ScrollView>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
