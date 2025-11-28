import { useState } from 'react';
import { Plus, Trash2, Edit, Play, Square, Send, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, generateRandomValue, getCurrentISOTime } from '../services/api';
import { mqttService } from '../services/mqtt';
import DeviceModal from '../components/DeviceModal';
import SendDataModal from '../components/SendDataModal';
import type { Device, DataPoint } from '../types';

export default function DevicesPage() {
  const devices = useStore((state) => state.devices);
  const vendors = useStore((state) => state.vendors);
  const deleteDevice = useStore((state) => state.deleteDevice);
  const simulations = useStore((state) => state.simulations);
  const startSimulation = useStore((state) => state.startSimulation);
  const stopSimulation = useStore((state) => state.stopSimulation);
  const updateSimulation = useStore((state) => state.updateSimulation);
  const apiSettings = useStore((state) => state.apiSettings);
  const mqttSettings = useStore((state) => state.mqttSettings);
  const addLog = useStore((state) => state.addLog);
  const updateStats = useStore((state) => state.updateStats);
  const stats = useStore((state) => state.stats);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>();
  const [isSendDataModalOpen, setIsSendDataModalOpen] = useState(false);
  const [sendingDevice, setSendingDevice] = useState<Device | undefined>();
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [collapsedVendors, setCollapsedVendors] = useState<Set<string>>(new Set());

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };

  const handleDelete = (deviceId: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      deleteDevice(deviceId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(undefined);
  };

  const handleOpenSendDataModal = (device: Device) => {
    setSendingDevice(device);
    setIsSendDataModalOpen(true);
  };

  const handleCloseSendDataModal = () => {
    setIsSendDataModalOpen(false);
    setSendingDevice(undefined);
  };

  const handleSendCustomData = async (sensorData: { propertyName: string; value: string }[]) => {
    if (!sendingDevice) return;

    const time = getCurrentISOTime();
    const dataPoints: DataPoint[] = sensorData.map((data) => ({
      ...data,
      customId: sendingDevice.customId,
      time,
    }));

    // Add geo if enabled
    if (sendingDevice.geoEnabled && sendingDevice.geo) {
      dataPoints.forEach((dp) => {
        dp.geo = sendingDevice.geo;
      });
    }

    await sendData(sendingDevice, dataPoints);
  };

  const generateDeviceData = (device: Device): DataPoint[] => {
    const dataPoints: DataPoint[] = [];
    const time = getCurrentISOTime();

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
    // Get vendor for this device
    const vendor = vendors.find((v) => v.id === device.vendorId);
    if (!vendor) {
      addLog({
        level: 'error',
        protocol: 'SYSTEM',
        message: `Vendor not found for device ${device.name}`,
      });
      return;
    }

    const useHttp = vendor.apiEnabled && !!vendor.apiToken;
    const useMqtt = vendor.mqttEnabled && vendor.mqttConnected;

    if (useHttp) {
      try {
        await api.sendDeviceData(dataPoints, vendor.apiBaseUrl, vendor.apiToken!);
        updateStats({
          httpCount: stats.httpCount + 1,
          successCount: stats.successCount + 1,
          totalRequests: stats.totalRequests + 1,
        });
        addLog({
          level: 'success',
          protocol: 'HTTP',
          message: `Sent data from ${device.name} via ${vendor.name}`,
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

    if (useMqtt) {
      try {
        const topic = `devices/${device.customId}/telemetry`;
        await mqttService.publish(topic, dataPoints);
        updateStats({
          mqttCount: stats.mqttCount + 1,
          successCount: stats.successCount + 1,
          totalRequests: stats.totalRequests + 1,
        });
        addLog({
          level: 'success',
          protocol: 'MQTT',
          message: `Published from ${device.name} via ${vendor.name}`,
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

    const sim = simulations.get(device.id);
    if (sim) {
      updateSimulation(device.id, {
        messagesSent: sim.messagesSent + 1,
        lastMessageTime: new Date(),
      });
    }
  };

  const handleStartSimulation = (device: Device) => {
    if (simulations.has(device.id)) return;

    const interval = device.interval || 5000;
    const initialData = generateDeviceData(device);
    sendData(device, initialData);

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
      message: `Started ${device.name}`,
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
      message: `Stopped ${sim.deviceName}`,
    });
  };

  const toggleVendorCollapse = (vendorId: string) => {
    const newCollapsed = new Set(collapsedVendors);
    if (newCollapsed.has(vendorId)) {
      newCollapsed.delete(vendorId);
    } else {
      newCollapsed.add(vendorId);
    }
    setCollapsedVendors(newCollapsed);
  };

  // Group devices by vendor
  const devicesByVendor = devices.reduce((acc, device) => {
    const vendorId = device.vendorId || 'no-vendor';
    if (!acc[vendorId]) {
      acc[vendorId] = [];
    }
    acc[vendorId].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  // Filter devices
  const filteredDevices = selectedVendorFilter === 'all'
    ? devices
    : devices.filter(d => d.vendorId === selectedVendorFilter);

  // Get vendor counts
  const vendorCounts = vendors.map(vendor => ({
    vendor,
    count: devices.filter(d => d.vendorId === vendor.id).length,
  }));

  const renderDeviceCard = (device: Device) => {
    const isRunning = simulations.has(device.id);
    return (
      <div key={device.id} className="card hover:shadow-medium transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-neutral-900 mb-1">
              {device.name}
            </h3>
            <p className="text-sm text-neutral-600">{device.customId}</p>
          </div>
          {isRunning ? (
            <span className="badge badge-success">
              <span className="w-1.5 h-1.5 bg-success-600 rounded-full mr-1.5 animate-pulse"></span>
              Active
            </span>
          ) : (
            <span className="badge bg-neutral-100 text-neutral-600">Inactive</span>
          )}
        </div>

        {/* Sensors */}
        <div className="mb-4">
          <div className="text-xs font-medium text-neutral-500 mb-2">
            Sensors ({device.sensors.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {device.sensors.slice(0, 4).map((sensor) => (
              <span
                key={sensor.id}
                className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded"
              >
                {sensor.icon} {sensor.name}
              </span>
            ))}
            {device.sensors.length > 4 && (
              <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded">
                +{device.sensors.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Geo Info */}
        {device.geoEnabled && device.geo && (
          <div className="mb-4 text-xs text-neutral-600">
            📍 {device.geo.lat.toFixed(4)}, {device.geo.lon.toFixed(4)}
            {device.randomWalk && (
              <span className="ml-2 text-primary-600">(Moving)</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-neutral-200">
          <button
            onClick={() => handleEdit(device)}
            className="flex-1 btn-secondary text-sm py-2"
          >
            <Edit className="w-4 h-4 mr-1 inline" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(device.id)}
            className="flex-1 btn text-sm py-2 bg-error-50 text-error-700 hover:bg-error-100"
          >
            <Trash2 className="w-4 h-4 mr-1 inline" />
            Delete
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-2 space-y-2">
          {/* Send Custom Data */}
          <button
            onClick={() => handleOpenSendDataModal(device)}
            className="w-full btn-secondary text-sm py-2"
          >
            <Send className="w-4 h-4 mr-1 inline" />
            Send Custom Data
          </button>

          {/* Start/Stop Simulation */}
          {isRunning ? (
            <button
              onClick={() => handleStopSimulation(device.id)}
              className="w-full btn text-sm py-2 bg-error-600 text-white hover:bg-error-700"
            >
              <Square className="w-4 h-4 mr-1 inline" />
              Stop Simulation
            </button>
          ) : (
            <button
              onClick={() => handleStartSimulation(device)}
              className="w-full btn-success text-sm py-2"
            >
              <Play className="w-4 h-4 mr-1 inline" />
              Start Simulation
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Devices</h1>
          <p className="text-neutral-600">Manage your IoT devices</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Device
        </button>
      </div>

      {/* Vendor Filter */}
      {devices.length > 0 && vendors.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Filter by Vendor:</span>
            <div className="flex gap-2 flex-wrap flex-1">
              <button
                onClick={() => setSelectedVendorFilter('all')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedVendorFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All ({devices.length})
              </button>
              {vendorCounts.map(({ vendor, count }) => (
                <button
                  key={vendor.id}
                  onClick={() => setSelectedVendorFilter(vendor.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedVendorFilter === vendor.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {vendor.name} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No devices yet</h3>
          <p className="text-neutral-600 mb-6">
            Create your first device to start simulating IoT data
          </p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Create First Device
          </button>
        </div>
      ) : selectedVendorFilter === 'all' ? (
        // Group by vendor view
        <div className="space-y-6">
          {Object.entries(devicesByVendor).map(([vendorId, vendorDevices]) => {
            const vendor = vendors.find(v => v.id === vendorId);
            const vendorName = vendor?.name || 'Unassigned Devices';
            const isCollapsed = collapsedVendors.has(vendorId);

            return (
              <div key={vendorId}>
                {/* Vendor Header */}
                <button
                  onClick={() => toggleVendorCollapse(vendorId)}
                  className="w-full flex items-center justify-between p-4 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors mb-4"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    )}
                    <h2 className="text-xl font-bold text-neutral-900">{vendorName}</h2>
                    <span className="text-sm text-neutral-600">({vendorDevices.length} devices)</span>
                  </div>
                </button>

                {/* Devices Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendorDevices.map(device => renderDeviceCard(device))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Filtered view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map(device => renderDeviceCard(device))}
        </div>
      )}

      {/* Device Modal */}
      <DeviceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        device={editingDevice}
      />

      {/* Send Data Modal */}
      {sendingDevice && (
        <SendDataModal
          isOpen={isSendDataModalOpen}
          onClose={handleCloseSendDataModal}
          device={sendingDevice}
          onSend={handleSendCustomData}
        />
      )}
    </div>
  );
}
