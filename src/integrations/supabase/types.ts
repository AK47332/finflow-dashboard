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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
          summary: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          summary: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_movements: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          organization_id: string
          payment_method: string | null
          type: Database["public"]["Enums"]["capital_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          organization_id: string
          payment_method?: string | null
          type: Database["public"]["Enums"]["capital_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          organization_id?: string
          payment_method?: string | null
          type?: Database["public"]["Enums"]["capital_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subscriptions: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ecom_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          customer_id: string
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          customer_id: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ecom_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_announcements: {
        Row: {
          created_at: string
          created_by: string
          icon: string | null
          id: string
          is_active: boolean
          link_url: string | null
          organization_id: string
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          icon?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          organization_id: string
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          organization_id?: string
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_banners: {
        Row: {
          created_at: string
          created_by: string
          cta_label: string | null
          cta_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          organization_id: string
          position: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          organization_id: string
          position?: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          organization_id?: string
          position?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_banners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_categories: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          organization_id: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ecom_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_contact_widget: {
        Row: {
          email: string | null
          greeting: string | null
          is_enabled: boolean
          messenger_username: string | null
          organization_id: string
          phone_number: string | null
          position: string
          updated_at: string
          updated_by: string | null
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          email?: string | null
          greeting?: string | null
          is_enabled?: boolean
          messenger_username?: string | null
          organization_id: string
          phone_number?: string | null
          position?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          email?: string | null
          greeting?: string | null
          is_enabled?: boolean
          messenger_username?: string | null
          organization_id?: string
          phone_number?: string | null
          position?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecom_contact_widget_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_customers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_instagram_posts: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_instagram_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecom_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ecom_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_orders: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          order_number: string
          organization_id: string
          payment_method: string
          payment_status: Database["public"]["Enums"]["order_payment_status"]
          shipping_city: string | null
          shipping_country: string | null
          shipping_fee: number
          shipping_full_name: string | null
          shipping_line1: string | null
          shipping_line2: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          organization_id: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_fee?: number
          shipping_full_name?: string | null
          shipping_line1?: string | null
          shipping_line2?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          organization_id?: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_fee?: number
          shipping_full_name?: string | null
          shipping_line1?: string | null
          shipping_line2?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ecom_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_pages: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          organization_id: string
          show_in_footer: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          organization_id: string
          show_in_footer?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          show_in_footer?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_pages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_product_extras: {
        Row: {
          compare_at_price: number | null
          ecom_category_id: string | null
          image_urls: string[] | null
          is_featured: boolean
          is_published: boolean
          is_trending: boolean
          long_description: string | null
          organization_id: string
          product_id: string
          short_description: string | null
          slug: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          ecom_category_id?: string | null
          image_urls?: string[] | null
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          long_description?: string | null
          organization_id: string
          product_id: string
          short_description?: string | null
          slug: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          ecom_category_id?: string | null
          image_urls?: string[] | null
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          long_description?: string | null
          organization_id?: string
          product_id?: string
          short_description?: string | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_product_extras_ecom_category_id_fkey"
            columns: ["ecom_category_id"]
            isOneToOne: false
            referencedRelation: "ecom_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_product_extras_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_product_extras_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          date: string
          description: string | null
          document_name: string | null
          document_path: string | null
          document_type: string | null
          document_url: string | null
          id: string
          is_recurring: boolean
          next_due_date: string | null
          organization_id: string
          payment_method: string
          recurrence: string | null
          tags: string[] | null
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_recurring?: boolean
          next_due_date?: string | null
          organization_id: string
          payment_method?: string
          recurrence?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_recurring?: boolean
          next_due_date?: string | null
          organization_id?: string
          payment_method?: string
          recurrence?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          category: string
          client: string | null
          created_at: string
          created_by: string
          date: string
          description: string | null
          document_name: string | null
          document_path: string | null
          document_type: string | null
          document_url: string | null
          ecom_order_id: string | null
          id: string
          is_partial: boolean
          organization_id: string
          payment_method: string
          remaining_due: number | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          client?: string | null
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          ecom_order_id?: string | null
          id?: string
          is_partial?: boolean
          organization_id: string
          payment_method?: string
          remaining_due?: number | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          client?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          ecom_order_id?: string | null
          id?: string
          is_partial?: boolean
          organization_id?: string
          payment_method?: string
          remaining_due?: number | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color: string
          content: string
          created_at: string
          created_by: string
          document_name: string | null
          document_path: string | null
          document_type: string | null
          document_url: string | null
          id: string
          note_date: string
          organization_id: string
          pinned: boolean
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          created_by: string
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          note_date?: string
          organization_id: string
          pinned?: boolean
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          created_by?: string
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          note_date?: string
          organization_id?: string
          pinned?: boolean
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_footer_settings: {
        Row: {
          address: string | null
          contact_button_label: string | null
          contact_button_url: string | null
          contact_text: string | null
          copyright_text: string | null
          description: string | null
          email: string | null
          facebook_url: string | null
          instagram_url: string | null
          organization_id: string
          payment_badges: string[] | null
          phone: string | null
          twitter_url: string | null
          updated_at: string
          updated_by: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          contact_button_label?: string | null
          contact_button_url?: string | null
          contact_text?: string | null
          copyright_text?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          organization_id: string
          payment_badges?: string[] | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string
          updated_by?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          contact_button_label?: string | null
          contact_button_url?: string | null
          contact_text?: string | null
          copyright_text?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          organization_id?: string
          payment_badges?: string[] | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string
          updated_by?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_footer_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_frontend_settings: {
        Row: {
          footer_logo_url: string | null
          hero_cta_label: string | null
          hero_cta_url: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          is_primary: boolean
          mode: Database["public"]["Enums"]["frontend_mode"]
          organization_id: string
          store_logo_url: string | null
          store_name: string | null
          store_tagline: string | null
          theme_accent_color: string | null
          theme_primary_color: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          footer_logo_url?: string | null
          hero_cta_label?: string | null
          hero_cta_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          is_primary?: boolean
          mode?: Database["public"]["Enums"]["frontend_mode"]
          organization_id: string
          store_logo_url?: string | null
          store_name?: string | null
          store_tagline?: string | null
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          footer_logo_url?: string | null
          hero_cta_label?: string | null
          hero_cta_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          is_primary?: boolean
          mode?: Database["public"]["Enums"]["frontend_mode"]
          organization_id?: string
          store_logo_url?: string | null
          store_name?: string | null
          store_tagline?: string | null
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_frontend_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          id: string
          logo_url: string | null
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          logo_url?: string | null
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      password_changes: {
        Row: {
          changed_at: string
          created_at: string
          email: string | null
          id: string
          password_preview: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          created_at?: string
          email?: string | null
          id?: string
          password_preview?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          created_at?: string
          email?: string | null
          id?: string
          password_preview?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payables: {
        Row: {
          amount: number
          amount_paid: number
          created_at: string
          created_by: string
          description: string | null
          document_name: string | null
          document_path: string | null
          document_type: string | null
          document_url: string | null
          due_date: string | null
          expense_id: string | null
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["ledger_status"]
          title: string | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          created_at?: string
          created_by: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          due_date?: string | null
          expense_id?: string | null
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["ledger_status"]
          title?: string | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          created_at?: string
          created_by?: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          due_date?: string | null
          expense_id?: string | null
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["ledger_status"]
          title?: string | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          price: number
          sku: string | null
          stock: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          price?: number
          sku?: string | null
          stock?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
          sku?: string | null
          stock?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_org_id: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_org_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_org_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount: number
          amount_paid: number
          client_id: string | null
          client_name: string
          created_at: string
          created_by: string
          description: string | null
          document_name: string | null
          document_path: string | null
          document_type: string | null
          document_url: string | null
          due_date: string | null
          id: string
          income_id: string | null
          organization_id: string
          status: Database["public"]["Enums"]["ledger_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          client_id?: string | null
          client_name: string
          created_at?: string
          created_by: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          income_id?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["ledger_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          income_id?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["ledger_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_income_id_fkey"
            columns: ["income_id"]
            isOneToOne: false
            referencedRelation: "incomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string
          id: string
          notify: boolean
          organization_id: string
          related_id: string | null
          related_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at: string
          id?: string
          notify?: boolean
          organization_id: string
          related_id?: string | null
          related_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string
          id?: string
          notify?: boolean
          organization_id?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          organization_id: string
          price: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          organization_id: string
          price?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organization_id?: string
          price?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      current_user_email: { Args: never; Returns: string }
      get_user_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_active: { Args: { _user_id: string }; Returns: boolean }
      is_ecom_customer: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "member"
        | "sales_manager"
        | "account_manager"
        | "store_manager"
      capital_type: "contribution" | "withdrawal"
      frontend_mode: "private" | "ecommerce" | "landing"
      invite_status: "pending" | "accepted" | "revoked" | "expired"
      ledger_status: "pending" | "partial" | "paid" | "overdue"
      order_payment_status: "unpaid" | "paid" | "refunded"
      order_status:
        | "pending"
        | "confirmed"
        | "paid"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: [
        "owner",
        "admin",
        "member",
        "sales_manager",
        "account_manager",
        "store_manager",
      ],
      capital_type: ["contribution", "withdrawal"],
      frontend_mode: ["private", "ecommerce", "landing"],
      invite_status: ["pending", "accepted", "revoked", "expired"],
      ledger_status: ["pending", "partial", "paid", "overdue"],
      order_payment_status: ["unpaid", "paid", "refunded"],
      order_status: [
        "pending",
        "confirmed",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
    },
  },
} as const
