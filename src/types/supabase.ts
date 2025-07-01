export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          can_manage_settings: boolean;
          can_manage_users: boolean;
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          can_manage_settings?: boolean;
          can_manage_users?: boolean;
          created_at?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          can_manage_settings?: boolean;
          can_manage_users?: boolean;
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          status: Database["public"]["Enums"]["ContactMessageStatus"];
          subject: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          status?: Database["public"]["Enums"]["ContactMessageStatus"];
          subject: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          status?: Database["public"]["Enums"]["ContactMessageStatus"];
          subject?: string;
          updated_at?: string;
        };
      };
      contact_tables: {
        Row: {
          created_at: string;
          datetime: string;
          description: string | null;
          id: string;
          is_public: boolean;
          max_participants: number;
          price: number;
          restaurant_id: string;
          status: Database["public"]["Enums"]["EventStatus"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          datetime: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          max_participants: number;
          price?: number;
          restaurant_id: string;
          status?: Database["public"]["Enums"]["EventStatus"];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          datetime?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          max_participants?: number;
          price?: number;
          restaurant_id?: string;
          status?: Database["public"]["Enums"]["EventStatus"];
          title?: string;
          updated_at?: string;
        };
      };
      contracts: {
        Row: {
          cancellation_date: string | null;
          created_at: string;
          id: string;
          restaurant_id: string;
          start_date: string;
          status: Database["public"]["Enums"]["ContractStatus"];
          trial_end_date: string | null;
          updated_at: string;
        };
        Insert: {
          cancellation_date?: string | null;
          created_at?: string;
          id?: string;
          restaurant_id: string;
          start_date: string;
          status: Database["public"]["Enums"]["ContractStatus"];
          trial_end_date?: string | null;
          updated_at?: string;
        };
        Update: {
          cancellation_date?: string | null;
          created_at?: string;
          id?: string;
          restaurant_id?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["ContractStatus"];
          trial_end_date?: string | null;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      invoices: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          date: string;
          download_url: string;
          id: string;
          restaurant_id: string | null;
          stripe_invoice_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency: string;
          date?: string;
          download_url: string;
          id?: string;
          restaurant_id?: string | null;
          stripe_invoice_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          date?: string;
          download_url?: string;
          id?: string;
          restaurant_id?: string | null;
          stripe_invoice_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
      };
      notifications: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_read: boolean;
          metadata: Json | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          title: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      participations: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          is_host: boolean;
          joined_at: string;
          message: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          is_host?: boolean;
          joined_at?: string;
          message?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          is_host?: boolean;
          joined_at?: string;
          message?: string | null;
          updated_at?: string;
          user_id?: string;
        };
      };
      partner_requests: {
        Row: {
          contact_email: string;
          contact_name: string;
          created_at: string;
          id: string;
          message: string | null;
          restaurant_name: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          contact_email: string;
          contact_name: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          restaurant_name: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          contact_email?: string;
          contact_name?: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          restaurant_name?: string;
          status?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          is_paying: boolean | null;
          language_code: string | null;
          name: string | null;
          role: Database["public"]["Enums"]["UserRole"];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_paying?: boolean | null;
          language_code?: string | null;
          name?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_paying?: boolean | null;
          language_code?: string | null;
          name?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
      };
      ratings: {
        Row: {
          comment: string | null;
          created_at: string;
          event_id: string;
          id: string;
          updated_at: string;
          user_id: string;
          value: number;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          updated_at?: string;
          user_id: string;
          value?: number;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
          value?: number;
        };
      };
      restaurant_images: {
        Row: {
          id: string;
          is_primary: boolean;
          public_id: string;
          restaurant_id: string;
          url: string;
        };
        Insert: {
          id?: string;
          is_primary?: boolean;
          public_id: string;
          restaurant_id: string;
          url: string;
        };
        Update: {
          id?: string;
          is_primary?: boolean;
          public_id?: string;
          restaurant_id?: string;
          url?: string;
        };
      };
      restaurants: {
        Row: {
          address: string | null;
          booking_url: string | null;
          capacity: number | null;
          city: string | null;
          contract_accepted_at: string | null;
          contract_start_date: string | null;
          contract_status: Database["public"]["Enums"]["ContractStatus"];
          contract_token: string | null;
          contract_token_expires_at: string | null;
          country: string | null;
          created_at: string;
          cuisine: string | null;
          description: string | null;
          email: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          is_visible: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          notification_settings: Json | null;
          offer_table_today: boolean;
          opening_hours: string | null;
          phone: string | null;
          plan: string | null;
          postal_code: string | null;
          price_range: string | null;
          privacy_settings: Json | null;
          stripe_subscription_id: string | null;
          trial_end_date: string | null;
          updated_at: string;
          userId: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          booking_url?: string | null;
          capacity?: number | null;
          city?: string | null;
          contract_accepted_at?: string | null;
          contract_start_date?: string | null;
          contract_status?: Database["public"]["Enums"]["ContractStatus"];
          contract_token?: string | null;
          contract_token_expires_at?: string | null;
          country?: string | null;
          created_at?: string;
          cuisine?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_visible?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          notification_settings?: Json | null;
          offer_table_today?: boolean;
          opening_hours?: string | null;
          phone?: string | null;
          plan?: string | null;
          postal_code?: string | null;
          price_range?: string | null;
          privacy_settings?: Json | null;
          stripe_subscription_id?: string | null;
          trial_end_date?: string | null;
          updated_at?: string;
          userId: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          booking_url?: string | null;
          capacity?: number | null;
          city?: string | null;
          contract_accepted_at?: string | null;
          contract_start_date?: string | null;
          contract_status?: Database["public"]["Enums"]["ContractStatus"];
          contract_token?: string | null;
          contract_token_expires_at?: string | null;
          country?: string | null;
          created_at?: string;
          cuisine?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_visible?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          notification_settings?: Json | null;
          offer_table_today?: boolean;
          opening_hours?: string | null;
          phone?: string | null;
          plan?: string | null;
          postal_code?: string | null;
          price_range?: string | null;
          privacy_settings?: Json | null;
          stripe_subscription_id?: string | null;
          trial_end_date?: string | null;
          updated_at?: string;
          userId?: string;
          website?: string | null;
        };
      };
      translations: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          language_code: Database["public"]["Enums"]["Language"];
          updated_at: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          language_code: Database["public"]["Enums"]["Language"];
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          language_code?: Database["public"]["Enums"]["Language"];
          updated_at?: string;
          value?: string;
        };
      };
      user_settings: {
        Row: {
          created_at: string;
          event_reminders: boolean;
          id: string;
          receive_newsletter: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_reminders?: boolean;
          id?: string;
          receive_newsletter?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_reminders?: boolean;
          id?: string;
          receive_newsletter?: boolean;
          updated_at?: string;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      ContactMessageStatus: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
      ContractStatus: "PENDING" | "ACTIVE" | "CANCELLED" | "REJECTED" | "APPROVED";
      CmsSectionType: "HERO" | "FEATURE" | "FOOTER" | "TESTIMONIAL" | "BANNER";
      EventStatus: "OPEN" | "FULL" | "CLOSED" | "PAST";
      Language: "DE" | "EN" | "ES" | "PT" | "FR";
      UserRole: "CUSTOMER" | "RESTAURANT" | "ADMIN";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type ContactTable = Database["public"]["Tables"]["contact_tables"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];