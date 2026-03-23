import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const PUSH_TOKEN_KEY = '@localmed_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  orderId?: string;
  prescriptionId?: string;
  type: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: NotificationData;
  date: Date;
}

class PushNotificationService {
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'LocalMed Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    return true;
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'localmed-app',
      });

      const pushToken = tokenData.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);

      return pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored push token:', error);
      return null;
    }
  }

  async subscribeToBackend(deviceData: {
    deviceId: string;
    deviceType: 'ios' | 'android' | 'web';
    notificationToken: string;
    deviceName?: string;
    deviceModel?: string;
  }): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await fetch('http://localhost:3000/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deviceData),
      });
    } catch (error) {
      console.error('Error subscribing to backend:', error);
    }
  }

  async unsubscribeFromBackend(deviceId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await fetch('http://localhost:3000/api/v1/notifications/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Error unsubscribing from backend:', error);
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (onNotificationReceived) {
          onNotificationReceived({
            id: notification.request.identifier,
            title: notification.request.content.title || '',
            body: notification.request.content.body || '',
            data: notification.request.content.data as NotificationData,
            date: new Date(),
          });
        }
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      }
    );
  }

  removeNotificationListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  async displayLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  }

  async displayOrderNotification(
    orderId: string,
    orderNumber: string,
    status: string
  ): Promise<void> {
    const messages: Record<string, { title: string; body: string }> = {
      confirmed: {
        title: 'Order Confirmed! 🎉',
        body: `Your order ${orderNumber} has been confirmed.`,
      },
      preparing: {
        title: 'Order Being Prepared',
        body: `Your order ${orderNumber} is being prepared.`,
      },
      ready: {
        title: 'Order Ready! 🚀',
        body: `Your order ${orderNumber} is ready for pickup.`,
      },
      completed: {
        title: 'Order Completed ✓',
        body: `Your order ${orderNumber} has been completed.`,
      },
      cancelled: {
        title: 'Order Cancelled',
        body: `Your order ${orderNumber} has been cancelled.`,
      },
    };

    const message = messages[status] || {
      title: 'Order Update',
      body: `Order ${orderNumber} status: ${status}`,
    };

    await this.displayLocalNotification(message.title, message.body, {
      orderId,
      type: `order_${status}`,
    });
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
