import { useState, useEffect } from 'react';
import { Play, StopCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

interface DeviceProfile {
  id: number;
  name: string;
  maxInactiveTime: number;
  description?: string;
}

export default function BulkDeviceCreatorPage() {
  const vendors = useStore((state) => state.vendors);
  const addLog = useStore((state) => state.addLog);

  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [deviceCount, setDeviceCount] = useState<number>(10);
  const [totalDuration, setTotalDuration] = useState<number>(10);
  const [deviceNamePrefix, setDeviceNamePrefix] = useState<string>('Device');
  const [deviceProfiles, setDeviceProfiles] = useState<DeviceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentDevice, setCurrentDevice] = useState<string>('');
  const [shouldStop, setShouldStop] = useState(false);

  // Load device profiles when vendor changes
  const handleLoadProfiles = async () => {
    if (!selectedVendor) {
      alert('Please select a vendor first');
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendor);
    if (!vendor || !vendor.apiToken) {
      alert('Vendor API token not configured');
      return;
    }

    setLoadingProfiles(true);
    try {
      const response = await api.getDeviceProfiles(vendor.apiBaseUrl, vendor.apiToken);

      // Response format: { result: [...] } (direct array, not result.contents)
      if (response.result && Array.isArray(response.result)) {
        setDeviceProfiles(response.result);
        addLog({
          protocol: 'HTTP',
          level: 'success',
          message: `Loaded ${response.result.length} device profiles`,
        });
      } else {
        setDeviceProfiles([]);
      }
    } catch (error: any) {
      addLog({
        protocol: 'HTTP',
        level: 'error',
        message: `Failed to load device profiles: ${error.message}`,
      });
      alert(`Failed to load device profiles: ${error.message}`);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Auto-load profiles when vendor changes
  useEffect(() => {
    if (selectedVendor) {
      handleLoadProfiles();
    } else {
      setDeviceProfiles([]);
      setSelectedProfileId(null);
    }
  }, [selectedVendor]);

  const handleStart = async () => {
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    if (!selectedProfileId) {
      alert('Please select a device profile');
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendor);
    if (!vendor || !vendor.apiToken) {
      alert('Vendor API token not configured');
      return;
    }

    if (!vendor.apiVendorId) {
      alert('Vendor ID is not configured. Please edit the vendor and set the Vendor ID.');
      return;
    }

    setIsCreating(true);
    setProgress(0);
    setCreatedCount(0);
    setFailedCount(0);
    setShouldStop(false);

    const delayMs = (totalDuration * 1000) / deviceCount; // milliseconds between each device creation

    for (let i = 0; i < deviceCount; i++) {
      if (shouldStop) {
        addLog({
          protocol: 'HTTP',
          level: 'info',
          message: 'Bulk device creation stopped by user',
        });
        break;
      }

      const deviceNumber = i + 1;
      const customId = `id:${deviceNamePrefix}_${deviceNumber}`;
      const deviceName = `${deviceNamePrefix}_${deviceNumber}`;

      setCurrentDevice(`${deviceName} (${customId})`);

      try {
        const deviceData = {
          brand: 'IoT Simulator',
          customId,
          name: deviceName,
          deviceProfileId: selectedProfileId,
          vendorId: vendor.apiVendorId!,
          model: 'SIM-v1',
          status: 'active', // lowercase
          transferEnabled: false,
        };

        await api.createDevice(deviceData, vendor.apiBaseUrl, vendor.apiToken);

        setCreatedCount((prev) => prev + 1);
        addLog({
          protocol: 'HTTP',
          level: 'success',
          message: `Device created: ${customId}`,
          data: deviceData,
        });
      } catch (error: any) {
        setFailedCount((prev) => prev + 1);
        addLog({
          protocol: 'HTTP',
          level: 'error',
          message: `Failed to create device ${customId}: ${error.message}`,
          data: { customId, error: error.message },
        });
      }

      setProgress(((i + 1) / deviceCount) * 100);

      // Delay before next device (except for last one)
      if (i < deviceCount - 1 && !shouldStop) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setIsCreating(false);
    setCurrentDevice('');

    addLog({
      protocol: 'HTTP',
      level: 'info',
      message: `Bulk device creation completed: ${createdCount} succeeded, ${failedCount} failed`,
    });
  };

  const handleStop = () => {
    setShouldStop(true);
    setIsCreating(false);
  };

  const handleReset = () => {
    setProgress(0);
    setCreatedCount(0);
    setFailedCount(0);
    setCurrentDevice('');
    setShouldStop(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Bulk Device Creator</h1>
        <p className="text-neutral-600">Create multiple devices on vendor platform with delay</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>

          <div className="space-y-4">
            {/* Vendor Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Vendor <span className="text-error-600">*</span>
              </label>
              <select
                className="input"
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                disabled={isCreating}
              >
                <option value="">Select a vendor...</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Count */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Devices <span className="text-error-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                className="input"
                value={deviceCount}
                onChange={(e) => setDeviceCount(parseInt(e.target.value) || 1)}
                disabled={isCreating}
              />
              <p className="text-xs text-neutral-500 mt-1">How many devices to create (1-10000)</p>
            </div>

            {/* Total Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Total Duration (seconds) <span className="text-error-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="input"
                value={totalDuration}
                onChange={(e) => setTotalDuration(parseInt(e.target.value) || 1)}
                disabled={isCreating}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Delay: ~{((totalDuration * 1000) / deviceCount).toFixed(0)}ms between each device
              </p>
            </div>

            {/* Device Name Prefix */}
            <div>
              <label className="block text-sm font-medium mb-2">Device Name Prefix</label>
              <input
                type="text"
                className="input"
                value={deviceNamePrefix}
                onChange={(e) => setDeviceNamePrefix(e.target.value)}
                placeholder="Device"
                disabled={isCreating}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Example: {deviceNamePrefix}_1, {deviceNamePrefix}_2, {deviceNamePrefix}_3, ...
              </p>
            </div>

            {/* Device Profile Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Device Profile <span className="text-error-600">*</span>
                </label>
                {selectedVendor && (
                  <button
                    onClick={handleLoadProfiles}
                    disabled={loadingProfiles || isCreating}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingProfiles ? 'animate-spin' : ''}`} />
                    Reload
                  </button>
                )}
              </div>

              {!selectedVendor ? (
                <div className="input bg-neutral-50 text-neutral-500 cursor-not-allowed">
                  Select a vendor first...
                </div>
              ) : loadingProfiles ? (
                <div className="input bg-neutral-50 text-neutral-500 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading profiles...
                </div>
              ) : deviceProfiles.length === 0 ? (
                <div className="input bg-neutral-50 text-neutral-500">
                  No device profiles found
                </div>
              ) : (
                <>
                  <select
                    className="input"
                    value={selectedProfileId || ''}
                    onChange={(e) => setSelectedProfileId(parseInt(e.target.value) || null)}
                    disabled={isCreating}
                  >
                    <option value="">Select a device profile...</option>
                    {deviceProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} (Max inactive: {profile.maxInactiveTime}s)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    {deviceProfiles.length} profile{deviceProfiles.length !== 1 ? 's' : ''} available
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {!isCreating ? (
              <>
                <button
                  className="btn-primary flex-1"
                  onClick={handleStart}
                  disabled={!selectedVendor || !selectedProfileId}
                >
                  <Play className="w-4 h-4 mr-2 inline" />
                  Start Creation
                </button>
                {(createdCount > 0 || failedCount > 0) && (
                  <button className="btn-secondary" onClick={handleReset}>
                    Reset
                  </button>
                )}
              </>
            ) : (
              <button className="btn flex-1 bg-error-600 text-white hover:bg-error-700" onClick={handleStop}>
                <StopCircle className="w-4 h-4 mr-2 inline" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Progress Panel */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Progress</h2>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="text-neutral-600">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-neutral-900">{createdCount}</div>
                <div className="text-xs text-neutral-600 mt-1">Created</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-error-600">{failedCount}</div>
                <div className="text-xs text-neutral-600 mt-1">Failed</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">{deviceCount - createdCount - failedCount}</div>
                <div className="text-xs text-neutral-600 mt-1">Remaining</div>
              </div>
            </div>

            {/* Current Device */}
            {isCreating && currentDevice && (
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="text-sm font-medium text-primary-900 mb-1">Currently Creating:</div>
                <div className="text-sm text-primary-700 font-mono">{currentDevice}</div>
              </div>
            )}

            {/* Status Message */}
            {!isCreating && (createdCount > 0 || failedCount > 0) && (
              <div
                className={`p-4 rounded-lg border ${
                  failedCount === 0
                    ? 'bg-success-50 border-success-200'
                    : createdCount === 0
                    ? 'bg-error-50 border-error-200'
                    : 'bg-warning-50 border-warning-200'
                }`}
              >
                <div className="text-sm font-medium">
                  {failedCount === 0 ? (
                    <span className="text-success-900">✓ All devices created successfully!</span>
                  ) : createdCount === 0 ? (
                    <span className="text-error-900">✗ All device creations failed</span>
                  ) : (
                    <span className="text-warning-900">⚠ Completed with some failures</span>
                  )}
                </div>
              </div>
            )}

            {/* Info */}
            {!isCreating && createdCount === 0 && failedCount === 0 && (
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Configure the settings on the left and click "Start Creation" to begin bulk device creation.
                </p>
                <p className="text-sm text-neutral-600 mt-2">
                  Devices will be created with a delay to avoid overwhelming the API.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
