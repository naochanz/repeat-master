import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_ENABLED_KEY = '@doriloop_notification_enabled';
const LAST_STUDY_DATE_KEY = '@doriloop_last_study_date';

// Configure notification handler (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }) as Notifications.NotificationBehavior,
});

export async function requestPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function isNotificationEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
  return val !== 'false'; // default enabled
}

export async function setNotificationEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, String(enabled));
  if (enabled) {
    await scheduleReminders();
  } else {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export async function recordStudySession(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(LAST_STUDY_DATE_KEY, today);
  // Reschedule reminders from today
  await scheduleReminders();
}

export async function getLastStudyDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_STUDY_DATE_KEY);
}

export async function scheduleReminders(): Promise<void> {
  const enabled = await isNotificationEnabled();
  if (!enabled) return;

  const hasPermission = await requestPermission();
  if (!hasPermission) return;

  // Cancel existing reminders
  await Notifications.cancelAllScheduledNotificationsAsync();

  const lastStudy = await getLastStudyDate();
  const now = new Date();

  // Reminder 1: Next day at 20:00 - "昨日の続きから"
  const tomorrow8pm = new Date(now);
  tomorrow8pm.setDate(tomorrow8pm.getDate() + 1);
  tomorrow8pm.setHours(20, 0, 0, 0);

  if (tomorrow8pm > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'DORILOOP',
        body: '昨日の続きから始めましょう！📚',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: tomorrow8pm,
      },
    });
  }

  // Reminder 2: 3 days later at 19:00 - "3日ぶりです"
  const threeDays = new Date(now);
  threeDays.setDate(threeDays.getDate() + 3);
  threeDays.setHours(19, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DORILOOP',
      body: '3日ぶりです！少しだけでも学習しませんか？🔥',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: threeDays,
    },
  });

  // Reminder 3: 7 days later at 18:00 - "1週間経ちました"
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  sevenDays.setHours(18, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DORILOOP',
      body: '1週間経ちました。目標を忘れていませんか？💪',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: sevenDays,
    },
  });
}
