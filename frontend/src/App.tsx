import { useState, useEffect } from 'react'
import { Cpu, Settings, LayoutDashboard, Database, Activity, FileText, Server, TestTube, Zap, PlusSquare } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import VendorsPage from './pages/VendorsPage'
import DevicesPage from './pages/DevicesPage'
import SimulatorPage from './pages/SimulatorPage'
import LogsPage from './pages/LogsPage'
import SettingsPage from './pages/SettingsPage'
import TestPage from './pages/TestPage'
import SensorsPage from './pages/SensorsPage'
import BulkDeviceCreatorPage from './pages/BulkDeviceCreatorPage'

type Page = 'dashboard' | 'vendors' | 'devices' | 'sensors' | 'simulator' | 'test' | 'logs' | 'settings' | 'bulk-creator'

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
      case 'vendors': return <VendorsPage />
      case 'devices': return <DevicesPage />
      case 'sensors': return <SensorsPage />
      case 'bulk-creator': return <BulkDeviceCreatorPage />
      case 'simulator': return <SimulatorPage />
      case 'logs': return <LogsPage />
      case 'test': return <TestPage />
      case 'settings': return <SettingsPage />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen relative flex flex-col">
        <div className="p-6 flex-1">
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
              { id: 'vendors', label: 'Vendors', icon: Server },
              { id: 'devices', label: 'Devices', icon: Database },
              { id: 'sensors', label: 'Sensors', icon: Zap },
              { id: 'bulk-creator', label: 'Bulk Creator', icon: PlusSquare },
              { id: 'simulator', label: 'Simulator', icon: Activity },
              { id: 'test', label: 'Manual Test', icon: TestTube },
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
        <div className="p-6">
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
