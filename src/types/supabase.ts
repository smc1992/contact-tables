export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          language_code: string | null;
          is_paying: boolean | null;
          stripe_customer_id: string | null;
          role: Database["public"]["Enums"]["UserRole"];
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          language_code?: string | null;
          is_paying?: boolean | null;
          stripe_customer_id?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          language_code?: string | null;
          is_paying?: boolean | null;
          stripe_customer_id?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          userId: string;
          name: string;
          address: string | null;
          postal_code: string | null;
          city: string | null;
          country: string | null;
          description: string | null;
          booking_url: string | null;
          image_url: string | null;
          cuisine: string | null;
          capacity: number | null;
          contract_start_date: string | null;
          trial_end_date: string | null;
          contract_status: Database["public"]["Enums"]["ContractStatus"];
          is_visible: boolean;
          offer_table_today: boolean;
          stripe_subscription_id: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          opening_hours: string | null;
          latitude: number | null;
          longitude: number | null;
          price_range: string | null;
          is_active: boolean;
          plan: string | null;
          contract_token: string | null;
          contract_token_expires_at: string | null;
          contract_accepted_at: string | null;
          notification_settings: Json | null;
          privacy_settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          userId: string;
          name: string;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          description?: string | null;
          booking_url?: string | null;
          image_url?: string | null;
          cuisine?: string | null;
          capacity?: number | null;
          contract_start_date?: string | null;
          trial_end_date?: string | null;
          contract_status?: Database["public"]["Enums"]["ContractStatus"];
          is_visible?: boolean;
          offer_table_today?: boolean;
          stripe_subscription_id?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          opening_hours?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          price_range?: string | null;
          is_active?: boolean;
          plan?: string | null;
          contract_token?: string | null;
          contract_token_expires_at?: string | null;
          contract_accepted_at?: string | null;
          notification_settings?: Json | null;
          privacy_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          name?: string;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          description?: string | null;
          booking_url?: string | null;
          image_url?: string | null;
          cuisine?: string | null;
          capacity?: number | null;
          contract_start_date?: string | null;
          trial_end_date?: string | null;
          contract_status?: Database["public"]["Enums"]["ContractStatus"];
          is_visible?: boolean;
          offer_table_today?: boolean;
          stripe_subscription_id?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          opening_hours?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          price_range?: string | null;
          is_active?: boolean;
          plan?: string | null;
          contract_token?: string | null;
          contract_token_expires_at?: string | null;
          contract_accepted_at?: string | null;
          notification_settings?: Json | null;
          privacy_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurant_images: {
        Row: {
          id: string;
          restaurant_id: string;
          url: string;
          public_id: string;
          is_primary: boolean;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          url: string;
          public_id: string;
          is_primary?: boolean;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          url?: string;
          public_id?: string;
          is_primary?: boolean;
        };
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          restaurant_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_tables: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          datetime: string | null;
          end_datetime: string | null;
          max_participants: number;
          price: number;
          restaurant_id: string;
          status: Database["public"]["Enums"]["EventStatus"];
          is_public: boolean;
          paused: boolean;
          // Neue Felder für unbestimmte Aktivierung und Pausenzeitraum
          is_indefinite: boolean;
          pause_start: string | null;
          pause_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          datetime?: string | null;
          end_datetime?: string | null;
          max_participants: number;
          price?: number;
          restaurant_id: string;
          status?: Database["public"]["Enums"]["EventStatus"];
          is_public?: boolean;
          paused?: boolean;
          // Neue Felder für unbestimmte Aktivierung und Pausenzeitraum
          is_indefinite?: boolean;
          pause_start?: string | null;
          pause_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          datetime?: string | null;
          end_datetime?: string | null;
          max_participants?: number;
          price?: number;
          restaurant_id?: string;
          status?: Database["public"]["Enums"]["EventStatus"];
          is_public?: boolean;
          paused?: boolean;
          // Neue Felder für unbestimmte Aktivierung und Pausenzeitraum
          is_indefinite?: boolean;
          pause_start?: string | null;
          pause_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      UserRole: "CUSTOMER" | "RESTAURANT" | "ADMIN";
      Language: "DE" | "EN" | "ES" | "PT" | "FR";
      ContractStatus: "PENDING" | "ACTIVE" | "CANCELLED" | "REJECTED" | "APPROVED";
      EventStatus: "OPEN" | "FULL" | "CLOSED" | "PAST" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
      CmsSectionType: "HERO" | "FEATURE" | "FOOTER" | "TESTIMONIAL" | "BANNER";
      ContactMessageStatus: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
    };
  };
};