# 🌐 Modern IoT Simulator Platform

Professional, modular IoT device simulator with multi-vendor support, React frontend, Node.js backend, and Docker deployment.

## ✨ Features

### 🎯 Core Features
- ✅ **Multi-Vendor Architecture** - Manage multiple IoT platforms with separate HTTP and MQTT configurations
- ✅ **Vendor Device Import** - Automatically import devices from vendor APIs
- ✅ **Unlimited Device Management** - Create, group, and manage unlimited IoT devices per vendor
- ✅ **Device Groups & Templates** - Organize devices in folders and use 6 pre-built templates
- ✅ **Bulk Device Creation** - Create multiple devices at once with auto-incrementing IDs
- ✅ **Scenario Recording** - Save and replay data patterns
- ✅ **HTTP & MQTT Support** - Dual protocol support per vendor with WebSocket proxy
- ✅ **Real-time Dashboard** - Monitor all metrics in real-time (RPM, uptime, success/fail rates)
- ✅ **Comprehensive Logging** - Detailed operation logs with filtering, export, and auto-scroll
- ✅ **Clean Modern UI** - Light theme with professional design and color-coded vendors
- ✅ **Multi-tenant Support** - Handle multiple API endpoints per vendor
- ✅ **Docker Ready** - One-command deployment

### 📦 Device Templates
- Temperature Sensor
- Humidity Sensor
- Smart Meter
- GPS Tracker
- Air Quality Monitor
- Motion Detector

### 📊 Sensor Types
- Number (min/max range)
- Boolean (true/false)
- String (comma-separated values)
- JSON (complex data structures)
- GPS coordinates
- Custom sensors

## 🏗️ Architecture Overview

### Multi-Vendor System
The simulator supports multiple IoT vendors simultaneously. Each vendor has:
- **Separate HTTP API Configuration**: Base URL, tenant code, username, password, token
- **Separate MQTT Broker Configuration**: Broker URL, client ID, credentials, connection status
- **Device Import Capability**: Fetch devices from vendor's API endpoint
- **Color-coded UI**: Visual distinction between vendors
- **Independent Connections**: Each vendor maintains its own HTTP and MQTT connections

### Data Flow
1. User creates vendors with their API/MQTT configurations
2. User creates devices and assigns them to vendors
3. Simulator generates random data based on sensor configurations
4. Data is sent via vendor's HTTP API and/or MQTT broker
5. Real-time statistics and logs track all operations

## 🚀 Quick Start

### Prerequisites
- **For Web Application**: Node.js 18+ and npm 9+, Docker and Docker Compose (optional)
- **For CLI Tool**: Python 3.7+ (lightweight, no Node.js required)

### CLI Tool (Python - Lightweight)

Perfect for servers without Node.js or when you just need basic device management.

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the CLI:**
```bash
python iot_cli.py
```

3. **Features:**
   - ✅ Login to vendor API
   - ✅ List device profiles
   - ✅ Import devices from API
   - ✅ Bulk create devices with auto-incrementing names
   - ✅ Send test data (basic simulator)
   - ✅ No database or complex setup needed
   - ✅ Works on any server with Python

**Example workflow:**
```
1. Login to Vendor API → Enter credentials
2. List Device Profiles → Note the profile ID
3. Bulk Create Devices → Enter count, prefix, profile ID
4. Send Test Data → Test individual device
```

### Development Mode (Web Application)

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Start development servers:**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Docker Deployment

1. **Build and run with Docker:**
```bash
npm run docker:build
npm run docker:up
```

2. **Access the application:**
- Frontend: http://localhost
- Backend API: http://localhost:3001

3. **Stop containers:**
```bash
npm run docker:down
```

## 📁 Project Structure

```
ModulerSimulator/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── DeviceModal.tsx       # Device creation/edit with templates
│   │   │   └── VendorModal.tsx       # Vendor management with API/MQTT config
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx         # Real-time stats and metrics
│   │   │   ├── VendorsPage.tsx       # Vendor CRUD operations
│   │   │   ├── DevicesPage.tsx       # Device management
│   │   │   ├── SimulatorPage.tsx     # Device simulation control
│   │   │   ├── LogsPage.tsx          # Operation logs
│   │   │   └── SettingsPage.tsx      # Global settings (legacy)
│   │   ├── services/      # API and MQTT services
│   │   │   ├── api.ts                # HTTP API client
│   │   │   └── mqtt.ts               # MQTT client
│   │   ├── store/         # State management (Zustand)
│   │   │   └── useStore.ts           # Global state with persistence
│   │   ├── types/         # TypeScript types
│   │   │   └── index.ts              # All type definitions
│   │   └── utils/         # Utility functions
│   ├── Dockerfile
│   └── package.json
├── backend/               # Node.js + Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── mqtt/          # MQTT WebSocket proxy
│   │   │   └── proxy.ts              # WebSocket to TCP proxy
│   │   └── utils/         # Utility functions
│   │       └── logger.ts             # Winston logging
│   ├── logs/              # Application logs
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml     # Docker orchestration
└── package.json           # Root package.json
```

## 🎨 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety with strict mode
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management with persistence
- **Recharts** - Data visualization
- **MQTT.js** - MQTT client for browser
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **MQTT.js** - MQTT broker client
- **WebSocket** - MQTT proxy for browser clients
- **Winston** - Logging with file rotation
- **Cors** - CORS handling

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Frontend serving (in production)

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
```

## 📖 Usage Guide

### 1. Vendor Management

#### Create a Vendor
1. Go to **Vendors** page
2. Click **"Add Vendor"**
3. Fill in vendor details:
   - Name and description
   - Choose a color for visual distinction
4. Configure **HTTP API** (if needed):
   - Enable HTTP API
   - Enter base URL (e.g., `http://api.example.com:8080`)
   - Enter tenant code, username, password
   - Click **"Test Login"** to authenticate
   - Token will be saved automatically
5. Configure **MQTT** (if needed):
   - Enable MQTT
   - Enter broker URL (e.g., `ws://mqtt.example.com:1883`)
   - (Optional) Enter client ID and credentials
   - Click **"Connect"** to establish connection
6. Configure **Device Import** (optional):
   - Enable device import
   - Enter API endpoint for fetching devices
7. Click **"Save"**

#### Import Devices from Vendor
1. Ensure vendor has:
   - HTTP API enabled and logged in
   - Device import configured with endpoint
2. On vendor card, click **"Import Devices from API"**
3. Devices will be fetched and added automatically
4. Check **Logs** page for import details

### 2. Device Management

#### Create a Single Device
1. Go to **Devices** page
2. Click **"Add Device"**
3. Fill in device details:
   - Name and custom ID
   - **Select vendor** (required)
   - (Optional) Custom interval in milliseconds
4. Add sensors:
   - **Use templates**: Click template button for pre-configured sensors
   - **Add custom sensors**: Click "Add Sensor"
     - Enter sensor code and name
     - Choose type (number, boolean, string, JSON)
     - Configure range/values based on type
5. Configure GPS (optional):
   - Enable geo location
   - Enter latitude and longitude
   - Enable random walk for simulated movement
6. Click **"Save"**

#### Bulk Create Devices
1. Click **"Bulk Create"**
2. Choose a device template
3. Specify quantity
4. Select vendor
5. Devices will be created with auto-incremented IDs

#### Device Templates
- **Temperature Sensor**: Single temperature sensor (20-30°C)
- **Humidity Sensor**: Single humidity sensor (40-60%)
- **Smart Meter**: Power, voltage, current sensors
- **GPS Tracker**: GPS coordinates with random walk
- **Air Quality Monitor**: CO2, PM2.5, temperature, humidity
- **Motion Detector**: Motion boolean sensor

### 3. Running Simulations

#### Start Single Device
1. Go to **Simulator** page
2. Configure settings:
   - Set default interval (applies to devices without custom interval)
   - Enable HTTP and/or MQTT protocols
3. Check devices you want to simulate
4. Click **"Start"** button on device card
5. Monitor real-time stats:
   - Messages sent
   - Last message time
   - Success/fail counts

#### Start Multiple Devices
1. Select devices using checkboxes
2. Click **"Start Selected (X)"** button
3. All selected devices will start simultaneously

#### Stop Simulations
- Single device: Click **"Stop"** on device card
- Multiple devices: Click **"Stop Selected (X)"**

### 4. Monitoring & Logs

#### Dashboard
- **Total Requests**: All HTTP/MQTT requests sent
- **Success Rate**: Successful transmissions
- **RPM (Requests Per Minute)**: Real-time throughput
- **Active Simulations**: Currently running devices
- **Uptime**: Time since first simulation started

#### Logs Page
- **Filter by level**: All / Success / Error / Info
- **Auto-scroll**: Toggle to follow latest logs
- **Export**: Download logs as .txt file
- **View payloads**: Expand to see full JSON data
- **Protocol tags**: HTTP, MQTT, SIM (simulator), SYSTEM

### 5. Scenario Management (Coming Soon)

1. **Record Scenario:**
   - Start device simulation
   - Click "Record Scenario"
   - Stop when done
   - Name and save scenario

2. **Replay Scenario:**
   - Go to Scenarios page
   - Select saved scenario
   - Click "Replay"

## 🔄 Data Flow Details

### HTTP Transmission
1. Simulator generates data points based on sensor configuration
2. Data formatted as array of `DataPoint` objects:
```json
[
  {
    "customDeviceId": "DEVICE_001",
    "sensorCode": "TEMP",
    "timestamp": "2025-01-10T12:00:00.000+03:00",
    "value": 25.5
  }
]
```
3. Sent to vendor's `{apiBaseUrl}/v1/device/device-data` endpoint
4. Uses vendor's API token in `x-xsrf-token` header
5. Response logged and stats updated

### MQTT Transmission
1. Simulator connects to vendor's MQTT broker via WebSocket proxy
2. Data published to topic: `devices/{customDeviceId}/telemetry`
3. Payload is JSON array of data points
4. QoS 0 (fire and forget)
5. Connection status tracked per vendor

### Data Generation
- **Number sensors**: Random value between min and max
- **Boolean sensors**: Random true/false
- **String sensors**: Random selection from comma-separated values
- **JSON sensors**: Complex objects (e.g., GPS coordinates)
- **GPS with random walk**: Coordinates drift slightly each interval

## 🔧 Advanced Configuration

### Custom Intervals
- **Global interval**: Default for all devices (set in Simulator page)
- **Device interval**: Override global interval per device
- **Range**: 1000ms (1 second) to unlimited
- **Recommendation**: 5000ms (5 seconds) for testing

### Vendor-Specific Routing
Each device sends data through its assigned vendor:
- Device → Vendor → HTTP API (if vendor.apiEnabled && vendor.apiToken)
- Device → Vendor → MQTT Broker (if vendor.mqttEnabled && vendor.mqttConnected)
- Multiple vendors can run simultaneously
- Each vendor maintains independent connections

### State Persistence
The following data is persisted in browser localStorage:
- Vendors (credentials, tokens, connection status)
- Devices (all configuration)
- Device groups
- Scenarios
- API/MQTT settings (legacy, now per-vendor)

Data is automatically loaded on page refresh.

## 🐛 Troubleshooting

### Vendor API Login Issues
**Error: 401 Unauthorized**
- Check tenant code, username, and password
- Ensure API base URL is correct
- Try logging in with Postman first to verify credentials

**Error: Network Error**
- Check if API URL is accessible
- Verify CORS is enabled on API server
- Check browser console for detailed error

### MQTT Connection Issues
**Error: Connection failed**
- Ensure WebSocket URL starts with `ws://` or `wss://`
- Check firewall/antivirus settings
- Verify broker is running and accessible
- Try connecting with MQTT.fx or MQTT Explorer first

**Disconnect after connect**
- Check broker authentication requirements
- Verify client ID is unique
- Check broker logs for rejection reason

### Device Import Issues
**Error: Device import not configured**
- Enable "Can import devices" in vendor settings
- Provide import endpoint URL (e.g., `/v1/devices`)
- Ensure API token is valid (login first)

**Error: HTTP 404 on import**
- Verify import endpoint is correct
- Check API documentation for correct path
- Test endpoint with Postman first

### Simulation Issues
**Error: Vendor not found**
- Ensure device has a vendor assigned
- Check if vendor was deleted
- Reassign device to valid vendor

**No data being sent**
- Check vendor connections (HTTP login, MQTT connect)
- Verify protocol checkboxes are enabled
- Check Logs page for error messages
- Ensure device has sensors configured

### Port Already in Use
```bash
# Kill processes on ports
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Docker Issues
```bash
# Clean Docker cache
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

### Clear Browser Data
If encountering state issues:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete `iot-simulator-storage`
4. Refresh page

## 📊 API Documentation

### Backend Endpoints

**Health Check:**
```
GET /api/health
Response: { status: "ok", timestamp: "..." }
```

**MQTT Proxy:**
```
WebSocket: ws://localhost:3001/mqtt-proxy
Purpose: Proxy WebSocket to TCP MQTT broker
```

**Logs:**
```
GET /api/logs?level=info&limit=100
Response: { logs: [...], total: 100 }

POST /api/logs/clear
Response: { message: "Logs cleared" }
```

**System Info:**
```
GET /api/system/info
Response: { uptime: 1234, memory: {...}, cpu: {...} }
```

### Vendor API Endpoints (Expected)

**Login:**
```
POST {apiBaseUrl}/v1/login/{tenantCode}
Body: { username: "...", password: "..." }
Response: { token: "...", tokenExpirationDate: "..." }
```

**Send Device Data:**
```
POST {apiBaseUrl}/v1/device/device-data
Headers: { "x-xsrf-token": "..." }
Body: [
  {
    "customDeviceId": "DEVICE_001",
    "sensorCode": "TEMP",
    "timestamp": "2025-01-10T12:00:00.000+03:00",
    "value": 25.5
  }
]
Response: { success: true }
```

**Import Devices (Optional):**
```
GET {apiBaseUrl}{importEndpoint}
Headers: { "x-xsrf-token": "..." }
Response: [
  {
    "name": "Device Name",
    "customId": "DEVICE_001",
    "sensors": [...]
  }
]
```

## 🔒 Security

- CORS configured for specific origins
- Environment variables for sensitive data
- Vendor tokens stored in localStorage (encrypted storage recommended for production)
- Passwords not persisted (only tokens)
- Logs exclude sensitive information
- No credentials in code or git

## 🎓 Development

### Adding New Features

1. Create feature branch
2. Implement in appropriate module (frontend/backend)
3. Add TypeScript types in `frontend/src/types/index.ts`
4. Update store actions in `frontend/src/store/useStore.ts`
5. Add UI components or pages
6. Update this README
7. Test thoroughly

### Code Style

- Use TypeScript strict mode
- Follow React best practices (functional components, hooks)
- Keep components small and focused
- Use Tailwind utility classes
- Consistent naming conventions
- Comprehensive error handling

### Key Design Patterns

- **Service Layer**: API and MQTT logic separated in `services/`
- **State Management**: Centralized Zustand store with persistence
- **Component Composition**: Reusable UI components
- **Type Safety**: Comprehensive TypeScript types
- **Template Pattern**: Device and sensor templates for quick creation

## 📈 Performance Considerations

- **Simulation intervals**: Avoid intervals below 1000ms for stability
- **Device limit**: No hard limit, but 100+ devices may impact browser performance
- **Log retention**: Limited to 1000 most recent logs
- **State size**: Large device lists increase localStorage size
- **MQTT connections**: One connection per vendor (not per device)

## 🗺️ Roadmap

- [x] Multi-vendor architecture
- [x] Device import from vendor APIs
- [x] Real-time dashboard with RPM
- [x] Comprehensive logging system
- [x] Device templates
- [ ] Scenario recording and replay
- [ ] Device grouping with folders
- [ ] Advanced data patterns (sine wave, step functions)
- [ ] Export/import configuration (JSON)
- [ ] User authentication
- [ ] Cloud deployment guides

## 📝 License

Private project - All rights reserved

## 🤝 Support

For issues or questions:

1. **Check logs**:
   - Frontend: Browser DevTools → Console
   - Backend: `backend/logs/`
   - Application: Logs page in UI

2. **Enable debug mode**:
   - Browser console: `localStorage.setItem('debug', 'true')`
   - Backend: Set `LOG_LEVEL=debug` in `.env`

3. **Check Docker logs**:
   ```bash
   docker-compose logs -f frontend
   docker-compose logs -f backend
   ```

4. **Verify connections**:
   - HTTP: Test vendor login in Vendors page
   - MQTT: Check connection status on vendor cards
   - Backend: Visit http://localhost:3001/api/health

## 🎉 Quick Reference

### Essential Commands
```bash
# Install everything
npm run install:all

# Development mode
npm run dev

# Docker mode
npm run docker:up

# Stop Docker
npm run docker:down

# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

### Key URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Backend Health: http://localhost:3001/api/health
- MQTT Proxy: ws://localhost:3001/mqtt-proxy

### File Locations
- Vendor config: Vendors page → Edit vendor
- Device config: Devices page → Edit device
- Simulation control: Simulator page
- Logs: Logs page → Filter/Export
- State: Browser → DevTools → Application → Local Storage → `iot-simulator-storage`

---

**Happy Simulating!** 🚀
