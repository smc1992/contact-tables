import axios from 'axios';

// API-Client mit Axios
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Restaurant-API
export const restaurantApi = {
  // Suche nach Restaurants
  search: async (params: {
    searchTerm?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    date?: string;
    time?: string;
    guests?: string;
    cuisine?: string;
    offerTableToday?: boolean;
    sortBy?: 'distance' | 'rating' | 'popularity';
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/restaurants/search', { params });
    return response.data;
  },

  // Details eines Restaurants abrufen
  getDetails: async (id: string) => {
    const response = await apiClient.get(`/restaurants/details?id=${id}`);
    return response.data;
  },

  // Bewertungen für ein Restaurant abrufen
  getRatings: async (restaurantId: string) => {
    const response = await apiClient.get(`/restaurants/ratings?restaurantId=${restaurantId}`);
    return response.data;
  },

  // Bewertung abgeben
  addRating: async (data: {
    restaurantId: string;
    value: number;
    comment?: string;
  }) => {
    const response = await apiClient.post('/restaurants/ratings', data);
    return response.data;
  },

  // Bewertung aktualisieren
  updateRating: async (data: {
    ratingId: string;
    value: number;
    comment?: string;
  }) => {
    const response = await apiClient.put('/restaurants/ratings', data);
    return response.data;
  },

  // Bewertung löschen
  deleteRating: async (ratingId: string) => {
    const response = await apiClient.delete('/restaurants/ratings', {
      data: { ratingId }
    });
    return response.data;
  }
};

// Event-API
export const eventApi = {
  // Suche nach Events
  search: async (params: {
    city?: string;
    date?: string;
    minSeats?: number;
    cuisine?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/events/search', { params });
    return response.data;
  },

  // Event erstellen
  create: async (data: {
    restaurantId: string;
    title: string;
    description?: string;
    date: string;
    time: string;
    maxParticipants: number;
    price?: number;
  }) => {
    const response = await apiClient.post('/events/create', data);
    return response.data;
  },

  // An einem Event teilnehmen
  participate: async (eventId: string) => {
    const response = await apiClient.post('/events/participate', { eventId });
    return response.data;
  }
};

// Benutzer-API
export const userApi = {
  // Benutzerprofil abrufen
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Benutzerprofil aktualisieren
  updateProfile: async (data: {
    name: string;
    languageCode?: string;
  }) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  // Benachrichtigungen abrufen
  getNotifications: async (params: {
    limit?: number;
    page?: number;
    unreadOnly?: boolean;
  }) => {
    const response = await apiClient.get('/users/notifications', { params });
    return response.data;
  },

  // Benachrichtigung als gelesen markieren
  markNotificationAsRead: async (notificationId: string) => {
    const response = await apiClient.patch('/users/notifications', {
      notificationId,
      markAllAsRead: false
    });
    return response.data;
  },

  // Alle Benachrichtigungen als gelesen markieren
  markAllNotificationsAsRead: async () => {
    const response = await apiClient.patch('/users/notifications', {
      markAllAsRead: true
    });
    return response.data;
  },

  // Benachrichtigung löschen
  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete('/users/notifications', {
      data: { notificationId }
    });
    return response.data;
  },

  // Favorisierte Restaurants abrufen
  getFavorites: async () => {
    const response = await apiClient.get('/users/favorites');
    return response.data;
  },

  // Restaurant zu Favoriten hinzufügen
  addFavorite: async (restaurantId: string) => {
    const response = await apiClient.post('/users/favorites', { restaurantId });
    return response.data;
  },

  // Restaurant aus Favoriten entfernen
  removeFavorite: async (restaurantId: string) => {
    const response = await apiClient.delete('/users/favorites', {
      data: { restaurantId }
    });
    return response.data;
  },

  // Benutzerereignisse abrufen
  getEvents: async () => {
    const response = await apiClient.get('/users/events');
    return response.data;
  },

  // Benutzereinstellungen abrufen
  getSettings: async () => {
    const response = await apiClient.get('/users/settings');
    return response.data;
  },

  // Benutzereinstellungen aktualisieren
  updateSettings: async (settings: any) => {
    const response = await apiClient.put('/users/settings', settings);
    return response.data;
  }
};

// Kontakt-API
export const contactApi = {
  // Kontaktanfrage erstellen
  createRequest: async (data: {
    restaurantId: string;
    date: string;
    time: string;
    partySize: number;
    message?: string;
  }) => {
    const response = await apiClient.post('/contact/request', data);
    return response.data;
  },

  // Kontaktanfragen abrufen
  getRequests: async (params?: {
    status?: 'host' | 'participant';
    date?: string;
    city?: string;
    minSeats?: number;
  }) => {
    const response = await apiClient.get('/contact/request', { params });
    return response.data;
  },

  // Details einer Kontaktanfrage abrufen
  getRequestDetails: async (id: string) => {
    const response = await apiClient.get(`/contact/request/${id}`);
    return response.data;
  },

  // Einer Kontaktanfrage beitreten
  joinRequest: async (eventId: string, message?: string) => {
    const response = await apiClient.post('/contact/request/join', {
      eventId,
      message
    });
    return response.data;
  },

  // Kontaktanfrage löschen
  deleteRequest: async (eventId: string) => {
    const response = await apiClient.delete(`/contact/request/${eventId}`);
    return response.data;
  },

  // Teilnahme an einer Kontaktanfrage beenden
  leaveRequest: async (eventId: string) => {
    const response = await apiClient.post('/contact/request/leave', {
      eventId
    });
    return response.data;
  },
  
  // Kontakttische für ein Restaurant abrufen
  getRestaurantContactTables: async (params?: {
    date?: string;
  }) => {
    const response = await apiClient.get('/contact/request/restaurant', { params });
    return response.data;
  },
};

// Geolokalisierungs-Hilfsfunktionen
export const geoApi = {
  // Aktuelle Position des Benutzers abrufen
  getCurrentPosition: (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      // Prüfen, ob Geolokalisierung im Browser verfügbar ist
      if (typeof window === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation wird von deinem Browser nicht unterstützt.'));
        return;
      }

      // Timeout für die Geolokalisierungsanfrage
      const timeoutId = setTimeout(() => {
        reject(new Error('Zeitüberschreitung bei der Standortabfrage.'));
      }, 10000);

      // Geolokalisierung anfordern
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          // Benutzerfreundliche Fehlermeldungen
          let errorMessage = 'Fehler bei der Standortabfrage.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Standortfreigabe wurde verweigert. Bitte erlaube den Zugriff auf deinen Standort in den Browsereinstellungen.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Standortinformationen sind derzeit nicht verfügbar.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Zeitüberschreitung bei der Standortabfrage.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    });
  },
  
  // Fallback-Methode, wenn Geolokalisierung fehlschlägt
  getDefaultLocation: () => {
    // Standardkoordinaten für Berlin
    return {
      coords: {
        latitude: 52.520008,
        longitude: 13.404954,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    } as GeolocationPosition;
  }
};

export default {
  restaurant: restaurantApi,
  event: eventApi,
  user: userApi,
  contact: contactApi,
  geo: geoApi
};
