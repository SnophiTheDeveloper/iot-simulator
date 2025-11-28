import { useState } from 'react';
import { Plus, Trash2, Edit, Server, Wifi, WifiOff, LogIn, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import VendorModal from '../components/VendorModal';
import type { Vendor } from '../types';

export default function VendorsPage() {
  const vendors = useStore((state) => state.vendors);
  const devices = useStore((state) => state.devices);
  const deleteVendor = useStore((state) => state.deleteVendor);
  const updateVendor = useStore((state) => state.updateVendor);
  const addDevice = useStore((state) => state.addDevice);
  const addLog = useStore((state) => state.addLog);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>();
  const [importing, setImporting] = useState<string | null>(null);

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDelete = (vendorId: string) => {
    const vendorDeviceCount = devices.filter((d) => d.vendorId === vendorId).length;
    const message =
      vendorDeviceCount > 0
        ? `This vendor has ${vendorDeviceCount} device(s). Deleting will remove all associated devices. Continue?`
        : 'Are you sure you want to delete this vendor?';

    if (confirm(message)) {
      deleteVendor(vendorId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVendor(undefined);
  };

  const getVendorDeviceCount = (vendorId: string) => {
    return devices.filter((d) => d.vendorId === vendorId).length;
  };

  const handleImportDevices = async (vendor: Vendor) => {
    if (!vendor.canImportDevices || !vendor.importEndpoint) {
      alert('Device import is not configured for this vendor');
      return;
    }

    if (!vendor.apiToken) {
      alert('Please login to the vendor API first');
      return;
    }

    setImporting(vendor.id);
    try {
      // Fetch devices from vendor API via proxy
      const responseData = await api.getDevices(
        vendor.apiBaseUrl,
        vendor.apiToken,
        vendor.importEndpoint
      );

      console.log('=== DEVICE IMPORT DEBUG ===');
      console.log('Raw responseData:', JSON.stringify(responseData, null, 2));
      console.log('responseData.result:', responseData.result);
      console.log('responseData.result?.contents:', responseData.result?.contents);

      // Fetch device profiles to get sensor properties via proxy
      let deviceProfiles: Map<number, any[]> = new Map();
      try {
        const profilesData = await api.getDeviceProfiles(vendor.apiBaseUrl, vendor.apiToken);
        console.log('Device profiles response:', JSON.stringify(profilesData, null, 2));
        // Fetch properties for each profile
        if (profilesData.result?.contents) {
          for (const profile of profilesData.result.contents) {
            try {
              const propsData = await api.getDeviceProfileProperties(
                vendor.apiBaseUrl,
                vendor.apiToken,
                profile.id
              );
              if (propsData.result && Array.isArray(propsData.result)) {
                // Filter only sensor properties (type: 'in')
                const sensors = propsData.result
                  .filter((prop: any) => prop.type === 'in' && prop.status === 'active')
                  .map((prop: any) => ({
                    id: `sensor-${prop.id}`,
                    name: prop.name,
                    type: prop.dataType === 'number' ? 'number' : 'string',
                    min: prop.minThreshold ? parseFloat(prop.minThreshold) : undefined,
                    max: prop.maxThreshold ? parseFloat(prop.maxThreshold) : undefined,
                    unit: prop.unit || undefined,
                    icon: '📊',
                  }));
                deviceProfiles.set(profile.id, sensors);
              }
            } catch (err) {
              console.error(`Failed to fetch properties for profile ${profile.id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch device profiles:', err);
      }

      // Process and add devices
      let importCount = 0;
      let devicesArray: any[] = [];

      // Handle different response structures
      if (responseData.result && responseData.result.contents && Array.isArray(responseData.result.contents)) {
        // Vendor API structure: { result: { contents: [...] } }
        console.log('Using result.contents structure');
        devicesArray = responseData.result.contents;
      } else if (Array.isArray(responseData)) {
        // Direct array structure
        console.log('Using direct array structure');
        devicesArray = responseData;
      } else if (responseData.devices && Array.isArray(responseData.devices)) {
        // Wrapped in devices property
        console.log('Using devices property structure');
        devicesArray = responseData.devices;
      } else if (responseData.result && Array.isArray(responseData.result)) {
        // Result is directly an array
        console.log('Using result array structure');
        devicesArray = responseData.result;
      }

      console.log('Final devicesArray length:', devicesArray.length);
      console.log('First device sample:', devicesArray[0]);

      // Extract API vendorId from first device and save to vendor
      if (devicesArray.length > 0 && devicesArray[0].vendorId) {
        const apiVendorId = devicesArray[0].vendorId;
        if (vendor.apiVendorId !== apiVendorId) {
          updateVendor(vendor.id, { apiVendorId });
          addLog({
            level: 'info',
            protocol: 'HTTP',
            message: `Saved API Vendor ID: ${apiVendorId} for ${vendor.name}`,
          });
        }
      }

      devicesArray.forEach((apiDevice: any) => {
        // Check if device already exists
        const existingDevice = devices.find(d => d.customId === apiDevice.customId);
        if (existingDevice) {
          addLog({
            level: 'info',
            protocol: 'HTTP',
            message: `Skipped duplicate device: ${apiDevice.name || apiDevice.customId}`,
          });
          return;
        }

        // Get sensors for this device's profile
        const profileSensors = apiDevice.deviceProfileId
          ? deviceProfiles.get(apiDevice.deviceProfileId) || []
          : [];

        // Map API device structure to our Device type
        const device = {
          id: Math.random().toString(36).substr(2, 9),
          name: apiDevice.name || `Device ${apiDevice.id}`,
          customId: apiDevice.customId || apiDevice.id?.toString() || `device_${importCount}`,
          vendorId: vendor.id,
          interval: 5000,
          sensors: profileSensors,
          geoEnabled: !!(apiDevice.setupLat && apiDevice.setupLon),
          geo: (apiDevice.setupLat && apiDevice.setupLon) ? {
            lat: apiDevice.setupLat,
            lon: apiDevice.setupLon,
            alt: apiDevice.setupAlt,
          } : undefined,
          randomWalk: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        addDevice(device);
        importCount++;
      });

      addLog({
        level: 'success',
        protocol: 'HTTP',
        message: `Imported ${importCount} devices from ${vendor.name} (Total found: ${devicesArray.length})`,
      });

      if (importCount === 0 && devicesArray.length === 0) {
        alert('No devices found to import.');
      } else if (importCount === 0) {
        alert(`Found ${devicesArray.length} devices but all were duplicates.`);
      } else {
        alert(`Successfully imported ${importCount} new devices from ${vendor.name}`);
      }
    } catch (error: any) {
      addLog({
        level: 'error',
        protocol: 'HTTP',
        message: `Failed to import devices from ${vendor.name}: ${error.message}`,
      });
      alert(`Failed to import devices: ${error.message}`);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Vendors</h1>
          <p className="text-neutral-600">Manage your IoT platform vendors</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Vendor
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No vendors yet</h3>
          <p className="text-neutral-600 mb-6">
            Create your first vendor to manage multiple IoT platforms
          </p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Create First Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vendors.map((vendor) => {
            const deviceCount = getVendorDeviceCount(vendor.id);
            return (
              <div
                key={vendor.id}
                className="card hover:shadow-medium transition-shadow"
                style={{ borderLeft: `4px solid ${vendor.color || '#0ea5e9'}` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: vendor.color + '20' || '#e0f2fe' }}
                      >
                        <Server
                          className="w-5 h-5"
                          style={{ color: vendor.color || '#0ea5e9' }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-neutral-900">{vendor.name}</h3>
                        {vendor.description && (
                          <p className="text-sm text-neutral-600">{vendor.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* HTTP API */}
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-neutral-600">HTTP API</span>
                      {vendor.apiEnabled && vendor.apiToken ? (
                        <span className="badge badge-success text-xs">
                          <LogIn className="w-3 h-3 mr-1" />
                          Connected
                        </span>
                      ) : (
                        <span className="badge bg-neutral-200 text-neutral-600 text-xs">
                          Disabled
                        </span>
                      )}
                    </div>
                    {vendor.apiEnabled && (
                      <p className="text-xs text-neutral-500 truncate">{vendor.apiBaseUrl}</p>
                    )}
                  </div>

                  {/* MQTT */}
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-neutral-600">MQTT</span>
                      {vendor.mqttEnabled && vendor.mqttConnected ? (
                        <span className="badge badge-success text-xs">
                          <Wifi className="w-3 h-3 mr-1" />
                          Connected
                        </span>
                      ) : vendor.mqttEnabled ? (
                        <span className="badge bg-warning-100 text-warning-700 text-xs">
                          <WifiOff className="w-3 h-3 mr-1" />
                          Disconnected
                        </span>
                      ) : (
                        <span className="badge bg-neutral-200 text-neutral-600 text-xs">
                          Disabled
                        </span>
                      )}
                    </div>
                    {vendor.mqttEnabled && (
                      <p className="text-xs text-neutral-500 truncate">{vendor.mqttBrokerUrl}</p>
                    )}
                  </div>
                </div>

                {/* Device Count */}
                <div className="mb-4 p-2 bg-primary-50 rounded-lg text-center">
                  <span className="text-sm text-primary-900">
                    <strong>{deviceCount}</strong> device{deviceCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Import Devices Button */}
                {vendor.canImportDevices && (
                  <div className="mb-3">
                    <button
                      onClick={() => handleImportDevices(vendor)}
                      disabled={importing === vendor.id || !vendor.apiToken}
                      className="w-full btn-primary text-sm py-2"
                    >
                      <Download className="w-4 h-4 mr-1 inline" />
                      {importing === vendor.id ? 'Importing...' : 'Import Devices from API'}
                    </button>
                    {!vendor.apiToken && (
                      <p className="text-xs text-warning-600 mt-1 text-center">
                        Login required to import devices
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-neutral-200">
                  <button
                    onClick={() => handleEdit(vendor)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    <Edit className="w-4 h-4 mr-1 inline" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="flex-1 btn text-sm py-2 bg-error-50 text-error-700 hover:bg-error-100"
                  >
                    <Trash2 className="w-4 h-4 mr-1 inline" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vendor={editingVendor}
      />
    </div>
  );
}
