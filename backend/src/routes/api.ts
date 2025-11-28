import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger, getLogs, clearLogs } from '../utils/logger';

const router = Router();

// ===========================================
// PROXY ENDPOINTS (to avoid CORS issues)
// ===========================================

// Proxy: Login to vendor API
router.post('/proxy/login', async (req: Request, res: Response) => {
  try {
    const { baseUrl, tenantCode, username, password } = req.body;

    if (!baseUrl || !tenantCode || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields: baseUrl, tenantCode, username, password' });
    }

    const response = await axios.post(
      `${baseUrl}/v1/login/${tenantCode}`,
      { username, password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    logger.info(`Proxy login successful for tenant: ${tenantCode}`);
    res.json(response.data);
  } catch (error: any) {
    logger.error('Proxy login failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Login failed',
      message: error.response?.data?.errors?.[0]?.description || error.message,
      details: error.response?.data
    });
  }
});

// Proxy: Send device data
router.post('/proxy/device-data', async (req: Request, res: Response) => {
  try {
    const { baseUrl, token, dataPoints } = req.body;

    if (!baseUrl || !token || !dataPoints) {
      return res.status(400).json({ error: 'Missing required fields: baseUrl, token, dataPoints' });
    }

    const response = await axios.post(
      `${baseUrl}/v1/device/device-data`,
      dataPoints,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-xsrf-token': token
        },
        timeout: 10000
      }
    );

    res.json(response.data);
  } catch (error: any) {
    logger.error('Proxy device-data failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Send data failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Proxy: Get devices from vendor
router.post('/proxy/devices', async (req: Request, res: Response) => {
  try {
    const { baseUrl, token, endpoint } = req.body;

    if (!baseUrl || !token) {
      return res.status(400).json({ error: 'Missing required fields: baseUrl, token' });
    }

    const url = endpoint ? `${baseUrl}${endpoint}` : `${baseUrl}/v1/vendor/devices`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': token
      },
      timeout: 30000
    });

    logger.info(`Proxy fetched devices from: ${url}`);
    res.json(response.data);
  } catch (error: any) {
    logger.error('Proxy get devices failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Get devices failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Proxy: Get device profiles from vendor
router.post('/proxy/device-profiles', async (req: Request, res: Response) => {
  try {
    const { baseUrl, token } = req.body;

    if (!baseUrl || !token) {
      return res.status(400).json({ error: 'Missing required fields: baseUrl, token' });
    }

    const response = await axios.get(`${baseUrl}/v1/vendor/device-profiles`, {
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': token
      },
      timeout: 10000
    });

    res.json(response.data);
  } catch (error: any) {
    logger.error('Proxy get device-profiles failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Get device profiles failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Proxy: Get device profile properties
router.post('/proxy/device-profile/property', async (req: Request, res: Response) => {
  try {
    const { baseUrl, token, profileId } = req.body;

    if (!baseUrl || !token || !profileId) {
      return res.status(400).json({ error: 'Missing required fields: baseUrl, token, profileId' });
    }

    const response = await axios.get(
      `${baseUrl}/v1/vendor/device-profile/property?profileId=${profileId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-xsrf-token': token
        },
        timeout: 10000
      }
    );

    res.json(response.data);
  } catch (error: any) {
    logger.error('Proxy get profile properties failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Get profile properties failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Proxy: Create device on vendor
router.post('/proxy/device/create', async (req: Request, res: Response) => {
  try {
    const { baseUrl, token, deviceData } = req.body;

    if (!baseUrl || !token || !deviceData) {
      return res.status(400).json({ error: 'Missing required fields: baseUrl, token, deviceData' });
    }

    const response = await axios.post(
      `${baseUrl}/v1/vendor/device`,
      deviceData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-xsrf-token': token
        },
        timeout: 10000
      }
    );

    logger.info(`Proxy created device: ${deviceData.name}`);
    res.json(response.data);
  } catch (error: any) {
    logger.error('Proxy create device failed:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Create device failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// ===========================================
// ORIGINAL ENDPOINTS
// ===========================================

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'IoT Simulator Backend'
  });
});

// Get logs
router.get('/logs', (req: Request, res: Response) => {
  try {
    const level = req.query.level as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;

    const logs = getLogs({ level, limit, fromDate });

    res.json({
      logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs', message: error.message });
  }
});

// Clear logs
router.post('/logs/clear', (req: Request, res: Response) => {
  try {
    clearLogs();
    res.json({
      success: true,
      message: 'Logs cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs', message: error.message });
  }
});

// System info
router.get('/system/info', (req: Request, res: Response) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: {
      total: process.memoryUsage().heapTotal,
      used: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
