import { useState } from 'react';
import { useRouter } from 'next/router';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiUser, FiMail } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PasswordInput from '../../components/PasswordInput';
import RestaurantRegisterForm from '../../components/RestaurantRegisterForm';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RestaurantRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
    const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const MONTHLY_URL = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_MONTHLY_URL || 'https://www.checkout-ds24.com/product/640542';
  const YEARLY_URL = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_YEARLY_URL || 'https://www.checkout-ds24.com/product/640621';

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Die Passwörter stimmen nicht überein.' });
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setStatus({ type: 'error', message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Minimal-Payload für Registrierung; weitere Details später im Dashboard
        body: JSON.stringify({
          firstName: 'Restaurant',
          lastName: 'Owner',
          restaurantName: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'RESTAURANT',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Spezifische Fehlermeldung für bereits existierende Benutzer
        if (response.status === 409) {
          throw new Error(result.message || 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert.');
        }
        
        throw new Error(result.message || result.error || 'Ein Fehler bei der Registrierung ist aufgetreten.');
      }

      // Erfolgsmeldung anzeigen (keine Auto-Anmeldung; E-Mail-Bestätigung erforderlich)
      setStatus({
        type: 'success',
        message: 'Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mail und bestätigen Sie Ihre Adresse, um fortzufahren.',
      });

    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Hinweis: Keine Auto-Weiterleitung mehr vor E-Mail-Bestätigung

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <RestaurantRegisterForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}