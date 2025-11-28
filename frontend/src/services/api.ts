import axios from 'axios';
import type { DataPoint } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('iot_api_token');
  if (token) {
    config.headers['x-xsrf-token'] = token;
  }
  return config;
});

export const api = {
  // Health check
  health: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Authentication (via backend proxy to avoid CORS)
  login: async (baseUrl: string, tenantCode: string, username: string, password: string) => {
    const response = await apiClient.post('/api/proxy/login', {
      baseUrl,
      tenantCode,
      username,
      password
    });
    return response.data;
  },

  // Send device data (via backend proxy to avoid CORS)
  sendDeviceData: async (dataPoints: DataPoint[], baseUrl: string, token: string) => {
    const response = await apiClient.post('/api/proxy/device-data', {
      baseUrl,
      token,
      dataPoints
    });
    return response.data;
  },

  // Get devices from vendor (via backend proxy)
  getDevices: async (baseUrl: string, token: string, endpoint?: string) => {
    const response = await apiClient.post('/api/proxy/devices', {
      baseUrl,
      token,
      endpoint
    });
    return response.data;
  },

  // Get device profiles from vendor (via backend proxy)
  getDeviceProfiles: async (baseUrl: string, token: string) => {
    const response = await apiClient.post('/api/proxy/device-profiles', {
      baseUrl,
      token
    });
    return response.data;
  },

  // Get device profile properties (via backend proxy)
  getDeviceProfileProperties: async (baseUrl: string, token: string, profileId: number) => {
    const response = await apiClient.post('/api/proxy/device-profile/property', {
      baseUrl,
      token,
      profileId
    });
    return response.data;
  },

  // Create device on vendor (via backend proxy)
  createDevice: async (
    deviceData: {
      brand?: string;
      customId: string;
      name: string;
      deviceProfileId: number;
      vendorId: number;
      model?: string;
      status: string;
      transferEnabled?: boolean;
      servedAppId?: number;
      locationId?: number;
      setupLat?: string;
      setupLon?: string;
      setupAlt?: string;
      establishmentDate?: string | null;
      expiryDate?: string | null;
      gatewayCustomId?: string | null;
      maintenanceEndDate?: string | null;
      warrantyEndDate?: string | null;
    },
    baseUrl: string,
    token: string
  ) => {
    const response = await apiClient.post('/api/proxy/device/create', {
      baseUrl,
      token,
      deviceData
    });
    return response.data;
  },

  // Get logs from backend
  getLogs: async (level?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());

    const response = await apiClient.get(`/api/logs?${params.toString()}`);
    return response.data;
  },

  // Clear logs
  clearLogs: async () => {
    const response = await apiClient.post('/api/logs/clear');
    return response.data;
  },

  // Get system info
  getSystemInfo: async () => {
    const response = await apiClient.get('/api/system/info');
    return response.data;
  },
};

// Utility function to generate ISO8601 timestamp
export const getCurrentISOTime = (): string => {
  const now = new Date();
  // Format: 2025-11-24T00:11:28.123+03:00 (with milliseconds, matching HTML version)
  return now.toISOString().slice(0, -1) + '+03:00';
};

// Utility function to generate random value based on sensor config
export const generateRandomValue = (sensor: any): string => {
  if (sensor.type === 'number') {
    const min = sensor.min || 0;
    const max = sensor.max || 100;
    const numValue = parseFloat((Math.random() * (max - min) + min).toFixed(2));
    return numValue.toString();
  } else if (sensor.type === 'boolean') {
    const boolValue = Math.random() > 0.5;
    return boolValue.toString();
  } else if (sensor.type === 'string' && sensor.values) {
    const values = sensor.values.split(',').map((v: string) => v.trim());
    return values[Math.floor(Math.random() * values.length)];
  } else if (sensor.type === 'json') {
    // For GPS/JSON sensors - return as JSON string
    const jsonValue = {
      lat: 40.0 + (Math.random() - 0.5) * 0.01,
      lon: 40.0 + (Math.random() - 0.5) * 0.01,
    };
    return JSON.stringify(jsonValue);
  }
  return '0';
};
