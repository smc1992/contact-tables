import { motion } from 'framer-motion';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AdminTest() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Admin-Dashboard (Testansicht)</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Willkommen im Testmodus</h2>
            <p className="text-gray-600">
              Dies ist eine Testansicht des Admin-Dashboards ohne Authentifizierung.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-blue-50 p-4 rounded-lg border border-blue-200"
            >
              <h3 className="font-medium text-blue-800 mb-2">Restaurants</h3>
              <p className="text-blue-600 mb-2">Verwalten Sie alle registrierten Restaurants.</p>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Restaurants anzeigen
              </button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-green-50 p-4 rounded-lg border border-green-200"
            >
              <h3 className="font-medium text-green-800 mb-2">Benutzer</h3>
              <p className="text-green-600 mb-2">Verwalten Sie alle Benutzerkonten.</p>
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Benutzer anzeigen
              </button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-purple-50 p-4 rounded-lg border border-purple-200"
            >
              <h3 className="font-medium text-purple-800 mb-2">Statistiken</h3>
              <p className="text-purple-600 mb-2">Sehen Sie wichtige Plattform-Statistiken ein.</p>
              <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                Statistiken anzeigen
              </button>
            </motion.div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Schnelle Aktionen</h3>
            <div className="flex flex-wrap gap-2">
              <button className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-sm">
                Neues Restaurant anlegen
              </button>
              <button className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-sm">
                Systemeinstellungen
              </button>
              <button className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-sm">
                Logs anzeigen
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 