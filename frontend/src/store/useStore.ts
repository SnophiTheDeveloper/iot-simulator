import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Device,
  DeviceGroup,
  Vendor,
  Simulation,
  Scenario,
  Statistics,
  Log,
  APISettings,
  MQTTSettings,
} from '../types';

interface AppState {
  // Vendors
  vendors: Vendor[];
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  // Devices
  devices: Device[];
  groups: DeviceGroup[];
  addDevice: (device: Device) => void;
  updateDevice: (id: string, device: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  addGroup: (group: DeviceGroup) => void;
  deleteGroup: (id: string) => void;

  // Simulations
  simulations: Map<string, Simulation>;
  startSimulation: (simulation: Simulation) => void;
  stopSimulation: (deviceId: string) => void;
  updateSimulation: (deviceId: string, data: Partial<Simulation>) => void;

  // Scenarios
  scenarios: Scenario[];
  addScenario: (scenario: Scenario) => void;
  deleteScenario: (id: string) => void;

  // Statistics
  stats: Statistics;
  updateStats: (stats: Partial<Statistics>) => void;
  resetStats: () => void;

  // Logs
  logs: Log[];
  addLog: (log: Omit<Log, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // Settings
  apiSettings: APISettings;
  mqttSettings: MQTTSettings;
  updateAPISettings: (settings: Partial<APISettings>) => void;
  updateMQTTSettings: (settings: Partial<MQTTSettings>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      vendors: [],
      devices: [],
      groups: [],
      simulations: new Map(),
      scenarios: [],
      stats: {
        totalRequests: 0,
        successCount: 0,
        failCount: 0,
        httpCount: 0,
        mqttCount: 0,
        startTime: null,
        rpm: 0,
      },
      logs: [],
      apiSettings: {
        baseUrl: 'http://test-skywaveapi.innova.com.tr:30080',
        tenantCode: '',
        username: '',
        password: '',
        token: '',
        tokenExpirationDate: '',
      },
      mqttSettings: {
        brokerUrl: 'ws://test-skywave-mqtt.innova.com.tr:61626',
        clientId: '',
        username: '',
        password: '',
        connected: false,
      },

      // Vendor actions
      addVendor: (vendor) =>
        set((state) => ({
          vendors: [...state.vendors, vendor],
        })),

      updateVendor: (id, vendorData) =>
        set((state) => ({
          vendors: state.vendors.map((v) =>
            v.id === id ? { ...v, ...vendorData, updatedAt: new Date() } : v
          ),
        })),

      deleteVendor: (id) =>
        set((state) => ({
          vendors: state.vendors.filter((v) => v.id !== id),
          // Also delete devices belonging to this vendor
          devices: state.devices.filter((d) => d.vendorId !== id),
        })),

      // Device actions
      addDevice: (device) =>
        set((state) => ({
          devices: [...state.devices, device],
        })),

      updateDevice: (id, deviceData) =>
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id ? { ...d, ...deviceData, updatedAt: new Date() } : d
          ),
        })),

      deleteDevice: (id) =>
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== id),
        })),

      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),

      deleteGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        })),

      // Simulation actions
      startSimulation: (simulation) =>
        set((state) => {
          const newSims = new Map(state.simulations);
          newSims.set(simulation.deviceId, simulation);
          return { simulations: newSims };
        }),

      stopSimulation: (deviceId) =>
        set((state) => {
          const newSims = new Map(state.simulations);
          newSims.delete(deviceId);
          return { simulations: newSims };
        }),

      updateSimulation: (deviceId, data) =>
        set((state) => {
          const newSims = new Map(state.simulations);
          const existing = newSims.get(deviceId);
          if (existing) {
            newSims.set(deviceId, { ...existing, ...data });
          }
          return { simulations: newSims };
        }),

      // Scenario actions
      addScenario: (scenario) =>
        set((state) => ({
          scenarios: [...state.scenarios, scenario],
        })),

      deleteScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
        })),

      // Stats actions
      updateStats: (statsData) =>
        set((state) => ({
          stats: { ...state.stats, ...statsData },
        })),

      resetStats: () =>
        set({
          stats: {
            totalRequests: 0,
            successCount: 0,
            failCount: 0,
            httpCount: 0,
            mqttCount: 0,
            startTime: null,
            rpm: 0,
          },
        }),

      // Log actions
      addLog: (logData) =>
        set((state) => {
          const newLog: Log = {
            ...logData,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
          };
          const logs = [...state.logs, newLog].slice(-1000); // Keep last 1000, newest at bottom
          return { logs };
        }),

      clearLogs: () => set({ logs: [] }),

      // Settings actions
      updateAPISettings: (settings) =>
        set((state) => ({
          apiSettings: { ...state.apiSettings, ...settings },
        })),

      updateMQTTSettings: (settings) =>
        set((state) => ({
          mqttSettings: { ...state.mqttSettings, ...settings },
        })),
    }),
    {
      name: 'iot-simulator-storage',
      partialize: (state) => ({
        vendors: state.vendors,
        devices: state.devices,
        groups: state.groups,
        scenarios: state.scenarios,
        apiSettings: state.apiSettings,
        mqttSettings: state.mqttSettings,
      }),
    }
  )
);
