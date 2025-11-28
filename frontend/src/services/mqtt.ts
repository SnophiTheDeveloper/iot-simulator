import mqtt, { MqttClient } from 'mqtt';
import type { DataPoint } from '../types';

class MQTTService {
  private client: MqttClient | null = null;
  private connected: boolean = false;
  private messageHandlers: Array<(topic: string, message: string) => void> = [];

  connect(brokerUrl: string, options?: { clientId?: string; username?: string; password?: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      // Disconnect existing connection
      if (this.client) {
        this.client.end(true);
        this.client = null;
        this.connected = false;
      }

      // Ensure broker URL has proper protocol
      // Browser MQTT.js only supports WebSocket protocols (ws:// or wss://)
      let url = brokerUrl;

      // Remove mqtt:// or mqtts:// and replace with ws:// or wss://
      if (url.startsWith('mqtt://')) {
        url = url.replace('mqtt://', 'ws://');
      } else if (url.startsWith('mqtts://')) {
        url = url.replace('mqtts://', 'wss://');
      } else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        // If no protocol, default to ws://
        url = 'ws://' + url;
      }

      const mqttOptions: any = {
        clientId: options?.clientId || `iot-sim-${Math.random().toString(16).substring(2, 10)}`,
        clean: true,
        reconnectPeriod: 0, // Disable automatic reconnection
        connectTimeout: 10000,
        keepalive: 60,
      };

      if (options?.username) {
        mqttOptions.username = options.username;
      }
      if (options?.password) {
        mqttOptions.password = options.password;
      }

      // Timeout for connection attempt
      const connectionTimeout = setTimeout(() => {
        if (!this.connected) {
          console.error('MQTT connection timeout');
          if (this.client) {
            this.client.end(true);
            this.client = null;
          }
          this.connected = false;
          reject(new Error('Connection timeout'));
        }
      }, 15000);

      try {
        this.client = mqtt.connect(url, mqttOptions);

        this.client.on('connect', () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          console.log('MQTT connected to', url);
          resolve();
        });

        this.client.on('error', (error) => {
          clearTimeout(connectionTimeout);
          console.error('MQTT error:', error);
          this.connected = false;
          if (this.client) {
            this.client.end(true);
            this.client = null;
          }
          reject(error);
        });

        this.client.on('offline', () => {
          console.log('MQTT offline');
          this.connected = false;
        });

        this.client.on('message', (topic, message) => {
          const msg = message.toString();
          this.messageHandlers.forEach((handler) => handler(topic, msg));
        });

        this.client.on('close', () => {
          console.log('MQTT connection closed');
          this.connected = false;
        });
      } catch (error) {
        clearTimeout(connectionTimeout);
        this.connected = false;
        if (this.client) {
          this.client.end(true);
          this.client = null;
        }
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  subscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connected) {
        reject(new Error('MQTT not connected'));
        return;
      }

      this.client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log('Subscribed to', topic);
          resolve();
        }
      });
    });
  }

  publish(topic: string, message: string | DataPoint[], qos: 0 | 1 | 2 = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connected) {
        reject(new Error('MQTT not connected'));
        return;
      }

      const payload = typeof message === 'string' ? message : JSON.stringify(message);

      this.client.publish(topic, payload, { qos }, (error) => {
        if (error) {
          console.error('MQTT publish error:', error);
          reject(error);
        } else {
          console.log('Published to', topic);
          resolve();
        }
      });
    });
  }

  onMessage(handler: (topic: string, message: string) => void): void {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (topic: string, message: string) => void): void {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }
}

// Export singleton instance
export const mqttService = new MQTTService();
