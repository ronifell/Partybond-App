import { useTranslation } from 'react-i18next';
import type { NavigationProp } from '@react-navigation/native';
import type { TabKey } from '../components/BottomTabBar';

export function useMainTabs(navigation: NavigationProp<Record<string, unknown>>, active: TabKey) {
  const { t } = useTranslation();
  const go = (screen: string) => () => navigation.navigate(screen as never);
  return [
    { key: 'home' as const, icon: 'home' as const, label: t('tabs.home'), onPress: active === 'home' ? undefined : go('Home') },
    { key: 'matches' as const, icon: 'people' as const, label: t('tabs.recent'), onPress: active === 'matches' ? undefined : go('RecentPlayers') },
    { key: 'sessions' as const, icon: 'calendar' as const, label: t('tabs.groups'), onPress: active === 'sessions' ? undefined : go('Groups') },
    { key: 'messages' as const, icon: 'chatbubble' as const, label: t('tabs.messages'), onPress: active === 'messages' ? undefined : go('Chats') },
    { key: 'profile' as const, icon: 'person' as const, label: t('tabs.profile'), onPress: active === 'profile' ? undefined : go('Profile') },
  ];
}
