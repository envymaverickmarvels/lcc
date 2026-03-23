import * as ExpoLocation from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_STORAGE_KEY = '@localmed_user_location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coords: LocationCoords;
  accuracy: number | null;
  timestamp: number;
}

class LocationService {
  private subscription: ExpoLocation.LocationSubscription | null = null;

  async requestPermission(): Promise<boolean> {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return this.getStoredLocation();
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      };

      await this.storeLocation(locationData);

      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      return this.getStoredLocation();
    }
  }

  async startTracking(callback: (location: LocationData) => void): Promise<void> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Location permission not granted');
        return;
      }

      await this.stopTracking();

      this.subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        (location) => {
          const locationData: LocationData = {
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          };
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  async stopTracking(): Promise<void> {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  async storeLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Error storing location:', error);
    }
  }

  async getStoredLocation(): Promise<LocationData | null> {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting stored location:', error);
    }
    return null;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  }

  async getReverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ city?: string; region?: string; country?: string } | null> {
    try {
      const results = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        return {
          city: results[0].city || results[0].subregion,
          region: results[0].region,
          country: results[0].country,
        };
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
    return null;
  }
}

export const locationService = new LocationService();
export default locationService;
