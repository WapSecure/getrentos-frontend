import { router } from 'expo-router';
import { Bell, MessageCircle, Trash2, UserRound } from '@sureground/icons/native';
import type { SettingsItem } from './SettingsList';

export const editProfileItem: SettingsItem = {
  key: 'profile',
  label: 'Edit profile',
  description: 'Name, contact details, photo',
  icon: UserRound,
  onPress: () => router.push('/(app)/edit-profile'),
};

export const notificationSettingsItem: SettingsItem = {
  key: 'notifications',
  label: 'Notifications',
  description: 'Email, push and in-app',
  icon: Bell,
  onPress: () => router.push('/(app)/notification-settings'),
};

export const textMessagesItem: SettingsItem = {
  key: 'text-messages',
  label: 'Text messages',
  description: 'SMS or WhatsApp for urgent alerts',
  icon: MessageCircle,
  onPress: () => router.push('/(app)/whatsapp-settings'),
};

export const deleteAccountItem: SettingsItem = {
  key: 'delete-account',
  label: 'Delete account',
  description: 'Permanently remove your account and data',
  icon: Trash2,
  onPress: () => router.push('/(app)/delete-account'),
};
