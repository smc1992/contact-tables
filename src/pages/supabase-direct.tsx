import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Layout } from '../components/Layout';

export default function SupabaseDirect() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Funktion zum Abrufen der Projekte
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direkte API-Anfrage an Supabase Management API
      const response = await fetch('https://api.supabase.com/v1/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer sbp_2af4113027ccee6f673e7739b15eb73d114d13da`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data);
      console.log('Projekte geladen:', data);
    } catch (err: any) {
      console.error('Fehler beim Laden der Projekte:', err);
      setError(err.message || 'Fehler beim Laden der Projekte');
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum Abrufen der Tabellen eines Projekts
  const fetchTables = async (projectRef: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedProject(projectRef);
      
      // Direkte API-Anfrage an Supabase Management API für Tabellen
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/tables`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer sbp_2af4113027ccee6f673e7739b15eb73d114d13da`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
      
      const data = await response.json();
      setTables(data);
      console.log('Tabellen geladen:', data);
    } catch (err: any) {
      console.error('Fehler beim Laden der Tabellen:', err);
      setError(err.message || 'Fehler beim Laden der Tabellen');
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum Erstellen einer Tabelle
  const createTable = async (projectRef: string, tableName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Direkte API-Anfrage zum Erstellen einer Tabelle
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/tables`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sbp_2af4113027ccee6f673e7739b15eb73d114d13da`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: tableName,
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimaryKey: true,
              isNullable: false,
              defaultValue: 'gen_random_uuid()'
            },
            {
              name: 'created_at',
              type: 'timestamp with time zone',
              isNullable: false,
              defaultValue: 'now()'
            },
            {
              name: 'name',
              type: 'text',
              isNullable: false
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API-Fehler: ${response.status}`);
      }
      
      // Tabellen neu laden
      await fetchTables(projectRef);
      alert(`Tabelle ${tableName} erfolgreich erstellt!`);
    } catch (err: any) {
      console.error('Fehler beim Erstellen der Tabelle:', err);
      setError(err.message || 'Fehler beim Erstellen der Tabelle');
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum Ausführen des SQL-Schemas
  const executeSQLSchema = async (projectRef: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // SQL aus der schema.sql-Datei abrufen (hier müssten Sie den Inhalt der Datei einbinden)
      const sqlSchema = `
      -- Schema für Contact Tables Anwendung (gekürzt für dieses Beispiel)
      
      -- Benutzer-Profil-Erweiterungen
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Restaurants
      CREATE TABLE IF NOT EXISTS public.restaurants (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      `;
      
      // SQL über die Management API ausführen
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sbp_2af4113027ccee6f673e7739b15eb73d114d13da`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: sqlSchema
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API-Fehler: ${response.status}`);
      }
      
      // Tabellen neu laden
      await fetchTables(projectRef);
      alert('SQL-Schema erfolgreich ausgeführt!');
    } catch (err: any) {
      console.error('Fehler beim Ausführen des SQL-Schemas:', err);
      setError(err.message || 'Fehler beim Ausführen des SQL-Schemas');
    } finally {
      setLoading(false);
    }
  };

  // Laden der Projekte beim ersten Rendern
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Supabase Direktzugriff</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Projekte</h2>
          {loading && !projects.length ? (
            <p>Projekte werden geladen...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${selectedProject === project.ref ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => fetchTables(project.ref)}
                >
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-gray-500">ID: {project.ref}</p>
                  <p className="text-sm text-gray-500">Region: {project.region}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedProject && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tabellen</h2>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    const tableName = prompt('Tabellenname eingeben:');
                    if (tableName) {
                      createTable(selectedProject, tableName);
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Neue Tabelle
                </button>
                <button
                  onClick={() => executeSQLSchema(selectedProject)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Schema ausführen
                </button>
              </div>
            </div>
            
            {loading && !tables.length ? (
              <p>Tabellen werden geladen...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Name</th>
                      <th className="py-2 px-4 border-b">Schema</th>
                      <th className="py-2 px-4 border-b">Spalten</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{table.name}</td>
                        <td className="py-2 px-4 border-b">{table.schema}</td>
                        <td className="py-2 px-4 border-b">{table.columns?.length || 0}</td>
                      </tr>
                    ))}
                    {tables.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-500">
                          Keine Tabellen gefunden
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
