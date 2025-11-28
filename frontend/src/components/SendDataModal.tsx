import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import type { Device } from '../types';
import { getCurrentISOTime } from '../services/api';

interface SendDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device;
  onSend: (data: { propertyName: string; value: string }[]) => void;
}

export default function SendDataModal({ isOpen, onClose, device, onSend }: SendDataModalProps) {
  const [sensorValues, setSensorValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && device) {
      // Initialize with default values
      const initialValues: Record<string, string> = {};
      device.sensors.forEach((sensor) => {
        if (sensor.type === 'number') {
          const mid = ((sensor.min || 0) + (sensor.max || 100)) / 2;
          initialValues[sensor.id] = mid.toFixed(2);
        } else if (sensor.type === 'boolean') {
          initialValues[sensor.id] = 'true';
        } else if (sensor.type === 'string' && sensor.values) {
          const values = sensor.values.split(',').map((v) => v.trim());
          initialValues[sensor.id] = values[0] || '';
        } else {
          initialValues[sensor.id] = '0';
        }
      });
      setSensorValues(initialValues);
    }
  }, [isOpen, device]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = device.sensors.map((sensor) => ({
      propertyName: sensor.name,
      value: sensorValues[sensor.id] || '0',
    }));

    onSend(data);
    onClose();
  };

  const handleValueChange = (sensorId: string, value: string) => {
    setSensorValues((prev) => ({
      ...prev,
      [sensorId]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-neutral-900">Send Custom Data</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Device Info */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">Device</div>
              <div className="font-semibold text-neutral-900">{device.name}</div>
              <div className="text-sm text-neutral-500">{device.customId}</div>
            </div>

            {/* Sensor Values */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Sensor Values</h3>
              <div className="space-y-4">
                {device.sensors.map((sensor) => (
                  <div key={sensor.id}>
                    <label className="block text-sm font-medium mb-2">
                      {sensor.name}
                      {sensor.unit && <span className="text-neutral-500 ml-1">({sensor.unit})</span>}
                    </label>

                    {sensor.type === 'number' && (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.01"
                          min={sensor.min}
                          max={sensor.max}
                          value={sensorValues[sensor.id] || '0'}
                          onChange={(e) => handleValueChange(sensor.id, e.target.value)}
                          className="input flex-1"
                        />
                        {sensor.min !== undefined && sensor.max !== undefined && (
                          <span className="text-sm text-neutral-500">
                            ({sensor.min} - {sensor.max})
                          </span>
                        )}
                      </div>
                    )}

                    {sensor.type === 'boolean' && (
                      <select
                        value={sensorValues[sensor.id] || 'true'}
                        onChange={(e) => handleValueChange(sensor.id, e.target.value)}
                        className="input"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    )}

                    {sensor.type === 'string' && sensor.values && (
                      <select
                        value={sensorValues[sensor.id] || ''}
                        onChange={(e) => handleValueChange(sensor.id, e.target.value)}
                        className="input"
                      >
                        {sensor.values.split(',').map((value) => (
                          <option key={value.trim()} value={value.trim()}>
                            {value.trim()}
                          </option>
                        ))}
                      </select>
                    )}

                    {sensor.type === 'string' && !sensor.values && (
                      <input
                        type="text"
                        value={sensorValues[sensor.id] || ''}
                        onChange={(e) => handleValueChange(sensor.id, e.target.value)}
                        className="input"
                      />
                    )}

                    {sensor.type === 'json' && (
                      <textarea
                        value={sensorValues[sensor.id] || '{}'}
                        onChange={(e) => handleValueChange(sensor.id, e.target.value)}
                        className="input font-mono text-sm"
                        rows={3}
                        placeholder='{"lat": 40.0, "lon": 40.0}'
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-neutral-600 mb-2">Preview Payload</div>
              <pre className="text-xs font-mono text-neutral-800 overflow-x-auto">
                {JSON.stringify(
                  device.sensors.map((sensor) => ({
                    propertyName: sensor.name,
                    value: sensorValues[sensor.id] || '0',
                    customId: device.customId,
                    time: getCurrentISOTime(),
                  })),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          <div className="sticky bottom-0 bg-neutral-50 px-6 py-4 flex justify-end gap-3 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Send className="w-4 h-4 mr-2 inline" />
              Send Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
