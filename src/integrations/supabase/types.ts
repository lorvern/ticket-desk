export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          event_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          category: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_featured: boolean
          name: string
          organizer_contact: string | null
          organizer_name: string | null
          slug: string
          starts_at: string
          status: string
          updated_at: string
          venue: string
        }
        Insert: {
          banner_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_featured?: boolean
          name: string
          organizer_contact?: string | null
          organizer_name?: string | null
          slug: string
          starts_at: string
          status?: string
          updated_at?: string
          venue: string
        }
        Update: {
          banner_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          organizer_contact?: string | null
          organizer_name?: string | null
          slug?: string
          starts_at?: string
          status?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          quantity: number
          ticket_category_id: string
          ticket_name: string
          unit_price_pesewas: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          quantity: number
          ticket_category_id: string
          ticket_name: string
          unit_price_pesewas: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          ticket_category_id?: string
          ticket_name?: string
          unit_price_pesewas?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string
          coupon_id: string | null
          created_at: string
          discount_pesewas: number
          event_id: string
          fee_pesewas: number
          id: string
          paid_at: string | null
          paystack_access_code: string | null
          paystack_reference: string | null
          reference: string
          status: string
          subtotal_pesewas: number
          total_pesewas: number
          updated_at: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string
          coupon_id?: string | null
          created_at?: string
          discount_pesewas?: number
          event_id: string
          fee_pesewas?: number
          id?: string
          paid_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          reference: string
          status?: string
          subtotal_pesewas?: number
          total_pesewas?: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string
          coupon_id?: string | null
          created_at?: string
          discount_pesewas?: number
          event_id?: string
          fee_pesewas?: number
          id?: string
          paid_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          reference?: string
          status?: string
          subtotal_pesewas?: number
          total_pesewas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_visible: boolean
          name: string
          price_pesewas: number
          quantity: number
          sale_ends_at: string | null
          sale_starts_at: string | null
          sold_count: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_visible?: boolean
          name: string
          price_pesewas: number
          quantity: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_visible?: boolean
          name?: string
          price_pesewas?: number
          quantity?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          id: string
          result: string
          scanned_at: string
          scanned_by: string | null
          ticket_id: string
        }
        Insert: {
          id?: string
          result: string
          scanned_at?: string
          scanned_by?: string | null
          ticket_id: string
        }
        Update: {
          id?: string
          result?: string
          scanned_at?: string
          scanned_by?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendee_name: string | null
          created_at: string
          event_id: string
          id: string
          order_id: string
          qr_payload: string
          status: string
          ticket_category_id: string
          ticket_code: string
          used_at: string | null
        }
        Insert: {
          attendee_name?: string | null
          created_at?: string
          event_id: string
          id?: string
          order_id: string
          qr_payload: string
          status?: string
          ticket_category_id: string
          ticket_code: string
          used_at?: string | null
        }
        Update: {
          attendee_name?: string | null
          created_at?: string
          event_id?: string
          id?: string
          order_id?: string
          qr_payload?: string
          status?: string
          ticket_category_id?: string
          ticket_code?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
