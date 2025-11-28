import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { SENSOR_TEMPLATES } from '../utils/templates';
import type { Sensor } from '../types';
import EmojiPicker from '../components/EmojiPicker';

export default function SensorsPage() {
  const [sensors, setSensors] = useState<Record<string, Omit<Sensor, 'id'>>>(SENSOR_TEMPLATES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Omit<Sensor, 'id'>>>({
    name: '',
    type: 'number',
    icon: '📊',
  });

  const handleEdit = (key: string) => {
    setEditingKey(key);
    setFormData(sensors[key]);
    setIsModalOpen(true);
  };

  const handleDelete = (key: string) => {
    if (confirm(`Are you sure you want to delete "${sensors[key].name}" sensor?`)) {
      const newSensors = { ...sensors };
      delete newSensors[key];
      setSensors(newSensors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      alert('Please enter sensor name and type');
      return;
    }

    const key = editingKey || formData.name.toLowerCase().replace(/\s+/g, '_');

    setSensors({
      ...sensors,
      [key]: {
        name: formData.name!,
        type: formData.type as any,
        min: formData.min,
        max: formData.max,
        unit: formData.unit,
        values: formData.values,
        icon: formData.icon || '📊',
      },
    });

    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKey(null);
    setFormData({
      name: '',
      type: 'number',
      icon: '📊',
    });
  };

  const handleOpenAddModal = () => {
    setEditingKey(null);
    setFormData({
      name: '',
      type: 'number',
      icon: '📊',
    });
    setIsModalOpen(true);
  };

  const getSensorTypeColor = (type: string) => {
    switch (type) {
      case 'number':
        return 'bg-blue-100 text-blue-700';
      case 'boolean':
        return 'bg-green-100 text-green-700';
      case 'string':
        return 'bg-purple-100 text-purple-700';
      case 'json':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Sensor Templates</h1>
          <p className="text-neutral-600">Manage sensor types for your devices</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAddModal}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Sensor Template
        </button>
      </div>

      {/* Sensors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(sensors).map(([key, sensor]) => (
          <div key={key} className="card hover:shadow-medium transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{sensor.icon}</span>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">{sensor.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getSensorTypeColor(sensor.type)}`}>
                    {sensor.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Sensor Details */}
            <div className="space-y-2 mb-4">
              {sensor.type === 'number' && (sensor.min !== undefined || sensor.max !== undefined) && (
                <div className="text-sm text-neutral-600">
                  <span className="font-medium">Range:</span> {sensor.min ?? '?'} - {sensor.max ?? '?'}
                  {sensor.unit && ` ${sensor.unit}`}
                </div>
              )}

              {sensor.unit && sensor.type === 'number' && (
                <div className="text-sm text-neutral-600">
                  <span className="font-medium">Unit:</span> {sensor.unit}
                </div>
              )}

              {sensor.type === 'string' && sensor.values && (
                <div className="text-sm text-neutral-600">
                  <span className="font-medium">Values:</span>{' '}
                  <span className="text-xs">{sensor.values}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-neutral-200">
              <button
                onClick={() => handleEdit(key)}
                className="flex-1 btn-secondary text-sm py-2"
              >
                <Edit className="w-4 h-4 mr-1 inline" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(key)}
                className="flex-1 btn text-sm py-2 bg-error-50 text-error-700 hover:bg-error-100"
              >
                <Trash2 className="w-4 h-4 mr-1 inline" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-neutral-900">
                {editingKey ? 'Edit Sensor Template' : 'Add Sensor Template'}
              </h2>
              <button onClick={handleCloseModal} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sensor Name <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., temperature, humidity"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Data Type <span className="text-error-600">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    required
                  >
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="string">String</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium mb-2">Icon (Emoji)</label>
                  <EmojiPicker
                    value={formData.icon || '📊'}
                    onChange={(emoji) => setFormData({ ...formData, icon: emoji })}
                  />
                </div>

                {/* Number type fields */}
                {formData.type === 'number' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Min Value</label>
                        <input
                          type="number"
                          step="any"
                          className="input"
                          value={formData.min ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              min: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Value</label>
                        <input
                          type="number"
                          step="any"
                          className="input"
                          value={formData.max ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              max: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder="100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Unit</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.unit ?? ''}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="e.g., °C, %, ppm"
                      />
                    </div>
                  </>
                )}

                {/* String type fields */}
                {formData.type === 'string' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Possible Values (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.values ?? ''}
                      onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                      placeholder="e.g., online, offline, error"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Leave empty for free text input
                    </p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-neutral-50 px-6 py-4 flex justify-end gap-3 border-t border-neutral-200">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="w-4 h-4 mr-2 inline" />
                  {editingKey ? 'Update' : 'Create'} Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
