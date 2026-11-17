export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "host" | "vendor" | "admin";

export type ServiceCategory =
  | "venue"
  | "catering"
  | "decoration"
  | "av_tech"
  | "photography"
  | "entertainment";

export type PriceUnit = "flat" | "per_person" | "per_hour";

export type PackageTier = "economy" | "standard" | "premium";

export type EventStatus =
  | "draft"
  | "planned"
  | "booking_requested"
  | "confirmed"
  | "cancelled";

export type BookingRequestStatus = "pending" | "accepted" | "declined";

export type PaymentType = "deposit" | "balance" | "featured_fee";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type PayoutStatus = "owed" | "paid";

export type ChatRole = "user" | "assistant";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      vendors: {
        Row: {
          id: string;
          owner_id: string;
          business_name: string;
          category: ServiceCategory;
          description: string | null;
          location_city: string;
          base_price: number;
          price_unit: PriceUnit;
          min_capacity: number | null;
          max_capacity: number | null;
          tags: string[];
          themes: string[];
          dietary_options: string[];
          portfolio_image_urls: string[];
          rating: number | null;
          review_count: number;
          is_new: boolean;
          is_active: boolean;
          is_featured: boolean;
          featured_until: string | null;
          embedding: string | null;
          embedding_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          business_name: string;
          category: ServiceCategory;
          description?: string | null;
          location_city: string;
          base_price: number;
          price_unit?: PriceUnit;
          min_capacity?: number | null;
          max_capacity?: number | null;
          tags?: string[];
          themes?: string[];
          dietary_options?: string[];
          portfolio_image_urls?: string[];
          rating?: number | null;
          review_count?: number;
          is_new?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          featured_until?: string | null;
          embedding?: string | null;
          embedding_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          business_name?: string;
          category?: ServiceCategory;
          description?: string | null;
          location_city?: string;
          base_price?: number;
          price_unit?: PriceUnit;
          min_capacity?: number | null;
          max_capacity?: number | null;
          tags?: string[];
          themes?: string[];
          dietary_options?: string[];
          portfolio_image_urls?: string[];
          rating?: number | null;
          review_count?: number;
          is_new?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          featured_until?: string | null;
          embedding?: string | null;
          embedding_source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendors_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      events: {
        Row: {
          id: string;
          host_id: string;
          title: string;
          event_type: string;
          event_date: string | null;
          location_city: string;
          budget: number;
          headcount: number;
          theme_description: string | null;
          dietary_needs: string[];
          must_have_categories: string[];
          status: EventStatus;
          extracted_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          title: string;
          event_type: string;
          event_date?: string | null;
          location_city: string;
          budget: number;
          headcount: number;
          theme_description?: string | null;
          dietary_needs?: string[];
          must_have_categories?: string[];
          status?: EventStatus;
          extracted_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          title?: string;
          event_type?: string;
          event_date?: string | null;
          location_city?: string;
          budget?: number;
          headcount?: number;
          theme_description?: string | null;
          dietary_needs?: string[];
          must_have_categories?: string[];
          status?: EventStatus;
          extracted_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      packages: {
        Row: {
          id: string;
          event_id: string;
          tier: PackageTier;
          total_cost: number;
          budget_used_percent: number;
          is_selected: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          tier: PackageTier;
          total_cost: number;
          budget_used_percent: number;
          is_selected?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          tier?: PackageTier;
          total_cost?: number;
          budget_used_percent?: number;
          is_selected?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "packages_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      package_items: {
        Row: {
          id: string;
          package_id: string;
          vendor_id: string;
          category: ServiceCategory;
          estimated_cost: number;
          match_score: number | null;
          match_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          vendor_id: string;
          category: ServiceCategory;
          estimated_cost: number;
          match_score?: number | null;
          match_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          package_id?: string;
          vendor_id?: string;
          category?: ServiceCategory;
          estimated_cost?: number;
          match_score?: number | null;
          match_reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "package_items_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_items_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          }
        ];
      };
      mood_boards: {
        Row: {
          id: string;
          event_id: string;
          prompt: string;
          image_url: string;
          is_placeholder: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          prompt: string;
          image_url: string;
          is_placeholder?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          prompt?: string;
          image_url?: string;
          is_placeholder?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mood_boards_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          event_id: string;
          role: ChatRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          role: ChatRole;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          role?: ChatRole;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      booking_requests: {
        Row: {
          id: string;
          event_id: string;
          package_id: string;
          vendor_id: string;
          package_item_id: string;
          status: BookingRequestStatus;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          package_id: string;
          vendor_id: string;
          package_item_id: string;
          status?: BookingRequestStatus;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          package_id?: string;
          vendor_id?: string;
          package_item_id?: string;
          status?: BookingRequestStatus;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_requests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_requests_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_requests_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_requests_package_item_id_fkey";
            columns: ["package_item_id"];
            isOneToOne: false;
            referencedRelation: "package_items";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          event_id: string;
          package_id: string;
          host_id: string;
          amount: number;
          currency: string;
          type: PaymentType;
          status: PaymentStatus;
          provider: string;
          provider_tran_id: string | null;
          provider_val_id: string | null;
          raw_response: Json | null;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          package_id: string;
          host_id: string;
          amount: number;
          currency?: string;
          type: PaymentType;
          status?: PaymentStatus;
          provider: string;
          provider_tran_id?: string | null;
          provider_val_id?: string | null;
          raw_response?: Json | null;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          package_id?: string;
          host_id?: string;
          amount?: number;
          currency?: string;
          type?: PaymentType;
          status?: PaymentStatus;
          provider?: string;
          provider_tran_id?: string | null;
          provider_val_id?: string | null;
          raw_response?: Json | null;
          created_at?: string;
          paid_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      vendor_payouts: {
        Row: {
          id: string;
          vendor_id: string;
          payment_id: string;
          gross_amount: number;
          commission_amount: number;
          net_amount: number;
          status: PayoutStatus;
          paid_at: string | null;
          reference_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          payment_id: string;
          gross_amount: number;
          commission_amount: number;
          net_amount: number;
          status?: PayoutStatus;
          paid_at?: string | null;
          reference_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          payment_id?: string;
          gross_amount?: number;
          commission_amount?: number;
          net_amount?: number;
          status?: PayoutStatus;
          paid_at?: string | null;
          reference_note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_payouts_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_logs: {
        Row: {
          id: string;
          user_id: string | null;
          feature: string;
          mode: string;
          latency_ms: number;
          success: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          feature: string;
          mode: string;
          latency_ms: number;
          success: boolean;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          feature?: string;
          mode?: string;
          latency_ms?: number;
          success?: boolean;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      match_vendors: {
        Args: {
          query_embedding: string;
          p_category?: string | null;
          p_city?: string | null;
          p_headcount?: number | null;
          match_count?: number;
        };
        Returns: {
          id: string;
          owner_id: string;
          business_name: string;
          category: ServiceCategory;
          description: string | null;
          location_city: string;
          base_price: number;
          price_unit: PriceUnit;
          min_capacity: number | null;
          max_capacity: number | null;
          tags: string[];
          themes: string[];
          dietary_options: string[];
          portfolio_image_urls: string[];
          rating: number | null;
          review_count: number;
          is_new: boolean;
          is_active: boolean;
          is_featured: boolean;
          featured_until: string | null;
          embedding: string | null;
          embedding_source: string | null;
          created_at: string;
          updated_at: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      service_category: ServiceCategory;
      price_unit: PriceUnit;
      package_tier: PackageTier;
      event_status: EventStatus;
      booking_request_status: BookingRequestStatus;
      payment_type: PaymentType;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
      chat_role: ChatRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
