import { useEffect, useState } from 'react';
import { Activity, Cpu, Database, Zap, TrendingUp, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const devices = useStore((state) => state.devices);
  const simulations = useStore((state) => state.simulations);
  const stats = useStore((state) => state.stats);
  const updateStats = useStore((state) => state.updateStats);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate RPM (Requests Per Minute)
  useEffect(() => {
    if (stats.startTime && stats.totalRequests > 0) {
      const elapsed = (Date.now() - new Date(stats.startTime).getTime()) / 1000 / 60; // minutes
      const rpm = elapsed > 0 ? Math.round(stats.totalRequests / elapsed) : 0;
      updateStats({ rpm });
    }
  }, [stats.totalRequests, stats.startTime]);

  // Start stats timer if there are active simulations
  useEffect(() => {
    if (simulations.size > 0 && !stats.startTime) {
      updateStats({ startTime: new Date() });
    } else if (simulations.size === 0 && stats.startTime) {
      updateStats({ startTime: null });
    }
  }, [simulations.size]);

  const activeSimulations = simulations.size;

  const successRate =
    stats.totalRequests > 0
      ? ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
      : '0';

  const getUptime = () => {
    if (!stats.startTime) return '0s';
    const elapsed = Math.floor((currentTime.getTime() - new Date(stats.startTime).getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
        <p className="text-neutral-600">Monitor your IoT simulation platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Total Devices</p>
              <p className="text-3xl font-bold text-neutral-900">{devices.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Active Simulations</p>
              <p className="text-3xl font-bold text-success-600">{activeSimulations}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-neutral-900">{stats.totalRequests}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-success-600">{successRate}%</p>
            </div>
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-neutral-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      {activeSimulations > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-primary-700">Requests/Min</p>
              <TrendingUp className="w-4 h-4 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-primary-900">{stats.rpm}</p>
            <p className="text-xs text-primary-600 mt-1">Real-time throughput</p>
          </div>

          <div className="card bg-gradient-to-br from-success-50 to-success-100 border-success-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-success-700">Uptime</p>
              <Clock className="w-4 h-4 text-success-600" />
            </div>
            <p className="text-3xl font-bold text-success-900">{getUptime()}</p>
            <p className="text-xs text-success-600 mt-1">Since simulation start</p>
          </div>

          <div className="card bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-warning-700">Active Devices</p>
              <Activity className="w-4 h-4 text-warning-600" />
            </div>
            <p className="text-3xl font-bold text-warning-900">{activeSimulations}</p>
            <p className="text-xs text-warning-600 mt-1">Currently sending data</p>
          </div>
        </div>
      )}

      {/* Welcome Card (show when no devices) */}
      {devices.length === 0 && (
        <div className="card">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Cpu className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Welcome to IoT Simulator Platform
            </h2>
            <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
              Modern, modular IoT device simulator with React, Docker, and MQTT support.
              Create unlimited devices, manage groups, and simulate real-world IoT scenarios.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn-primary" onClick={() => window.location.hash = '#/devices'}>
                Create Your First Device
              </button>
              <button className="btn-secondary">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Protocol Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">HTTP Requests</span>
                <span className="font-medium text-neutral-900">{stats.httpCount}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalRequests > 0 ? (stats.httpCount / stats.totalRequests) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">MQTT Requests</span>
                <span className="font-medium text-neutral-900">{stats.mqttCount}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-success-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalRequests > 0 ? (stats.mqttCount / stats.totalRequests) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Request Status</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">Successful</span>
                <span className="font-medium text-success-600">{stats.successCount}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-success-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalRequests > 0 ? (stats.successCount / stats.totalRequests) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">Failed</span>
                <span className="font-medium text-error-600">{stats.failCount}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-error-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalRequests > 0 ? (stats.failCount / stats.totalRequests) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-primary-900">
            <strong>System Status:</strong> All services running • Backend connected • Ready for simulation
          </p>
        </div>
      </div>
    </div>
  );
}
