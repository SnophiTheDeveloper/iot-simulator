import { useState } from 'react';
import { Save, LogIn, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { mqttService } from '../services/mqtt';

export default function SettingsPage() {
  const apiSettings = useStore((state) => state.apiSettings);
  const mqttSettings = useStore((state) => state.mqttSettings);
  const updateAPISettings = useStore((state) => state.updateAPISettings);
  const updateMQTTSettings = useStore((state) => state.updateMQTTSettings);
  const addLog = useStore((state) => state.addLog);

  const [apiForm, setApiForm] = useState({
    baseUrl: apiSettings.baseUrl,
    tenantCode: apiSettings.tenantCode,
    username: apiSettings.username,
    password: apiSettings.password,
  });

  const [mqttForm, setMqttForm] = useState({
    brokerUrl: mqttSettings.brokerUrl,
    clientId: mqttSettings.clientId || '',
    username: mqttSettings.username || '',
    password: mqttSettings.password || '',
  });

  const [loading, setLoading] = useState(false);
  const [mqttConnecting, setMqttConnecting] = useState(false);

  const handleAPILogin = async () => {
    if (!apiForm.baseUrl || !apiForm.tenantCode || !apiForm.username || !apiForm.password) {
      alert('Please fill in all API credentials');
      return;
    }

    setLoading(true);
    try {
      const result = await api.login(apiForm.tenantCode, apiForm.username, apiForm.password);

      updateAPISettings({
        baseUrl: apiForm.baseUrl,
        tenantCode: apiForm.tenantCode,
        username: apiForm.username,
        password: apiForm.password,
        token: result.token,
        tokenExpirationDate: result.tokenExpirationDate,
      });

      addLog({
        level: 'success',
        protocol: 'HTTP',
        message: `Successfully logged in as ${apiForm.username}`,
      });

      alert('Login successful! Token received.');
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors?.[0]?.description || error.message || 'Login failed';
      addLog({
        level: 'error',
        protocol: 'HTTP',
        message: `Login failed: ${errorMsg}`,
      });
      alert(`Login failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMQTTConnect = async () => {
    if (!mqttForm.brokerUrl) {
      alert('Please enter MQTT broker URL');
      return;
    }

    setMqttConnecting(true);
    try {
      await mqttService.connect(mqttForm.brokerUrl, {
        clientId: mqttForm.clientId,
        username: mqttForm.username,
        password: mqttForm.password,
      });

      updateMQTTSettings({
        brokerUrl: mqttForm.brokerUrl,
        clientId: mqttForm.clientId,
        username: mqttForm.username,
        password: mqttForm.password,
        connected: true,
      });

      addLog({
        level: 'success',
        protocol: 'MQTT',
        message: `Connected to ${mqttForm.brokerUrl}`,
      });

      alert('MQTT connected successfully!');
    } catch (error: any) {
      addLog({
        level: 'error',
        protocol: 'MQTT',
        message: `Connection failed: ${error.message}`,
      });
      alert(`MQTT connection failed: ${error.message}`);
    } finally {
      setMqttConnecting(false);
    }
  };

  const handleMQTTDisconnect = () => {
    mqttService.disconnect();
    updateMQTTSettings({ connected: false });
    addLog({
      level: 'info',
      protocol: 'MQTT',
      message: 'Disconnected from broker',
    });
  };

  const saveAPISettings = () => {
    updateAPISettings({
      baseUrl: apiForm.baseUrl,
      tenantCode: apiForm.tenantCode,
      username: apiForm.username,
      password: apiForm.password,
    });
    alert('API settings saved!');
  };

  const saveMQTTSettings = () => {
    updateMQTTSettings({
      brokerUrl: mqttForm.brokerUrl,
      clientId: mqttForm.clientId,
      username: mqttForm.username,
      password: mqttForm.password,
    });
    alert('MQTT settings saved!');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Settings</h1>
        <p className="text-neutral-600">Configure API and MQTT connections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HTTP API Settings */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900">HTTP API Settings</h2>
            {apiSettings.token && (
              <span className="badge badge-success">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                API Base URL
              </label>
              <input
                type="text"
                value={apiForm.baseUrl}
                onChange={(e) => setApiForm({ ...apiForm, baseUrl: e.target.value })}
                className="input"
                placeholder="http://test-skywaveapi.innova.com.tr:30080"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tenant Code
              </label>
              <input
                type="text"
                value={apiForm.tenantCode}
                onChange={(e) => setApiForm({ ...apiForm, tenantCode: e.target.value })}
                className="input"
                placeholder="TMP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={apiForm.username}
                onChange={(e) => setApiForm({ ...apiForm, username: e.target.value })}
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
                value={apiForm.password}
                onChange={(e) => setApiForm({ ...apiForm, password: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </div>

            {apiSettings.token && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Auth Token
                </label>
                <textarea
                  value={apiSettings.token}
                  readOnly
                  className="input font-mono text-xs"
                  rows={3}
                />
                <p className="text-xs text-neutral-600 mt-1">
                  Expires: {new Date(apiSettings.tokenExpirationDate).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAPILogin}
                disabled={loading}
                className="btn-primary flex-1"
              >
                <LogIn className="w-4 h-4 mr-2 inline" />
                {loading ? 'Logging in...' : 'Login & Get Token'}
              </button>
              <button onClick={saveAPISettings} className="btn-secondary">
                <Save className="w-4 h-4 mr-2 inline" />
                Save
              </button>
            </div>
          </div>
        </div>

        {/* MQTT Settings */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900">MQTT Settings</h2>
            {mqttSettings.connected ? (
              <span className="badge badge-success">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </span>
            ) : (
              <span className="badge bg-neutral-100 text-neutral-600">
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Broker URL (WebSocket)
              </label>
              <input
                type="text"
                value={mqttForm.brokerUrl}
                onChange={(e) => setMqttForm({ ...mqttForm, brokerUrl: e.target.value })}
                className="input"
                placeholder="ws://test-skywave-mqtt.innova.com.tr:61626"
              />
              <p className="text-xs text-neutral-600 mt-1">
                Use ws:// for non-secure or wss:// for TLS/SSL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Client ID (optional)
              </label>
              <input
                type="text"
                value={mqttForm.clientId}
                onChange={(e) => setMqttForm({ ...mqttForm, clientId: e.target.value })}
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
                value={mqttForm.username}
                onChange={(e) => setMqttForm({ ...mqttForm, username: e.target.value })}
                className="input"
                placeholder="username@tenantCode"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password (optional)
              </label>
              <input
                type="password"
                value={mqttForm.password}
                onChange={(e) => setMqttForm({ ...mqttForm, password: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-3">
              {mqttSettings.connected ? (
                <button onClick={handleMQTTDisconnect} className="btn-danger flex-1">
                  <WifiOff className="w-4 h-4 mr-2 inline" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleMQTTConnect}
                  disabled={mqttConnecting}
                  className="btn-success flex-1"
                >
                  <Wifi className="w-4 h-4 mr-2 inline" />
                  {mqttConnecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
              <button onClick={saveMQTTSettings} className="btn-secondary">
                <Save className="w-4 h-4 mr-2 inline" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
        <h3 className="font-semibold text-primary-900 mb-2">Connection Tips</h3>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>• HTTP API requires login to get authentication token</li>
          <li>• MQTT WebSocket protocol is required for browser connections</li>
          <li>• Both connections are optional - use what you need</li>
          <li>• Settings are automatically saved to browser storage</li>
        </ul>
      </div>
    </div>
  );
}
