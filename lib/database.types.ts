Need to install the following packages:
supabase@2.31.8
Ok to proceed? (y) 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_job_history: {
        Row: {
          ai_model: string | null
          completed_at: string | null
          description: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          job_type: Database["public"]["Enums"]["job_type"]
          output_tokens: number | null
          project_id: string
          started_at: string
          status: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          completed_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          job_type: Database["public"]["Enums"]["job_type"]
          output_tokens?: number | null
          project_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Update: {
          ai_model?: string | null
          completed_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          job_type?: Database["public"]["Enums"]["job_type"]
          output_tokens?: number | null
          project_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_job_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      article_batch_items: {
        Row: {
          ai_keywords: string[] | null
          ai_label: string | null
          ai_process_opinion: string | null
          article_id: string
          batch_id: string
          created_at: string
          human_label: string | null
          id: string
          preclassified_at: string | null
          preclassified_by: string | null
          requires_adjudication: boolean | null
          status: Database["public"]["Enums"]["batch_item_status"]
          status_preclasificacion:
            | Database["public"]["Enums"]["item_preclass_status"]
            | null
        }
        Insert: {
          ai_keywords?: string[] | null
          ai_label?: string | null
          ai_process_opinion?: string | null
          article_id: string
          batch_id: string
          created_at?: string
          human_label?: string | null
          id?: string
          preclassified_at?: string | null
          preclassified_by?: string | null
          requires_adjudication?: boolean | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          status_preclasificacion?:
            | Database["public"]["Enums"]["item_preclass_status"]
            | null
        }
        Update: {
          ai_keywords?: string[] | null
          ai_label?: string | null
          ai_process_opinion?: string | null
          article_id?: string
          batch_id?: string
          created_at?: string
          human_label?: string | null
          id?: string
          preclassified_at?: string | null
          preclassified_by?: string | null
          requires_adjudication?: boolean | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          status_preclasificacion?:
            | Database["public"]["Enums"]["item_preclass_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "article_batch_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_batch_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "eligible_articles_for_batching_view"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "article_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      article_batches: {
        Row: {
          assigned_to: string | null
          batch_number: number
          completed_at: string | null
          created_at: string
          id: string
          name: string | null
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["batch_preclass_status"] | null
          translation_complete: boolean
        }
        Insert: {
          assigned_to?: string | null
          batch_number: number
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string | null
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
          translation_complete?: boolean
        }
        Update: {
          assigned_to?: string | null
          batch_number?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string | null
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
          translation_complete?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "article_batches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      article_dimension_reviews: {
        Row: {
          article_batch_item_id: string
          classification_value: string | null
          confidence_score: number | null
          created_at: string
          dimension_id: string
          id: string
          iteration: number
          rationale: string | null
          reviewer_id: string
          reviewer_type: string
        }
        Insert: {
          article_batch_item_id: string
          classification_value?: string | null
          confidence_score?: number | null
          created_at?: string
          dimension_id: string
          id?: string
          iteration?: number
          rationale?: string | null
          reviewer_id: string
          reviewer_type: string
        }
        Update: {
          article_batch_item_id?: string
          classification_value?: string | null
          confidence_score?: number | null
          created_at?: string
          dimension_id?: string
          id?: string
          iteration?: number
          rationale?: string | null
          reviewer_id?: string
          reviewer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_dimension_reviews_article_batch_item_id_fkey"
            columns: ["article_batch_item_id"]
            isOneToOne: false
            referencedRelation: "article_batch_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_dimension_reviews_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      article_group_items: {
        Row: {
          added_at: string
          article_id: string
          description: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          article_id: string
          description?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          article_id?: string
          description?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_group_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_group_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "eligible_articles_for_batching_view"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_group_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "article_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      article_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["group_visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "article_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      article_notes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          note_content: string | null
          project_id: string
          title: string | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["note_visibility"]
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          note_content?: string | null
          project_id: string
          title?: string | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          note_content?: string | null
          project_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["note_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "article_notes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_notes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "eligible_articles_for_batching_view"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      article_translations: {
        Row: {
          abstract: string | null
          article_id: string
          created_at: string
          id: string
          language: string
          summary: string | null
          title: string
          translated_at: string
          translated_by: string | null
          translator_system: string | null
        }
        Insert: {
          abstract?: string | null
          article_id: string
          created_at?: string
          id?: string
          language: string
          summary?: string | null
          title: string
          translated_at?: string
          translated_by?: string | null
          translator_system?: string | null
        }
        Update: {
          abstract?: string | null
          article_id?: string
          created_at?: string
          id?: string
          language?: string
          summary?: string | null
          title?: string
          translated_at?: string
          translated_by?: string | null
          translator_system?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "eligible_articles_for_batching_view"
            referencedColumns: ["article_id"]
          },
        ]
      }
      articles: {
        Row: {
          abstract: string | null
          authors: string[] | null
          correlativo: number
          created_at: string
          doi: string | null
          id: string
          journal: string | null
          metadata: Json | null
          project_id: string
          publication_year: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          authors?: string[] | null
          correlativo: number
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          metadata?: Json | null
          project_id: string
          publication_year?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          authors?: string[] | null
          correlativo?: number
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          metadata?: Json | null
          project_id?: string
          publication_year?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_normalized_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      articles_legacy: {
        Row: {
          Abstract: string | null
          "Article Number": string | null
          "Author Full Names": string | null
          Authors: string | null
          correlativo: number
          DOI: string
          "DOI Link": string | null
          eISSN: string | null
          "End Page": string | null
          id: string
          ISBN: string | null
          ISSN: string | null
          Issue: string | null
          Journal: string | null
          ORCIDs: string | null
          project_id: string | null
          "Publication Date": string | null
          "Publication Type": string | null
          Publication_Year: number | null
          "Special Issue": string | null
          "Start Page": string | null
          Title: string | null
          "UT (Unique WOS ID)": string | null
          Volume: string | null
        }
        Insert: {
          Abstract?: string | null
          "Article Number"?: string | null
          "Author Full Names"?: string | null
          Authors?: string | null
          correlativo: number
          DOI: string
          "DOI Link"?: string | null
          eISSN?: string | null
          "End Page"?: string | null
          id?: string
          ISBN?: string | null
          ISSN?: string | null
          Issue?: string | null
          Journal?: string | null
          ORCIDs?: string | null
          project_id?: string | null
          "Publication Date"?: string | null
          "Publication Type"?: string | null
          Publication_Year?: number | null
          "Special Issue"?: string | null
          "Start Page"?: string | null
          Title?: string | null
          "UT (Unique WOS ID)"?: string | null
          Volume?: string | null
        }
        Update: {
          Abstract?: string | null
          "Article Number"?: string | null
          "Author Full Names"?: string | null
          Authors?: string | null
          correlativo?: number
          DOI?: string
          "DOI Link"?: string | null
          eISSN?: string | null
          "End Page"?: string | null
          id?: string
          ISBN?: string | null
          ISSN?: string | null
          Issue?: string | null
          Journal?: string | null
          ORCIDs?: string | null
          project_id?: string | null
          "Publication Date"?: string | null
          "Publication Type"?: string | null
          Publication_Year?: number | null
          "Special Issue"?: string | null
          "Start Page"?: string | null
          Title?: string | null
          "UT (Unique WOS ID)"?: string | null
          Volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      preclass_dimension_examples: {
        Row: {
          dimension_id: string
          example: string
          id: string
        }
        Insert: {
          dimension_id: string
          example: string
          id?: string
        }
        Update: {
          dimension_id?: string
          example?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimension_examples_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      preclass_dimension_options: {
        Row: {
          dimension_id: string
          id: string
          ordering: number
          value: string
        }
        Insert: {
          dimension_id: string
          id?: string
          ordering?: number
          value: string
        }
        Update: {
          dimension_id?: string
          id?: string
          ordering?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimension_options_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      preclass_dimension_questions: {
        Row: {
          dimension_id: string
          id: string
          ordering: number
          question: string
        }
        Insert: {
          dimension_id: string
          id?: string
          ordering?: number
          question: string
        }
        Update: {
          dimension_id?: string
          id?: string
          ordering?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimension_questions_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      preclass_dimensions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          ordering: number
          project_id: string
          type: Database["public"]["Enums"]["dimension_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          ordering?: number
          project_id: string
          type: Database["public"]["Enums"]["dimension_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          ordering?: number
          project_id?: string
          type?: Database["public"]["Enums"]["dimension_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimensions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          contact_email_for_project: string | null
          contextual_notes: string | null
          id: string
          is_active_for_user: boolean
          joined_at: string
          project_id: string
          project_role_id: string
          ui_font_pair: string | null
          ui_is_dark_mode: boolean
          ui_theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email_for_project?: string | null
          contextual_notes?: string | null
          id?: string
          is_active_for_user?: boolean
          joined_at?: string
          project_id: string
          project_role_id: string
          ui_font_pair?: string | null
          ui_is_dark_mode?: boolean
          ui_theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email_for_project?: string | null
          contextual_notes?: string | null
          id?: string
          is_active_for_user?: boolean
          joined_at?: string
          project_id?: string
          project_role_id?: string
          ui_font_pair?: string | null
          ui_is_dark_mode?: boolean
          ui_theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_role_id_fkey"
            columns: ["project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          can_bulk_edit_master_data: boolean
          can_create_batches: boolean
          can_manage_master_data: boolean
          can_upload_files: boolean
          created_at: string
          id: string
          project_id: string
          role_description: string | null
          role_name: string
          updated_at: string
        }
        Insert: {
          can_bulk_edit_master_data?: boolean
          can_create_batches?: boolean
          can_manage_master_data?: boolean
          can_upload_files?: boolean
          created_at?: string
          id?: string
          project_id: string
          role_description?: string | null
          role_name: string
          updated_at?: string
        }
        Update: {
          can_bulk_edit_master_data?: boolean
          can_create_batches?: boolean
          can_manage_master_data?: boolean
          can_upload_files?: boolean
          created_at?: string
          id?: string
          project_id?: string
          role_description?: string | null
          role_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles_history: {
        Row: {
          can_bulk_edit_master_data_new: boolean | null
          can_bulk_edit_master_data_old: boolean | null
          can_create_batches_new: boolean | null
          can_create_batches_old: boolean | null
          can_manage_master_data_new: boolean | null
          can_manage_master_data_old: boolean | null
          can_upload_files_new: boolean | null
          can_upload_files_old: boolean | null
          history_id: string
          operated_by_user_id: string | null
          operation_timestamp: string
          operation_type: string
          project_id: string | null
          role_description_new: string | null
          role_description_old: string | null
          role_id: string
          role_name_new: string | null
          role_name_old: string | null
          transaction_id: number | null
        }
        Insert: {
          can_bulk_edit_master_data_new?: boolean | null
          can_bulk_edit_master_data_old?: boolean | null
          can_create_batches_new?: boolean | null
          can_create_batches_old?: boolean | null
          can_manage_master_data_new?: boolean | null
          can_manage_master_data_old?: boolean | null
          can_upload_files_new?: boolean | null
          can_upload_files_old?: boolean | null
          history_id?: string
          operated_by_user_id?: string | null
          operation_timestamp?: string
          operation_type: string
          project_id?: string | null
          role_description_new?: string | null
          role_description_old?: string | null
          role_id: string
          role_name_new?: string | null
          role_name_old?: string | null
          transaction_id?: number | null
        }
        Update: {
          can_bulk_edit_master_data_new?: boolean | null
          can_bulk_edit_master_data_old?: boolean | null
          can_create_batches_new?: boolean | null
          can_create_batches_old?: boolean | null
          can_manage_master_data_new?: boolean | null
          can_manage_master_data_old?: boolean | null
          can_upload_files_new?: boolean | null
          can_upload_files_old?: boolean | null
          history_id?: string
          operated_by_user_id?: string | null
          operation_timestamp?: string
          operation_type?: string
          project_id?: string | null
          role_description_new?: string | null
          role_description_old?: string | null
          role_id?: string
          role_name_new?: string | null
          role_name_old?: string | null
          transaction_id?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          institution_name: string | null
          lead_researcher_user_id: string | null
          module_bibliography: boolean
          module_interviews: boolean
          module_planning: boolean
          name: string
          proposal: string | null
          proposal_bibliography: string | null
          proposal_interviews: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_name?: string | null
          lead_researcher_user_id?: string | null
          module_bibliography?: boolean
          module_interviews?: boolean
          module_planning?: boolean
          name: string
          proposal?: string | null
          proposal_bibliography?: string | null
          proposal_interviews?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_name?: string | null
          lead_researcher_user_id?: string | null
          module_bibliography?: boolean
          module_interviews?: boolean
          module_planning?: boolean
          name?: string
          proposal?: string | null
          proposal_bibliography?: string | null
          proposal_interviews?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      users_profiles: {
        Row: {
          contact_phone: string | null
          created_at: string
          first_name: string | null
          general_notes: string | null
          last_name: string | null
          preferred_language: string | null
          primary_institution: string | null
          pronouns: string | null
          public_contact_email: string | null
          public_display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          first_name?: string | null
          general_notes?: string | null
          last_name?: string | null
          preferred_language?: string | null
          primary_institution?: string | null
          pronouns?: string | null
          public_contact_email?: string | null
          public_display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          first_name?: string | null
          general_notes?: string | null
          last_name?: string | null
          preferred_language?: string | null
          primary_institution?: string | null
          pronouns?: string | null
          public_contact_email?: string | null
          public_display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      detailed_article_notes: {
        Row: {
          article_id: string | null
          author_name: string | null
          created_at: string | null
          id: string | null
          note_content: string | null
          project_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          visibility: Database["public"]["Enums"]["note_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "article_notes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_notes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "eligible_articles_for_batching_view"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      detailed_project_members: {
        Row: {
          can_bulk_edit_master_data: boolean | null
          can_create_batches: boolean | null
          can_manage_master_data: boolean | null
          can_upload_files: boolean | null
          contact_email_for_project: string | null
          contact_phone: string | null
          contextual_notes: string | null
          first_name: string | null
          general_notes: string | null
          is_active_for_user: boolean | null
          joined_at: string | null
          last_name: string | null
          preferred_language: string | null
          primary_institution: string | null
          project_id: string | null
          project_member_id: string | null
          project_role_id: string | null
          pronouns: string | null
          public_contact_email: string | null
          public_display_name: string | null
          role_name: string | null
          ui_font_pair: string | null
          ui_is_dark_mode: boolean | null
          ui_theme: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_role_id_fkey"
            columns: ["project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      eligible_articles_for_batching_view: {
        Row: {
          article_id: string | null
          project_id: string | null
        }
        Insert: {
          article_id?: string | null
          project_id?: string | null
        }
        Update: {
          article_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_normalized_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _dim_project_id: {
        Args: { did: string }
        Returns: string
      }
      _is_project_member: {
        Args: { pid: string }
        Returns: boolean
      }
      check_user_has_profile: {
        Args: { uid: string; pid: string }
        Returns: boolean
      }
      get_current_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      get_project_batches_with_assignee_names: {
        Args: { p_project_id: string }
        Returns: {
          id: string
          batch_number: number
          name: string
          status: string
          assigned_to_member_name: string
          article_count: number
        }[]
      }
      get_project_id_from_article: {
        Args: { p_article_id: string }
        Returns: string
      }
      get_project_id_from_batch_item: {
        Args: { item_id: string }
        Returns: string
      }
      get_user_batches_with_detailed_counts: {
        Args: { p_user_id: string; p_project_id: string }
        Returns: {
          id: string
          batch_number: number
          name: string
          status: Database["public"]["Enums"]["batch_preclass_status"]
          article_counts: Json
        }[]
      }
      get_user_by_email: {
        Args: { user_email: string }
        Returns: string
      }
      get_user_project_ids: {
        Args: { p_user_id: string }
        Returns: string[]
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
        Args: { p_user_id: string; p_project_id_to_check: string }
        Returns: boolean
      }
    }
    Enums: {
      batch_item_status:
        | "unreviewed"
        | "ai_preclassified"
        | "human_preclassified"
        | "disagreement"
        | "reconciled"
      batch_preclass_status:
        | "pending"
        | "translated"
        | "review_pending"
        | "reconciliation_pending"
        | "validated"
        | "reconciled"
        | "disputed"
      batch_status:
        | "pending"
        | "in_progress"
        | "ai_prefilled"
        | "discrepancies"
        | "completed"
      dimension_type: "finite" | "open"
      group_visibility: "public" | "private"
      item_preclass_status:
        | "pending_review"
        | "reconciliation_pending"
        | "agreed"
        | "reconciled"
        | "disputed"
      job_status: "running" | "completed" | "failed"
      job_type: "TRANSLATION" | "PRECLASSIFICATION"
      note_visibility: "public" | "private"
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
      batch_item_status: [
        "unreviewed",
        "ai_preclassified",
        "human_preclassified",
        "disagreement",
        "reconciled",
      ],
      batch_preclass_status: [
        "pending",
        "translated",
        "review_pending",
        "reconciliation_pending",
        "validated",
        "reconciled",
        "disputed",
      ],
      batch_status: [
        "pending",
        "in_progress",
        "ai_prefilled",
        "discrepancies",
        "completed",
      ],
      dimension_type: ["finite", "open"],
      group_visibility: ["public", "private"],
      item_preclass_status: [
        "pending_review",
        "reconciliation_pending",
        "agreed",
        "reconciled",
        "disputed",
      ],
      job_status: ["running", "completed", "failed"],
      job_type: ["TRANSLATION", "PRECLASSIFICATION"],
      note_visibility: ["public", "private"],
    },
  },
} as const
