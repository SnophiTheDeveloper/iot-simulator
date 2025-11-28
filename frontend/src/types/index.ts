// Device Types
export interface Sensor {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'json';
  min?: number;
  max?: number;
  unit?: string;
  values?: string; // comma-separated for string type
  icon?: string;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  alt?: number;
}

export interface Device {
  id: string;
  name: string;
  customId: string;
  vendorId: string; // Required: which vendor this device belongs to
  profileId?: string;
  locationId?: string;
  groupId?: string;
  sensors: Sensor[];
  interval?: number; // Custom interval in milliseconds
  geoEnabled: boolean;
  geo?: GeoLocation;
  randomWalk: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
}

// Simulation Types
export interface Simulation {
  deviceId: string;
  deviceName: string;
  startTime: Date;
  messagesSent: number;
  lastMessageTime: Date;
  intervalId?: NodeJS.Timeout;
}

export interface DataPoint {
  propertyName: string;
  value: any;
  customId: string;
  time: string; // ISO8601
  geo?: {
    lat: number;
    lon: number;
    alt?: number;
  };
}

// Scenario Types
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  deviceId: string;
  dataPoints: DataPoint[];
  duration: number; // milliseconds
  createdAt: Date;
}

// Statistics Types
export interface Statistics {
  totalRequests: number;
  successCount: number;
  failCount: number;
  httpCount: number;
  mqttCount: number;
  startTime: number | null;
  rpm: number; // requests per minute
}

// Log Types
export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface Log {
  id: string;
  timestamp: string;
  level: LogLevel;
  protocol: 'HTTP' | 'MQTT' | 'SIM' | 'SYSTEM';
  message: string;
  data?: any;
}

// Vendor Types - Multi-vendor support
export interface Vendor {
  id: string;
  name: string;
  description?: string;
  color?: string;
  // HTTP API Configuration
  apiEnabled: boolean;
  apiBaseUrl: string;
  apiTenantCode: string;
  apiUsername: string;
  apiPassword: string;
  apiToken?: string;
  apiTokenExpiration?: string;
  apiVendorId?: number; // Numeric vendor ID from the API platform (for device creation)
  // MQTT Configuration
  mqttEnabled: boolean;
  mqttBrokerUrl: string;
  mqttClientId?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  mqttConnected: boolean;
  // Device Import
  canImportDevices: boolean;
  importEndpoint?: string; // API endpoint to fetch devices
  createdAt: Date;
  updatedAt: Date;
}

// Legacy API Settings Types (for backward compatibility)
export interface APISettings {
  baseUrl: string;
  tenantCode: string;
  username: string;
  password: string;
  token: string;
  tokenExpirationDate: string;
}

// Legacy MQTT Settings Types (for backward compatibility)
export interface MQTTSettings {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  connected: boolean;
}

// Template Types
export interface DeviceTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sensors: Omit<Sensor, 'id'>[];
  defaultGeo?: boolean;
}
