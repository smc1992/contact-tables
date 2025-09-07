// @ts-nocheck
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiMail, FiLock, FiFilter, FiSearch } from 'react-icons/fi';
import { FaUser, FaUtensils, FaUsers } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { User as SupabaseUser } from '@supabase/supabase-js';
import PasswordInput from '@/components/PasswordInput';
import { Button, Table, Modal, Input, Select, message, Tabs, Tooltip, Badge, Popconfirm, Spin, Tag, Dropdown, Menu, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, LockOutlined, SearchOutlined, PlusOutlined, FilterOutlined, TagOutlined, TagsOutlined, LoadingOutlined, MoreOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active: boolean;
  banned_until?: string | null;
  metadata?: Record<string, any>;
}

interface GroupedUsers {
  admin: User[];
  restaurant: User[];
  customer: User[];
  user: User[];
  [key: string]: User[];
}

interface UsersPageProps {
  initialUsers: User[];
  initialGroupedUsers?: GroupedUsers;
}

// Verwende withAuth HOC für konsistente Authentifizierung
export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'], // Erlaubte Rollen
  async (context, user) => {
    console.log('getServerSideProps für /admin/users wird ausgeführt');
    console.log('Benutzerrolle:', user.user_metadata?.role);
    console.log('Admin-Berechtigung bestätigt, Seite wird geladen');
    console.log('Benutzer-ID:', user.id);
    console.log('Benutzer-Email:', user.email);
    
    // Serverseitige Datenladung wird übersprungen, da sie clientseitig erfolgt
    // Dies vermeidet Probleme mit undefined URLs und SSR-Komplexität
    
    // Fallback, wenn Daten nicht geladen werden konnten
    return {
      props: {
        initialUsers: [], // Leeres Array, Daten werden clientseitig geladen
        initialGroupedUsers: {
          admin: [],
          restaurant: [],
          customer: [],
          user: []
        },
        error: null,
      },
    };
  }
);

// Konfiguration für Next.js, um statische Exporte zu verhindern
export const config = {
  unstable_runtimeJS: true,
  runtime: 'nodejs'
};

export default function UsersPage({ initialUsers, initialGroupedUsers, error, user: authUser }: UsersPageProps & { error?: string, user: SupabaseUser }) {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>(initialGroupedUsers || {
    admin: [],
    restaurant: [],
    customer: [],
    user: []
  });
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'user',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    is_active: true,
    // Rollen-spezifisch
    restaurant_name: '',
    restaurant_isVisible: false,
    admin_canManageUsers: false,
    admin_canManageSettings: false,
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // Filter-States
  const [search, setSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [hasPhoneOnly, setHasPhoneOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [tagFilterLoading, setTagFilterLoading] = useState(false);
  const [usersWithSelectedTag, setUsersWithSelectedTag] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Debugging-Informationen
  useEffect(() => {
    console.log('Benutzerseite geladen');
    console.log('Router-Pfad:', router.pathname);
    console.log('Router-Query:', router.query);
    console.log('Benutzer authentifiziert:', !!session);
    console.log('Benutzerrolle:', user?.user_metadata?.role);
    
    if (error) {
      console.error('Fehler aus getServerSideProps:', error);
    }
  }, [router, session, user, error]);

  // Laden der Benutzerdaten
  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      // Benutzer über API-Route abrufen
      console.log('Rufe API-Route /api/admin/users auf...');
      const response = await fetch('/api/admin/users');
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Fehler beim Laden der Benutzer:', data.error);
        message.error('Fehler beim Laden der Benutzer');
        return;
      }
      
      if (!Array.isArray(data.users)) {
        console.error('Unerwartetes API-Antwortformat:', data);
        throw new Error('Unerwartetes API-Antwortformat');
      }
      
      // Benutzer-Tags laden
      console.log('Lade Benutzer-Tags...');
      const tagsResponse = await fetch('/api/admin/users/get-user-tags');
      const tagsData = await tagsResponse.json();
      
      if (tagsData.error) {
        console.error('Fehler beim Laden der Benutzer-Tags:', tagsData.error);
        // Wir setzen fort, auch wenn Tags nicht geladen werden konnten
      }
      
      // Tags den Benutzern zuordnen
      const userTags = tagsData.userTags || {};
      const usersWithTags = data.users.map(user => ({
        ...user,
        tags: userTags[user.id] || []
      }));
      
      // Gruppierte Benutzer mit Tags aktualisieren
      const groupedUsersWithTags = {};
      
      Object.entries(data.groupedUsers || {}).forEach(([role, users]) => {
        groupedUsersWithTags[role] = (users as any[]).map(user => ({
          ...user,
          tags: userTags[user.id] || []
        }));
      });
      
      // Daten setzen
      setUsers(usersWithTags);
      setGroupedUsers(groupedUsersWithTags || {
        admin: [],
        restaurant: [],
        customer: [],
        user: []
      });
      
      console.log('Geladene Benutzer:', usersWithTags.length);
      console.log('Benutzer nach Rollen:', {
        admin: groupedUsersWithTags?.admin?.length || 0,
        restaurant: groupedUsersWithTags?.restaurant?.length || 0,
        customer: groupedUsersWithTags?.customer?.length || 0,
        user: groupedUsersWithTags?.user?.length || 0
      });
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      message.error(`Fehler beim Laden der Benutzer: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      // Fallback zu Dummy-Daten bei Fehler
      setUsers([
        {
          id: '1',
          email: 'admin@contact-tables.org',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          phone: '+49123456789',
          created_at: '2025-01-15T12:00:00Z',
          last_sign_in_at: '2025-08-20T10:30:00Z',
          is_active: true,
          tags: [] // Leeres Tags-Array für Fallback-Daten
        },
        {
          id: '2',
          email: 'restaurant@example.com',
          role: 'restaurant',
          first_name: 'Restaurant',
          last_name: 'Owner',
          phone: '+49987654321',
          created_at: '2025-02-10T09:45:00Z',
          last_sign_in_at: '2025-08-19T14:20:00Z',
          is_active: true,
          tags: [] // Leeres Tags-Array für Fallback-Daten
        },
        {
          id: '3',
          email: 'customer@example.com',
          role: 'customer',
          first_name: 'Max',
          last_name: 'Mustermann',
          phone: '+49123123123',
          created_at: '2025-03-05T15:30:00Z',
          last_sign_in_at: '2025-08-18T18:15:00Z',
          is_active: true,
          tags: [] // Leeres Tags-Array für Fallback-Daten
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Lade Daten, wenn die Komponente gemountet wird
    fetchUsers();
    fetchTags();
  }, []);

  useEffect(() => {
    // Benutzer laden, wenn die Seite geladen wird
    // Da wir withAuth verwenden, ist die Authentifizierung bereits sichergestellt
    if (!authLoading && initialUsers.length === 0) {
      fetchUsers();
    }
    
    // Tags laden
    fetchTags();
    
    // authUser aus den Props kann hier verwendet werden, falls nötig
    if (authUser) {
      console.log('Authentifizierter Benutzer:', authUser.email);
    }
  }, [authLoading, initialUsers.length, authUser]);

  // Formatierung des Datums
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Formular-Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  // Passwort-Formular-Handler
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Benutzer bearbeiten
  const handleEditUser = async (user: User) => {
    setCurrentUser(user);
    // Grunddaten setzen
    setFormData({
      email: user.email,
      role: user.role,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      password: '',
      is_active: user.is_active,
      restaurant_name: '',
      restaurant_isVisible: false,
      admin_canManageUsers: false,
      admin_canManageSettings: false,
    });
    // Details laden (rollen-spezifisch)
    try {
      const resp = await fetch(`/api/admin/users/${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        const r = data?.restaurant;
        const a = data?.admin;
        setFormData(prev => ({
          ...prev,
          restaurant_name: r?.name || '',
          restaurant_isVisible: !!r?.isVisible,
          admin_canManageUsers: !!a?.canManageUsers,
          admin_canManageSettings: !!a?.canManageSettings,
        }));
      }
    } catch (e) {
      console.error('Fehler beim Laden der Benutzerdetails:', e);
    }
    setIsModalOpen(true);
  };
  
  // Benutzer aktualisieren nach Änderungen
  const refreshUserData = () => {
    fetchUsers();
  };

  // Passwort ändern
  const handleChangePassword = (user: User) => {
    setCurrentUser(user);
    setPasswordData({
      password: '',
      confirmPassword: ''
    });
    setIsPasswordModalOpen(true);
  };

  // Neuen Benutzer erstellen
  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({
      email: '',
      role: 'user',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      is_active: true,
      restaurant_name: '',
      restaurant_isVisible: false,
      admin_canManageUsers: false,
      admin_canManageSettings: false,
    });
    setIsModalOpen(true);
  };

  // Benutzer speichern
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentUser) {
        // Update via serverseitiger API
        const resp = await fetch(`/api/admin/users/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: formData.role,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            is_active: formData.is_active,
            restaurant_name: formData.restaurant_name,
            restaurant_isVisible: formData.restaurant_isVisible,
            admin_canManageUsers: formData.admin_canManageUsers,
            admin_canManageSettings: formData.admin_canManageSettings,
          })
        });
        if (!resp.ok) throw new Error(await resp.text());
      } else {
        // Neuen Benutzer erstellen via serverseitiger API
        if (!formData.password) {
          alert('Bitte geben Sie ein Passwort ein');
          return;
        }
        const resp = await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            restaurant_name: formData.restaurant_name,
            restaurant_isVisible: formData.restaurant_isVisible,
            admin_canManageUsers: formData.admin_canManageUsers,
            admin_canManageSettings: formData.admin_canManageSettings,
          })
        });
        if (!resp.ok) throw new Error(await resp.text());
      }
      
      // Modal schließen und Daten neu laden
      setIsModalOpen(false);
      refreshUserData();
    } catch (error) {
      console.error('Fehler beim Speichern des Benutzers:', error);
      alert('Fehler beim Speichern des Benutzers');
    }
  };

  // Passwort speichern
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    if (passwordData.password !== passwordData.confirmPassword) {
      alert('Die Passwörter stimmen nicht überein');
      return;
    }
    
    try {
      const resp = await fetch(`/api/admin/users/${currentUser.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.password })
      });
      if (!resp.ok) throw new Error(await resp.text());
      
      // Modal schließen
      setIsPasswordModalOpen(false);
      alert('Passwort erfolgreich geändert');
    } catch (error) {
      console.error('Fehler beim Ändern des Passworts:', error);
      alert('Fehler beim Ändern des Passworts');
    }
  };

  // Benutzer löschen
  const handleDeleteUser = async (user: User | string) => {
    const id = typeof user === 'string' ? user : user.id;
    if (!confirm('Möchten Sie diesen Benutzer wirklich löschen?')) return;
    
    try {
      const resp = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(await resp.text());
      
      // Daten neu laden
      refreshUserData();
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error);
      alert('Fehler beim Löschen des Benutzers');
    }
  };

  // Rollenfarbe bestimmen
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'restaurant':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Rollenicon bestimmen
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <FaUser className="inline mr-1" />;
      case 'restaurant':
        return <FaUtensils className="inline mr-1" />;
      case 'customer':
        return <FaUsers className="inline mr-1" />;
      default:
        return <FaUser className="inline mr-1" />;
    }
  };
  
  // Rollenname bestimmen
  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Admin';
      case 'restaurant':
        return 'Restaurant';
      case 'customer':
        return 'Kunde';
      default:
        return 'Benutzer';
    }
  };
  
  // Filtere Benutzer basierend auf aktivem Tab
  // Wenn ein Tagfilter aktiv ist (nicht 'all'), immer aus allen Benutzern filtern,
  // damit Nutzer mit dem Tag auch dann sichtbar sind, wenn ihre Rolle nicht zum aktiven Tab passt
  const filteredUsers = tagFilter !== 'all'
    ? users
    : (activeTab === 'all' ? users : groupedUsers[activeTab] || []);
  
  // Zusätzliche Filter: Suche, E-Mail, Status, Telefon vorhanden, Tag
  const visibleUsers = (filteredUsers || []).filter((u) => {
    // Status-Filter
    if (statusFilter === 'active' && !u.is_active) return false;
    if (statusFilter === 'inactive' && u.is_active) return false;

    // Nur mit Telefonnummer
    if (hasPhoneOnly && !u.phone) return false;

    // Tag-Filter
    if (tagFilter !== 'all') {
      // Wenn ein Tag ausgewählt ist (einschließlich 'none') und der Benutzer nicht in der Liste der Benutzer mit diesem Tag ist
      if (usersWithSelectedTag.length > 0 && !usersWithSelectedTag.includes(u.id)) {
        return false;
      }
      // Wenn keine Benutzer mit diesem Tag gefunden wurden, aber ein Tag ausgewählt ist
      // (verhindert, dass alle Benutzer angezeigt werden, wenn keine mit dem Tag gefunden wurden)
      else if (usersWithSelectedTag.length === 0 && tagFilter !== 'none') {
        return false;
      }
      // Wenn 'keine Tags' ausgewählt ist und keine Benutzer zurückgegeben wurden, zeige keine Benutzer an
      else if (tagFilter === 'none' && usersWithSelectedTag.length === 0) {
        return false;
      }
    }

    // Generische Suche (Name, E-Mail, Telefon)
    const q = search.trim().toLowerCase();
    if (q) {
      const nameStr = (
        (u.name || '').toString() || `${u.first_name || ''} ${u.last_name || ''}`
      ).toLowerCase();
      const emailStr = (u.email || '').toLowerCase();
      const phoneStr = (u.phone || '').toLowerCase();
      if (
        !nameStr.includes(q) &&
        !emailStr.includes(q) &&
        !phoneStr.includes(q)
      ) {
        return false;
      }
    }

    // E-Mail gezielt filtern
    const e = emailSearch.trim().toLowerCase();
    if (e && !(u.email || '').toLowerCase().includes(e)) return false;

    return true;
  });
  
  // Benutzerauswahl für Massenaktionen
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  
  // Statistiken für die Tabs
  const userCounts = {
    all: users.length,
    admin: groupedUsers.admin?.length || 0,
    restaurant: groupedUsers.restaurant?.length || 0,
    customer: groupedUsers.customer?.length || 0,
    user: groupedUsers.user?.length || 0
  };

  // Tabellenspalten definieren
  const columns = [
    {
      title: (
        <Checkbox 
          onChange={(e) => handleSelectAllUsers(e.target.checked)}
          checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
          indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < filteredUsers.length}
        />
      ),
      dataIndex: 'selection',
      key: 'selection',
      width: 50,
      render: (_, user) => (
        <Checkbox 
          checked={selectedUserIds.includes(user.id)}
          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, user) => (
        <span>
          {user.first_name} {user.last_name}
        </span>
      ),
    },
    {
      title: 'E-Mail',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rolle',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = 'blue';
        if (role === 'ADMIN') color = 'red';
        if (role === 'RESTAURANT') color = 'green';
        return <Badge color={color} text={role} />;
      },
    },
    {
      title: (
        <div className="flex items-center">
          <TagsOutlined className="mr-1" /> Tags
        </div>
      ),
      dataIndex: 'tags',
      key: 'tags',
      render: (_, user) => {
        // Suche nach Tags für diesen Benutzer
        const userTags = user.tags || [];
        
        if (userTags.length === 0) {
          return <span className="text-gray-400 text-xs italic">Keine Tags</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {userTags.map((tagId: string) => {
              const tag = tags.find(t => t.id === tagId);
              if (!tag) return null;
              
              return (
                <span 
                  key={tagId}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  title={tag.description || ''}
                >
                  <TagsOutlined className="mr-1" style={{ fontSize: '10px' }} />
                  {tag.name}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, user) => (
        <Badge
          status={user.email_confirmed_at ? 'success' : 'warning'}
          text={user.email_confirmed_at ? 'Bestätigt' : 'Unbestätigt'}
        />
      ),
    },
    {
      title: 'Registriert am',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Letzter Login',
      dataIndex: 'last_sign_in_at',
      key: 'last_sign_in_at',
      render: (date: string) => (date ? formatDate(date) : 'Nie'),
    },
    {
      title: 'Aktionen',
      key: 'actions',
      render: (_, user) => (
        <div className="flex space-x-2">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditUser(user)}
            title="Benutzer bearbeiten"
          />
          <Button
            icon={<LockOutlined />}
            size="small"
            onClick={() => handleChangePassword(user)}
            title="Passwort ändern"
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteUser(user)}
            title="Benutzer löschen"
          />
        </div>
      ),
    },
  ];

  const handleSelectUser = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };
  
  const handleSelectAllUsers = (isSelected: boolean) => {
    if (isSelected) {
      const allUserIds = filteredUsers.map(user => user.id);
      setSelectedUserIds(allUserIds);
    } else {
      setSelectedUserIds([]);
    }
  };
  
  const createTag = async () => {
    if (!newTagName.trim()) {
      message.error('Bitte geben Sie einen Tag-Namen ein');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newTagName.trim(),
          description: newTagDescription.trim() || undefined
        })
      });
      
      if (response.ok) {
        const newTag = await response.json();
        setTags(prev => [...prev, newTag]);
        setNewTagName('');
        setNewTagDescription('');
        message.success('Tag erfolgreich erstellt');
      } else {
        const error = await response.json();
        message.error(error.error || 'Fehler beim Erstellen des Tags');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Tags:', error);
      message.error('Fehler beim Erstellen des Tags');
    }
  };

  const handleAssignTag = async () => {
    if (!selectedTag) {
      message.error('Bitte wählen Sie einen Tag aus');
      return;
    }
    
    if (selectedUserIds.length === 0) {
      message.error('Bitte wählen Sie mindestens einen Benutzer aus');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/tags/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userIds: selectedUserIds,
          tagId: selectedTag
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        message.success(`Tag erfolgreich ${result.assigned} Benutzern zugewiesen`);
        
        // Benutzerdaten neu laden, um die aktualisierten Tags anzuzeigen
        await fetchUsers();
        
        // Tag-Modal schließen und Auswahl zurücksetzen
        setShowTagModal(false);
        setSelectedUserIds([]);
        setSelectedTag(undefined);
      } else {
        const error = await response.json();
        message.error(error.error || 'Fehler beim Zuweisen des Tags');
      }
    } catch (error) {
      console.error('Fehler beim Zuweisen des Tags:', error);
      message.error('Fehler beim Zuweisen des Tags');
    }
  };

  const [showTagModal, setShowTagModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // Laden der Tags
  const fetchTags = async () => {
    try {
      console.log('Lade Tags...');
      const response = await fetch('/api/admin/tags/list');
      
      if (!response.ok) {
        throw new Error(`Fehler beim Laden der Tags: ${response.status}`);
      }
      
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Fehler beim Laden der Tags:', error);
      message.error('Tags konnten nicht geladen werden');
      setTags([]);
    }
  };

  // Tag löschen
  const handleDeleteTag = async (tagId: string, tagName: string) => {
    Modal.confirm({
      title: 'Tag löschen',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Möchten Sie den Tag <strong>{tagName}</strong> wirklich löschen?</p>
          <p className="text-red-500">Diese Aktion kann nicht rückgängig gemacht werden und entfernt den Tag von allen Benutzern.</p>
        </div>
      ),
      okText: 'Ja, löschen',
      okType: 'danger',
      cancelText: 'Abbrechen',
      onOk: async () => {
        try {
          const response = await fetch(`/api/admin/users/delete-tag?tagId=${tagId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Fehler beim Löschen des Tags: ${response.status}`);
          }
          
          const result = await response.json();
          message.success(result.message || `Tag "${tagName}" wurde erfolgreich gelöscht`);
          
          // Tag-Filter zurücksetzen, wenn der gelöschte Tag ausgewählt war
          if (tagFilter === tagId) {
            setTagFilter('all');
            setUsersWithSelectedTag([]);
          }
          
          // Tags neu laden
          await fetchTags();
        } catch (error) {
          console.error('Fehler beim Löschen des Tags:', error);
          message.error(`Fehler beim Löschen des Tags: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
        }
      },
    });
  };

  // Benutzer nach Tag filtern
  const handleTagFilterChange = async (value: string) => {
    console.log(`Tag-Filter geändert auf: ${value}`);
    setTagFilter(value);
    // Bei spezifischem Tag automatisch den Tab auf "all" setzen, damit alle Treffer sichtbar sind
    if (value !== 'all') {
      setActiveTab('all');
    }
    
    if (value === 'all') {
      // Alle Benutzer anzeigen (kein Filter)
      console.log('Filter zurückgesetzt auf "Alle"');
      setUsersWithSelectedTag([]);
      return;
    }
    
    setTagFilterLoading(true);
    try {
      let response;
      
      if (value === 'none') {
        // Benutzer ohne Tags abrufen
        console.log('Rufe Benutzer ohne Tags ab...');
        response = await fetch('/api/admin/users/without-tags');
      } else {
        // Benutzer mit dem ausgewählten Tag abrufen
        console.log(`Rufe Benutzer mit Tag ID ${value} ab...`);
        response = await fetch(`/api/admin/users/by-tag?tagId=${value}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API-Fehler (${response.status}):`, errorText);
        throw new Error(`Fehler beim Laden der Benutzer nach Tag: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API-Antwort erhalten:', result);
      
      if (Array.isArray(result.users)) {
        // Stelle sicher, dass alle gefilterten Benutzer in der Tabelle verfügbar sind
        // (falls /api/admin/users einige Benutzer nicht geliefert hat)
        const existingIds = new Set(users.map((u) => u.id));
        const toAdd = result.users
          .filter((u: any) => !existingIds.has(u.id))
          .map((u: any) => {
            const fullName = (u.name || '').trim();
            const [first, ...rest] = fullName.split(' ');
            const last = rest.join(' ');
            return {
              id: u.id,
              email: u.email || '',
              role: (u.role || 'user').toString().toLowerCase(),
              name: fullName,
              first_name: first || '',
              last_name: last || '',
              phone: '',
              created_at: u.created_at || '',
              last_sign_in_at: undefined,
              is_active: true,
              tags: []
            } as any;
          });
        if (toAdd.length > 0) {
          console.log('Füge fehlende Benutzer aus Tag-Ergebnis hinzu:', toAdd.length);
          setUsers((prev) => [...prev, ...toAdd]);
        }
        const userIds = result.users.map((user: any) => user.id);
        console.log(`${userIds.length} Benutzer mit diesem Tag gefunden:`, userIds);
        setUsersWithSelectedTag(userIds);
      } else {
        console.warn('Keine Benutzer in der API-Antwort gefunden oder ungültiges Format');
        setUsersWithSelectedTag([]);
      }
    } catch (error) {
      console.error('Fehler beim Filtern nach Tag:', error);
      message.error(`Fehler beim Filtern nach Tag: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setUsersWithSelectedTag([]);
    } finally {
      setTagFilterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="users" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Benutzer</h1>
              <div className="flex space-x-3">
                <button
                  onClick={refreshUserData}
                  disabled={refreshing}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {refreshing ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    'Aktualisieren'
                  )}
                </button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddUserModal(true)}
                >
                  Benutzer hinzufügen
                </Button>
                {selectedUserIds.length > 0 && (
                  <Button
                    className="ml-2"
                    icon={<TagsOutlined />}
                    onClick={() => {
                      console.log('Tags zuweisen Button geklickt');
                      setShowTagModal(true);
                    }}
                  >
                    Tags zuweisen ({selectedUserIds.length})
                  </Button>
                )}
              </div>
            </div>
            
            {/* Tabs für Rollenfilter */}
            <div className="mb-6">
              <div className="flex flex-wrap border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
                    activeTab === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaUsers className="inline mr-1" /> Alle ({userCounts.all})
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
                    activeTab === 'admin'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaUser className="inline mr-1" /> Admins ({userCounts.admin})
                </button>
                <button
                  onClick={() => setActiveTab('restaurant')}
                  className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
                    activeTab === 'restaurant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaUtensils className="inline mr-1" /> Restaurants ({userCounts.restaurant})
                </button>
                <button
                  onClick={() => setActiveTab('customer')}
                  className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
                    activeTab === 'customer'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaUsers className="inline mr-1" /> Kunden ({userCounts.customer})
                </button>
                <button
                  onClick={() => setActiveTab('user')}
                  className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
                    activeTab === 'user'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaUser className="inline mr-1" /> Sonstige ({userCounts.user})
                </button>
              </div>
            </div>

            {/* Filterleiste */}
            <div className="mb-4 bg-white shadow-sm rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Suche</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name, E-Mail oder Telefon suchen"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">E-Mail enthält</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      placeholder="z.B. @domain.de"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <Select
                    value={statusFilter}
                    onChange={(value: string) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <Select.Option value="all">Alle</Select.Option>
                    <Select.Option value="active">Aktiv</Select.Option>
                    <Select.Option value="inactive">Inaktiv</Select.Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tag-Filter</label>
                  <Select
                    value={tagFilter}
                    onChange={handleTagFilterChange}
                    loading={tagFilterLoading}
                    className="w-full"
                    placeholder="Nach Tag filtern"
                    suffixIcon={tagFilterLoading ? <LoadingOutlined /> : <TagsOutlined />}
                    optionLabelProp="label"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        {tags.length === 0 && (
                          <div className="p-2 text-xs text-gray-500 border-t">
                            Keine Tags vorhanden. Erstellen Sie Tags über den Button "Tags zuweisen".
                          </div>
                        )}
                      </>
                    )}
                  >
                    <Select.Option value="all" label="Alle Tags">
                      <div className="flex items-center">
                        <TagsOutlined className="mr-2" />
                        <span>Alle Tags</span>
                      </div>
                    </Select.Option>
                    <Select.Option value="none" label="Keine Tags">
                      <div className="flex items-center">
                        <TagsOutlined className="mr-2" style={{ opacity: 0.5 }} />
                        <span>Keine Tags</span>
                      </div>
                    </Select.Option>
                    {tags.map(tag => (
                      <Select.Option 
                        key={tag.id} 
                        value={tag.id}
                        label={`${tag.name} (${tag.userCount || 0})`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <TagsOutlined className="mr-2" style={{ color: '#6366f1' }} />
                            <span>{tag.name}</span>
                          </div>
                          <div className="flex items-center">
                            {tag.userCount > 0 && (
                              <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded-full mr-2">
                                {tag.userCount}
                              </span>
                            )}
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<DeleteOutlined style={{ color: '#f5222d' }} />} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTag(tag.id, tag.name);
                              }}
                              title="Tag löschen"
                              className="opacity-70 hover:opacity-100"
                            />
                          </div>
                        </div>
                        {tag.description && (
                          <div className="text-xs text-gray-500 mt-1 pl-6">{tag.description}</div>
                        )}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end justify-between">
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <Input
                      type="checkbox"
                      checked={hasPhoneOnly}
                      onChange={(e) => setHasPhoneOnly(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                    />
                    Nur mit Telefonnummer
                  </label>
                  <Button
                    onClick={() => {
                      setSearch('');
                      setEmailSearch('');
                      setStatusFilter('all');
                      setHasPhoneOnly(false);
                      setTagFilter('all');
                      setUsersWithSelectedTag([]);
                    }}
                    className="ml-4 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    title="Filter zurücksetzen"
                  >
                    Zurücksetzen
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <FiFilter className="inline mr-1" /> Ergebnis: {visibleUsers.length} von {filteredUsers.length} in diesem Tab
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={visibleUsers}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: pageSize,
                    current: currentPage,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showSizeChanger: true,
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      if (size !== pageSize) {
                        setPageSize(size);
                      }
                    },
                    onShowSizeChange: (current, size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    },
                    showTotal: (total, range) => `${range[0]}-${range[1]} von ${total} Einträgen`
                  }}
                  rowSelection={{
                    selectedRowKeys: selectedUserIds,
                    onChange: (selectedRowKeys: React.Key[]) => setSelectedUserIds(selectedRowKeys as string[]),
                    columnWidth: 50,
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Modal für Benutzer hinzufügen/bearbeiten */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
            </h2>
            <form onSubmit={handleSaveUser}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={!!currentUser}
                />
              </div>
              {!currentUser && (
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange as any}
                    className="w-full"
                    required={!currentUser}
                  />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rolle
                </label>
                <Select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <Select.Option value="admin">Admin</Select.Option>
                  <Select.Option value="restaurant">Restaurant</Select.Option>
                  <Select.Option value="customer">Kunde</Select.Option>
                  <Select.Option value="user">Benutzer</Select.Option>
                </Select>
              </div>
              <div className="mb-4">
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Vorname
                </label>
                <Input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nachname
                </label>
                <Input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {/* Rollen-spezifische Felder */}
              {formData.role.toLowerCase() === 'restaurant' && (
                <div className="mb-4">
                  <label htmlFor="restaurant_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurantname
                  </label>
                  <Input
                    type="text"
                    id="restaurant_name"
                    name="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="mt-3 flex items-center">
                    <Input
                      type="checkbox"
                      id="restaurant_isVisible"
                      name="restaurant_isVisible"
                      checked={formData.restaurant_isVisible}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="restaurant_isVisible" className="ml-2 block text-sm text-gray-900">
                      Öffentlich sichtbar
                    </label>
                  </div>
                </div>
              )}
              {formData.role.toLowerCase() === 'admin' && (
                <div className="mb-4">
                  <div className="block text-sm font-medium text-gray-700 mb-1">Admin-Berechtigungen</div>
                  <div className="flex items-center mb-2">
                    <Input
                      type="checkbox"
                      id="admin_canManageUsers"
                      name="admin_canManageUsers"
                      checked={formData.admin_canManageUsers}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="admin_canManageUsers" className="ml-2 block text-sm text-gray-900">
                      Benutzer verwalten
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Input
                      type="checkbox"
                      id="admin_canManageSettings"
                      name="admin_canManageSettings"
                      checked={formData.admin_canManageSettings}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="admin_canManageSettings" className="ml-2 block text-sm text-gray-900">
                      Einstellungen verwalten
                    </label>
                  </div>
                </div>
              )}
              {currentUser && (
                <div className="mb-4 flex items-center">
                  <Input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Aktiv
                  </label>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="mr-2"
                >
                  Abbrechen
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Speichern
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal für Tag-Zuweisung */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Tags zuweisen
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {selectedUserIds.length} Benutzer ausgewählt
              </span>
            </div>
            
            {/* Vorhandene Tags */}
            <div className="mb-5">
              <label htmlFor="tag-select" className="block text-sm font-medium text-gray-700 mb-2">
                Vorhandene Tags
              </label>
              
              {tags.length === 0 ? (
                <div className="text-sm text-gray-500 italic mb-2 bg-gray-50 p-3 rounded border border-gray-200">
                  Keine Tags vorhanden. Erstellen Sie unten einen neuen Tag.
                </div>
              ) : (
                <div className="mb-3 flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div 
                      key={tag.id} 
                      onClick={() => setSelectedTag(tag.id)}
                      className={`cursor-pointer px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors ${selectedTag === tag.id 
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'}`}
                    >
                      <TagsOutlined style={{ fontSize: '14px' }} />
                      {tag.name}
                      {tag.userCount > 0 && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                          {tag.userCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <Select
                id="tag-select"
                value={selectedTag}
                onChange={(value) => setSelectedTag(value)}
                className="w-full"
                placeholder="Oder wählen Sie einen Tag aus der Liste"
                allowClear
              >
                {tags.map(tag => (
                  <Select.Option key={tag.id} value={tag.id}>
                    {tag.name} {tag.userCount ? `(${tag.userCount} Benutzer)` : ''}
                  </Select.Option>
                ))}
              </Select>
            </div>
            
            {/* Neuen Tag erstellen */}
            <div className="mb-5 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <PlusOutlined className="mr-1" /> Neuen Tag erstellen
                </label>
              </div>
              <Input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag-Name"
                className="w-full mb-2"
                maxLength={50}
              />
              <Input
                type="text"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="Beschreibung (optional)"
                className="w-full mb-2"
                maxLength={200}
              />
              <Button 
                onClick={createTag}
                type="primary"
                className="w-full"
                disabled={!newTagName.trim()}
                icon={<PlusOutlined />}
              >
                Tag erstellen
              </Button>
            </div>
            
            {/* Aktionen */}
            <div className="flex justify-end space-x-3 mt-6 border-t pt-4 border-gray-200">
              <Button
                onClick={() => setShowTagModal(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="primary"
                onClick={handleAssignTag}
                disabled={!selectedTag || selectedUserIds.length === 0}
                icon={<TagsOutlined />}
              >
                Tag zuweisen
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal für Passwort ändern */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Passwort ändern für {currentUser?.email}
            </h2>
            <form onSubmit={handleSavePassword}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Passwort
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={passwordData.password}
                  onChange={handlePasswordInputChange}
                  className="w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort bestätigen
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Passwort ändern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
