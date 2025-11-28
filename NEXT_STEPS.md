# 🚀 Next Steps - IoT Simulator Platform

## ✅ Yapılanlar (Completed)
- ✅ Project structure (frontend + backend + Docker)
- ✅ Backend API with Express + TypeScript
- ✅ MQTT WebSocket Proxy
- ✅ Winston Logging System
- ✅ React + Vite + TypeScript frontend
- ✅ Tailwind CSS clean light theme
- ✅ Zustand state management
- ✅ Basic routing (Dashboard, Devices, Logs pages)

## 🔧 Manual File Update Needed

App.tsx dosyasını manuel olarak değiştirmen lazım:

1. `frontend/src/App.tsx` dosyasını aç
2. Tüm içeriğini sil
3. Aşağıdaki kodu yapıştır:

```typescript
import { useState, useEffect } from 'react'
import { Cpu, Settings, LayoutDashboard, Database, Activity, FileText } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import DevicesPage from './pages/DevicesPage'
import LogsPage from './pages/LogsPage'

type Page = 'dashboard' | 'devices' | 'simulator' | 'logs' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2) as Page
      if (hash) setCurrentPage(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (page: Page) => {
    window.location.hash = `#/${page}`
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'devices': return <DevicesPage />
      case 'logs': return <LogsPage />
      default: return <div className="card p-12 text-center"><h2 className="text-2xl font-bold">Coming Soon</h2></div>
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">IoT Simulator</h1>
              <p className="text-xs text-neutral-500">Device Platform</p>
            </div>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'devices', label: 'Devices', icon: Database },
              { id: 'simulator', label: 'Simulator', icon: Activity },
              { id: 'logs', label: 'Logs', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id as Page)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-success-700 font-medium">System Online</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">{renderPage()}</div>
      </main>
    </div>
  )
}

export default App
```

4. Kaydet ve tarayıcıyı yenile

## 📋 Sonraki Adımlar

1. **Test Navigation** - Sidebar menüsünden tıkla, sayfalar arası geçiş test et
2. **Device Management** - Add Device butonu + modal ekle
3. **Settings Page** - API & MQTT ayarları
4. **Simulation Engine** - Gerçek veri gönderme
5. **Charts** - Recharts ile grafikler

## 🎯 Priority Features

- Device CRUD operations
- HTTP API integration
- MQTT integration  
- Scenario recording
- Bulk device creation

Hazır olunca söyle, devam edelim!
