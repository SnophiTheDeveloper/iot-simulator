import type { DeviceTemplate, Sensor } from '../types';

export const SENSOR_TEMPLATES: Record<string, Omit<Sensor, 'id'>> = {
  battery: {
    name: 'battery',
    type: 'number',
    min: 0,
    max: 100,
    unit: '%',
    icon: '🔋',
  },
  temperature: {
    name: 'temperature',
    type: 'number',
    min: -40,
    max: 80,
    unit: '°C',
    icon: '🌡️',
  },
  humidity: {
    name: 'humidity',
    type: 'number',
    min: 0,
    max: 100,
    unit: '%',
    icon: '💧',
  },
  co2: {
    name: 'co2',
    type: 'number',
    min: 400,
    max: 5000,
    unit: 'ppm',
    icon: '💨',
  },
  pressure: {
    name: 'pressure',
    type: 'number',
    min: 900,
    max: 1100,
    unit: 'hPa',
    icon: '🌪️',
  },
  light: {
    name: 'light',
    type: 'number',
    min: 0,
    max: 10000,
    unit: 'lux',
    icon: '💡',
  },
  motion: {
    name: 'motion',
    type: 'boolean',
    icon: '🚶',
  },
  gps: {
    name: 'gps',
    type: 'json',
    icon: '📍',
  },
  status: {
    name: 'status',
    type: 'string',
    values: 'online, offline, device_error',
    icon: '📶',
  },
  firmwareversion: {
    name: 'firmwareversion',
    type: 'string',
    icon: '💾',
  },
  ip: {
    name: 'ip',
    type: 'string',
    icon: '🌐',
  },
  coordinates: {
    name: 'coordinates',
    type: 'json',
    icon: '🗺️',
  },
};

export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  {
    id: 'smart-home',
    name: 'Smart Home Sensor',
    description: 'Temperature, humidity, and motion sensor for smart homes',
    icon: '🏠',
    sensors: [
      SENSOR_TEMPLATES.temperature,
      SENSOR_TEMPLATES.humidity,
      SENSOR_TEMPLATES.motion,
    ],
  },
  {
    id: 'industrial',
    name: 'Industrial Sensor',
    description: 'Temperature, pressure, and vibration monitoring',
    icon: '🏭',
    sensors: [
      SENSOR_TEMPLATES.temperature,
      SENSOR_TEMPLATES.pressure,
      SENSOR_TEMPLATES.co2,
    ],
  },
  {
    id: 'environmental',
    name: 'Environmental Monitor',
    description: 'Complete environmental monitoring station',
    icon: '🌍',
    sensors: [
      SENSOR_TEMPLATES.temperature,
      SENSOR_TEMPLATES.humidity,
      SENSOR_TEMPLATES.pressure,
      SENSOR_TEMPLATES.light,
      SENSOR_TEMPLATES.co2,
    ],
  },
  {
    id: 'tracker',
    name: 'GPS Tracker',
    description: 'Vehicle or asset tracking device',
    icon: '📍',
    sensors: [SENSOR_TEMPLATES.gps, SENSOR_TEMPLATES.battery],
    defaultGeo: true,
  },
  {
    id: 'battery-monitor',
    name: 'Battery Monitor',
    description: 'Simple battery level monitoring',
    icon: '🔋',
    sensors: [SENSOR_TEMPLATES.battery],
  },
];

export const generateDeviceId = (): string => {
  return `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const generateSensorId = (): string => {
  return `sen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
