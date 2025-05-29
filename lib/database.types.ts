// lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Definición de los Enums que existen en la base de datos
export type BatchStatusEnum =
  | "pending"
  | "in_progress"
  | "ai_prefilled"
  | "discrepancies"
  | "completed"
  | "error";

export type BatchItemStatusEnum =
  | "unreviewed"
  | "ai_preclassified"
  | "human_preclassified"
  | "disagreement"
  | "reconciled"
  | "error";

// Nuevos Enums para Dimensiones (si los necesitas, de momento usamos 'text')
// export type PreclassDimensionTypeEnum = "finite" | "open";


export interface Database {
  public: {
    Tables: {
      // =================================================================
      // TABLAS DE USUARIOS Y PERFILES
      // =================================================================
      users_profiles: {
        Row: {
          user_id: string
          first_name: string | null
          last_name: string | null
          public_display_name: string | null
          public_contact_email: string | null
          primary_institution: string | null
          contact_phone: string | null
          general_notes: string | null
          preferred_language: string | null
          pronouns: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          first_name?: string | null
          last_name?: string | null
          public_display_name?: string | null
          public_contact_email?: string | null
          primary_institution?: string | null
          contact_phone?: string | null
          general_notes?: string | null
          preferred_language?: string | null
          pronouns?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          public_display_name?: string | null
          public_contact_email?: string | null
          primary_institution?: string | null
          contact_phone?: string | null
          general_notes?: string | null
          preferred_language?: string | null
          pronouns?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // =================================================================
      // TABLAS DE PROYECTOS, ROLES Y MIEMBROS
      // =================================================================
      projects: {
        Row: {
          id: string
          name: string
          code: string | null
          description: string | null
          institution_name: string | null
          lead_researcher_user_id: string | null
          status: string
          module_bibliography: boolean
          module_interviews: boolean
          module_planning: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          description?: string | null
          institution_name?: string | null
          lead_researcher_user_id?: string | null
          status?: string
          module_bibliography?: boolean
          module_interviews?: boolean
          module_planning?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          description?: string | null
          institution_name?: string | null
          lead_researcher_user_id?: string | null
          status?: string
          module_bibliography?: boolean
          module_interviews?: boolean
          module_planning?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_researcher_user_id_fkey"
            columns: ["lead_researcher_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      project_roles: {
        Row: {
          id: string
          project_id: string
          role_name: string
          role_description: string | null
          can_manage_master_data: boolean
          can_create_batches: boolean
          can_upload_files: boolean
          can_bulk_edit_master_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          role_name: string
          role_description?: string | null
          can_manage_master_data?: boolean
          can_create_batches?: boolean
          can_upload_files?: boolean
          can_bulk_edit_master_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          role_name?: string
          role_description?: string | null
          can_manage_master_data?: boolean
          can_create_batches?: boolean
          can_upload_files?: boolean
          can_bulk_edit_master_data?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }

      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          project_role_id: string
          is_active_for_user: boolean
          ui_theme: string | null
          ui_font_pair: string | null
          ui_is_dark_mode: boolean
          contextual_notes: string | null
          contact_email_for_project: string | null
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          project_role_id: string
          is_active_for_user?: boolean
          ui_theme?: string | null
          ui_font_pair?: string | null
          ui_is_dark_mode?: boolean
          contextual_notes?: string | null
          contact_email_for_project?: string | null
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          project_role_id?: string
          is_active_for_user?: boolean
          ui_theme?: string | null
          ui_font_pair?: string | null
          ui_is_dark_mode?: boolean
          contextual_notes?: string | null
          contact_email_for_project?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_role_id_fkey"
            columns: ["project_role_id"]
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          }
        ]
      }

      // =================================================================
      // TABLAS DE ARTÍCULOS Y LOTES
      // =================================================================
      articles: {
        Row: {
          id: string
          project_id: string | null // Mantengo como en tu original, aunque tu doc dice FK a projects(id) y no null
          external_id: string | null
          title: string | null
          authors: string[] | null
          journal: string | null
          publication_year: number | null
          language: string | null
          abstract: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
          correlativo: number
          "Publication Type": string | null
          "Author Full Names": string | null
          Title2: string | null
          ORCIDs: string | null
          ISSN: string | null
          eISSN: string | null
          ISBN: string | null
          "Publication Date": string | null
          Volume: string | null
          Issue: string | null
          "Special Issue": string | null
          "Start Page": string | null
          "End Page": string | null
          "Article Number": string | null
          DOI: string | null
          "DOI Link": string | null
          "UT (Unique WOS ID)": string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          external_id?: string | null
          title?: string | null
          authors?: string[] | null
          journal?: string | null
          publication_year?: number | null
          language?: string | null
          abstract?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          correlativo: number
          "Publication Type"?: string | null
          "Author Full Names"?: string | null
          Title2?: string | null
          ORCIDs?: string | null
          ISSN?: string | null
          eISSN?: string | null
          ISBN?: string | null
          "Publication Date"?: string | null
          Volume?: string | null
          Issue?: string | null
          "Special Issue"?: string | null
          "Start Page"?: string | null
          "End Page"?: string | null
          "Article Number"?: string | null
          DOI?: string | null
          "DOI Link"?: string | null
          "UT (Unique WOS ID)"?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          external_id?: string | null
          title?: string | null
          authors?: string[] | null
          journal?: string | null
          publication_year?: number | null
          language?: string | null
          abstract?: string | null
          metadata?: Json | null
          updated_at?: string
          correlativo?: number
          "Publication Type"?: string | null
          "Author Full Names"?: string | null
          Title2?: string | null
          ORCIDs?: string | null
          ISSN?: string | null
          eISSN?: string | null
          ISBN?: string | null
          "Publication Date"?: string | null
          Volume?: string | null
          Issue?: string | null
          "Special Issue"?: string | null
          "Start Page"?: string | null
          "End Page"?: string | null
          "Article Number"?: string | null
          DOI?: string | null
          "DOI Link"?: string | null
          "UT (Unique WOS ID)"?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }

      article_batches: {
        Row: {
          id: string
          project_id: string
          batch_number: number
          name: string | null
          assigned_to: string | null
          status: BatchStatusEnum
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          batch_number: number
          name?: string | null
          assigned_to?: string | null
          status?: BatchStatusEnum
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          batch_number?: number
          name?: string | null
          assigned_to?: string | null
          status?: BatchStatusEnum
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_batches_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_batches_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      article_batch_items: {
        Row: {
          id: string
          batch_id: string
          article_id: string
          ai_label: string | null
          human_label: string | null
          status: BatchItemStatusEnum
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          article_id: string
          ai_label?: string | null
          human_label?: string | null
          status?: BatchItemStatusEnum
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          article_id?: string
          ai_label?: string | null
          human_label?: string | null
          status?: BatchItemStatusEnum
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            referencedRelation: "article_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_batch_items_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          }
        ]
      }

      article_translations: {
        Row: {
          id: string
          article_id: string
          language_code: string
          title: string
          abstract: string
          summary: string | null
          translated_by_user_id: string | null
          translator_system: string | null
          translated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_id: string
          language_code: string
          title: string
          abstract: string
          summary?: string | null
          translated_by_user_id?: string | null
          translator_system?: string | null
          translated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          language_code?: string
          title?: string
          abstract?: string
          summary?: string | null
          translated_by_user_id?: string | null
          translator_system?: string | null
          translated_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_translations_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_translations_translated_by_user_id_fkey"
            columns: ["translated_by_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // =================================================================
      // TABLAS DE AUDITORÍA E HISTORIAL
      // =================================================================
      project_roles_history: {
        Row: {
          history_id: string
          operation_type: "INSERT" | "UPDATE" | "DELETE"
          operation_timestamp: string
          operated_by_user_id: string | null
          role_id: string
          project_id: string
          role_name_old: string | null
          role_name_new: string | null
          role_description_old: string | null
          role_description_new: string | null
          can_manage_master_data_old: boolean | null
          can_manage_master_data_new: boolean | null
          can_create_batches_old: boolean | null
          can_create_batches_new: boolean | null
          can_upload_files_old: boolean | null
          can_upload_files_new: boolean | null
          can_bulk_edit_master_data_old: boolean | null
          can_bulk_edit_master_data_new: boolean | null
        }
        Insert: {
          history_id?: string
          operation_type: "INSERT" | "UPDATE" | "DELETE"
          operation_timestamp?: string
          operated_by_user_id?: string | null
          role_id: string
          project_id: string
          role_name_old?: string | null
          role_name_new?: string | null
          role_description_old?: string | null
          role_description_new?: string | null
          can_manage_master_data_old?: boolean | null
          can_manage_master_data_new?: boolean | null
          can_create_batches_old?: boolean | null
          can_create_batches_new?: boolean | null
          can_upload_files_old?: boolean | null
          can_upload_files_new?: boolean | null
          can_bulk_edit_master_data_old?: boolean | null
          can_bulk_edit_master_data_new?: boolean | null
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: "project_roles_history_operated_by_user_id_fkey"
            columns: ["operated_by_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_roles_history_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "project_roles" // Asumiendo que el FK es a project_roles.id
            referencedColumns: ["id"]
          },
           { // Asegúrate que este FK también esté bien definido.
            foreignKeyName: "project_roles_history_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }

      // =================================================================
      // NUEVAS TABLAS: DIMENSIONES DE PRE-CLASIFICACIÓN
      // =================================================================
      preclass_dimensions: {
        Row: {
          id: string // uuid PK
          project_id: string // uuid FK projects(id)
          name: string // text
          type: string // text ('finite' | 'open') - Usamos string aquí, se puede refinar con un Enum si se crea en DB
          description: string | null // text
          ordering: number // integer
          created_at: string // timestamptz default now()
          updated_at: string // timestamptz default now()
        }
        Insert: {
          id?: string // uuid default gen_random_uuid()
          project_id: string
          name: string
          type: string // 'finite' | 'open'
          description?: string | null
          ordering?: number
          created_at?: string // timestamptz default now()
          updated_at?: string // timestamptz default now()
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: string // 'finite' | 'open'
          description?: string | null
          ordering?: number
          updated_at?: string // timestamptz default now()
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimensions_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }

      preclass_dimension_options: {
        Row: {
          id: string // uuid PK
          dimension_id: string // uuid FK preclass_dimensions(id)
          value: string // text
          ordering: number // integer
          created_at: string // timestamptz default now()
          // updated_at no estaba en tu doc original para esta tabla, la omito por ahora
        }
        Insert: {
          id?: string // uuid default gen_random_uuid()
          dimension_id: string
          value: string
          ordering?: number
          created_at?: string // timestamptz default now()
        }
        Update: {
          id?: string
          dimension_id?: string
          value?: string
          ordering?: number
          // updated_at? : string
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimension_options_dimension_id_fkey"
            columns: ["dimension_id"]
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          }
        ]
      }

      preclass_dimension_questions: {
        Row: {
          id: string // uuid PK
          dimension_id: string // uuid FK preclass_dimensions(id)
          question: string // text
          ordering: number // integer
          created_at: string // timestamptz default now()
          // updated_at no estaba en tu doc original para esta tabla
        }
        Insert: {
          id?: string // uuid default gen_random_uuid()
          dimension_id: string
          question: string
          ordering?: number
          created_at?: string // timestamptz default now()
        }
        Update: {
          id?: string
          dimension_id?: string
          question?: string
          ordering?: number
          // updated_at? : string
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimension_questions_dimension_id_fkey"
            columns: ["dimension_id"]
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          }
        ]
      }

      preclass_dimension_examples: {
        Row: {
          id: string // uuid PK
          dimension_id: string // uuid FK preclass_dimensions(id)
          example: string // text
          created_at: string // timestamptz default now()
          // updated_at no estaba en tu doc original para esta tabla
        }
        Insert: {
          id?: string // uuid default gen_random_uuid()
          dimension_id: string
          example: string
          created_at?: string // timestamptz default now()
        }
        Update: {
          id?: string
          dimension_id?: string
          example?: string
          // updated_at? : string
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimension_examples_dimension_id_fkey"
            columns: ["dimension_id"]
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          }
        ]
      }

    } // Fin de Tables
    Views: {
      detailed_project_members: {
        Row: {
          project_member_id: string | null
          user_id: string | null
          project_id: string | null
          project_role_id: string | null
          joined_at: string | null
          role_name: string | null
          first_name: string | null
          last_name: string | null
          public_display_name: string | null
          public_contact_email: string | null
          primary_institution: string | null
          contact_phone: string | null
          general_notes: string | null
          preferred_language: string | null
          pronouns: string | null
          ui_theme: string | null
          ui_font_pair: string | null
          ui_is_dark_mode: boolean | null
          can_manage_master_data?: boolean | null
          can_create_batches?: boolean | null
          can_upload_files?: boolean | null
          can_bulk_edit_master_data?: boolean | null
          is_active_for_user?: boolean | null
          contextual_notes?: string | null
          contact_email_for_project?: string | null
        }
        // Si la vista permite Insert/Update (generalmente no), se definirían aquí.
        // Insert?: { ... }
        // Update?: { ... }
      }
      // Si existiera la vista eligible_articles_for_batching_view, se definiría aquí.
      // Ejemplo:
      // eligible_articles_for_batching_view: {
      //   Row: {
      //     article_id: string | null
      //     project_id: string | null
      //     title: string | null
      //     // ... otros campos relevantes de la vista
      //   }
      // }
    } // Fin de Views
    Functions: {
      get_current_auth_context: {
        Args: Record<string, never>
        Returns: {
          current_uid: string | null
          current_role: string | null
        }[]
      }
      get_user_by_email: {
        Args: {
          user_email: string
        }
        Returns: string | null
      }
      has_permission_in_project: {
        Args: {
          p_user_id: string
          p_project_id: string
          p_permission_column: string
        }
        Returns: boolean
      }
      is_user_member_of_project: {
        Args: {
            p_user_id: string
            p_project_id_to_check: string
        }
        Returns: boolean
      }
      // Si existiera la función get_project_batches_with_assignee_names, se definiría aquí.
      // Ejemplo:
      // get_project_batches_with_assignee_names: {
      //   Args: {
      //     p_project_id: string
      //   }
      //   Returns: { // Este tipo de retorno debería coincidir con tu BatchForDisplay
      //     id: string
      //     batch_number: number
      //     name: string | null
      //     status: string // o BatchStatusEnum si la RPC lo devuelve así
      //     assigned_to_member_name: string | null
      //     article_count: number // o string si la RPC devuelve string y conviertes luego
      //   }[]
      // }
    } // Fin de Functions
    Enums: {
      batch_status: BatchStatusEnum
      batch_item_status: BatchItemStatusEnum
      // preclass_dimension_type: PreclassDimensionTypeEnum // Si creas el enum en la DB
    } // Fin de Enums
    CompositeTypes: {
      [_ in never]: never
    }
  } // Fin de public
} // Fin de Database