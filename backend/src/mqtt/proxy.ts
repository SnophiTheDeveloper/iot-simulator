import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as net from 'net';
import { logger } from '../utils/logger';

export function setupMQTTProxy(httpServer: Server): void {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/mqtt-proxy'
  });

  logger.info('MQTT WebSocket Proxy initialized on /mqtt-proxy');

  wss.on('connection', (ws: WebSocket, req) => {
    const clientIp = req.socket.remoteAddress;
    logger.info(`New WebSocket connection from ${clientIp}`);

    let tcpClient: net.Socket | null = null;
    let mqttBrokerHost: string | null = null;
    let mqttBrokerPort: number | null = null;

    // Handle first message to establish MQTT broker connection
    let isFirstMessage = true;

    ws.on('message', (data: Buffer) => {
      if (isFirstMessage) {
        // First message should contain broker information
        try {
          const config = JSON.parse(data.toString());

          if (config.type === 'connect' && config.broker) {
            mqttBrokerHost = config.broker.host;
            mqttBrokerPort = config.broker.port;

            // Validate broker settings
            if (!mqttBrokerHost || !mqttBrokerPort) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid broker configuration'
              }));
              return;
            }

            logger.info(`Connecting to MQTT broker: ${mqttBrokerHost}:${mqttBrokerPort}`);

            // Create TCP connection to MQTT broker
            tcpClient = net.connect(
              mqttBrokerPort,
              mqttBrokerHost,
              () => {
                logger.info(`Connected to MQTT broker: ${mqttBrokerHost}:${mqttBrokerPort}`);
                ws.send(JSON.stringify({ type: 'connected', status: 'success' }));
              }
            );

            // Forward data from MQTT broker to WebSocket
            tcpClient.on('data', (brokerData: Buffer) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(brokerData);
              }
            });

            // Handle TCP errors
            tcpClient.on('error', (err) => {
              logger.error('MQTT broker connection error:', err);
              ws.send(JSON.stringify({
                type: 'error',
                message: err.message
              }));
            });

            // Handle TCP close
            tcpClient.on('close', () => {
              logger.info('MQTT broker connection closed');
              if (ws.readyState === WebSocket.OPEN) {
                ws.close();
              }
            });

            isFirstMessage = false;
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'First message must be connection config'
            }));
          }
        } catch (error) {
          // If not JSON, treat as raw MQTT data (for direct connections)
          logger.warn('Received non-JSON first message, treating as raw MQTT');
          isFirstMessage = false;

          // For direct MQTT connections, we won't proxy
          // Client should send proper connection config first
        }
      } else {
        // Forward WebSocket data to MQTT broker
        if (tcpClient && !tcpClient.destroyed) {
          tcpClient.write(data);
        }
      }
    });

    ws.on('close', () => {
      logger.info(`WebSocket connection closed from ${clientIp}`);
      if (tcpClient && !tcpClient.destroyed) {
        tcpClient.end();
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error:', err);
      if (tcpClient && !tcpClient.destroyed) {
        tcpClient.end();
      }
    });
  });

  wss.on('error', (err) => {
    logger.error('WebSocket server error:', err);
  });
}
