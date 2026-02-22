export interface GPSPosition {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * @param pos1 First position
 * @param pos2 Second position
 * @returns Distance in meters
 */
export function calculateDistance(pos1: GPSPosition, pos2: GPSPosition): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a position is within a specified radius of a center point
 * @param center The center position
 * @param position The position to check
 * @param radiusInMeters The radius in meters
 * @returns True if the position is within the radius
 */
export function isWithinRadius(
  center: GPSPosition,
  position: GPSPosition,
  radiusInMeters: number
): boolean {
  const distance = calculateDistance(center, position);
  return distance <= radiusInMeters;
}

/**
 * Get the user's current GPS position
 * @returns Promise that resolves to the GPS position
 */
export function getCurrentPosition(): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Watch the user's GPS position
 * @param callback Function to call when position updates
 * @returns Watch ID that can be used to stop watching
 */
export function watchPosition(
  callback: (position: GPSPosition) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.error('Geolocation watch error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

/**
 * Stop watching the user's GPS position
 * @param watchId The watch ID returned by watchPosition
 */
export function clearWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}
