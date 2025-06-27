import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiUsers, FiMapPin, FiClock } from 'react-icons/fi';
import { geoApi } from '../utils/api';

interface SearchFormProps {
  className?: string;
  initialValues?: {
    searchTerm?: string;
    date?: string;
    time?: string;
    guests?: string;
  };
  onSearch?: (values: {
    searchTerm: string;
    date: string;
    time: string;
    guests: string;
    latitude?: number;
    longitude?: number;
  }) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ 
  className = '', 
  initialValues = {},
  onSearch
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialValues.searchTerm || '');
  const [date, setDate] = useState(initialValues.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialValues.time || '19:00');
  const [guests, setGuests] = useState(initialValues.guests || '2');
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [popularCities] = useState(['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt']);

  // Versuche, die Geolokalisierung beim Laden der Komponente zu erhalten
  useEffect(() => {
    // Nur im Browser ausführen
    if (typeof window === 'undefined') return;
    
    const getLocation = async () => {
      try {
        setIsLocating(true);
        setLocationError(null);
        const position = await geoApi.getCurrentPosition();
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      } catch (error) {
        console.error('Fehler bei der Geolokalisierung:', error);
        // Freundliche Fehlermeldung anzeigen
        if (error instanceof Error) {
          setLocationError(error.message);
        } else {
          setLocationError('Standort konnte nicht ermittelt werden');
        }
        
        // Optional: Fallback auf Standardposition
        // const defaultPosition = geoApi.getDefaultLocation();
        // setLocation({
        //   latitude: defaultPosition.coords.latitude,
        //   longitude: defaultPosition.coords.longitude
        // });
      } finally {
        setIsLocating(false);
      }
    };
    
    getLocation();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const searchParams = {
      searchTerm,
      date,
      time,
      guests,
      ...(location && { latitude: location.latitude, longitude: location.longitude })
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Standardverhalten: Zur Suchergebnisseite navigieren
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      params.append('date', date);
      params.append('time', time);
      params.append('guests', guests);
      if (location) {
        params.append('lat', location.latitude.toString());
        params.append('lng', location.longitude.toString());
      }
      
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <motion.form 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.6 }}
      onSubmit={handleSearch} 
      className={`bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-lg border-2 border-primary-500 max-w-5xl mx-auto w-full ${className}`}
    >
      <h3 className="text-2xl font-bold text-secondary-800 mb-6 text-center">Finde deinen Tisch</h3>
      
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-12 gap-3 lg:gap-4">
          <div className="md:col-span-4 lg:col-span-5 relative">
            <label htmlFor="location-desktop" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Standort</label>
            <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
              <FiMapPin size={20} />
            </div>
            <input
              id="location-desktop"
              type="text"
              placeholder={isLocating ? 'Standort wird ermittelt...' : 'Wo möchtest du essen?'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg"
              disabled={isLocating}
            />
            {locationError && (
              <p className="text-red-500 text-xs mt-1 ml-1">{locationError}</p>
            )}
          </div>
          
          <div className="md:col-span-2 lg:col-span-2 relative">
            <label htmlFor="date-desktop" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Datum</label>
            <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
              <FiCalendar size={20} />
            </div>
            <input
              id="date-desktop"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-2 relative">
            <label htmlFor="time-desktop" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Uhrzeit</label>
            <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
              <FiClock size={20} />
            </div>
            <select
              id="time-desktop"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg appearance-none"
            >
              {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map(t => (
                <option key={t} value={t} className="text-secondary-800 font-medium">{t} Uhr</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2 lg:col-span-1 relative">
            <label htmlFor="guests-desktop" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Gäste</label>
            <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
              <FiUsers size={20} />
            </div>
            <select
              id="guests-desktop"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg appearance-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num} className="text-secondary-800 font-medium">{num}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-2 relative">
            <label className="block text-sm font-bold text-transparent mb-2 ml-1 uppercase">Suchen</label>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-secondary-900 font-bold py-3 px-4 lg:px-8 rounded-xl flex items-center justify-center space-x-2 lg:space-x-3 transition-all shadow-xl border-2 border-primary-600 text-base lg:text-lg"
            >
              <FiSearch size={22} />
              <span>Tisch finden</span>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="relative">
          <label htmlFor="location-mobile" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Standort</label>
          <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
            <FiMapPin size={20} />
          </div>
          <input
            id="location-mobile"
            type="text"
            placeholder={isLocating ? 'Standort wird ermittelt...' : 'Wo möchtest du essen?'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg"
            disabled={isLocating}
          />
          {locationError && (
            <p className="text-red-500 text-xs mt-1 ml-1">{locationError}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label htmlFor="date-mobile" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Datum</label>
            <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
              <FiCalendar size={18} />
            </div>
            <input
              id="date-mobile"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="relative">
            <label htmlFor="time-mobile" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Uhrzeit</label>
            <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
              <FiClock size={18} />
            </div>
            <select
              id="time-mobile"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg appearance-none"
            >
              {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map(t => (
                <option key={t} value={t} className="text-secondary-800 font-medium">{t} Uhr</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label htmlFor="guests-mobile" className="block text-sm font-bold text-secondary-800 mb-2 ml-1 uppercase">Gäste</label>
            <div className="absolute left-3 top-[calc(50%+0.5rem)] transform -translate-y-1/2 text-secondary-700">
              <FiUsers size={18} />
            </div>
            <select
              id="guests-mobile"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full input-field pl-10 text-secondary-800 font-medium border-2 border-neutral-300 focus:border-primary-500 py-3 text-base rounded-lg appearance-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num} className="text-secondary-800 font-medium">{num}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-bold text-transparent mb-2 ml-1 uppercase">Suchen</label>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-secondary-900 font-bold py-3 px-2 rounded-xl flex items-center justify-center space-x-1 transition-all shadow-xl border-2 border-primary-600 text-sm sm:text-base"
            >
              <FiSearch size={18} />
              <span>Tisch finden</span>
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 text-base text-secondary-800 font-semibold">
        <span className="flex items-center px-3 py-1 bg-neutral-100 rounded-full shadow-sm mb-1 sm:mb-0">
          <FiMapPin className="mr-1 text-primary-500" size={16} /> Beliebt:
        </span>
        {popularCities.map(city => (
          <motion.button 
            key={city}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchTerm(city)}
            className="px-4 py-2 rounded-full bg-white border-2 border-neutral-300 hover:bg-neutral-50 hover:border-primary-500 hover:text-primary-600 transition-all text-secondary-800 font-semibold shadow-md"
          >
            {city}
          </motion.button>
        ))}
      </div>
    </motion.form>
  );
};

export default SearchForm;
