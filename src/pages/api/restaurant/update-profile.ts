import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API update-profile req.headers.cookie:', req.headers.cookie); // Log cookies

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // Für getUser() ist das Setzen hier vorerst nicht primär, wird ggf. später angepasst
        },
        remove(name: string, options: CookieOptions) {
          // Für getUser() ist das Entfernen hier vorerst nicht primär
        },
      },
      cookieOptions: { 
        name: 'contact-tables-auth',
      },
    }
  );

  const { data: authData, error: userError } = await supabase.auth.getUser();

  if (userError || !authData || !authData.user) {
    console.error('API update-profile Auth Error:', userError);
    console.log('API update-profile Auth Data:', authData);
    return res.status(401).json({ message: 'Nicht authentifiziert oder Fehler beim Abrufen des Benutzers. Details im Server-Log.' });
  }
  const user = authData.user;

  const {
    id, // Erwartet die Restaurant-ID als 'id'
    name,
    description,
    address,
    city,
    cuisine, // Wird zu cuisine_type (Array) konvertiert
    phone,   // Wird zu contact_phone
    email,   // Wird zu contact_email
    website,
    capacity,
    openingHours, // Wird zu opening_hours (Text)
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Restaurant-ID (id) ist erforderlich' });
  }

  if (!name || !description || !address || !city) {
    return res.status(400).json({ message: 'Name, Beschreibung, Adresse und Stadt sind erforderlich' });
  }
  
  const updateData: { [key: string]: any } = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (website !== undefined) updateData.website = website;
  if (capacity !== undefined) updateData.capacity = Number(capacity);
  if (cuisine !== undefined) updateData.cuisine = cuisine; // Angepasst an DB-Spalte 'cuisine' (text)
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (openingHours !== undefined) updateData.opening_hours = openingHours;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'Keine Daten zum Aktualisieren bereitgestellt' });
  }
  
  try {
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', id)
      .eq('userId', user.id) // Sicherheitsüberprüfung: User muss der Eigentümer sein
      .select()
      .single();

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ message: 'Restaurant nicht gefunden oder keine Berechtigung.' });
      }
      return res.status(500).json({ message: 'Fehler beim Aktualisieren des Restaurant-Profils', details: updateError.message });
    }

    if (!updatedRestaurant) {
        return res.status(404).json({ message: 'Restaurant nach Update nicht gefunden oder keine Berechtigung.' });
    }

    return res.status(200).json({
      message: 'Restaurant-Profil erfolgreich aktualisiert',
      restaurant: updatedRestaurant,
    });

  } catch (error: any) {
    console.error('Fehler bei der Aktualisierung des Restaurant-Profils (Catch Block):', error);
    return res.status(500).json({ message: 'Interner Serverfehler', details: error.message });
  }
}
