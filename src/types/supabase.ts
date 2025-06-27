export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          can_manage_settings: boolean
          can_manage_users: boolean
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          can_manage_settings?: boolean
          can_manage_users?: boolean
          created_at?: string
          id: string
          updated_at: string
        }
        Update: {
          can_manage_settings?: boolean
          can_manage_users?: boolean
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      CmsSection: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          language_code: Database["public"]["Enums"]["Language"]
          position: number
          title: string
          type: Database["public"]["Enums"]["CmsSectionType"]
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id: string
          is_active?: boolean
          key: string
          language_code: Database["public"]["Enums"]["Language"]
          position: number
          title: string
          type: Database["public"]["Enums"]["CmsSectionType"]
          updated_at: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          language_code?: Database["public"]["Enums"]["Language"]
          position?: number
          title?: string
          type?: Database["public"]["Enums"]["CmsSectionType"]
          updated_at?: string
        }
        Relationships: []
      }
      contact_tables: {
        Row: {
          created_at: string
          datetime: string
          description: string | null
          id: string
          max_participants: number
          price: number
          restaurant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          datetime: string
          description?: string | null
          id: string
          max_participants: number
          price?: number
          restaurant_id: string
          title: string
          updated_at: string
        }
        Update: {
          created_at?: string
          datetime?: string
          description?: string | null
          id?: string
          max_participants?: number
          price?: number
          restaurant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ContactMessage: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["ContactMessageStatus"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["ContactMessageStatus"]
          subject: string
          updated_at: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["ContactMessageStatus"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      Contract: {
        Row: {
          cancellation_date: string | null
          created_at: string
          id: string
          restaurant_id: string
          start_date: string
          status: Database["public"]["Enums"]["ContractStatus"]
          trial_end_date: string | null
          updated_at: string
        }
        Insert: {
          cancellation_date?: string | null
          created_at?: string
          id: string
          restaurant_id: string
          start_date: string
          status: Database["public"]["Enums"]["ContractStatus"]
          trial_end_date?: string | null
          updated_at: string
        }
        Update: {
          cancellation_date?: string | null
          created_at?: string
          id?: string
          restaurant_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["ContractStatus"]
          trial_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Contract_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Invoice: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          download_url: string
          id: string
          restaurant_id: string | null
          stripe_invoice_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          date?: string
          download_url: string
          id: string
          restaurant_id?: string | null
          stripe_invoice_id: string
          updated_at: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          download_url?: string
          id?: string
          restaurant_id?: string | null
          stripe_invoice_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Invoice_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Invoice_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id: string
          is_read?: boolean
          metadata?: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_host: boolean
          joined_at: string
          message: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id: string
          is_host?: boolean
          joined_at?: string
          message?: string | null
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_host?: boolean
          joined_at?: string
          message?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_requests: {
        Row: {
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          message: string | null
          restaurant_name: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          created_at?: string
          id: string
          message?: string | null
          restaurant_name: string
          status?: string
          updated_at: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          message?: string | null
          restaurant_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_paying: boolean | null
          language_code: string | null
          name: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_paying?: boolean | null
          language_code?: string | null
          name?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_paying?: boolean | null
          language_code?: string | null
          name?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
          value?: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      RestaurantImage: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          restaurant_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id: string
          is_primary?: boolean
          restaurant_id: string
          updated_at: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          restaurant_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "RestaurantImage_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          booking_url: string | null
          capacity: number | null
          city: string | null
          contract_accepted_at: string | null
          contract_start_date: string | null
          contract_status: Database["public"]["Enums"]["ContractStatus"]
          contract_token: string | null
          contract_token_expires_at: string | null
          country: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          email: string | null
          id: string
          profile_image_url: string | null
          is_active: boolean
          is_visible: boolean
          latitude: number | null
          longitude: number | null
          name: string
          offer_table_today: boolean
          opening_hours: string | null
          phone: string | null
          plan: string | null
          postal_code: string | null
          price_range: string | null
          stripe_subscription_id: string | null
          trial_end_date: string | null
          updated_at: string
          userId: string
          website: string | null
        }
        Insert: {
          address?: string | null
          booking_url?: string | null
          capacity?: number | null
          city?: string | null
          contract_accepted_at?: string | null
          contract_start_date?: string | null
          contract_status?: Database["public"]["Enums"]["ContractStatus"]
          contract_token?: string | null
          contract_token_expires_at?: string | null
          country?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_visible?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          offer_table_today?: boolean
          opening_hours?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          price_range?: string | null
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          updated_at?: string
          userId: string
          website?: string | null
        }
        Update: {
          address?: string | null
          booking_url?: string | null
          capacity?: number | null
          city?: string | null
          contract_accepted_at?: string | null
          contract_start_date?: string | null
          contract_status?: Database["public"]["Enums"]["ContractStatus"]
          contract_token?: string | null
          contract_token_expires_at?: string | null
          country?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_visible?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          offer_table_today?: boolean
          opening_hours?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          price_range?: string | null
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          updated_at?: string
          userId?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Translation: {
        Row: {
          created_at: string
          id: string
          key: string
          language_code: Database["public"]["Enums"]["Language"]
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id: string
          key: string
          language_code: Database["public"]["Enums"]["Language"]
          updated_at: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          language_code?: Database["public"]["Enums"]["Language"]
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          event_reminders: boolean
          id: string
          receive_newsletter: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_reminders?: boolean
          id: string
          receive_newsletter?: boolean
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_reminders?: boolean
          id?: string
          receive_newsletter?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      CmsSectionType: "HERO" | "FEATURE" | "FOOTER" | "TESTIMONIAL" | "BANNER"
      ContactMessageStatus: "NEW" | "READ" | "REPLIED" | "ARCHIVED"
      ContractStatus:
        | "PENDING"
        | "ACTIVE"
        | "CANCELLED"
        | "REJECTED"
        | "APPROVED"
      EventStatus: "OPEN" | "FULL" | "CLOSED" | "PAST"
      Language: "DE" | "EN" | "ES" | "PT" | "FR"
      UserRole: "CUSTOMER" | "RESTAURANT" | "ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      CmsSectionType: ["HERO", "FEATURE", "FOOTER", "TESTIMONIAL", "BANNER"],
      ContactMessageStatus: ["NEW", "READ", "REPLIED", "ARCHIVED"],
      ContractStatus: [
        "PENDING",
        "ACTIVE",
        "CANCELLED",
        "REJECTED",
        "APPROVED",
      ],
      EventStatus: ["OPEN", "FULL", "CLOSED", "PAST"],
      Language: ["DE", "EN", "ES", "PT", "FR"],
      UserRole: ["CUSTOMER", "RESTAURANT", "ADMIN"],
    },
  },
} as const
