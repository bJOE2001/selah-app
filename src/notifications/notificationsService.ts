import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const MORNING_NOTIFICATION_ID = 'morning-devotion-reminder';
const EVENING_NOTIFICATION_ID = 'evening-reflection-reminder';
const DEVOTIONAL_CHANNEL_ID = 'daily-devotional-habits';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function getNotificationsModule(): typeof import('expo-notifications') | null {
  if (isExpoGo) {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Configure default foreground notification behavior
 */
export function configureNotificationHandler() {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync(DEVOTIONAL_CHANNEL_ID, {
        name: 'Daily Devotional Habits',
        description: 'Morning Devotions & Evening Reflection reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D6A4F',
      }).catch(() => {});
    }
  } catch (err) {
    // Gracefully handle in constrained environments
  }
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    // In Expo Go sandbox, return true so UI switches and tests work without error
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return false;
  }
}

/**
 * Parse time string like "07:00 AM" or "09:30 PM" into 24-hour hour & minute
 */
export function parseTimeStringToHourMinute(timeStr: string): { hour: number; minute: number } {
  try {
    const [timePart, meridiem] = timeStr.trim().split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10) || 0;

    if (meridiem?.toUpperCase() === 'PM' && hour < 12) {
      hour += 12;
    } else if (meridiem?.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return { hour, minute };
  } catch {
    return { hour: 7, minute: 0 };
  }
}

/**
 * Schedule or cancel Morning Devotion daily reminder
 */
export async function syncMorningReminder(enabled: boolean, timeStr: string): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    // In Expo Go sandbox, simulate success
    return true;
  }

  try {
    // Cancel existing morning reminder first
    await Notifications.cancelScheduledNotificationAsync(MORNING_NOTIFICATION_ID).catch(() => {});

    if (!enabled) return true;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    const { hour, minute } = parseTimeStringToHourMinute(timeStr);

    await Notifications.scheduleNotificationAsync({
      identifier: MORNING_NOTIFICATION_ID,
      content: {
        title: '🌅 Morning Devotion • Shepema',
        body: 'Start your day with God’s presence. Discover today’s Rhema Scripture.',
        sound: true,
        data: { targetScreen: '/(tabs)/journal' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: DEVOTIONAL_CHANNEL_ID,
      },
    });

    return true;
  } catch (err) {
    console.warn('Failed to schedule morning reminder:', err);
    return false;
  }
}

/**
 * Schedule or cancel Evening Reflection daily reminder
 */
export async function syncEveningReminder(enabled: boolean, timeStr: string): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    // In Expo Go sandbox, simulate success
    return true;
  }

  try {
    // Cancel existing evening reminder first
    await Notifications.cancelScheduledNotificationAsync(EVENING_NOTIFICATION_ID).catch(() => {});

    if (!enabled) return true;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    const { hour, minute } = parseTimeStringToHourMinute(timeStr);

    await Notifications.scheduleNotificationAsync({
      identifier: EVENING_NOTIFICATION_ID,
      content: {
        title: '🌙 Evening Reflection • Shepema',
        body: 'Pause and reflect on God’s faithfulness today. Record your thoughts before bed.',
        sound: true,
        data: { targetScreen: '/(tabs)/journal' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: DEVOTIONAL_CHANNEL_ID,
      },
    });

    return true;
  } catch (err) {
    console.warn('Failed to schedule evening reminder:', err);
    return false;
  }
}

/**
 * Sync all user reminder preferences on app startup
 */
export async function syncAllReminders(settings: {
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;
}): Promise<void> {
  if (settings.morningReminderEnabled) {
    await syncMorningReminder(true, settings.morningReminderTime);
  }
  if (settings.eveningReminderEnabled) {
    await syncEveningReminder(true, settings.eveningReminderTime);
  }
}
