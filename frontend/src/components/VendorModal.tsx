import { useState, useEffect } from 'react';
import { X, Server, Wifi, Download, LogIn } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { mqttService } from '../services/mqtt';
import type { Vendor } from '../types';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor?: Vendor;
}

export default function VendorModal({ isOpen, onClose, vendor }: VendorModalProps) {
  const addVendor = useStore((state) => state.addVendor);
  const updateVendor = useStore((state) => state.updateVendor);
  const addLog = useStore((state) => state.addLog);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0ea5e9');

  // HTTP API
  const [apiEnabled, setApiEnabled] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiTenantCode, setApiTenantCode] = useState('');
  const [apiUsername, setApiUsername] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [apiTokenExpiration, setApiTokenExpiration] = useState('');
  const [apiVendorId, setApiVendorId] = useState<number | undefined>(undefined);

  // MQTT
  const [mqttEnabled, setMqttEnabled] = useState(false);
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState('');
  const [mqttClientId, setMqttClientId] = useState('');
  const [mqttUsername, setMqttUsername] = useState('');
  const [mqttPassword, setMqttPassword] = useState('');
  const [mqttConnected, setMqttConnected] = useState(false);

  // Device Import
  const [canImportDevices, setCanImportDevices] = useState(false);
  const [importEndpoint, setImportEndpoint] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && vendor) {
      // Edit mode
      setName(vendor.name);
      setDescription(vendor.description || '');
      setColor(vendor.color || '#0ea5e9');
      setApiEnabled(vendor.apiEnabled);
      setApiBaseUrl(vendor.apiBaseUrl);
      setApiTenantCode(vendor.apiTenantCode);
      setApiUsername(vendor.apiUsername);
      setApiPassword(vendor.apiPassword);
      setApiToken(vendor.apiToken || '');
      setApiTokenExpiration(vendor.apiTokenExpiration || '');
      setApiVendorId(vendor.apiVendorId);
      setMqttEnabled(vendor.mqttEnabled);
      setMqttBrokerUrl(vendor.mqttBrokerUrl);
      setMqttClientId(vendor.mqttClientId || '');
      setMqttUsername(vendor.mqttUsername || '');
      setMqttPassword(vendor.mqttPassword || '');
      setMqttConnected(vendor.mqttConnected);
      setCanImportDevices(vendor.canImportDevices);
      setImportEndpoint(vendor.importEndpoint || '');
    } else if (isOpen) {
      // Create mode - reset
      resetForm();
    }
  }, [isOpen, vendor]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor('#0ea5e9');
    setApiEnabled(false);
    setApiBaseUrl('');
    setApiTenantCode('');
    setApiUsername('');
    setApiPassword('');
    setApiToken('');
    setApiTokenExpiration('');
    setApiVendorId(undefined);
    setMqttEnabled(false);
    setMqttBrokerUrl('');
    setMqttClientId('');
    setMqttUsername('');
    setMqttPassword('');
    setMqttConnected(false);
    setCanImportDevices(false);
    setImportEndpoint('');
  };

  const handleAPILogin = async () => {
    if (!apiBaseUrl || !apiTenantCode || !apiUsername || !apiPassword) {
      alert('Please fill in all API credentials');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(apiBaseUrl, apiTenantCode, apiUsername, apiPassword);
      console.log('=== LOGIN DEBUG ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('response.result:', response.result);
      console.log('response.token:', response.token);

      // Handle nested result structure from vendor API
      const result = response.result || response;
      console.log('Parsed result:', result);

      const token = result.token;
      const tokenExpiration = result.tokenExpirationDate;

      console.log('Extracted token:', token);
      console.log('Extracted tokenExpiration:', tokenExpiration);

      if (!token) {
        throw new Error('No token received from API. Check console for response structure.');
      }

      // Update local state
      setApiToken(token);
      setApiTokenExpiration(tokenExpiration);

      // If editing existing vendor, immediately save token to store
      if (vendor) {
        console.log('Updating vendor in store with token');
        updateVendor(vendor.id, {
          apiToken: token,
          apiTokenExpiration: tokenExpiration
        });
      } else {
        console.log('Not updating store - vendor is new (not editing)');
      }

      addLog({
        level: 'success',
        protocol: 'HTTP',
        message: `Successfully authenticated vendor API: ${name || apiBaseUrl}`,
      });
      alert('API Login successful!');
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      // Handle both proxy error format and original API error format
      const errorMsg = error.response?.data?.message ||
                       error.response?.data?.errors?.[0]?.description ||
                       error.message;
      addLog({
        level: 'error',
        protocol: 'HTTP',
        message: `API login failed for ${name || apiBaseUrl}: ${errorMsg}`,
      });
      alert(`API Login failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMQTTConnect = async () => {
    if (!mqttBrokerUrl) {
      alert('Please enter MQTT broker URL');
      return;
    }

    setLoading(true);
    try {
      await mqttService.connect(mqttBrokerUrl, {
        clientId: mqttClientId,
        username: mqttUsername,
        password: mqttPassword,
      });
      setMqttConnected(true);
      addLog({
        level: 'success',
        protocol: 'MQTT',
        message: `Connected to ${name || mqttBrokerUrl}`,
      });
      alert('MQTT connected successfully!');
    } catch (error: any) {
      addLog({
        level: 'error',
        protocol: 'MQTT',
        message: `MQTT connection failed for ${name || mqttBrokerUrl}: ${error.message}`,
      });
      alert(`MQTT connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMQTTDisconnect = () => {
    mqttService.disconnect();
    setMqttConnected(false);
    addLog({
      level: 'info',
      protocol: 'MQTT',
      message: `Disconnected from ${name || mqttBrokerUrl}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter vendor name');
      return;
    }

    if (apiEnabled && !apiBaseUrl) {
      alert('Please enter API Base URL');
      return;
    }

    if (mqttEnabled && !mqttBrokerUrl) {
      alert('Please enter MQTT Broker URL');
      return;
    }

    const vendorData: Vendor = {
      id: vendor?.id || Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      description: description.trim(),
      color,
      apiEnabled,
      apiBaseUrl,
      apiTenantCode,
      apiUsername,
      apiPassword,
      apiToken,
      apiTokenExpiration,
      apiVendorId,
      mqttEnabled,
      mqttBrokerUrl,
      mqttClientId,
      mqttUsername,
      mqttPassword,
      mqttConnected,
      canImportDevices,
      importEndpoint,
      createdAt: vendor?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (vendor) {
      updateVendor(vendor.id, vendorData);
      addLog({
        level: 'info',
        protocol: 'SYSTEM',
        message: `Updated vendor: ${name}`,
      });
    } else {
      addVendor(vendorData);
      addLog({
        level: 'info',
        protocol: 'SYSTEM',
        message: `Created vendor: ${name}`,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-hard max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Server className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                {vendor ? 'Edit Vendor' : 'Create New Vendor'}
              </h2>
              <p className="text-sm text-neutral-600">Configure vendor API and MQTT connections</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="e.g., Skywave IoT Platform"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Brief description of this vendor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Color Theme
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-neutral-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* HTTP API Configuration */}
          <div className="mb-6 p-4 border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">HTTP API Configuration</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiEnabled}
                  onChange={(e) => setApiEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-neutral-700">Enable HTTP API</span>
              </label>
            </div>

            {apiEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    API Base URL *
                  </label>
                  <input
                    type="text"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    className="input"
                    placeholder="http://api.example.com:8080"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tenant Code
                  </label>
                  <input
                    type="text"
                    value={apiTenantCode}
                    onChange={(e) => setApiTenantCode(e.target.value)}
                    className="input"
                    placeholder="TENANT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    API Vendor ID
                  </label>
                  <input
                    type="number"
                    value={apiVendorId || ''}
                    onChange={(e) => setApiVendorId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input"
                    placeholder="Auto-filled on device import"
                    readOnly={!!apiVendorId}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {apiVendorId
                      ? `✅ Automatically retrieved from API (ID: ${apiVendorId})`
                      : '💡 Will be auto-filled when you import devices from this vendor'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={apiUsername}
                    onChange={(e) => setApiUsername(e.target.value)}
                    className="input"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={apiPassword}
                    onChange={(e) => setApiPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleAPILogin}
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    <LogIn className="w-4 h-4 mr-2 inline" />
                    {loading ? 'Logging in...' : 'Login & Get Token'}
                  </button>
                </div>

                {apiToken && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Auth Token
                    </label>
                    <textarea
                      value={apiToken}
                      readOnly
                      className="input font-mono text-xs"
                      rows={2}
                    />
                    <p className="text-xs text-neutral-600 mt-1">
                      Expires: {new Date(apiTokenExpiration).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MQTT Configuration */}
          <div className="mb-6 p-4 border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">MQTT Configuration</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mqttEnabled}
                  onChange={(e) => setMqttEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-neutral-700">Enable MQTT</span>
              </label>
            </div>

            {mqttEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Broker URL (WebSocket) *
                  </label>
                  <input
                    type="text"
                    value={mqttBrokerUrl}
                    onChange={(e) => setMqttBrokerUrl(e.target.value)}
                    className="input"
                    placeholder="ws://mqtt.example.com:1883"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Client ID (optional)
                  </label>
                  <input
                    type="text"
                    value={mqttClientId}
                    onChange={(e) => setMqttClientId(e.target.value)}
                    className="input"
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={mqttUsername}
                    onChange={(e) => setMqttUsername(e.target.value)}
                    className="input"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={mqttPassword}
                    onChange={(e) => setMqttPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  {mqttConnected ? (
                    <button
                      type="button"
                      onClick={handleMQTTDisconnect}
                      className="btn-danger w-full"
                    >
                      <Wifi className="w-4 h-4 mr-2 inline" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMQTTConnect}
                      disabled={loading}
                      className="btn-success w-full"
                    >
                      <Wifi className="w-4 h-4 mr-2 inline" />
                      {loading ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Device Import */}
          <div className="mb-6 p-4 border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Device Import</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canImportDevices}
                  onChange={(e) => setCanImportDevices(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-neutral-700">Enable Device Import</span>
              </label>
            </div>

            {canImportDevices && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Import Endpoint
                </label>
                <input
                  type="text"
                  value={importEndpoint}
                  onChange={(e) => setImportEndpoint(e.target.value)}
                  className="input"
                  placeholder="/api/devices"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  API endpoint to fetch devices from vendor platform
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {vendor ? 'Update Vendor' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
