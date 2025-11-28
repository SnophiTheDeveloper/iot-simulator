import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SENSOR_TEMPLATES, DEVICE_TEMPLATES, generateDeviceId, generateSensorId } from '../utils/templates';
import type { Device, Sensor } from '../types';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: Device;
}

export default function DeviceModal({ isOpen, onClose, device }: DeviceModalProps) {
  const addDevice = useStore((state) => state.addDevice);
  const updateDevice = useStore((state) => state.updateDevice);
  const vendors = useStore((state) => state.vendors);

  const [formData, setFormData] = useState({
    name: '',
    customId: '',
    vendorId: '',
    interval: 5000,
    profileId: '',
    locationId: '',
    geoEnabled: false,
    randomWalk: false,
    lat: 40.0,
    lon: 40.0,
    alt: 0,
  });

  const [sensors, setSensors] = useState<Sensor[]>([]);

  const [showSensorForm, setShowSensorForm] = useState(false);
  const [currentSensor, setCurrentSensor] = useState<Partial<Sensor>>({
    type: 'number',
  });

  // Update form when device prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (device) {
        // Edit mode - load device data
        setFormData({
          name: device.name || '',
          customId: device.customId || '',
          vendorId: device.vendorId || '',
          interval: device.interval || 5000,
          profileId: device.profileId || '',
          locationId: device.locationId || '',
          geoEnabled: device.geoEnabled || false,
          randomWalk: device.randomWalk || false,
          lat: device.geo?.lat || 40.0,
          lon: device.geo?.lon || 40.0,
          alt: device.geo?.alt || 0,
        });
        setSensors(device.sensors || []);
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          customId: '',
          vendorId: '',
          interval: 5000,
          profileId: '',
          locationId: '',
          geoEnabled: false,
          randomWalk: false,
          lat: 40.0,
          lon: 40.0,
          alt: 0,
        });
        setSensors([]);
      }
      setShowSensorForm(false);
      setCurrentSensor({ type: 'number' });
    }
  }, [isOpen, device]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.customId || !formData.vendorId || sensors.length === 0) {
      alert('Please fill in device name, custom ID, select a vendor, and add at least one sensor');
      return;
    }

    const deviceData: Device = {
      id: device?.id || generateDeviceId(),
      name: formData.name,
      customId: formData.customId,
      vendorId: formData.vendorId,
      interval: formData.interval,
      profileId: formData.profileId,
      locationId: formData.locationId,
      sensors,
      geoEnabled: formData.geoEnabled,
      geo: formData.geoEnabled
        ? {
            lat: formData.lat,
            lon: formData.lon,
            alt: formData.alt,
          }
        : undefined,
      randomWalk: formData.randomWalk,
      createdAt: device?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (device?.id) {
      updateDevice(device.id, deviceData);
    } else {
      addDevice(deviceData);
    }

    onClose();
  };

  const addSensor = () => {
    if (!currentSensor.name || !currentSensor.type) {
      alert('Please enter sensor name and type');
      return;
    }

    const newSensor: Sensor = {
      id: generateSensorId(),
      name: currentSensor.name,
      type: currentSensor.type as any,
      min: currentSensor.min,
      max: currentSensor.max,
      unit: currentSensor.unit,
      values: currentSensor.values,
      icon: currentSensor.icon,
    };

    setSensors([...sensors, newSensor]);
    setCurrentSensor({ type: 'number' });
    setShowSensorForm(false);
  };

  const removeSensor = (id: string) => {
    setSensors(sensors.filter((s) => s.id !== id));
  };

  const useTemplate = (templateId: string) => {
    const template = DEVICE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      const newSensors = template.sensors.map((s) => ({
        ...s,
        id: generateSensorId(),
      }));
      setSensors(newSensors);
      if (template.defaultGeo) {
        setFormData({ ...formData, geoEnabled: true });
      }
    }
  };

  const useSensorTemplate = (templateKey: string) => {
    const template = SENSOR_TEMPLATES[templateKey];
    if (template) {
      setCurrentSensor({ ...template });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-hard max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">
            {device ? 'Edit Device' : 'Add New Device'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device Templates */}
            {!device && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Quick Start Templates
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DEVICE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => useTemplate(template.id)}
                      className="p-4 border-2 border-neutral-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                    >
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-neutral-600 mt-1">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Temperature Sensor 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Custom ID *
                </label>
                <input
                  type="text"
                  value={formData.customId}
                  onChange={(e) => setFormData({ ...formData, customId: e.target.value })}
                  className="input"
                  placeholder="e.g., sn-0001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Vendor *
                </label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {vendors.length === 0 && (
                  <p className="text-xs text-warning-600 mt-1">
                    ⚠️ No vendors available. Please create a vendor first in the Vendors page.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Interval (ms)
                </label>
                <input
                  type="number"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: Number(e.target.value) })}
                  className="input"
                  placeholder="5000"
                  min="1000"
                  step="1000"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Data sending interval in milliseconds
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Profile ID
                </label>
                <input
                  type="text"
                  value={formData.profileId}
                  onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                  className="input"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Location ID
                </label>
                <input
                  type="text"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="input"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Geo Location */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.geoEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, geoEnabled: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-neutral-700">
                  Enable Geo Location
                </span>
              </label>

              {formData.geoEnabled && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) =>
                        setFormData({ ...formData, lat: parseFloat(e.target.value) })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lon}
                      onChange={(e) =>
                        setFormData({ ...formData, lon: parseFloat(e.target.value) })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">Altitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.alt}
                      onChange={(e) =>
                        setFormData({ ...formData, alt: parseFloat(e.target.value) })
                      }
                      className="input"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.randomWalk}
                        onChange={(e) =>
                          setFormData({ ...formData, randomWalk: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-neutral-700">
                        Enable Random Walk (simulate movement)
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Sensors */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Sensors * ({sensors.length})
                </label>
                <button
                  type="button"
                  onClick={() => setShowSensorForm(!showSensorForm)}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Add Sensor
                </button>
              </div>

              {/* Sensor Templates */}
              {showSensorForm && (
                <div className="mb-4 p-4 bg-neutral-50 rounded-xl">
                  <h4 className="text-sm font-medium mb-3">Sensor Templates</h4>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {Object.entries(SENSOR_TEMPLATES).map(([key, template]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => useSensorTemplate(key)}
                        className="p-2 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-white transition-all text-center"
                      >
                        <div className="text-2xl mb-1">{template.icon}</div>
                        <div className="text-xs font-medium">{template.name}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Sensor Form */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={currentSensor.name || ''}
                      onChange={(e) =>
                        setCurrentSensor({ ...currentSensor, name: e.target.value })
                      }
                      placeholder="Sensor name"
                      className="input"
                    />
                    <select
                      value={currentSensor.type}
                      onChange={(e) =>
                        setCurrentSensor({ ...currentSensor, type: e.target.value as any })
                      }
                      className="input"
                    >
                      <option value="number">Number</option>
                      <option value="string">String</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>

                    {currentSensor.type === 'number' && (
                      <>
                        <input
                          type="number"
                          value={currentSensor.min || ''}
                          onChange={(e) =>
                            setCurrentSensor({
                              ...currentSensor,
                              min: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Min value"
                          className="input"
                        />
                        <input
                          type="number"
                          value={currentSensor.max || ''}
                          onChange={(e) =>
                            setCurrentSensor({
                              ...currentSensor,
                              max: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Max value"
                          className="input"
                        />
                      </>
                    )}

                    {currentSensor.type === 'string' && (
                      <input
                        type="text"
                        value={currentSensor.values || ''}
                        onChange={(e) =>
                          setCurrentSensor({ ...currentSensor, values: e.target.value })
                        }
                        placeholder="Comma-separated values"
                        className="input col-span-2"
                      />
                    )}

                    <input
                      type="text"
                      value={currentSensor.unit || ''}
                      onChange={(e) =>
                        setCurrentSensor({ ...currentSensor, unit: e.target.value })
                      }
                      placeholder="Unit (optional)"
                      className="input"
                    />

                    <button type="button" onClick={addSensor} className="btn-primary">
                      Add Sensor
                    </button>
                  </div>
                </div>
              )}

              {/* Sensor List */}
              <div className="space-y-2">
                {sensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {sensor.icon} {sensor.name}
                      </div>
                      <div className="text-xs text-neutral-600">
                        {sensor.type}
                        {sensor.type === 'number' &&
                          ` (${sensor.min} - ${sensor.max}${sensor.unit ? ' ' + sensor.unit : ''})`}
                        {sensor.type === 'string' && sensor.values && ` (${sensor.values})`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSensor(sensor.id)}
                      className="p-2 hover:bg-error-100 text-error-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-neutral-200">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {device ? 'Update Device' : 'Create Device'}
          </button>
        </div>
      </div>
    </div>
  );
}
