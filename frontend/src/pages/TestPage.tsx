import { useState } from 'react';
import { Send, Wifi } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { mqttService } from '../services/mqtt';

export default function TestPage() {
  const vendors = useStore((state) => state.vendors);
  const addLog = useStore((state) => state.addLog);

  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [protocol, setProtocol] = useState<'http' | 'mqtt'>('http');

  // HTTP State
  const [httpPayload, setHttpPayload] = useState('[\n  {\n    "propertyName": "battery",\n    "value": "50",\n    "customId": "Device_test1",\n    "time": "2025-11-14T10:00:00+03:00"\n  }\n]');

  // MQTT State
  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttConnecting, setMqttConnecting] = useState(false);
  const [mqttTopic, setMqttTopic] = useState('data');
  const [mqttPayload, setMqttPayload] = useState('[\n  {\n    "propertyName": "battery",\n    "value": "50",\n    "customId": "Device_test1",\n    "time": "2025-11-14T10:00:00+03:00"\n  }\n]');

  const handleHttpSend = async () => {
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendor);
    if (!vendor) return;

    try {
      const payload = JSON.parse(httpPayload);
      const response = await api.sendDeviceData(payload, vendor.apiBaseUrl, vendor.apiToken!);

      addLog({
        protocol: 'HTTP',
        level: 'success',
        message: `Manual HTTP request sent successfully`,
        data: { request: payload, response },
      });

      alert('HTTP request sent successfully!');
    } catch (error: any) {
      addLog({
        protocol: 'HTTP',
        level: 'error',
        message: `Manual HTTP request failed: ${error.message}`,
        data: { error: error.message },
      });

      alert(`HTTP request failed: ${error.message}`);
    }
  };

  const handleMqttConnect = async () => {
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendor);
    if (!vendor || !vendor.mqttBrokerUrl) {
      alert('MQTT broker URL not configured for this vendor');
      return;
    }

    setMqttConnecting(true);

    try {
      await mqttService.connect(vendor.mqttBrokerUrl, {
        username: vendor.mqttUsername,
        password: vendor.mqttPassword,
      });

      setMqttConnected(true);
      setMqttConnecting(false);

      addLog({
        protocol: 'MQTT',
        level: 'success',
        message: `Manual MQTT connection established to ${vendor.mqttBrokerUrl}`,
      });

      alert('MQTT connected successfully!');
    } catch (error: any) {
      setMqttConnecting(false);
      setMqttConnected(false);

      addLog({
        protocol: 'MQTT',
        level: 'error',
        message: `Manual MQTT connection failed: ${error.message}`,
        data: {
          broker: vendor.mqttBrokerUrl,
          username: vendor.mqttUsername,
          error: error.message
        },
      });

      alert(`MQTT connection failed: ${error.message}\n\nNote: Browser MQTT requires WebSocket (ws:// or wss://). Check if broker supports WebSocket on correct port.`);
    }
  };

  const handleMqttDisconnect = () => {
    mqttService.disconnect();
    setMqttConnected(false);
    setMqttConnecting(false);

    addLog({
      protocol: 'MQTT',
      level: 'info',
      message: `Manual MQTT disconnected`,
    });
  };

  const handleMqttPublish = async () => {
    if (!mqttConnected) {
      alert('Please connect to MQTT broker first');
      return;
    }

    try {
      const payload = JSON.parse(mqttPayload);
      await mqttService.publish(mqttTopic, payload);

      addLog({
        protocol: 'MQTT',
        level: 'success',
        message: `Manual MQTT message published to ${mqttTopic}`,
        data: { topic: mqttTopic, payload },
      });

      alert('MQTT message published successfully!');
    } catch (error: any) {
      addLog({
        protocol: 'MQTT',
        level: 'error',
        message: `Manual MQTT publish failed: ${error.message}`,
      });

      alert(`MQTT publish failed: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Manual Testing</h1>
        <p className="text-neutral-600">Send manual HTTP/MQTT requests for testing</p>
      </div>

      {/* Vendor Selection */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Vendor</h2>
        <select
          className="input"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
        >
          <option value="">Select a vendor...</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
      </div>

      {/* Protocol Tabs */}
      <div className="card">
        <div className="flex gap-2 mb-6 border-b border-neutral-200">
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              protocol === 'http'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setProtocol('http')}
          >
            HTTP Request
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              protocol === 'mqtt'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            onClick={() => setProtocol('mqtt')}
          >
            MQTT Publish
          </button>
        </div>

        {/* HTTP Panel */}
        {protocol === 'http' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">HTTP Request Body (JSON)</h3>
            <textarea
              className="input font-mono text-sm"
              rows={12}
              value={httpPayload}
              onChange={(e) => setHttpPayload(e.target.value)}
              placeholder='[{"propertyName": "battery", "value": "50", "customId": "Device_test1", "time": "2025-11-14T10:00:00+03:00"}]'
            />
            <button
              className="btn-primary mt-4"
              onClick={handleHttpSend}
              disabled={!selectedVendor}
            >
              <Send className="w-4 h-4 mr-2 inline" />
              Send HTTP Request
            </button>
          </div>
        )}

        {/* MQTT Panel */}
        {protocol === 'mqtt' && (
          <div>
            {/* Help Note */}
            <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-800">
                <strong>Note:</strong> Browser MQTT requires WebSocket protocol.
                <br />
                Use <code className="px-1 py-0.5 bg-primary-100 rounded">ws://host:port</code> or{' '}
                <code className="px-1 py-0.5 bg-primary-100 rounded">wss://host:port</code> format.
                <br />
                If you enter <code className="px-1 py-0.5 bg-primary-100 rounded">mqtt://</code>, it will be converted to{' '}
                <code className="px-1 py-0.5 bg-primary-100 rounded">ws://</code>
              </p>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm font-medium">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  mqttConnecting
                    ? 'bg-warning-100 text-warning-700'
                    : mqttConnected
                    ? 'bg-success-100 text-success-700'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {mqttConnecting ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-warning-600 rounded-full mr-1.5 animate-pulse inline-block"></span>
                    Connecting...
                  </>
                ) : mqttConnected ? (
                  'Connected'
                ) : (
                  'Disconnected'
                )}
              </span>
              {!mqttConnected && !mqttConnecting ? (
                <button
                  className="btn-primary ml-auto"
                  onClick={handleMqttConnect}
                  disabled={!selectedVendor}
                >
                  <Wifi className="w-4 h-4 mr-2 inline" />
                  Connect
                </button>
              ) : mqttConnecting ? (
                <button className="btn-secondary ml-auto" onClick={handleMqttDisconnect}>
                  Cancel
                </button>
              ) : (
                <button className="btn-secondary ml-auto" onClick={handleMqttDisconnect}>
                  Disconnect
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Topic</label>
              <input
                type="text"
                className="input"
                value={mqttTopic}
                onChange={(e) => setMqttTopic(e.target.value)}
                placeholder="data"
              />
            </div>

            <h3 className="text-lg font-semibold mb-4">MQTT Payload (JSON)</h3>
            <textarea
              className="input font-mono text-sm"
              rows={12}
              value={mqttPayload}
              onChange={(e) => setMqttPayload(e.target.value)}
              placeholder='[{"propertyName": "battery", "value": "50", "customId": "Device_test1", "time": "2025-11-14T10:00:00+03:00"}]'
            />
            <button
              className="btn-primary mt-4"
              onClick={handleMqttPublish}
              disabled={!mqttConnected}
            >
              <Send className="w-4 h-4 mr-2 inline" />
              Publish Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
