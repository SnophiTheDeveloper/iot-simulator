import { useState, useEffect } from 'react';
import { Play, Square, Clock, Zap, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, generateRandomValue, getCurrentISOTime } from '../services/api';
import { mqttService } from '../services/mqtt';
import type { Device, DataPoint } from '../types';

export default function SimulatorPage() {
  const devices = useStore((state) => state.devices);
  const vendors = useStore((state) => state.vendors);
  const simulations = useStore((state) => state.simulations);
  const startSimulation = useStore((state) => state.startSimulation);
  const stopSimulation = useStore((state) => state.stopSimulation);
  const updateSimulation = useStore((state) => state.updateSimulation);
  const apiSettings = useStore((state) => state.apiSettings);
  const mqttSettings = useStore((state) => state.mqttSettings);
  const addLog = useStore((state) => state.addLog);
  const updateStats = useStore((state) => state.updateStats);
  const stats = useStore((state) => state.stats);

  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [globalInterval, setGlobalInterval] = useState(5000); // 5 seconds default
  const [useHttp, setUseHttp] = useState(true);
  const [useMqtt, setUseMqtt] = useState(false);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      simulations.forEach((sim) => {
        if (sim.intervalId) {
          clearInterval(sim.intervalId);
        }
      });
    };
  }, []);

  const generateDeviceData = (device: Device): DataPoint[] => {
    const dataPoints: DataPoint[] = [];
    const time = getCurrentISOTime();

    // Generate random walk for geo if enabled
    let currentGeo = device.geo;
    if (device.geoEnabled && device.randomWalk && currentGeo) {
      currentGeo = {
        lat: currentGeo.lat + (Math.random() - 0.5) * 0.001,
        lon: currentGeo.lon + (Math.random() - 0.5) * 0.001,
        alt: currentGeo.alt,
      };
    }

    device.sensors.forEach((sensor) => {
      const value = generateRandomValue(sensor);
      const dataPoint: DataPoint = {
        propertyName: sensor.name,
        value,
        customId: device.customId,
        time,
      };

      // Add geo data if enabled
      if (device.geoEnabled && currentGeo) {
        dataPoint.geo = currentGeo;
      }

      dataPoints.push(dataPoint);
    });

    return dataPoints;
  };

  const sendData = async (device: Device, dataPoints: DataPoint[]) => {
    let httpSuccess = false;
    let mqttSuccess = false;

    // Get vendor for this device
    const vendor = vendors.find((v) => v.id === device.vendorId);
    if (!vendor) {
      addLog({
        level: 'error',
        protocol: 'SYSTEM',
        message: `Vendor not found for device ${device.name}`,
      });
      return { httpSuccess, mqttSuccess };
    }

    // Send via HTTP (using vendor's API configuration)
    if (useHttp && vendor.apiEnabled && vendor.apiToken) {
      try {
        await api.sendDeviceData(dataPoints, vendor.apiBaseUrl, vendor.apiToken);
        httpSuccess = true;
        updateStats({
          httpCount: stats.httpCount + 1,
          successCount: stats.successCount + 1,
          totalRequests: stats.totalRequests + 1,
        });
        addLog({
          level: 'success',
          protocol: 'HTTP',
          message: `Sent ${dataPoints.length} data points from ${device.name} via ${vendor.name}`,
          data: dataPoints,
        });
      } catch (error: any) {
        updateStats({
          failCount: stats.failCount + 1,
          totalRequests: stats.totalRequests + 1,
        });
        addLog({
          level: 'error',
          protocol: 'HTTP',
          message: `Failed to send from ${device.name} via ${vendor.name}: ${error.message}`,
        });
      }
    }

    // Send via MQTT (using vendor's MQTT configuration)
    if (useMqtt && vendor.mqttEnabled && vendor.mqttConnected) {
      try {
        const topic = `devices/${device.customId}/telemetry`;
        await mqttService.publish(topic, dataPoints);
        mqttSuccess = true;
        updateStats({
          mqttCount: stats.mqttCount + 1,
          successCount: stats.successCount + 1,
          totalRequests: stats.totalRequests + 1,
        });
        addLog({
          level: 'success',
          protocol: 'MQTT',
          message: `Published ${dataPoints.length} data points from ${device.name} via ${vendor.name} to ${topic}`,
          data: dataPoints,
        });
      } catch (error: any) {
        updateStats({
          failCount: stats.failCount + 1,
          totalRequests: stats.totalRequests + 1,
        });
        addLog({
          level: 'error',
          protocol: 'MQTT',
          message: `Failed to publish from ${device.name} via ${vendor.name}: ${error.message}`,
        });
      }
    }

    // Update simulation stats
    const sim = simulations.get(device.id);
    if (sim) {
      updateSimulation(device.id, {
        messagesSent: sim.messagesSent + 1,
        lastMessageTime: new Date(),
      });
    }

    return { httpSuccess, mqttSuccess };
  };

  const handleStartSimulation = (device: Device) => {
    if (simulations.has(device.id)) return;

    const interval = device.interval || globalInterval;

    // Send initial data immediately
    const initialData = generateDeviceData(device);
    sendData(device, initialData);

    // Set up interval for periodic sending
    const intervalId = setInterval(() => {
      const dataPoints = generateDeviceData(device);
      sendData(device, dataPoints);
    }, interval);

    startSimulation({
      deviceId: device.id,
      deviceName: device.name,
      startTime: new Date(),
      messagesSent: 1,
      lastMessageTime: new Date(),
      intervalId,
    });

    addLog({
      level: 'info',
      protocol: 'SIM',
      message: `Started simulation for ${device.name} (interval: ${interval}ms)`,
    });
  };

  const handleStopSimulation = (deviceId: string) => {
    const sim = simulations.get(deviceId);
    if (!sim) return;

    if (sim.intervalId) {
      clearInterval(sim.intervalId);
    }

    stopSimulation(deviceId);

    addLog({
      level: 'info',
      protocol: 'SIM',
      message: `Stopped simulation for ${sim.deviceName}`,
    });
  };

  const handleStartAll = () => {
    selectedDevices.forEach((deviceId) => {
      const device = devices.find((d) => d.id === deviceId);
      if (device && !simulations.has(deviceId)) {
        handleStartSimulation(device);
      }
    });
  };

  const handleStopAll = () => {
    selectedDevices.forEach((deviceId) => {
      if (simulations.has(deviceId)) {
        handleStopSimulation(deviceId);
      }
    });
  };

  const toggleDeviceSelection = (deviceId: string) => {
    const newSelection = new Set(selectedDevices);
    if (newSelection.has(deviceId)) {
      newSelection.delete(deviceId);
    } else {
      newSelection.add(deviceId);
    }
    setSelectedDevices(newSelection);
  };

  const selectAll = () => {
    setSelectedDevices(new Set(devices.map((d) => d.id)));
  };

  const deselectAll = () => {
    setSelectedDevices(new Set());
  };

  const canSimulate = (useHttp && apiSettings.token) || (useMqtt && mqttSettings.connected);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Simulator</h1>
        <p className="text-neutral-600">Start and manage device simulations</p>
      </div>

      {/* Configuration Panel */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <SettingsIcon className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-bold text-neutral-900">Simulation Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Default Interval (ms)
            </label>
            <input
              type="number"
              value={globalInterval}
              onChange={(e) => setGlobalInterval(Number(e.target.value))}
              className="input"
              min="1000"
              step="1000"
            />
            <p className="text-xs text-neutral-500 mt-1">For devices without custom interval</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Protocol</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useHttp}
                  onChange={(e) => setUseHttp(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">
                  HTTP API {apiSettings.token ? '✓' : '(not configured)'}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useMqtt}
                  onChange={(e) => setUseMqtt(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">
                  MQTT {mqttSettings.connected ? '✓' : '(not connected)'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-end">
            <div className="flex gap-2 w-full">
              <button onClick={selectAll} className="btn-secondary flex-1">
                Select All
              </button>
              <button onClick={deselectAll} className="btn-secondary flex-1">
                Deselect All
              </button>
            </div>
          </div>
        </div>

        {!canSimulate && (
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-warning-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-800">
              <strong>Configuration Required:</strong> Please configure HTTP API or connect to MQTT
              in the Settings page before starting simulations.
            </div>
          </div>
        )}

        {canSimulate && selectedDevices.size > 0 && (
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button onClick={handleStartAll} className="btn-success flex-1" disabled={!canSimulate}>
              <Play className="w-4 h-4 mr-2 inline" />
              Start Selected ({selectedDevices.size})
            </button>
            <button onClick={handleStopAll} className="btn-danger flex-1">
              <Square className="w-4 h-4 mr-2 inline" />
              Stop Selected ({selectedDevices.size})
            </button>
          </div>
        )}
      </div>

      {/* Devices List */}
      {devices.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No devices available</h3>
          <p className="text-neutral-600 mb-6">Create devices in the Devices page first</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => {
            const isRunning = simulations.has(device.id);
            const isSelected = selectedDevices.has(device.id);
            const sim = simulations.get(device.id);

            return (
              <div
                key={device.id}
                className={`card hover:shadow-medium transition-all ${
                  isSelected ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDeviceSelection(device.id)}
                    className="w-5 h-5"
                  />

                  {/* Device Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-neutral-900">{device.name}</h3>
                      <span className="text-sm text-neutral-500">{device.customId}</span>
                      {isRunning && (
                        <span className="badge badge-success">
                          <span className="w-1.5 h-1.5 bg-success-600 rounded-full mr-1.5 animate-pulse"></span>
                          Running
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{device.interval || globalInterval}ms</span>
                      </div>
                      <div>
                        <span className="font-medium">{device.sensors.length}</span> sensors
                      </div>
                      {isRunning && sim && (
                        <>
                          <div>
                            <span className="font-medium">{sim.messagesSent}</span> messages
                          </div>
                          <div>
                            Last: {sim.lastMessageTime.toLocaleTimeString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isRunning ? (
                      <button
                        onClick={() => handleStopSimulation(device.id)}
                        className="btn-danger"
                      >
                        <Square className="w-4 h-4 mr-2 inline" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartSimulation(device)}
                        className="btn-success"
                        disabled={!canSimulate}
                      >
                        <Play className="w-4 h-4 mr-2 inline" />
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
