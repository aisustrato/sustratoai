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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_job_history: {
        Row: {
          ai_model: string | null
          completed_at: string | null
          description: string | null
          details: Json | null
          error_message: string | null
          id: string
          input_tokens: number | null
          job_type: Database["public"]["Enums"]["job_type"]
          output_tokens: number | null
          progress: number | null
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          completed_at?: string | null
          description?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          job_type: Database["public"]["Enums"]["job_type"]
          output_tokens?: number | null
          progress?: number | null
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          completed_at?: string | null
          description?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          job_type?: Database["public"]["Enums"]["job_type"]
          output_tokens?: number | null
          progress?: number | null
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
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
      article_abstract_highlights: {
        Row: {
          article_id: string
          created_at: string | null
          highlighted_content: string
          highlights_metadata: Json | null
          id: string
          project_id: string
          updated_at: string | null
          user_id: string
          version_type: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          highlighted_content: string
          highlights_metadata?: Json | null
          id?: string
          project_id: string
          updated_at?: string | null
          user_id: string
          version_type: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          highlighted_content?: string
          highlights_metadata?: Json | null
          id?: string
          project_id?: string
          updated_at?: string | null
          user_id?: string
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_abstract_highlights_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_abstract_highlights_project_id_fkey"
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
          created_at: string | null
          human_label: string | null
          id: string
          preclassified_at: string | null
          preclassified_by: string | null
          requires_adjudication: boolean | null
          status: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Insert: {
          ai_keywords?: string[] | null
          ai_label?: string | null
          ai_process_opinion?: string | null
          article_id: string
          batch_id: string
          created_at?: string | null
          human_label?: string | null
          id?: string
          preclassified_at?: string | null
          preclassified_by?: string | null
          requires_adjudication?: boolean | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Update: {
          ai_keywords?: string[] | null
          ai_label?: string | null
          ai_process_opinion?: string | null
          article_id?: string
          batch_id?: string
          created_at?: string | null
          human_label?: string | null
          id?: string
          preclassified_at?: string | null
          preclassified_by?: string | null
          requires_adjudication?: boolean | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
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
          created_at: string | null
          id: string
          name: string | null
          phase_id: string | null
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["batch_preclass_status"] | null
          translation_complete: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          batch_number: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phase_id?: string | null
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
          translation_complete?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          batch_number?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phase_id?: string | null
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
          translation_complete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "article_batches_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "preclassification_phases"
            referencedColumns: ["id"]
          },
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
          article_id: string
          classification_value: string | null
          confidence_score: number | null
          created_at: string | null
          dimension_id: string
          id: string
          is_final: boolean | null
          iteration: number | null
          option_id: string | null
          prevalidated: boolean | null
          rationale: string | null
          reviewer_id: string
          reviewer_type: string
          status: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Insert: {
          article_batch_item_id: string
          article_id: string
          classification_value?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dimension_id: string
          id?: string
          is_final?: boolean | null
          iteration?: number | null
          option_id?: string | null
          prevalidated?: boolean | null
          rationale?: string | null
          reviewer_id: string
          reviewer_type: string
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Update: {
          article_batch_item_id?: string
          article_id?: string
          classification_value?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dimension_id?: string
          id?: string
          is_final?: boolean | null
          iteration?: number | null
          option_id?: string | null
          prevalidated?: boolean | null
          rationale?: string | null
          reviewer_id?: string
          reviewer_type?: string
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "article_dimension_reviews_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_dimension_reviews_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "preclass_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_dimension_reviews_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "preclass_dimension_options"
            referencedColumns: ["id"]
          },
        ]
      }
      article_group_items: {
        Row: {
          added_at: string | null
          article_id: string
          description: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          article_id: string
          description?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
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
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["group_visibility"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string | null
          user_id: string
          visibility?: Database["public"]["Enums"]["group_visibility"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["group_visibility"] | null
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
          created_at: string | null
          id: string
          note_content: string | null
          project_id: string
          title: string | null
          updated_at: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["note_visibility"] | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          note_content?: string | null
          project_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: Database["public"]["Enums"]["note_visibility"] | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          note_content?: string | null
          project_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["note_visibility"] | null
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
          created_at: string | null
          id: string
          language: string
          summary: string | null
          title: string
          translated_at: string | null
          translated_by: string | null
          translator_system: string | null
        }
        Insert: {
          abstract?: string | null
          article_id: string
          created_at?: string | null
          id?: string
          language: string
          summary?: string | null
          title: string
          translated_at?: string | null
          translated_by?: string | null
          translator_system?: string | null
        }
        Update: {
          abstract?: string | null
          article_id?: string
          created_at?: string | null
          id?: string
          language?: string
          summary?: string | null
          title?: string
          translated_at?: string | null
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
        ]
      }
      articles: {
        Row: {
          abstract: string | null
          authors: string[] | null
          correlativo: number
          created_at: string | null
          doi: string | null
          id: string
          journal: string | null
          metadata: Json | null
          project_id: string
          publication_year: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          abstract?: string | null
          authors?: string[] | null
          correlativo?: number
          created_at?: string | null
          doi?: string | null
          id?: string
          journal?: string | null
          metadata?: Json | null
          project_id: string
          publication_year?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          abstract?: string | null
          authors?: string[] | null
          correlativo?: number
          created_at?: string | null
          doi?: string | null
          id?: string
          journal?: string | null
          metadata?: Json | null
          project_id?: string
          publication_year?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_migration_profiles: {
        Row: {
          contact_phone: string | null
          created_at: string | null
          first_name: string | null
          general_notes: string | null
          last_name: string | null
          preferred_language: string | null
          primary_institution: string | null
          pronouns: string | null
          public_contact_email: string | null
          public_display_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string | null
          first_name?: string | null
          general_notes?: string | null
          last_name?: string | null
          preferred_language?: string | null
          primary_institution?: string | null
          pronouns?: string | null
          public_contact_email?: string | null
          public_display_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contact_phone?: string | null
          created_at?: string | null
          first_name?: string | null
          general_notes?: string | null
          last_name?: string | null
          preferred_language?: string | null
          primary_institution?: string | null
          pronouns?: string | null
          public_contact_email?: string | null
          public_display_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_migration_reviews: {
        Row: {
          article_batch_item_id: string | null
          article_id: string | null
          classification_value: string | null
          confidence_score: number | null
          created_at: string | null
          dimension_id: string | null
          id: string | null
          is_final: boolean | null
          iteration: number | null
          option_id: string | null
          prevalidated: boolean | null
          rationale: string | null
          reviewer_id: string | null
          reviewer_type: string | null
          status: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Insert: {
          article_batch_item_id?: string | null
          article_id?: string | null
          classification_value?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dimension_id?: string | null
          id?: string | null
          is_final?: boolean | null
          iteration?: number | null
          option_id?: string | null
          prevalidated?: boolean | null
          rationale?: string | null
          reviewer_id?: string | null
          reviewer_type?: string | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Update: {
          article_batch_item_id?: string | null
          article_id?: string | null
          classification_value?: string | null
          confidence_score?: number | null
          created_at?: string | null
          dimension_id?: string | null
          id?: string | null
          is_final?: boolean | null
          iteration?: number | null
          option_id?: string | null
          prevalidated?: boolean | null
          rationale?: string | null
          reviewer_id?: string | null
          reviewer_type?: string | null
          status?: Database["public"]["Enums"]["batch_preclass_status"] | null
        }
        Relationships: []
      }
      cgt_artefactos: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          direcciones_resueltas_at: string | null
          error_mensaje: string | null
          estado: Database["public"]["Enums"]["cgt_estado_metabolizacion"]
          grupo_id: string | null
          id: string
          metadata: Json | null
          project_id: string
          sha256_json: string
          storage_path_json: string | null
          storage_path_md: string | null
          storage_path_original: string | null
          storage_path_yaml: string | null
          tipo: Database["public"]["Enums"]["cgt_tipo_artefacto"]
          titulo: string
          updated_at: string
          visibilidad: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          direcciones_resueltas_at?: string | null
          error_mensaje?: string | null
          estado?: Database["public"]["Enums"]["cgt_estado_metabolizacion"]
          grupo_id?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          sha256_json: string
          storage_path_json?: string | null
          storage_path_md?: string | null
          storage_path_original?: string | null
          storage_path_yaml?: string | null
          tipo: Database["public"]["Enums"]["cgt_tipo_artefacto"]
          titulo: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          direcciones_resueltas_at?: string | null
          error_mensaje?: string | null
          estado?: Database["public"]["Enums"]["cgt_estado_metabolizacion"]
          grupo_id?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          sha256_json?: string
          storage_path_json?: string | null
          storage_path_md?: string | null
          storage_path_original?: string | null
          storage_path_yaml?: string | null
          tipo?: Database["public"]["Enums"]["cgt_tipo_artefacto"]
          titulo?: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "cgt_grupos_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_artefactos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_artefactos_audio: {
        Row: {
          artefacto_id: string
          bitrate: number | null
          created_at: string
          duracion_seg: number | null
          formato_original: string | null
          hablantes: Json | null
          idioma: string | null
          sample_rate: number | null
          transcripcion_completa: string | null
          updated_at: string
        }
        Insert: {
          artefacto_id: string
          bitrate?: number | null
          created_at?: string
          duracion_seg?: number | null
          formato_original?: string | null
          hablantes?: Json | null
          idioma?: string | null
          sample_rate?: number | null
          transcripcion_completa?: string | null
          updated_at?: string
        }
        Update: {
          artefacto_id?: string
          bitrate?: number | null
          created_at?: string
          duracion_seg?: number | null
          formato_original?: string | null
          hablantes?: Json | null
          idioma?: string | null
          sample_rate?: number | null
          transcripcion_completa?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_audio_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_artefactos_imagen: {
        Row: {
          alto_px: number | null
          ancho_px: number | null
          artefacto_id: string
          created_at: string
          formato_original: string | null
          imagen_descrita_id: string | null
          updated_at: string
        }
        Insert: {
          alto_px?: number | null
          ancho_px?: number | null
          artefacto_id: string
          created_at?: string
          formato_original?: string | null
          imagen_descrita_id?: string | null
          updated_at?: string
        }
        Update: {
          alto_px?: number | null
          ancho_px?: number | null
          artefacto_id?: string
          created_at?: string
          formato_original?: string | null
          imagen_descrita_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_imagen_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_imagen_descrita"
            columns: ["imagen_descrita_id"]
            isOneToOne: true
            referencedRelation: "cgt_imagenes_descritas"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_artefactos_markdown: {
        Row: {
          artefacto_id: string
          autor_original: string | null
          contenido: string
          created_at: string
          fecha_original: string | null
          frontmatter: Json | null
          headers: Json | null
          updated_at: string
        }
        Insert: {
          artefacto_id: string
          autor_original?: string | null
          contenido: string
          created_at?: string
          fecha_original?: string | null
          frontmatter?: Json | null
          headers?: Json | null
          updated_at?: string
        }
        Update: {
          artefacto_id?: string
          autor_original?: string | null
          contenido?: string
          created_at?: string
          fecha_original?: string | null
          frontmatter?: Json | null
          headers?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_markdown_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_artefactos_pdf_informe: {
        Row: {
          artefacto_id: string
          autor_original: string | null
          citas_bibliograficas: Json | null
          created_at: string
          doi: string | null
          fecha_original: string | null
          markdown_renderizado: string
          num_paginas: number | null
          secciones: Json | null
          updated_at: string
        }
        Insert: {
          artefacto_id: string
          autor_original?: string | null
          citas_bibliograficas?: Json | null
          created_at?: string
          doi?: string | null
          fecha_original?: string | null
          markdown_renderizado: string
          num_paginas?: number | null
          secciones?: Json | null
          updated_at?: string
        }
        Update: {
          artefacto_id?: string
          autor_original?: string | null
          citas_bibliograficas?: Json | null
          created_at?: string
          doi?: string | null
          fecha_original?: string | null
          markdown_renderizado?: string
          num_paginas?: number | null
          secciones?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_pdf_informe_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_artefactos_pdf_slides: {
        Row: {
          artefacto_id: string
          autor_original: string | null
          created_at: string
          fecha_original: string | null
          num_paginas: number
          paginas: Json
          updated_at: string
        }
        Insert: {
          artefacto_id: string
          autor_original?: string | null
          created_at?: string
          fecha_original?: string | null
          num_paginas: number
          paginas?: Json
          updated_at?: string
        }
        Update: {
          artefacto_id?: string
          autor_original?: string | null
          created_at?: string
          fecha_original?: string | null
          num_paginas?: number
          paginas?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_pdf_slides_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_artefactos_referencias: {
        Row: {
          apariciones: Json
          artefacto_id: string
          confianza_extraccion: number
          created_at: string
          formato_cita_inline: string | null
          hash_extractor_crudo: string
          id: string
          notas_extractor: string | null
          numero_en_artefacto: number | null
          project_id: string
          referencia_id: string
        }
        Insert: {
          apariciones?: Json
          artefacto_id: string
          confianza_extraccion?: number
          created_at?: string
          formato_cita_inline?: string | null
          hash_extractor_crudo: string
          id?: string
          notas_extractor?: string | null
          numero_en_artefacto?: number | null
          project_id: string
          referencia_id: string
        }
        Update: {
          apariciones?: Json
          artefacto_id?: string
          confianza_extraccion?: number
          created_at?: string
          formato_cita_inline?: string | null
          hash_extractor_crudo?: string
          id?: string
          notas_extractor?: string | null
          numero_en_artefacto?: number | null
          project_id?: string
          referencia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_referencias_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_artefactos_referencias_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_artefactos_referencias_referencia_id_fkey"
            columns: ["referencia_id"]
            isOneToOne: false
            referencedRelation: "cgt_referencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_artefactos_referencias_referencia_id_fkey"
            columns: ["referencia_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_referencias_con_conteo"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_artefactos_video: {
        Row: {
          artefacto_id: string
          created_at: string
          duracion_seg: number | null
          formato_original: string | null
          fps: number | null
          hablantes: Json | null
          idioma: string | null
          resolucion: string | null
          transcripcion_completa: string | null
          updated_at: string
        }
        Insert: {
          artefacto_id: string
          created_at?: string
          duracion_seg?: number | null
          formato_original?: string | null
          fps?: number | null
          hablantes?: Json | null
          idioma?: string | null
          resolucion?: string | null
          transcripcion_completa?: string | null
          updated_at?: string
        }
        Update: {
          artefacto_id?: string
          created_at?: string
          duracion_seg?: number | null
          formato_original?: string | null
          fps?: number | null
          hablantes?: Json | null
          idioma?: string | null
          resolucion?: string | null
          transcripcion_completa?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_artefactos_video_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_audio_segmentos: {
        Row: {
          artefacto_id: string
          confianza: number | null
          created_at: string
          hablante_id: string | null
          id: string
          texto: string
          timestamp_fin: number
          timestamp_inicio: number
        }
        Insert: {
          artefacto_id: string
          confianza?: number | null
          created_at?: string
          hablante_id?: string | null
          id?: string
          texto: string
          timestamp_fin: number
          timestamp_inicio: number
        }
        Update: {
          artefacto_id?: string
          confianza?: number | null
          created_at?: string
          hablante_id?: string | null
          id?: string
          texto?: string
          timestamp_fin?: number
          timestamp_inicio?: number
        }
        Relationships: [
          {
            foreignKeyName: "cgt_audio_segmentos_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos_audio"
            referencedColumns: ["artefacto_id"]
          },
        ]
      }
      cgt_citas: {
        Row: {
          aliases: Json
          ano: string | null
          autor: string | null
          created_at: string
          id: string
          project_id: string
          referencia: string | null
          texto: string
          tipo_cita: Database["public"]["Enums"]["cgt_tipo_cita"]
          updated_at: string
        }
        Insert: {
          aliases?: Json
          ano?: string | null
          autor?: string | null
          created_at?: string
          id?: string
          project_id: string
          referencia?: string | null
          texto: string
          tipo_cita?: Database["public"]["Enums"]["cgt_tipo_cita"]
          updated_at?: string
        }
        Update: {
          aliases?: Json
          ano?: string | null
          autor?: string | null
          created_at?: string
          id?: string
          project_id?: string
          referencia?: string | null
          texto?: string
          tipo_cita?: Database["public"]["Enums"]["cgt_tipo_cita"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_citas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_citas_ediciones_humanas: {
        Row: {
          campo_editado: string
          created_at: string
          id: string
          justificacion: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_editado: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_editado?: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id?: string
          project_id?: string
          user_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_citas_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_citas_menciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_citas_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_citas_valor_canonico"
            referencedColumns: ["mencion_id"]
          },
          {
            foreignKeyName: "cgt_citas_ediciones_humanas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_citas_menciones: {
        Row: {
          artefacto_id: string
          autor_cartografiador: string | null
          autor_extractor_crudo: string | null
          cartografiado_at: string | null
          cita_id: string | null
          confianza_cartografiador: number | null
          created_at: string
          decision_cartografiador: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          hash_extractor_crudo: string
          id: string
          justificacion_cartografiador: string | null
          origen: Database["public"]["Enums"]["cgt_origen"]
          project_id: string
          referencia_cartografiador: string | null
          referencia_extractor_cruda: string | null
          texto_cartografiador: string | null
          texto_extractor_crudo: string
          tipo_cita_cartografiador:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          tipo_cita_extractor:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          ubicacion_en_artefacto: string | null
        }
        Insert: {
          artefacto_id: string
          autor_cartografiador?: string | null
          autor_extractor_crudo?: string | null
          cartografiado_at?: string | null
          cita_id?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          hash_extractor_crudo: string
          id?: string
          justificacion_cartografiador?: string | null
          origen?: Database["public"]["Enums"]["cgt_origen"]
          project_id: string
          referencia_cartografiador?: string | null
          referencia_extractor_cruda?: string | null
          texto_cartografiador?: string | null
          texto_extractor_crudo: string
          tipo_cita_cartografiador?:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          tipo_cita_extractor?:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          ubicacion_en_artefacto?: string | null
        }
        Update: {
          artefacto_id?: string
          autor_cartografiador?: string | null
          autor_extractor_crudo?: string | null
          cartografiado_at?: string | null
          cita_id?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          hash_extractor_crudo?: string
          id?: string
          justificacion_cartografiador?: string | null
          origen?: Database["public"]["Enums"]["cgt_origen"]
          project_id?: string
          referencia_cartografiador?: string | null
          referencia_extractor_cruda?: string | null
          texto_cartografiador?: string | null
          texto_extractor_crudo?: string
          tipo_cita_cartografiador?:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          tipo_cita_extractor?:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          ubicacion_en_artefacto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_citas_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_citas_menciones_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "cgt_citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_citas_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_conceptos: {
        Row: {
          aliases: Json
          created_at: string
          descripcion_canonica: string | null
          es_semilla_fractal: boolean
          id: string
          nombre_canonico: string
          project_id: string
          updated_at: string
        }
        Insert: {
          aliases?: Json
          created_at?: string
          descripcion_canonica?: string | null
          es_semilla_fractal?: boolean
          id?: string
          nombre_canonico: string
          project_id: string
          updated_at?: string
        }
        Update: {
          aliases?: Json
          created_at?: string
          descripcion_canonica?: string | null
          es_semilla_fractal?: boolean
          id?: string
          nombre_canonico?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_conceptos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_conceptos_ediciones_humanas: {
        Row: {
          campo_editado: string
          created_at: string
          id: string
          justificacion: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_editado: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_editado?: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id?: string
          project_id?: string
          user_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_conceptos_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_conceptos_menciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_conceptos_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_conceptos_valor_canonico"
            referencedColumns: ["mencion_id"]
          },
          {
            foreignKeyName: "cgt_conceptos_ediciones_humanas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_conceptos_menciones: {
        Row: {
          artefacto_id: string
          cartografiado_at: string | null
          concepto_id: string | null
          confianza_cartografiador: number | null
          created_at: string
          decision_cartografiador: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador: string | null
          descripcion_extractor_cruda: string | null
          hash_extractor_crudo: string
          id: string
          justificacion_cartografiador: string | null
          nombre_cartografiador: string | null
          nombre_extractor_crudo: string
          project_id: string
        }
        Insert: {
          artefacto_id: string
          cartografiado_at?: string | null
          concepto_id?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          hash_extractor_crudo: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo: string
          project_id: string
        }
        Update: {
          artefacto_id?: string
          cartografiado_at?: string | null
          concepto_id?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          hash_extractor_crudo?: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_conceptos_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_conceptos_menciones_concepto_id_fkey"
            columns: ["concepto_id"]
            isOneToOne: false
            referencedRelation: "cgt_conceptos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_conceptos_menciones_concepto_id_fkey"
            columns: ["concepto_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_conceptos_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_conceptos_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_cronicas: {
        Row: {
          artefacto_id: string
          contenido: string
          contracalibracion: string | null
          contracalibracion_activada: boolean
          costo_usd: number | null
          created_at: string
          generado_por: Database["public"]["Enums"]["cgt_origen"]
          id: string
          modelo_ia: string | null
          nodo_generador: string | null
          project_id: string
          tokens_count: number | null
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string
          version_esquema: string
          visibilidad: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Insert: {
          artefacto_id: string
          contenido: string
          contracalibracion?: string | null
          contracalibracion_activada?: boolean
          costo_usd?: number | null
          created_at?: string
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          id?: string
          modelo_ia?: string | null
          nodo_generador?: string | null
          project_id: string
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Update: {
          artefacto_id?: string
          contenido?: string
          contracalibracion?: string | null
          contracalibracion_activada?: boolean
          costo_usd?: number | null
          created_at?: string
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          id?: string
          modelo_ia?: string | null
          nodo_generador?: string | null
          project_id?: string
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cgt_cronicas_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_cronicas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_destilados: {
        Row: {
          artefacto_id: string
          cita_nucleo: Json | null
          costo_usd: number | null
          created_at: string
          estructura_documento: Json | null
          generado_por: Database["public"]["Enums"]["cgt_origen"]
          id: string
          modelo_ia: string | null
          movimientos: Json
          nodo_generador: string | null
          project_id: string
          tensiones: Json
          tesis: string
          tokens_count: number | null
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string
          version_esquema: string
          visibilidad: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Insert: {
          artefacto_id: string
          cita_nucleo?: Json | null
          costo_usd?: number | null
          created_at?: string
          estructura_documento?: Json | null
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          id?: string
          modelo_ia?: string | null
          movimientos?: Json
          nodo_generador?: string | null
          project_id: string
          tensiones?: Json
          tesis: string
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Update: {
          artefacto_id?: string
          cita_nucleo?: Json | null
          costo_usd?: number | null
          created_at?: string
          estructura_documento?: Json | null
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          id?: string
          modelo_ia?: string | null
          movimientos?: Json
          nodo_generador?: string | null
          project_id?: string
          tensiones?: Json
          tesis?: string
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cgt_destilados_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_destilados_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_disciplinas: {
        Row: {
          aliases: Json
          created_at: string
          descripcion_canonica: string | null
          disciplina_madre_id: string | null
          id: string
          nombre_canonico: string
          project_id: string
          updated_at: string
        }
        Insert: {
          aliases?: Json
          created_at?: string
          descripcion_canonica?: string | null
          disciplina_madre_id?: string | null
          id?: string
          nombre_canonico: string
          project_id: string
          updated_at?: string
        }
        Update: {
          aliases?: Json
          created_at?: string
          descripcion_canonica?: string | null
          disciplina_madre_id?: string | null
          id?: string
          nombre_canonico?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_disciplinas_disciplina_madre_id_fkey"
            columns: ["disciplina_madre_id"]
            isOneToOne: false
            referencedRelation: "cgt_disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_disciplina_madre_id_fkey"
            columns: ["disciplina_madre_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_disciplinas_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_disciplinas_ediciones_humanas: {
        Row: {
          campo_editado: string
          created_at: string
          id: string
          justificacion: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_editado: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_editado?: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id?: string
          project_id?: string
          user_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_disciplinas_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_disciplinas_menciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_disciplinas_valor_canonico"
            referencedColumns: ["mencion_id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_ediciones_humanas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_disciplinas_menciones: {
        Row: {
          artefacto_id: string
          cartografiado_at: string | null
          confianza_cartografiador: number | null
          created_at: string
          decision_cartografiador: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador: string | null
          descripcion_extractor_cruda: string | null
          disciplina_id: string | null
          hash_extractor_crudo: string
          id: string
          justificacion_cartografiador: string | null
          nombre_cartografiador: string | null
          nombre_extractor_crudo: string
          project_id: string
        }
        Insert: {
          artefacto_id: string
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          disciplina_id?: string | null
          hash_extractor_crudo: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo: string
          project_id: string
        }
        Update: {
          artefacto_id?: string
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          disciplina_id?: string | null
          hash_extractor_crudo?: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_disciplinas_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_menciones_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "cgt_disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_menciones_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_disciplinas_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_germinales: {
        Row: {
          artefacto_id: string | null
          contexto_snapshot: Json | null
          costo_usd: number | null
          created_at: string
          generado_por: Database["public"]["Enums"]["cgt_origen"]
          grupo_id: string | null
          hash_cronica_upstream: string | null
          hash_destilado_upstream: string | null
          id: string
          modelo_ia: string | null
          nodo_generador: string | null
          num_proyecciones_propuestas: number | null
          num_resonancias_propuestas: number | null
          project_id: string
          resumen: string | null
          tokens_count: number | null
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string
          version_esquema: string
          visibilidad: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Insert: {
          artefacto_id?: string | null
          contexto_snapshot?: Json | null
          costo_usd?: number | null
          created_at?: string
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          grupo_id?: string | null
          hash_cronica_upstream?: string | null
          hash_destilado_upstream?: string | null
          id?: string
          modelo_ia?: string | null
          nodo_generador?: string | null
          num_proyecciones_propuestas?: number | null
          num_resonancias_propuestas?: number | null
          project_id: string
          resumen?: string | null
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Update: {
          artefacto_id?: string | null
          contexto_snapshot?: Json | null
          costo_usd?: number | null
          created_at?: string
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          grupo_id?: string | null
          hash_cronica_upstream?: string | null
          hash_destilado_upstream?: string | null
          id?: string
          modelo_ia?: string | null
          nodo_generador?: string | null
          num_proyecciones_propuestas?: number | null
          num_resonancias_propuestas?: number | null
          project_id?: string
          resumen?: string | null
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cgt_germinales_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_germinales_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: true
            referencedRelation: "cgt_grupos_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_germinales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_grupos_artefactos: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          id: string
          metadata: Json | null
          nombre: string
          project_id: string
          updated_at: string
          visibilidad: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          project_id: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          project_id?: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cgt_grupos_artefactos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_imagenes_descritas: {
        Row: {
          alto_px: number | null
          ancho_px: number | null
          artefacto_id: string
          created_at: string
          descripcion_humana: string | null
          descripcion_humana_at: string | null
          descripcion_humana_por: string | null
          descripcion_ia: string | null
          formato: string | null
          id: string
          modelo_ia: string | null
          pagina_num: number | null
          posicion_en_pagina: number | null
          storage_path: string
          timestamp_seg: number | null
          updated_at: string
        }
        Insert: {
          alto_px?: number | null
          ancho_px?: number | null
          artefacto_id: string
          created_at?: string
          descripcion_humana?: string | null
          descripcion_humana_at?: string | null
          descripcion_humana_por?: string | null
          descripcion_ia?: string | null
          formato?: string | null
          id?: string
          modelo_ia?: string | null
          pagina_num?: number | null
          posicion_en_pagina?: number | null
          storage_path: string
          timestamp_seg?: number | null
          updated_at?: string
        }
        Update: {
          alto_px?: number | null
          ancho_px?: number | null
          artefacto_id?: string
          created_at?: string
          descripcion_humana?: string | null
          descripcion_humana_at?: string | null
          descripcion_humana_por?: string | null
          descripcion_ia?: string | null
          formato?: string | null
          id?: string
          modelo_ia?: string | null
          pagina_num?: number | null
          posicion_en_pagina?: number | null
          storage_path?: string
          timestamp_seg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_imagenes_descritas_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_logs_cartografiador: {
        Row: {
          artefacto_id: string
          costo_usd: number
          created_at: string
          duracion_ms: number
          error_mensaje: string | null
          finish_reason: string | null
          id: string
          intento: number
          modelo: string
          project_id: string
          temperatura: number
          tokens_cached: number
          tokens_input: number
          tokens_output: number
          total_ambigua: number
          total_match_existente: number
          total_menciones: number
          total_nueva_entidad: number
          universo_citas_count: number
          universo_conceptos_count: number
          universo_disciplinas_count: number
          universo_pensadores_count: number
          universo_teorias_count: number
          user_id: string | null
        }
        Insert: {
          artefacto_id: string
          costo_usd?: number
          created_at?: string
          duracion_ms?: number
          error_mensaje?: string | null
          finish_reason?: string | null
          id?: string
          intento?: number
          modelo: string
          project_id: string
          temperatura: number
          tokens_cached?: number
          tokens_input?: number
          tokens_output?: number
          total_ambigua?: number
          total_match_existente?: number
          total_menciones?: number
          total_nueva_entidad?: number
          universo_citas_count?: number
          universo_conceptos_count?: number
          universo_disciplinas_count?: number
          universo_pensadores_count?: number
          universo_teorias_count?: number
          user_id?: string | null
        }
        Update: {
          artefacto_id?: string
          costo_usd?: number
          created_at?: string
          duracion_ms?: number
          error_mensaje?: string | null
          finish_reason?: string | null
          id?: string
          intento?: number
          modelo?: string
          project_id?: string
          temperatura?: number
          tokens_cached?: number
          tokens_input?: number
          tokens_output?: number
          total_ambigua?: number
          total_match_existente?: number
          total_menciones?: number
          total_nueva_entidad?: number
          universo_citas_count?: number
          universo_conceptos_count?: number
          universo_disciplinas_count?: number
          universo_pensadores_count?: number
          universo_teorias_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_logs_cartografiador_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_logs_cartografiador_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_logs_deepseek: {
        Row: {
          artefacto_id: string | null
          costo_usd: number
          created_at: string
          duracion_ms: number
          error_mensaje: string | null
          finish_reason: string | null
          formato: string
          id: string
          intento: number
          modelo: string
          project_id: string | null
          temperatura: number
          tokens_cached: number
          tokens_input: number
          tokens_output: number
        }
        Insert: {
          artefacto_id?: string | null
          costo_usd?: number
          created_at?: string
          duracion_ms?: number
          error_mensaje?: string | null
          finish_reason?: string | null
          formato: string
          id?: string
          intento?: number
          modelo: string
          project_id?: string | null
          temperatura: number
          tokens_cached?: number
          tokens_input?: number
          tokens_output?: number
        }
        Update: {
          artefacto_id?: string | null
          costo_usd?: number
          created_at?: string
          duracion_ms?: number
          error_mensaje?: string | null
          finish_reason?: string | null
          formato?: string
          id?: string
          intento?: number
          modelo?: string
          project_id?: string | null
          temperatura?: number
          tokens_cached?: number
          tokens_input?: number
          tokens_output?: number
        }
        Relationships: [
          {
            foreignKeyName: "cgt_logs_deepseek_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_logs_deepseek_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_menciones_direcciones: {
        Row: {
          artefacto_id: string
          created_at: string
          documento: string
          id: string
          mencion_id: string
          nodo_id: string
          offset_fin: number
          offset_inicio: number
          origen: string
          project_id: string
          tipo_mencion: string
        }
        Insert: {
          artefacto_id: string
          created_at?: string
          documento: string
          id?: string
          mencion_id: string
          nodo_id: string
          offset_fin: number
          offset_inicio: number
          origen?: string
          project_id: string
          tipo_mencion: string
        }
        Update: {
          artefacto_id?: string
          created_at?: string
          documento?: string
          id?: string
          mencion_id?: string
          nodo_id?: string
          offset_fin?: number
          offset_inicio?: number
          origen?: string
          project_id?: string
          tipo_mencion?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_menciones_direcciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_menciones_direcciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_nucleos: {
        Row: {
          artefacto_id: string
          cita_nucleo: Json | null
          costo_usd: number | null
          created_at: string
          generado_por: Database["public"]["Enums"]["cgt_origen"]
          hash_destilado_upstream: string
          id: string
          modelo_ia: string | null
          movimientos_esenciales: Json
          nodo_generador: string | null
          project_id: string
          tension_irreductible: string | null
          tesis: string
          tokens_count: number | null
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string
          version_esquema: string
          visibilidad: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Insert: {
          artefacto_id: string
          cita_nucleo?: Json | null
          costo_usd?: number | null
          created_at?: string
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          hash_destilado_upstream: string
          id?: string
          modelo_ia?: string | null
          movimientos_esenciales?: Json
          nodo_generador?: string | null
          project_id: string
          tension_irreductible?: string | null
          tesis: string
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Update: {
          artefacto_id?: string
          cita_nucleo?: Json | null
          costo_usd?: number | null
          created_at?: string
          generado_por?: Database["public"]["Enums"]["cgt_origen"]
          hash_destilado_upstream?: string
          id?: string
          modelo_ia?: string | null
          movimientos_esenciales?: Json
          nodo_generador?: string | null
          project_id?: string
          tension_irreductible?: string | null
          tesis?: string
          tokens_count?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
          version_esquema?: string
          visibilidad?: Database["public"]["Enums"]["cgt_visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cgt_nucleos_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: true
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_nucleos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_pensadores: {
        Row: {
          aliases: Json
          created_at: string
          descripcion_canonica: string | null
          id: string
          nombre_canonico: string
          project_id: string
          updated_at: string
        }
        Insert: {
          aliases?: Json
          created_at?: string
          descripcion_canonica?: string | null
          id?: string
          nombre_canonico: string
          project_id: string
          updated_at?: string
        }
        Update: {
          aliases?: Json
          created_at?: string
          descripcion_canonica?: string | null
          id?: string
          nombre_canonico?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_pensadores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_pensadores_ediciones_humanas: {
        Row: {
          campo_editado: string
          created_at: string
          id: string
          justificacion: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_editado: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_editado?: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id?: string
          project_id?: string
          user_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_pensadores_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_pensadores_menciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_pensadores_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_pensadores_valor_canonico"
            referencedColumns: ["mencion_id"]
          },
          {
            foreignKeyName: "cgt_pensadores_ediciones_humanas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_pensadores_menciones: {
        Row: {
          artefacto_id: string
          cartografiado_at: string | null
          confianza_cartografiador: number | null
          created_at: string
          decision_cartografiador: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador: string | null
          descripcion_extractor_cruda: string | null
          hash_extractor_crudo: string
          id: string
          justificacion_cartografiador: string | null
          nombre_cartografiador: string | null
          nombre_extractor_crudo: string
          pensador_id: string | null
          project_id: string
        }
        Insert: {
          artefacto_id: string
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          hash_extractor_crudo: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo: string
          pensador_id?: string | null
          project_id: string
        }
        Update: {
          artefacto_id?: string
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          hash_extractor_crudo?: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo?: string
          pensador_id?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_pensadores_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_pensadores_menciones_pensador_id_fkey"
            columns: ["pensador_id"]
            isOneToOne: false
            referencedRelation: "cgt_pensadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_pensadores_menciones_pensador_id_fkey"
            columns: ["pensador_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_pensadores_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_pensadores_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_referencias: {
        Row: {
          aliases: Json
          ano: string | null
          autores: Json
          created_at: string
          descripcion_canonica: string | null
          doi: string | null
          fuente: string | null
          id: string
          isbn: string | null
          project_id: string
          tipo_referencia: Database["public"]["Enums"]["cgt_tipo_referencia"]
          titulo: string | null
          updated_at: string
          url: string | null
          url_normalizada: string | null
        }
        Insert: {
          aliases?: Json
          ano?: string | null
          autores?: Json
          created_at?: string
          descripcion_canonica?: string | null
          doi?: string | null
          fuente?: string | null
          id?: string
          isbn?: string | null
          project_id: string
          tipo_referencia?: Database["public"]["Enums"]["cgt_tipo_referencia"]
          titulo?: string | null
          updated_at?: string
          url?: string | null
          url_normalizada?: string | null
        }
        Update: {
          aliases?: Json
          ano?: string | null
          autores?: Json
          created_at?: string
          descripcion_canonica?: string | null
          doi?: string | null
          fuente?: string | null
          id?: string
          isbn?: string | null
          project_id?: string
          tipo_referencia?: Database["public"]["Enums"]["cgt_tipo_referencia"]
          titulo?: string | null
          updated_at?: string
          url?: string | null
          url_normalizada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_referencias_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_teorias: {
        Row: {
          aliases: Json
          autores_principales: Json
          created_at: string
          descripcion_canonica: string | null
          id: string
          nombre_canonico: string
          project_id: string
          updated_at: string
        }
        Insert: {
          aliases?: Json
          autores_principales?: Json
          created_at?: string
          descripcion_canonica?: string | null
          id?: string
          nombre_canonico: string
          project_id: string
          updated_at?: string
        }
        Update: {
          aliases?: Json
          autores_principales?: Json
          created_at?: string
          descripcion_canonica?: string | null
          id?: string
          nombre_canonico?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cgt_teorias_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_teorias_ediciones_humanas: {
        Row: {
          campo_editado: string
          created_at: string
          id: string
          justificacion: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_editado: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id: string
          project_id: string
          user_id: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_editado?: string
          created_at?: string
          id?: string
          justificacion?: string | null
          mencion_id?: string
          project_id?: string
          user_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_teorias_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_teorias_menciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_teorias_ediciones_humanas_mencion_id_fkey"
            columns: ["mencion_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_teorias_valor_canonico"
            referencedColumns: ["mencion_id"]
          },
          {
            foreignKeyName: "cgt_teorias_ediciones_humanas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_teorias_menciones: {
        Row: {
          artefacto_id: string
          cartografiado_at: string | null
          confianza_cartografiador: number | null
          created_at: string
          decision_cartografiador: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador: string | null
          descripcion_extractor_cruda: string | null
          hash_extractor_crudo: string
          id: string
          justificacion_cartografiador: string | null
          nombre_cartografiador: string | null
          nombre_extractor_crudo: string
          project_id: string
          teoria_id: string | null
        }
        Insert: {
          artefacto_id: string
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          hash_extractor_crudo: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo: string
          project_id: string
          teoria_id?: string | null
        }
        Update: {
          artefacto_id?: string
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          created_at?: string
          decision_cartografiador?: Database["public"]["Enums"]["cgt_decision_cartografiador"]
          descripcion_cartografiador?: string | null
          descripcion_extractor_cruda?: string | null
          hash_extractor_crudo?: string
          id?: string
          justificacion_cartografiador?: string | null
          nombre_cartografiador?: string | null
          nombre_extractor_crudo?: string
          project_id?: string
          teoria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_teorias_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_teorias_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_teorias_menciones_teoria_id_fkey"
            columns: ["teoria_id"]
            isOneToOne: false
            referencedRelation: "cgt_teorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_teorias_menciones_teoria_id_fkey"
            columns: ["teoria_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_teorias_con_conteo"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_video_segmentos: {
        Row: {
          artefacto_id: string
          confianza: number | null
          created_at: string
          frames_clave_ids: string[] | null
          hablante_id: string | null
          id: string
          texto: string | null
          timestamp_fin: number
          timestamp_inicio: number
        }
        Insert: {
          artefacto_id: string
          confianza?: number | null
          created_at?: string
          frames_clave_ids?: string[] | null
          hablante_id?: string | null
          id?: string
          texto?: string | null
          timestamp_fin: number
          timestamp_inicio: number
        }
        Update: {
          artefacto_id?: string
          confianza?: number | null
          created_at?: string
          frames_clave_ids?: string[] | null
          hablante_id?: string | null
          id?: string
          texto?: string | null
          timestamp_fin?: number
          timestamp_inicio?: number
        }
        Relationships: [
          {
            foreignKeyName: "cgt_video_segmentos_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos_video"
            referencedColumns: ["artefacto_id"]
          },
        ]
      }
      cog_artifact_disciplines: {
        Row: {
          artifact_id: string
          discipline_id: string
          relevance_score: number | null
        }
        Insert: {
          artifact_id: string
          discipline_id: string
          relevance_score?: number | null
        }
        Update: {
          artifact_id?: string
          discipline_id?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifact_disciplines_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_disciplines_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "cog_disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_artifact_exports: {
        Row: {
          artifact_id: string
          canonical_json: Json
          content_hash: string
          created_at: string
          exported_at: string
          updated_at: string
        }
        Insert: {
          artifact_id: string
          canonical_json: Json
          content_hash: string
          created_at?: string
          exported_at?: string
          updated_at?: string
        }
        Update: {
          artifact_id?: string
          canonical_json?: Json
          content_hash?: string
          created_at?: string
          exported_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifact_exports_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: true
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_exports_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: true
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_artifact_pages: {
        Row: {
          artifact_id: string
          created_at: string | null
          error_message: string | null
          id: string
          markdown_original: string | null
          markdown_translated: string | null
          marker_metadata: Json | null
          page_number: number
          pdf_storage_path: string | null
          processed_at: string | null
          retry_count: number | null
          status: string
          translated_at: string | null
          updated_at: string | null
        }
        Insert: {
          artifact_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          markdown_original?: string | null
          markdown_translated?: string | null
          marker_metadata?: Json | null
          page_number: number
          pdf_storage_path?: string | null
          processed_at?: string | null
          retry_count?: number | null
          status?: string
          translated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          artifact_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          markdown_original?: string | null
          markdown_translated?: string | null
          marker_metadata?: Json | null
          page_number?: number
          pdf_storage_path?: string | null
          processed_at?: string | null
          retry_count?: number | null
          status?: string
          translated_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cog_artifact_references: {
        Row: {
          artifact_id: string
          context_snippet: string | null
          reference_id: string
          relevance_score: number | null
        }
        Insert: {
          artifact_id: string
          context_snippet?: string | null
          reference_id: string
          relevance_score?: number | null
        }
        Update: {
          artifact_id?: string
          context_snippet?: string | null
          reference_id?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifact_references_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_references_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_references_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "cog_references"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_artifact_relations: {
        Row: {
          created_at: string | null
          derived_artifact_id: string
          generation_metadata: Json | null
          id: string
          relation_type: string
          source_artifact_id: string
        }
        Insert: {
          created_at?: string | null
          derived_artifact_id: string
          generation_metadata?: Json | null
          id?: string
          relation_type: string
          source_artifact_id: string
        }
        Update: {
          created_at?: string | null
          derived_artifact_id?: string
          generation_metadata?: Json | null
          id?: string
          relation_type?: string
          source_artifact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifact_relations_derived_artifact_id_fkey"
            columns: ["derived_artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_relations_derived_artifact_id_fkey"
            columns: ["derived_artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_relations_source_artifact_id_fkey"
            columns: ["source_artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_relations_source_artifact_id_fkey"
            columns: ["source_artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_artifact_streams: {
        Row: {
          artifact_id: string
          context_snippet: string | null
          relevance_score: number | null
          stream_id: string
        }
        Insert: {
          artifact_id: string
          context_snippet?: string | null
          relevance_score?: number | null
          stream_id: string
        }
        Update: {
          artifact_id?: string
          context_snippet?: string | null
          relevance_score?: number | null
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifact_streams_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_streams_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_streams_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "cog_thought_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_artifact_theories: {
        Row: {
          artifact_id: string
          context_snippet: string | null
          is_primary_topic: boolean | null
          relevance_score: number | null
          theory_id: string
        }
        Insert: {
          artifact_id: string
          context_snippet?: string | null
          is_primary_topic?: boolean | null
          relevance_score?: number | null
          theory_id: string
        }
        Update: {
          artifact_id?: string
          context_snippet?: string | null
          is_primary_topic?: boolean | null
          relevance_score?: number | null
          theory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifact_theories_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_theories_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_artifact_theories_theory_id_fkey"
            columns: ["theory_id"]
            isOneToOne: false
            referencedRelation: "cog_theories"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_artifacts: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          error_log: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          project_id: string
          source_metadata: Json | null
          status: Database["public"]["Enums"]["cog_processing_status"] | null
          storage_path: string
          title: string
          type: Database["public"]["Enums"]["cog_artifact_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_log?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          project_id: string
          source_metadata?: Json | null
          status?: Database["public"]["Enums"]["cog_processing_status"] | null
          storage_path: string
          title: string
          type: Database["public"]["Enums"]["cog_artifact_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          error_log?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string
          source_metadata?: Json | null
          status?: Database["public"]["Enums"]["cog_processing_status"] | null
          storage_path?: string
          title?: string
          type?: Database["public"]["Enums"]["cog_artifact_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_chat_sessions: {
        Row: {
          artifact_context: string | null
          artifact_id: string
          avg_f0_score: number | null
          created_at: string | null
          ended_at: string | null
          id: string
          inference_enabled: boolean | null
          messages: Json
          paralloros_count: number | null
          project_id: string
          session_title: string | null
          started_at: string | null
          total_messages: number | null
          updated_at: string | null
        }
        Insert: {
          artifact_context?: string | null
          artifact_id: string
          avg_f0_score?: number | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          inference_enabled?: boolean | null
          messages?: Json
          paralloros_count?: number | null
          project_id: string
          session_title?: string | null
          started_at?: string | null
          total_messages?: number | null
          updated_at?: string | null
        }
        Update: {
          artifact_context?: string | null
          artifact_id?: string
          avg_f0_score?: number | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          inference_enabled?: boolean | null
          messages?: Json
          paralloros_count?: number | null
          project_id?: string
          session_title?: string | null
          started_at?: string | null
          total_messages?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_chat_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_chat_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_chat_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_chronological_data: {
        Row: {
          artifact_id: string
          confidence_score: number | null
          context: string | null
          created_at: string | null
          date_value: string | null
          description: string
          event_type: string
          extracted_by: string | null
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          artifact_id: string
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          date_value?: string | null
          description: string
          event_type: string
          extracted_by?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          artifact_id?: string
          confidence_score?: number | null
          context?: string | null
          created_at?: string | null
          date_value?: string | null
          description?: string
          event_type?: string
          extracted_by?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_chronological_data_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_chronological_data_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_chronological_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_cross_modal_validation: {
        Row: {
          created_at: string | null
          emergent_insights_count: number | null
          id: string
          image_id: string
          interpretation_id: string
          review_notes: string | null
          reviewed_by: string | null
          seed_id: string
          semantic_similarity: number | null
          tdc_coherence_preserved: boolean | null
          validation_status: string | null
          visual_fidelity: number | null
        }
        Insert: {
          created_at?: string | null
          emergent_insights_count?: number | null
          id?: string
          image_id: string
          interpretation_id: string
          review_notes?: string | null
          reviewed_by?: string | null
          seed_id: string
          semantic_similarity?: number | null
          tdc_coherence_preserved?: boolean | null
          validation_status?: string | null
          visual_fidelity?: number | null
        }
        Update: {
          created_at?: string | null
          emergent_insights_count?: number | null
          id?: string
          image_id?: string
          interpretation_id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          seed_id?: string
          semantic_similarity?: number | null
          tdc_coherence_preserved?: boolean | null
          validation_status?: string | null
          visual_fidelity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_cross_modal_validation_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "cog_generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_cross_modal_validation_interpretation_id_fkey"
            columns: ["interpretation_id"]
            isOneToOne: false
            referencedRelation: "cog_visual_interpretations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_cross_modal_validation_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "cog_fractal_seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_disciplines: {
        Row: {
          created_at: string | null
          description: string | null
          geometric_affinity: string | null
          id: string
          is_validated: boolean | null
          name: string
          parent_discipline_id: string | null
          project_id: string
          typical_system_type: Database["public"]["Enums"]["system_type"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          geometric_affinity?: string | null
          id?: string
          is_validated?: boolean | null
          name: string
          parent_discipline_id?: string | null
          project_id: string
          typical_system_type?:
            | Database["public"]["Enums"]["system_type"]
            | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          geometric_affinity?: string | null
          id?: string
          is_validated?: boolean | null
          name?: string
          parent_discipline_id?: string | null
          project_id?: string
          typical_system_type?:
            | Database["public"]["Enums"]["system_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_disciplines_parent_discipline_id_fkey"
            columns: ["parent_discipline_id"]
            isOneToOne: false
            referencedRelation: "cog_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_disciplines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_essay_edit_history: {
        Row: {
          artifact_id: string
          changes_summary: string | null
          character_count: number | null
          created_at: string
          edit_reason: string | null
          edit_type: string
          edited_by: string | null
          essay_content: string
          estimated_tokens: number | null
          generation_metadata: Json | null
          id: string
          transcription_id: string | null
          version_number: number
        }
        Insert: {
          artifact_id: string
          changes_summary?: string | null
          character_count?: number | null
          created_at?: string
          edit_reason?: string | null
          edit_type: string
          edited_by?: string | null
          essay_content: string
          estimated_tokens?: number | null
          generation_metadata?: Json | null
          id?: string
          transcription_id?: string | null
          version_number: number
        }
        Update: {
          artifact_id?: string
          changes_summary?: string | null
          character_count?: number | null
          created_at?: string
          edit_reason?: string | null
          edit_type?: string
          edited_by?: string | null
          essay_content?: string
          estimated_tokens?: number | null
          generation_metadata?: Json | null
          id?: string
          transcription_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "cog_essay_edit_history_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_essay_edit_history_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_essay_edit_history_transcription_id_fkey"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "cog_transcriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_fractal_seeds: {
        Row: {
          artifact_id: string | null
          canonical_content: string | null
          content: string
          context: string | null
          created_at: string | null
          created_by: string | null
          derived_from_reference_id: string | null
          geometric_signature: string | null
          id: string
          merged_at: string | null
          merged_by: string | null
          origin_discipline_id: string | null
          origin_stream_id: string | null
          origin_theory_id: string | null
          project_id: string
          properties: Json | null
          system_type: Database["public"]["Enums"]["system_type"] | null
          tags: string[] | null
          viability_score: number | null
        }
        Insert: {
          artifact_id?: string | null
          canonical_content?: string | null
          content: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          derived_from_reference_id?: string | null
          geometric_signature?: string | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          origin_discipline_id?: string | null
          origin_stream_id?: string | null
          origin_theory_id?: string | null
          project_id: string
          properties?: Json | null
          system_type?: Database["public"]["Enums"]["system_type"] | null
          tags?: string[] | null
          viability_score?: number | null
        }
        Update: {
          artifact_id?: string | null
          canonical_content?: string | null
          content?: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          derived_from_reference_id?: string | null
          geometric_signature?: string | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          origin_discipline_id?: string | null
          origin_stream_id?: string | null
          origin_theory_id?: string | null
          project_id?: string
          properties?: Json | null
          system_type?: Database["public"]["Enums"]["system_type"] | null
          tags?: string[] | null
          viability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_fractal_seeds_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_fractal_seeds_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_fractal_seeds_derived_from_reference_id_fkey"
            columns: ["derived_from_reference_id"]
            isOneToOne: false
            referencedRelation: "cog_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_fractal_seeds_origin_discipline_id_fkey"
            columns: ["origin_discipline_id"]
            isOneToOne: false
            referencedRelation: "cog_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_fractal_seeds_origin_stream_id_fkey"
            columns: ["origin_stream_id"]
            isOneToOne: false
            referencedRelation: "cog_thought_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_fractal_seeds_origin_theory_id_fkey"
            columns: ["origin_theory_id"]
            isOneToOne: false
            referencedRelation: "cog_theories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_fractal_seeds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_garden_elements: {
        Row: {
          added_at: string | null
          element_content: string | null
          element_id: string | null
          element_label: string
          element_type: string
          garden_id: string
          id: string
          project_id: string | null
        }
        Insert: {
          added_at?: string | null
          element_content?: string | null
          element_id?: string | null
          element_label: string
          element_type: string
          garden_id: string
          id?: string
          project_id?: string | null
        }
        Update: {
          added_at?: string | null
          element_content?: string | null
          element_id?: string | null
          element_label?: string
          element_type?: string
          garden_id?: string
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_garden_elements_garden_id_fkey"
            columns: ["garden_id"]
            isOneToOne: false
            referencedRelation: "cog_resonance_gardens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_garden_elements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_generated_images: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          file_size_bytes: number | null
          generation_params: Json | null
          height: number | null
          id: string
          mime_type: string | null
          model_name: string | null
          prompt_id: string
          provider: string
          status: string | null
          storage_path: string
          storage_url: string | null
          width: number | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          generation_params?: Json | null
          height?: number | null
          id?: string
          mime_type?: string | null
          model_name?: string | null
          prompt_id: string
          provider: string
          status?: string | null
          storage_path: string
          storage_url?: string | null
          width?: number | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          generation_params?: Json | null
          height?: number | null
          id?: string
          mime_type?: string | null
          model_name?: string | null
          prompt_id?: string
          provider?: string
          status?: string | null
          storage_path?: string
          storage_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_generated_images_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "cog_image_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_image_prompts: {
        Row: {
          artifact_id: string
          created_at: string | null
          generated_by: string
          id: string
          model_version: string | null
          negative_prompt: string | null
          prompt_text: string
          seed_id: string
          status: string | null
          style_modifiers: string[] | null
          temperature: number | null
        }
        Insert: {
          artifact_id: string
          created_at?: string | null
          generated_by: string
          id?: string
          model_version?: string | null
          negative_prompt?: string | null
          prompt_text: string
          seed_id: string
          status?: string | null
          style_modifiers?: string[] | null
          temperature?: number | null
        }
        Update: {
          artifact_id?: string
          created_at?: string | null
          generated_by?: string
          id?: string
          model_version?: string | null
          negative_prompt?: string | null
          prompt_text?: string
          seed_id?: string
          status?: string | null
          style_modifiers?: string[] | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_image_prompts_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_image_prompts_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_image_prompts_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "cog_fractal_seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_references: {
        Row: {
          aliases: string[] | null
          associated_streams: string[] | null
          associated_theories: string[] | null
          bio_snippet: string | null
          created_at: string | null
          era: string | null
          id: string
          is_thinker: boolean | null
          is_validated: boolean | null
          key_contributions: string[] | null
          name: string
          primary_discipline_id: string | null
          project_id: string
        }
        Insert: {
          aliases?: string[] | null
          associated_streams?: string[] | null
          associated_theories?: string[] | null
          bio_snippet?: string | null
          created_at?: string | null
          era?: string | null
          id?: string
          is_thinker?: boolean | null
          is_validated?: boolean | null
          key_contributions?: string[] | null
          name: string
          primary_discipline_id?: string | null
          project_id: string
        }
        Update: {
          aliases?: string[] | null
          associated_streams?: string[] | null
          associated_theories?: string[] | null
          bio_snippet?: string | null
          created_at?: string | null
          era?: string | null
          id?: string
          is_thinker?: boolean | null
          is_validated?: boolean | null
          key_contributions?: string[] | null
          name?: string
          primary_discipline_id?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cog_references_primary_discipline_id_fkey"
            columns: ["primary_discipline_id"]
            isOneToOne: false
            referencedRelation: "cog_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_references_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_resonance_gardens: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          emoji: string | null
          id: string
          name: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          emoji?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_resonance_gardens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_seed_normalizations: {
        Row: {
          affected_artifact_ids: string[]
          affected_rows: number
          canonical_content: string
          created_at: string | null
          id: string
          performed_by: string
          project_id: string
          reason: string | null
          source_contents: string[]
        }
        Insert: {
          affected_artifact_ids?: string[]
          affected_rows?: number
          canonical_content: string
          created_at?: string | null
          id?: string
          performed_by: string
          project_id: string
          reason?: string | null
          source_contents: string[]
        }
        Update: {
          affected_artifact_ids?: string[]
          affected_rows?: number
          canonical_content?: string
          created_at?: string | null
          id?: string
          performed_by?: string
          project_id?: string
          reason?: string | null
          source_contents?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "cog_seed_normalizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_seeds_in_farms: {
        Row: {
          added_at: string | null
          connection_strength: number | null
          farm_id: string
          role_in_farm: string | null
          seed_id: string
        }
        Insert: {
          added_at?: string | null
          connection_strength?: number | null
          farm_id: string
          role_in_farm?: string | null
          seed_id: string
        }
        Update: {
          added_at?: string | null
          connection_strength?: number | null
          farm_id?: string
          role_in_farm?: string | null
          seed_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cog_seeds_in_farms_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "cog_semantic_farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_seeds_in_farms_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "cog_fractal_seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_segment_bookmarks: {
        Row: {
          artifact_id: string
          created_at: string | null
          id: string
          notes: string | null
          segment_end: number | null
          segment_index: number
          segment_start: number | null
          segment_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artifact_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          segment_end?: number | null
          segment_index: number
          segment_start?: number | null
          segment_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artifact_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          segment_end?: number | null
          segment_index?: number
          segment_start?: number | null
          segment_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cog_segment_bookmarks_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_segment_bookmarks_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_semantic_equivalences: {
        Row: {
          concept_a_id: string
          concept_b_id: string
          confidence: number | null
          created_at: string | null
          description: string | null
          domain_a: string
          domain_b: string
          equivalence_type: string
          evidence: string | null
          geometric_confidence: number | null
          id: string
          is_validated: boolean | null
          project_id: string
          shared_geometry: string | null
          validated_by: string | null
        }
        Insert: {
          concept_a_id: string
          concept_b_id: string
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          domain_a: string
          domain_b: string
          equivalence_type: string
          evidence?: string | null
          geometric_confidence?: number | null
          id?: string
          is_validated?: boolean | null
          project_id: string
          shared_geometry?: string | null
          validated_by?: string | null
        }
        Update: {
          concept_a_id?: string
          concept_b_id?: string
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          domain_a?: string
          domain_b?: string
          equivalence_type?: string
          evidence?: string | null
          geometric_confidence?: number | null
          id?: string
          is_validated?: boolean | null
          project_id?: string
          shared_geometry?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_semantic_equivalences_concept_a_id_fkey"
            columns: ["concept_a_id"]
            isOneToOne: false
            referencedRelation: "cog_fractal_seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_semantic_equivalences_concept_b_id_fkey"
            columns: ["concept_b_id"]
            isOneToOne: false
            referencedRelation: "cog_fractal_seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_semantic_equivalences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_semantic_farms: {
        Row: {
          created_at: string | null
          cross_domain_mappings: Json | null
          description: string | null
          farm_type: string | null
          geometric_equivalence: Json | null
          id: string
          name: string
          project_id: string
          tdc_status_consensus: Database["public"]["Enums"]["tdc_status"] | null
          viability_consensus: number | null
        }
        Insert: {
          created_at?: string | null
          cross_domain_mappings?: Json | null
          description?: string | null
          farm_type?: string | null
          geometric_equivalence?: Json | null
          id?: string
          name: string
          project_id: string
          tdc_status_consensus?:
            | Database["public"]["Enums"]["tdc_status"]
            | null
          viability_consensus?: number | null
        }
        Update: {
          created_at?: string | null
          cross_domain_mappings?: Json | null
          description?: string | null
          farm_type?: string | null
          geometric_equivalence?: Json | null
          id?: string
          name?: string
          project_id?: string
          tdc_status_consensus?:
            | Database["public"]["Enums"]["tdc_status"]
            | null
          viability_consensus?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_semantic_farms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_theories: {
        Row: {
          aliases: string[] | null
          created_at: string | null
          description: string | null
          era: string | null
          geometric_signature: string | null
          id: string
          is_validated: boolean | null
          key_thinkers: string[] | null
          name: string
          origin_discipline_id: string | null
          project_id: string
          r_proximity: number | null
          system_type: Database["public"]["Enums"]["system_type"] | null
          updated_at: string | null
          validated_by: string | null
          viability_score: number | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          description?: string | null
          era?: string | null
          geometric_signature?: string | null
          id?: string
          is_validated?: boolean | null
          key_thinkers?: string[] | null
          name: string
          origin_discipline_id?: string | null
          project_id: string
          r_proximity?: number | null
          system_type?: Database["public"]["Enums"]["system_type"] | null
          updated_at?: string | null
          validated_by?: string | null
          viability_score?: number | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          description?: string | null
          era?: string | null
          geometric_signature?: string | null
          id?: string
          is_validated?: boolean | null
          key_thinkers?: string[] | null
          name?: string
          origin_discipline_id?: string | null
          project_id?: string
          r_proximity?: number | null
          system_type?: Database["public"]["Enums"]["system_type"] | null
          updated_at?: string | null
          validated_by?: string | null
          viability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_theories_origin_discipline_id_fkey"
            columns: ["origin_discipline_id"]
            isOneToOne: false
            referencedRelation: "cog_disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_theories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_thought_streams: {
        Row: {
          aliases: string[] | null
          created_at: string | null
          description: string | null
          era: string | null
          geographic_origin: string | null
          id: string
          is_validated: boolean | null
          key_figures: string[] | null
          name: string
          parent_stream_id: string | null
          project_id: string
          related_theories: string[] | null
          system_type: Database["public"]["Enums"]["system_type"] | null
          typical_friction_range: unknown
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          description?: string | null
          era?: string | null
          geographic_origin?: string | null
          id?: string
          is_validated?: boolean | null
          key_figures?: string[] | null
          name: string
          parent_stream_id?: string | null
          project_id: string
          related_theories?: string[] | null
          system_type?: Database["public"]["Enums"]["system_type"] | null
          typical_friction_range?: unknown
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          description?: string | null
          era?: string | null
          geographic_origin?: string | null
          id?: string
          is_validated?: boolean | null
          key_figures?: string[] | null
          name?: string
          parent_stream_id?: string | null
          project_id?: string
          related_theories?: string[] | null
          system_type?: Database["public"]["Enums"]["system_type"] | null
          typical_friction_range?: unknown
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_thought_streams_parent_stream_id_fkey"
            columns: ["parent_stream_id"]
            isOneToOne: false
            referencedRelation: "cog_thought_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_thought_streams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_transcriptions: {
        Row: {
          artifact_id: string
          confidence_score: number | null
          created_at: string | null
          distilled_essay: string | null
          distilled_essay_metadata: Json | null
          full_text: string | null
          id: string
          language: string | null
          provider: string | null
          segments: Json | null
        }
        Insert: {
          artifact_id: string
          confidence_score?: number | null
          created_at?: string | null
          distilled_essay?: string | null
          distilled_essay_metadata?: Json | null
          full_text?: string | null
          id?: string
          language?: string | null
          provider?: string | null
          segments?: Json | null
        }
        Update: {
          artifact_id?: string
          confidence_score?: number | null
          created_at?: string | null
          distilled_essay?: string | null
          distilled_essay_metadata?: Json | null
          full_text?: string | null
          id?: string
          language?: string | null
          provider?: string | null
          segments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_transcriptions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_transcriptions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_viability_analysis: {
        Row: {
          analyzed_by: string
          artifact_id: string
          confidence: number | null
          created_at: string | null
          ethical_debt_score: number
          ethical_debt_signals: Json | null
          frequency_proximity: number | null
          friction_keywords: string[] | null
          friction_score: number
          hope_catastrophic_forgetting_risk: number | null
          hope_memory_type: Database["public"]["Enums"]["hope_memory_type"]
          id: string
          raw_analysis_data: Json | null
          recommendation: string | null
          reviewed_by: string | null
          system_type: Database["public"]["Enums"]["system_type"]
          tdc_action: Database["public"]["Enums"]["tdc_color"]
          tdc_interpretation: Database["public"]["Enums"]["tdc_color"]
          tdc_perception: Database["public"]["Enums"]["tdc_color"]
          tdc_status: Database["public"]["Enums"]["tdc_status"]
          transcription_id: string | null
          updated_at: string | null
          viability_score: number
        }
        Insert: {
          analyzed_by?: string
          artifact_id: string
          confidence?: number | null
          created_at?: string | null
          ethical_debt_score: number
          ethical_debt_signals?: Json | null
          frequency_proximity?: number | null
          friction_keywords?: string[] | null
          friction_score: number
          hope_catastrophic_forgetting_risk?: number | null
          hope_memory_type: Database["public"]["Enums"]["hope_memory_type"]
          id?: string
          raw_analysis_data?: Json | null
          recommendation?: string | null
          reviewed_by?: string | null
          system_type: Database["public"]["Enums"]["system_type"]
          tdc_action: Database["public"]["Enums"]["tdc_color"]
          tdc_interpretation: Database["public"]["Enums"]["tdc_color"]
          tdc_perception: Database["public"]["Enums"]["tdc_color"]
          tdc_status: Database["public"]["Enums"]["tdc_status"]
          transcription_id?: string | null
          updated_at?: string | null
          viability_score: number
        }
        Update: {
          analyzed_by?: string
          artifact_id?: string
          confidence?: number | null
          created_at?: string | null
          ethical_debt_score?: number
          ethical_debt_signals?: Json | null
          frequency_proximity?: number | null
          friction_keywords?: string[] | null
          friction_score?: number
          hope_catastrophic_forgetting_risk?: number | null
          hope_memory_type?: Database["public"]["Enums"]["hope_memory_type"]
          id?: string
          raw_analysis_data?: Json | null
          recommendation?: string | null
          reviewed_by?: string | null
          system_type?: Database["public"]["Enums"]["system_type"]
          tdc_action?: Database["public"]["Enums"]["tdc_color"]
          tdc_interpretation?: Database["public"]["Enums"]["tdc_color"]
          tdc_perception?: Database["public"]["Enums"]["tdc_color"]
          tdc_status?: Database["public"]["Enums"]["tdc_status"]
          transcription_id?: string | null
          updated_at?: string | null
          viability_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "cog_viability_analysis_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_viability_analysis_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cog_viability_analysis_transcription_id_fkey"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "cog_transcriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_visual_interpretations: {
        Row: {
          coherence_with_concept: string | null
          confidence: number | null
          created_at: string | null
          fractal_detected: boolean | null
          geometric_patterns: string[] | null
          id: string
          image_id: string
          interpreted_by: string
          model_version: string | null
          new_insights: string | null
          raw_response: Json | null
          visual_action: string | null
          visual_interpretation: string | null
          visual_perception: string | null
        }
        Insert: {
          coherence_with_concept?: string | null
          confidence?: number | null
          created_at?: string | null
          fractal_detected?: boolean | null
          geometric_patterns?: string[] | null
          id?: string
          image_id: string
          interpreted_by: string
          model_version?: string | null
          new_insights?: string | null
          raw_response?: Json | null
          visual_action?: string | null
          visual_interpretation?: string | null
          visual_perception?: string | null
        }
        Update: {
          coherence_with_concept?: string | null
          confidence?: number | null
          created_at?: string | null
          fractal_detected?: boolean | null
          geometric_patterns?: string[] | null
          id?: string
          image_id?: string
          interpreted_by?: string
          model_version?: string | null
          new_insights?: string | null
          raw_response?: Json | null
          visual_action?: string | null
          visual_interpretation?: string | null
          visual_perception?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_visual_interpretations_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "cog_generated_images"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_registry: {
        Row: {
          article_count: number
          created_at: string
          dimension_count: number
          export_type: string
          file_name: string
          filters_applied: Json | null
          id: string
          metadata: Json | null
          phase_id: string
          project_id: string
          sha256_hash: string
          user_id: string
        }
        Insert: {
          article_count?: number
          created_at?: string
          dimension_count?: number
          export_type: string
          file_name: string
          filters_applied?: Json | null
          id?: string
          metadata?: Json | null
          phase_id: string
          project_id: string
          sha256_hash: string
          user_id: string
        }
        Update: {
          article_count?: number
          created_at?: string
          dimension_count?: number
          export_type?: string
          file_name?: string
          filters_applied?: Json | null
          id?: string
          metadata?: Json | null
          phase_id?: string
          project_id?: string
          sha256_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_registry_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "preclassification_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_registry_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      discrepancy_export_logs: {
        Row: {
          batch_id: string
          created_at: string
          export_format: string
          export_metadata: Json | null
          file_size_bytes: number | null
          id: string
          project_id: string
          storage_path: string | null
          total_discrepancies: number
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          export_format?: string
          export_metadata?: Json | null
          file_size_bytes?: number | null
          id?: string
          project_id: string
          storage_path?: string | null
          total_discrepancies?: number
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          export_format?: string
          export_metadata?: Json | null
          file_size_bytes?: number | null
          id?: string
          project_id?: string
          storage_path?: string | null
          total_discrepancies?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discrepancy_export_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "article_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancy_export_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      minotauro_ai_interactions: {
        Row: {
          ai_model: string
          archetype_tone: Database["public"]["Enums"]["archetype_tone"]
          created_at: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          output_tokens: number | null
          paragraph_id: string
          prompt_sent: string
          response_received: string
          success: boolean | null
        }
        Insert: {
          ai_model: string
          archetype_tone: Database["public"]["Enums"]["archetype_tone"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          paragraph_id: string
          prompt_sent: string
          response_received: string
          success?: boolean | null
        }
        Update: {
          ai_model?: string
          archetype_tone?: Database["public"]["Enums"]["archetype_tone"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          paragraph_id?: string
          prompt_sent?: string
          response_received?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "minotauro_ai_interactions_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "minotauro_paragraphs"
            referencedColumns: ["id"]
          },
        ]
      }
      minotauro_curated_sources: {
        Row: {
          artifact_id: string | null
          chat_session_id: string | null
          content_excerpt: string | null
          created_at: string | null
          galaxy_id: string
          id: string
          metadata: Json | null
          order_index: number | null
          relevance_note: string | null
          source_type: string
        }
        Insert: {
          artifact_id?: string | null
          chat_session_id?: string | null
          content_excerpt?: string | null
          created_at?: string | null
          galaxy_id: string
          id?: string
          metadata?: Json | null
          order_index?: number | null
          relevance_note?: string | null
          source_type: string
        }
        Update: {
          artifact_id?: string | null
          chat_session_id?: string | null
          content_excerpt?: string | null
          created_at?: string | null
          galaxy_id?: string
          id?: string
          metadata?: Json | null
          order_index?: number | null
          relevance_note?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "minotauro_curated_sources_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minotauro_curated_sources_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "cog_artifacts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minotauro_curated_sources_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "cog_chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minotauro_curated_sources_galaxy_id_fkey"
            columns: ["galaxy_id"]
            isOneToOne: false
            referencedRelation: "minotauro_galaxies"
            referencedColumns: ["id"]
          },
        ]
      }
      minotauro_galaxies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          order_index: number
          title: string
          universe_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number
          title: string
          universe_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number
          title?: string
          universe_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minotauro_galaxies_universe_id_fkey"
            columns: ["universe_id"]
            isOneToOne: false
            referencedRelation: "minotauro_universes"
            referencedColumns: ["id"]
          },
        ]
      }
      minotauro_paragraph_versions: {
        Row: {
          ai_rationale: string | null
          archetype_tone: Database["public"]["Enums"]["archetype_tone"] | null
          changes_summary: string | null
          content: string
          created_at: string | null
          created_by: string
          id: string
          metadata: Json | null
          paragraph_id: string
          version_number: number
        }
        Insert: {
          ai_rationale?: string | null
          archetype_tone?: Database["public"]["Enums"]["archetype_tone"] | null
          changes_summary?: string | null
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          metadata?: Json | null
          paragraph_id: string
          version_number: number
        }
        Update: {
          ai_rationale?: string | null
          archetype_tone?: Database["public"]["Enums"]["archetype_tone"] | null
          changes_summary?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          metadata?: Json | null
          paragraph_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "minotauro_paragraph_versions_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "minotauro_paragraphs"
            referencedColumns: ["id"]
          },
        ]
      }
      minotauro_paragraphs: {
        Row: {
          ai_content: string | null
          archetype_tone: Database["public"]["Enums"]["archetype_tone"] | null
          created_at: string | null
          final_content: string | null
          galaxy_id: string
          human_content: string
          id: string
          metadata: Json | null
          order_index: number
          seed_concept: string | null
          status: Database["public"]["Enums"]["paragraph_status"] | null
          title_tentative: string | null
          updated_at: string | null
        }
        Insert: {
          ai_content?: string | null
          archetype_tone?: Database["public"]["Enums"]["archetype_tone"] | null
          created_at?: string | null
          final_content?: string | null
          galaxy_id: string
          human_content: string
          id?: string
          metadata?: Json | null
          order_index?: number
          seed_concept?: string | null
          status?: Database["public"]["Enums"]["paragraph_status"] | null
          title_tentative?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_content?: string | null
          archetype_tone?: Database["public"]["Enums"]["archetype_tone"] | null
          created_at?: string | null
          final_content?: string | null
          galaxy_id?: string
          human_content?: string
          id?: string
          metadata?: Json | null
          order_index?: number
          seed_concept?: string | null
          status?: Database["public"]["Enums"]["paragraph_status"] | null
          title_tentative?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minotauro_paragraphs_galaxy_id_fkey"
            columns: ["galaxy_id"]
            isOneToOne: false
            referencedRelation: "minotauro_galaxies"
            referencedColumns: ["id"]
          },
        ]
      }
      minotauro_universes: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string
          purpose: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          purpose?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          purpose?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "minotauro_universes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_calibration_chats: {
        Row: {
          completed_at: string | null
          consumed_by_calibration_id: string | null
          created_at: string | null
          id: string
          is_complete: boolean | null
          is_public: boolean | null
          isomorphism_id: string | null
          message_count: number | null
          new_evidence_provided: boolean | null
          node_id: string | null
          origin_calibration_id: string | null
          project_id: string
          suggests_recalibration: boolean | null
          summary: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          consumed_by_calibration_id?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          is_public?: boolean | null
          isomorphism_id?: string | null
          message_count?: number | null
          new_evidence_provided?: boolean | null
          node_id?: string | null
          origin_calibration_id?: string | null
          project_id: string
          suggests_recalibration?: boolean | null
          summary?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          consumed_by_calibration_id?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          is_public?: boolean | null
          isomorphism_id?: string | null
          message_count?: number | null
          new_evidence_provided?: boolean | null
          node_id?: string | null
          origin_calibration_id?: string | null
          project_id?: string
          suggests_recalibration?: boolean | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_calibration_chats_consumed_by_calibration_id_fkey"
            columns: ["consumed_by_calibration_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibration_chats_isomorphism_id_fkey"
            columns: ["isomorphism_id"]
            isOneToOne: false
            referencedRelation: "nexus_isomorphisms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibration_chats_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibration_stats"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "nexus_calibration_chats_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibration_chats_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibration_chats_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_timeline"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "nexus_calibration_chats_origin_calibration_id_fkey"
            columns: ["origin_calibration_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibration_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_calibrations: {
        Row: {
          ai_model: string
          ai_model_version: string | null
          angle_interpretation: string | null
          calibration_angle: number | null
          created_at: string | null
          elegant_closure: string | null
          evidence_needed: string | null
          geometric_pattern: string | null
          id: string
          input_context: Json | null
          is_public: boolean | null
          isomorphism_id: string | null
          node_id: string | null
          output_summary: string | null
          previous_calibration_id: string | null
          project_id: string
          published_at: string | null
          quipu_cognitive: number | null
          quipu_resonant: number | null
          reasoning: string
          requested_by: string
          result: string
          version: number
        }
        Insert: {
          ai_model?: string
          ai_model_version?: string | null
          angle_interpretation?: string | null
          calibration_angle?: number | null
          created_at?: string | null
          elegant_closure?: string | null
          evidence_needed?: string | null
          geometric_pattern?: string | null
          id?: string
          input_context?: Json | null
          is_public?: boolean | null
          isomorphism_id?: string | null
          node_id?: string | null
          output_summary?: string | null
          previous_calibration_id?: string | null
          project_id: string
          published_at?: string | null
          quipu_cognitive?: number | null
          quipu_resonant?: number | null
          reasoning: string
          requested_by: string
          result: string
          version?: number
        }
        Update: {
          ai_model?: string
          ai_model_version?: string | null
          angle_interpretation?: string | null
          calibration_angle?: number | null
          created_at?: string | null
          elegant_closure?: string | null
          evidence_needed?: string | null
          geometric_pattern?: string | null
          id?: string
          input_context?: Json | null
          is_public?: boolean | null
          isomorphism_id?: string | null
          node_id?: string | null
          output_summary?: string | null
          previous_calibration_id?: string | null
          project_id?: string
          published_at?: string | null
          quipu_cognitive?: number | null
          quipu_resonant?: number | null
          reasoning?: string
          requested_by?: string
          result?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "nexus_calibrations_isomorphism_id_fkey"
            columns: ["isomorphism_id"]
            isOneToOne: false
            referencedRelation: "nexus_isomorphisms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibrations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibration_stats"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "nexus_calibrations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibrations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibrations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_timeline"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "nexus_calibrations_previous_calibration_id_fkey"
            columns: ["previous_calibration_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_calibrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          quipu_data: Json | null
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          quipu_data?: Json | null
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          quipu_data?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibration_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_civilization_glitches: {
        Row: {
          civilization_id: string
          glitch_id: string
          notes: string | null
        }
        Insert: {
          civilization_id: string
          glitch_id: string
          notes?: string | null
        }
        Update: {
          civilization_id?: string
          glitch_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_civilization_glitches_glitch_id_fkey"
            columns: ["glitch_id"]
            isOneToOne: false
            referencedRelation: "nexus_fertile_glitches"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_fertile_glitches: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      nexus_isomorphism_connections: {
        Row: {
          created_at: string | null
          id: string
          isomorphism_id: string | null
          node_id: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          isomorphism_id?: string | null
          node_id?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          isomorphism_id?: string | null
          node_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_isomorphism_connections_isomorphism_id_fkey"
            columns: ["isomorphism_id"]
            isOneToOne: false
            referencedRelation: "nexus_isomorphisms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_isomorphism_connections_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibration_stats"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "nexus_isomorphism_connections_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_isomorphism_connections_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_isomorphism_connections_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_timeline"
            referencedColumns: ["node_id"]
          },
        ]
      }
      nexus_isomorphisms: {
        Row: {
          color: string | null
          connection_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          project_id: string
          slug: string | null
          strength: number | null
        }
        Insert: {
          color?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          project_id: string
          slug?: string | null
          strength?: number | null
        }
        Update: {
          color?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          project_id?: string
          slug?: string | null
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_isomorphisms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_node_tags: {
        Row: {
          node_id: string
          tag_id: string
        }
        Insert: {
          node_id: string
          tag_id: string
        }
        Update: {
          node_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_node_tags_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_calibration_stats"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "nexus_node_tags_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_node_tags_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_nodes_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_node_tags_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nexus_timeline"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "nexus_node_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "nexus_pattern_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_nodes: {
        Row: {
          anomaly_description: string | null
          anomaly_level: string | null
          citation: string | null
          counter_narrative: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_precision: string | null
          description: string | null
          emoji: string | null
          foundational_label: string | null
          id: string
          is_foundational: boolean | null
          latitude: number | null
          longitude: number | null
          maturity: string
          maturity_reason: string | null
          name: string
          node_type: string
          official_narrative: string | null
          project_id: string
          region_id: string | null
          search_vector: unknown
          slug: string | null
          source_url: string | null
          subtitle: string | null
          torsion_angle: number | null
          torsion_note: string | null
          updated_at: string | null
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          anomaly_description?: string | null
          anomaly_level?: string | null
          citation?: string | null
          counter_narrative?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_precision?: string | null
          description?: string | null
          emoji?: string | null
          foundational_label?: string | null
          id?: string
          is_foundational?: boolean | null
          latitude?: number | null
          longitude?: number | null
          maturity?: string
          maturity_reason?: string | null
          name: string
          node_type?: string
          official_narrative?: string | null
          project_id: string
          region_id?: string | null
          search_vector?: unknown
          slug?: string | null
          source_url?: string | null
          subtitle?: string | null
          torsion_angle?: number | null
          torsion_note?: string | null
          updated_at?: string | null
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          anomaly_description?: string | null
          anomaly_level?: string | null
          citation?: string | null
          counter_narrative?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_precision?: string | null
          description?: string | null
          emoji?: string | null
          foundational_label?: string | null
          id?: string
          is_foundational?: boolean | null
          latitude?: number | null
          longitude?: number | null
          maturity?: string
          maturity_reason?: string | null
          name?: string
          node_type?: string
          official_narrative?: string | null
          project_id?: string
          region_id?: string | null
          search_vector?: unknown
          slug?: string | null
          source_url?: string | null
          subtitle?: string | null
          torsion_angle?: number | null
          torsion_note?: string | null
          updated_at?: string | null
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_nodes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "nexus_diversity_analysis"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "nexus_nodes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "nexus_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_pattern_tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          project_id: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          project_id: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          project_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_pattern_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_regions: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nexus_researchers: {
        Row: {
          access_enabled: boolean | null
          created_at: string | null
          email: string | null
          id: string
          institution: string | null
          last_activity: string | null
          name: string
          project_active: boolean | null
          specialization: string | null
          updated_at: string | null
          user_id: string | null
          validation_enabled: boolean | null
        }
        Insert: {
          access_enabled?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          last_activity?: string | null
          name: string
          project_active?: boolean | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation_enabled?: boolean | null
        }
        Update: {
          access_enabled?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          last_activity?: string | null
          name?: string
          project_active?: boolean | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation_enabled?: boolean | null
        }
        Relationships: []
      }
      nexus_technologies: {
        Row: {
          anomaly_level: string | null
          category: string | null
          civilization_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          anomaly_level?: string | null
          category?: string | null
          civilization_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          anomaly_level?: string | null
          category?: string | null
          civilization_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      nexus_validation_chats: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_complete: boolean | null
          message_count: number | null
          validation_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          message_count?: number | null
          validation_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          message_count?: number | null
          validation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_validation_chats_validation_id_fkey"
            columns: ["validation_id"]
            isOneToOne: false
            referencedRelation: "nexus_validations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_validations: {
        Row: {
          additional_info: string | null
          can_be_negated: boolean | null
          civilization_id: string | null
          confidence_level: string | null
          created_at: string | null
          evidence_needed: string | null
          evidence_needed_old: string | null
          geometric_pattern: string | null
          id: string
          isomorphism_id: string | null
          notes: string | null
          quipu_cognitive: number | null
          quipu_resonant: number | null
          reasoning: string | null
          researcher_id: string | null
          validated_at: string | null
        }
        Insert: {
          additional_info?: string | null
          can_be_negated?: boolean | null
          civilization_id?: string | null
          confidence_level?: string | null
          created_at?: string | null
          evidence_needed?: string | null
          evidence_needed_old?: string | null
          geometric_pattern?: string | null
          id?: string
          isomorphism_id?: string | null
          notes?: string | null
          quipu_cognitive?: number | null
          quipu_resonant?: number | null
          reasoning?: string | null
          researcher_id?: string | null
          validated_at?: string | null
        }
        Update: {
          additional_info?: string | null
          can_be_negated?: boolean | null
          civilization_id?: string | null
          confidence_level?: string | null
          created_at?: string | null
          evidence_needed?: string | null
          evidence_needed_old?: string | null
          geometric_pattern?: string | null
          id?: string
          isomorphism_id?: string | null
          notes?: string | null
          quipu_cognitive?: number | null
          quipu_resonant?: number | null
          reasoning?: string | null
          researcher_id?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_validations_researcher_id_fkey"
            columns: ["researcher_id"]
            isOneToOne: false
            referencedRelation: "nexus_researchers"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_annexes: {
        Row: {
          created_at: string
          description: string
          file_size: number
          filename: string
          id: string
          language: string
          mime_type: string
          paper_id: string
          position: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          file_size?: number
          filename: string
          id?: string
          language?: string
          mime_type?: string
          paper_id: string
          position?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          file_size?: number
          filename?: string
          id?: string
          language?: string
          mime_type?: string
          paper_id?: string
          position?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_annexes_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_images: {
        Row: {
          alt_text: string
          created_at: string
          description_ai: string
          file_size: number | null
          height: number | null
          id: string
          is_uploaded: boolean
          mime_type: string | null
          original_filename: string | null
          original_placeholder: string
          paper_id: string
          position: number
          public_url: string | null
          storage_path: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string
          created_at?: string
          description_ai?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_uploaded?: boolean
          mime_type?: string | null
          original_filename?: string | null
          original_placeholder: string
          paper_id: string
          position: number
          public_url?: string | null
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string
          created_at?: string
          description_ai?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_uploaded?: boolean
          mime_type?: string | null
          original_filename?: string | null
          original_placeholder?: string
          paper_id?: string
          position?: number
          public_url?: string | null
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_images_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          abstract_en: string | null
          abstract_es: string
          authors: Json
          citation_apa: string | null
          content_md: string
          created_at: string
          created_by: string | null
          doi: string | null
          id: string
          is_published: boolean
          keywords: string[]
          language: string
          license: string
          pdf_sha256: string | null
          pdf_storage_path: string | null
          pdf_url: string | null
          processing_status: string
          published_at: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
          version: string
          zenodo_url: string | null
        }
        Insert: {
          abstract_en?: string | null
          abstract_es: string
          authors?: Json
          citation_apa?: string | null
          content_md: string
          created_at?: string
          created_by?: string | null
          doi?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          language?: string
          license?: string
          pdf_sha256?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          processing_status?: string
          published_at?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
          version?: string
          zenodo_url?: string | null
        }
        Update: {
          abstract_en?: string | null
          abstract_es?: string
          authors?: Json
          citation_apa?: string | null
          content_md?: string
          created_at?: string
          created_by?: string | null
          doi?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          language?: string
          license?: string
          pdf_sha256?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          processing_status?: string
          published_at?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          version?: string
          zenodo_url?: string | null
        }
        Relationships: []
      }
      phase_eligible_articles: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          phase_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          phase_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_eligible_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_eligible_articles_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "preclassification_phases"
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
          emoticon: string | null
          id: string
          ordering: number | null
          value: string
        }
        Insert: {
          dimension_id: string
          emoticon?: string | null
          id?: string
          ordering?: number | null
          value: string
        }
        Update: {
          dimension_id?: string
          emoticon?: string | null
          id?: string
          ordering?: number | null
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
          ordering: number | null
          question: string
        }
        Insert: {
          dimension_id: string
          id?: string
          ordering?: number | null
          question: string
        }
        Update: {
          dimension_id?: string
          id?: string
          ordering?: number | null
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
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          ordering: number | null
          phase_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["dimension_status"] | null
          type: Database["public"]["Enums"]["dimension_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          ordering?: number | null
          phase_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["dimension_status"] | null
          type: Database["public"]["Enums"]["dimension_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          ordering?: number | null
          phase_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["dimension_status"] | null
          type?: Database["public"]["Enums"]["dimension_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preclass_dimensions_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "preclassification_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preclass_dimensions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      preclassification_phases: {
        Row: {
          applied_filters: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          phase_number: number
          project_id: string
          source_phase_id: string | null
          status:
            | Database["public"]["Enums"]["preclassification_phase_status"]
            | null
          total_articles: number | null
          universe_name: string | null
          universe_type: string | null
        }
        Insert: {
          applied_filters?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          phase_number: number
          project_id: string
          source_phase_id?: string | null
          status?:
            | Database["public"]["Enums"]["preclassification_phase_status"]
            | null
          total_articles?: number | null
          universe_name?: string | null
          universe_type?: string | null
        }
        Update: {
          applied_filters?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          phase_number?: number
          project_id?: string
          source_phase_id?: string | null
          status?:
            | Database["public"]["Enums"]["preclassification_phase_status"]
            | null
          total_articles?: number | null
          universe_name?: string | null
          universe_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preclassification_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preclassification_phases_source_phase_id_fkey"
            columns: ["source_phase_id"]
            isOneToOne: false
            referencedRelation: "preclassification_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          contact_email_for_project: string | null
          contextual_notes: string | null
          id: string
          is_active_for_user: boolean | null
          joined_at: string | null
          project_id: string
          project_role_id: string
          ui_font_pair: string | null
          ui_is_dark_mode: boolean | null
          ui_theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_email_for_project?: string | null
          contextual_notes?: string | null
          id?: string
          is_active_for_user?: boolean | null
          joined_at?: string | null
          project_id: string
          project_role_id: string
          ui_font_pair?: string | null
          ui_is_dark_mode?: boolean | null
          ui_theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_email_for_project?: string | null
          contextual_notes?: string | null
          id?: string
          is_active_for_user?: boolean | null
          joined_at?: string | null
          project_id?: string
          project_role_id?: string
          ui_font_pair?: string | null
          ui_is_dark_mode?: boolean | null
          ui_theme?: string | null
          updated_at?: string | null
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
          can_bulk_edit_master_data: boolean | null
          can_create_batches: boolean | null
          can_manage_master_data: boolean | null
          can_upload_files: boolean | null
          created_at: string | null
          id: string
          project_id: string
          role_description: string | null
          role_name: string
          updated_at: string | null
        }
        Insert: {
          can_bulk_edit_master_data?: boolean | null
          can_create_batches?: boolean | null
          can_manage_master_data?: boolean | null
          can_upload_files?: boolean | null
          created_at?: string | null
          id?: string
          project_id: string
          role_description?: string | null
          role_name: string
          updated_at?: string | null
        }
        Update: {
          can_bulk_edit_master_data?: boolean | null
          can_create_batches?: boolean | null
          can_manage_master_data?: boolean | null
          can_upload_files?: boolean | null
          created_at?: string | null
          id?: string
          project_id?: string
          role_description?: string | null
          role_name?: string
          updated_at?: string | null
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
          operation_timestamp: string | null
          operation_type: string | null
          project_id: string | null
          role_description_new: string | null
          role_description_old: string | null
          role_id: string | null
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
          operation_timestamp?: string | null
          operation_type?: string | null
          project_id?: string | null
          role_description_new?: string | null
          role_description_old?: string | null
          role_id?: string | null
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
          operation_timestamp?: string | null
          operation_type?: string | null
          project_id?: string | null
          role_description_new?: string | null
          role_description_old?: string | null
          role_id?: string | null
          role_name_new?: string | null
          role_name_old?: string | null
          transaction_id?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          active_phase_id: string | null
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          institution_name: string | null
          lead_researcher_user_id: string | null
          module_bibliography: boolean | null
          module_cognetica: boolean | null
          module_interviews: boolean | null
          module_planning: boolean | null
          name: string
          owner_id: string | null
          proposal: string | null
          proposal_bibliography: string | null
          proposal_interviews: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          active_phase_id?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          institution_name?: string | null
          lead_researcher_user_id?: string | null
          module_bibliography?: boolean | null
          module_cognetica?: boolean | null
          module_interviews?: boolean | null
          module_planning?: boolean | null
          name: string
          owner_id?: string | null
          proposal?: string | null
          proposal_bibliography?: string | null
          proposal_interviews?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          active_phase_id?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          institution_name?: string | null
          lead_researcher_user_id?: string | null
          module_bibliography?: boolean | null
          module_cognetica?: boolean | null
          module_interviews?: boolean | null
          module_planning?: boolean | null
          name?: string
          owner_id?: string | null
          proposal?: string | null
          proposal_bibliography?: string | null
          proposal_interviews?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users_profiles: {
        Row: {
          contact_phone: string | null
          created_at: string | null
          first_name: string | null
          general_notes: string | null
          is_platform_admin: boolean | null
          last_name: string | null
          preferred_language: string | null
          primary_institution: string | null
          pronouns: string | null
          public_contact_email: string | null
          public_display_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string | null
          first_name?: string | null
          general_notes?: string | null
          is_platform_admin?: boolean | null
          last_name?: string | null
          preferred_language?: string | null
          primary_institution?: string | null
          pronouns?: string | null
          public_contact_email?: string | null
          public_display_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string | null
          first_name?: string | null
          general_notes?: string | null
          is_platform_admin?: boolean | null
          last_name?: string | null
          preferred_language?: string | null
          primary_institution?: string | null
          pronouns?: string | null
          public_contact_email?: string | null
          public_display_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      cgt_vw_citas_valor_canonico: {
        Row: {
          artefacto_id: string | null
          autor_canonico_actual: string | null
          autor_extractor_crudo: string | null
          cartografiado_at: string | null
          cita_id: string | null
          confianza_cartografiador: number | null
          decision_cartografiador:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          mencion_id: string | null
          project_id: string | null
          referencia_canonica_actual: string | null
          referencia_extractor_cruda: string | null
          texto_canonico_actual: string | null
          texto_extractor_crudo: string | null
          tipo_cita_canonico_actual:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          tipo_cita_extractor:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          ubicacion_en_artefacto: string | null
        }
        Insert: {
          artefacto_id?: string | null
          autor_canonico_actual?: never
          autor_extractor_crudo?: string | null
          cartografiado_at?: string | null
          cita_id?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          mencion_id?: string | null
          project_id?: string | null
          referencia_canonica_actual?: never
          referencia_extractor_cruda?: string | null
          texto_canonico_actual?: never
          texto_extractor_crudo?: string | null
          tipo_cita_canonico_actual?: never
          tipo_cita_extractor?:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          ubicacion_en_artefacto?: string | null
        }
        Update: {
          artefacto_id?: string | null
          autor_canonico_actual?: never
          autor_extractor_crudo?: string | null
          cartografiado_at?: string | null
          cita_id?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          mencion_id?: string | null
          project_id?: string | null
          referencia_canonica_actual?: never
          referencia_extractor_cruda?: string | null
          texto_canonico_actual?: never
          texto_extractor_crudo?: string | null
          tipo_cita_canonico_actual?: never
          tipo_cita_extractor?:
            | Database["public"]["Enums"]["cgt_tipo_cita"]
            | null
          ubicacion_en_artefacto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_citas_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_citas_menciones_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "cgt_citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_citas_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_conceptos_con_conteo: {
        Row: {
          aliases: Json | null
          created_at: string | null
          descripcion_canonica: string | null
          es_semilla_fractal: boolean | null
          id: string | null
          menciones_count: number | null
          nombre_canonico: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          aliases?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          es_semilla_fractal?: boolean | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aliases?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          es_semilla_fractal?: boolean | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_conceptos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_conceptos_valor_canonico: {
        Row: {
          artefacto_id: string | null
          cartografiado_at: string | null
          concepto_id: string | null
          confianza_cartografiador: number | null
          decision_cartografiador:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual: string | null
          descripcion_extractor_cruda: string | null
          descripcion_humano_ultimo: string | null
          mencion_id: string | null
          nombre_canonico_actual: string | null
          nombre_extractor_crudo: string | null
          nombre_humano_ultimo: string | null
          project_id: string | null
        }
        Insert: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          concepto_id?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          project_id?: string | null
        }
        Update: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          concepto_id?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_conceptos_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_conceptos_menciones_concepto_id_fkey"
            columns: ["concepto_id"]
            isOneToOne: false
            referencedRelation: "cgt_conceptos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_conceptos_menciones_concepto_id_fkey"
            columns: ["concepto_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_conceptos_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_conceptos_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_disciplinas_con_conteo: {
        Row: {
          aliases: Json | null
          created_at: string | null
          descripcion_canonica: string | null
          disciplina_madre_id: string | null
          id: string | null
          menciones_count: number | null
          nombre_canonico: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          aliases?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          disciplina_madre_id?: string | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aliases?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          disciplina_madre_id?: string | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_disciplinas_disciplina_madre_id_fkey"
            columns: ["disciplina_madre_id"]
            isOneToOne: false
            referencedRelation: "cgt_disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_disciplina_madre_id_fkey"
            columns: ["disciplina_madre_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_disciplinas_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_disciplinas_valor_canonico: {
        Row: {
          artefacto_id: string | null
          cartografiado_at: string | null
          confianza_cartografiador: number | null
          decision_cartografiador:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual: string | null
          descripcion_extractor_cruda: string | null
          descripcion_humano_ultimo: string | null
          disciplina_id: string | null
          mencion_id: string | null
          nombre_canonico_actual: string | null
          nombre_extractor_crudo: string | null
          nombre_humano_ultimo: string | null
          project_id: string | null
        }
        Insert: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          disciplina_id?: string | null
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          project_id?: string | null
        }
        Update: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          disciplina_id?: string | null
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_disciplinas_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_menciones_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "cgt_disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_menciones_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_disciplinas_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_disciplinas_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_pensadores_con_conteo: {
        Row: {
          aliases: Json | null
          created_at: string | null
          descripcion_canonica: string | null
          id: string | null
          menciones_count: number | null
          nombre_canonico: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          aliases?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aliases?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_pensadores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_pensadores_valor_canonico: {
        Row: {
          artefacto_id: string | null
          cartografiado_at: string | null
          confianza_cartografiador: number | null
          decision_cartografiador:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual: string | null
          descripcion_extractor_cruda: string | null
          descripcion_humano_ultimo: string | null
          mencion_id: string | null
          nombre_canonico_actual: string | null
          nombre_extractor_crudo: string | null
          nombre_humano_ultimo: string | null
          pensador_id: string | null
          project_id: string | null
        }
        Insert: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          pensador_id?: string | null
          project_id?: string | null
        }
        Update: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          pensador_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_pensadores_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_pensadores_menciones_pensador_id_fkey"
            columns: ["pensador_id"]
            isOneToOne: false
            referencedRelation: "cgt_pensadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_pensadores_menciones_pensador_id_fkey"
            columns: ["pensador_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_pensadores_con_conteo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_pensadores_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_referencias_con_conteo: {
        Row: {
          aliases: Json | null
          ano: string | null
          artefactos_count: number | null
          autores: Json | null
          created_at: string | null
          descripcion_canonica: string | null
          doi: string | null
          fuente: string | null
          id: string | null
          isbn: string | null
          project_id: string | null
          tipo_referencia:
            | Database["public"]["Enums"]["cgt_tipo_referencia"]
            | null
          titulo: string | null
          updated_at: string | null
          url: string | null
          url_normalizada: string | null
        }
        Insert: {
          aliases?: Json | null
          ano?: string | null
          artefactos_count?: never
          autores?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          doi?: string | null
          fuente?: string | null
          id?: string | null
          isbn?: string | null
          project_id?: string | null
          tipo_referencia?:
            | Database["public"]["Enums"]["cgt_tipo_referencia"]
            | null
          titulo?: string | null
          updated_at?: string | null
          url?: string | null
          url_normalizada?: string | null
        }
        Update: {
          aliases?: Json | null
          ano?: string | null
          artefactos_count?: never
          autores?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          doi?: string | null
          fuente?: string | null
          id?: string | null
          isbn?: string | null
          project_id?: string | null
          tipo_referencia?:
            | Database["public"]["Enums"]["cgt_tipo_referencia"]
            | null
          titulo?: string | null
          updated_at?: string | null
          url?: string | null
          url_normalizada?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_referencias_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_teorias_con_conteo: {
        Row: {
          aliases: Json | null
          autores_principales: Json | null
          created_at: string | null
          descripcion_canonica: string | null
          id: string | null
          menciones_count: number | null
          nombre_canonico: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          aliases?: Json | null
          autores_principales?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aliases?: Json | null
          autores_principales?: Json | null
          created_at?: string | null
          descripcion_canonica?: string | null
          id?: string | null
          menciones_count?: never
          nombre_canonico?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_teorias_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_vw_teorias_valor_canonico: {
        Row: {
          artefacto_id: string | null
          cartografiado_at: string | null
          confianza_cartografiador: number | null
          decision_cartografiador:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual: string | null
          descripcion_extractor_cruda: string | null
          descripcion_humano_ultimo: string | null
          mencion_id: string | null
          nombre_canonico_actual: string | null
          nombre_extractor_crudo: string | null
          nombre_humano_ultimo: string | null
          project_id: string | null
          teoria_id: string | null
        }
        Insert: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          project_id?: string | null
          teoria_id?: string | null
        }
        Update: {
          artefacto_id?: string | null
          cartografiado_at?: string | null
          confianza_cartografiador?: number | null
          decision_cartografiador?:
            | Database["public"]["Enums"]["cgt_decision_cartografiador"]
            | null
          descripcion_canonica_actual?: never
          descripcion_extractor_cruda?: string | null
          descripcion_humano_ultimo?: never
          mencion_id?: string | null
          nombre_canonico_actual?: never
          nombre_extractor_crudo?: string | null
          nombre_humano_ultimo?: never
          project_id?: string | null
          teoria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_teorias_menciones_artefacto_id_fkey"
            columns: ["artefacto_id"]
            isOneToOne: false
            referencedRelation: "cgt_artefactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_teorias_menciones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_teorias_menciones_teoria_id_fkey"
            columns: ["teoria_id"]
            isOneToOne: false
            referencedRelation: "cgt_teorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgt_teorias_menciones_teoria_id_fkey"
            columns: ["teoria_id"]
            isOneToOne: false
            referencedRelation: "cgt_vw_teorias_con_conteo"
            referencedColumns: ["id"]
          },
        ]
      }
      cog_artifacts_full: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          error_log: string | null
          ethical_debt_score: number | null
          file_size_bytes: number | null
          friction_score: number | null
          hope_memory_type:
            | Database["public"]["Enums"]["hope_memory_type"]
            | null
          id: string | null
          mime_type: string | null
          project_id: string | null
          references_count: number | null
          seeds_count: number | null
          source_metadata: Json | null
          status: Database["public"]["Enums"]["cog_processing_status"] | null
          storage_path: string | null
          system_type: Database["public"]["Enums"]["system_type"] | null
          tdc_status: Database["public"]["Enums"]["tdc_status"] | null
          theories_count: number | null
          title: string | null
          transcription_confidence: number | null
          transcription_text: string | null
          type: Database["public"]["Enums"]["cog_artifact_type"] | null
          updated_at: string | null
          viability_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cog_artifacts_project_id_fkey"
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
      nexus_calibration_stats: {
        Row: {
          avg_cognitive: number | null
          avg_resonant: number | null
          calibration_count: number | null
          dominant_pattern: string | null
          insufficient_count: number | null
          negable_count: number | null
          node_id: string | null
          node_name: string | null
          project_id: string | null
          robust_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_diversity_analysis: {
        Row: {
          green_count: number | null
          node_count: number | null
          percentage: number | null
          project_id: string | null
          purple_count: number | null
          red_count: number | null
          region_emoji: string | null
          region_id: string | null
          region_name: string | null
          white_count: number | null
          yellow_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_nodes_with_tags: {
        Row: {
          anomaly_description: string | null
          anomaly_level: string | null
          citation: string | null
          counter_narrative: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_precision: string | null
          description: string | null
          emoji: string | null
          foundational_label: string | null
          id: string | null
          is_foundational: boolean | null
          latitude: number | null
          longitude: number | null
          maturity: string | null
          maturity_reason: string | null
          name: string | null
          node_type: string | null
          official_narrative: string | null
          project_id: string | null
          region_emoji: string | null
          region_id: string | null
          region_name: string | null
          search_vector: unknown
          slug: string | null
          source_url: string | null
          subtitle: string | null
          tag_names: string[] | null
          tag_slugs: string[] | null
          torsion_angle: number | null
          torsion_note: string | null
          updated_at: string | null
          year_end: number | null
          year_start: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_nodes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "nexus_diversity_analysis"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "nexus_nodes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "nexus_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_timeline: {
        Row: {
          emoji: string | null
          foundational_label: string | null
          is_foundational: boolean | null
          maturity: string | null
          name: string | null
          node_id: string | null
          node_type: string | null
          project_id: string | null
          region_color: string | null
          region_emoji: string | null
          region_id: string | null
          region_name: string | null
          torsion_angle: number | null
          year_end: number | null
          year_start: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nexus_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_nodes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "nexus_diversity_analysis"
            referencedColumns: ["region_id"]
          },
          {
            foreignKeyName: "nexus_nodes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "nexus_regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_article_status_from_dimensions: {
        Args: { p_article_batch_item_id: string }
        Returns: Database["public"]["Enums"]["batch_preclass_status"]
      }
      cgt_artefactos_por_concepto: {
        Args: { p_concepto_id: string }
        Returns: {
          artefacto_id: string
          mencion_id: string
          nombre_canonico_actual: string
          primera_aparicion: string
        }[]
      }
      cgt_artefactos_por_disciplina: {
        Args: { p_disciplina_id: string }
        Returns: {
          artefacto_id: string
          mencion_id: string
          nombre_canonico_actual: string
          primera_aparicion: string
        }[]
      }
      cgt_artefactos_por_pensador: {
        Args: { p_pensador_id: string }
        Returns: {
          artefacto_id: string
          mencion_id: string
          nombre_canonico_actual: string
          primera_aparicion: string
        }[]
      }
      cgt_artefactos_por_referencia: {
        Args: { p_referencia_id: string }
        Returns: {
          apariciones_count: number
          artefacto_id: string
          formato_cita_inline: string
          numero_en_artefacto: number
          primera_aparicion: string
          puente_id: string
        }[]
      }
      cgt_artefactos_por_teoria: {
        Args: { p_teoria_id: string }
        Returns: {
          artefacto_id: string
          mencion_id: string
          nombre_canonico_actual: string
          primera_aparicion: string
        }[]
      }
      cgt_borrar_artefacto_completo: {
        Args: { p_artefacto_id: string }
        Returns: undefined
      }
      cgt_contar_artefactos_referencia: {
        Args: { p_referencia_id: string }
        Returns: number
      }
      cgt_contar_menciones_concepto: {
        Args: { p_concepto_id: string }
        Returns: number
      }
      cgt_contar_menciones_disciplina: {
        Args: { p_disciplina_id: string }
        Returns: number
      }
      cgt_contar_menciones_pensador: {
        Args: { p_pensador_id: string }
        Returns: number
      }
      cgt_contar_menciones_teoria: {
        Args: { p_teoria_id: string }
        Returns: number
      }
      cgt_referencias_por_artefacto: {
        Args: { p_artefacto_id: string }
        Returns: {
          ano: string
          apariciones: Json
          artefactos_count: number
          autores: Json
          confianza_extraccion: number
          doi: string
          formato_cita_inline: string
          fuente: string
          notas_extractor: string
          numero_en_artefacto: number
          puente_id: string
          referencia_id: string
          tipo_referencia: Database["public"]["Enums"]["cgt_tipo_referencia"]
          titulo: string
          url: string
        }[]
      }
      get_all_project_batches: {
        Args: { p_project_id: string }
        Returns: {
          article_counts: Json
          assigned_to: string
          batch_number: number
          id: string
          name: string
          status: Database["public"]["Enums"]["batch_preclass_status"]
        }[]
      }
      get_all_project_batches_v2: {
        Args: { p_project_id: string }
        Returns: {
          article_counts: Json
          assigned_to: string
          batch_number: number
          id: string
          name: string
          status: Database["public"]["Enums"]["batch_preclass_status"]
        }[]
      }
      get_all_project_batches_v3: {
        Args: { p_project_id: string }
        Returns: {
          article_counts: Json
          assigned_to: string
          batch_number: number
          id: string
          name: string
          status: Database["public"]["Enums"]["batch_preclass_status"]
        }[]
      }
      get_all_project_batches_v4: {
        Args: { p_project_id: string }
        Returns: {
          article_counts: Json
          assigned_to: string
          batch_number: number
          id: string
          name: string
          phase_id: string
          status: Database["public"]["Enums"]["batch_preclass_status"]
        }[]
      }
      get_artifact_derivatives: {
        Args: { artifact_uuid: string }
        Returns: {
          artifact_title: string
          artifact_type: string
          created_at: string
          derived_id: string
          relation_type: string
        }[]
      }
      get_artifact_family_tree: {
        Args: { artifact_uuid: string }
        Returns: {
          artifact_id: string
          artifact_title: string
          artifact_type: string
          depth: number
          relation_type: string
        }[]
      }
      get_artifact_progress: { Args: { artifact_uuid: string }; Returns: Json }
      get_artifact_source: {
        Args: { artifact_uuid: string }
        Returns: {
          artifact_title: string
          artifact_type: string
          created_at: string
          relation_type: string
          source_id: string
        }[]
      }
      get_current_auth_context: {
        Args: never
        Returns: {
          current_role: string
          current_uid: string
        }[]
      }
      get_current_essay_version: {
        Args: { p_artifact_id: string }
        Returns: {
          created_at: string
          edit_type: string
          edited_by: string
          essay_content: string
          is_manual_edit: boolean
          version_number: number
        }[]
      }
      get_essay_version_history: {
        Args: { p_artifact_id: string }
        Returns: {
          changes_summary: string
          character_count: number
          created_at: string
          edit_reason: string
          edit_type: string
          edited_by: string
          editor_email: string
          version_number: number
        }[]
      }
      get_minotauro_universe_full: {
        Args: { p_universe_id: string }
        Returns: Json
      }
      get_paragraph_curated_sources_with_details: {
        Args: { p_paragraph_id: string }
        Returns: Json
      }
      get_paragraph_version_history: {
        Args: { p_paragraph_id: string }
        Returns: Json
      }
      get_user_by_email: { Args: { user_email: string }; Returns: string }
      has_permission_in_project: {
        Args: {
          p_permission_column: string
          p_project_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_batch_closed: {
        Args: { p_batch_id: string }
        Returns: {
          finalizedDimensions: number
          isClosed: boolean
          percentFinalized: number
          totalDimensions: number
        }[]
      }
      is_platform_admin: { Args: never; Returns: boolean }
      nexus_user_has_permission: {
        Args: { p_permission: string; p_project_id: string }
        Returns: boolean
      }
      nexus_user_has_project_access: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      archetype_tone: "bufon" | "auditor" | "editor" | "colega"
      batch_preclass_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "validated"
        | "rejected"
        | "disputed"
        | "reconciled"
        | "reconciliation_pending"
        | "review_pending"
        | "translated"
      batch_status:
        | "ai_prefilled"
        | "completed"
        | "discrepancies"
        | "in_progress"
        | "pending"
      cgt_decision_cartografiador:
        | "match_existente"
        | "nueva_entidad"
        | "ambigua"
        | "sin_cartografiar"
      cgt_estado_metabolizacion:
        | "ingresado"
        | "metabolizando"
        | "metabolizado"
        | "error"
      cgt_origen: "llm" | "humano" | "nodo" | "sistema"
      cgt_tipo_artefacto:
        | "audio"
        | "pdf_slides"
        | "pdf_informe"
        | "markdown"
        | "video"
        | "imagen"
      cgt_tipo_cita: "academica" | "hecho_historico" | "obra" | "otra"
      cgt_tipo_referencia:
        | "paper"
        | "libro"
        | "web"
        | "dataset"
        | "video"
        | "norma_legal"
        | "reporte"
        | "otro"
        | "desconocido"
      cgt_visibilidad: "privado" | "proyecto"
      cog_artifact_type:
        | "video"
        | "audio"
        | "document"
        | "image"
        | "other"
        | "markdown"
        | "pdf_report"
        | "pdf_slides"
      cog_processing_status:
        | "pending"
        | "uploading"
        | "transcribing"
        | "analyzing"
        | "completed"
        | "error"
      dimension_status: "active" | "inactive" | "archived"
      dimension_type:
        | "binary"
        | "categorical"
        | "text"
        | "scale"
        | "finite"
        | "open"
      group_visibility: "private" | "project" | "public"
      hope_memory_type: "Slow" | "Fast" | "Mixed"
      job_status: "pending" | "processing" | "completed" | "failed" | "running"
      job_type:
        | "import_articles"
        | "generate_embeddings"
        | "preclassification"
        | "batch_processing"
        | "PRECLASSIFICATION"
        | "RECONCILIATION"
        | "TRANSLATION"
        | "cognetica_metabolizacion"
      note_visibility: "private" | "project" | "public"
      paragraph_status:
        | "draft"
        | "ai_processing"
        | "ai_proposal"
        | "human_review"
        | "accepted"
        | "rejected"
        | "final"
      preclassification_phase_status:
        | "planning"
        | "active"
        | "completed"
        | "archived"
        | "annulled"
        | "inactive"
      system_type: "F0-SlowMemory" | "F1-FastMemory" | "Mixto"
      tdc_color: "green" | "yellow" | "red"
      tdc_status: "coherent" | "broken"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      archetype_tone: ["bufon", "auditor", "editor", "colega"],
      batch_preclass_status: [
        "pending",
        "in_progress",
        "completed",
        "validated",
        "rejected",
        "disputed",
        "reconciled",
        "reconciliation_pending",
        "review_pending",
        "translated",
      ],
      batch_status: [
        "ai_prefilled",
        "completed",
        "discrepancies",
        "in_progress",
        "pending",
      ],
      cgt_decision_cartografiador: [
        "match_existente",
        "nueva_entidad",
        "ambigua",
        "sin_cartografiar",
      ],
      cgt_estado_metabolizacion: [
        "ingresado",
        "metabolizando",
        "metabolizado",
        "error",
      ],
      cgt_origen: ["llm", "humano", "nodo", "sistema"],
      cgt_tipo_artefacto: [
        "audio",
        "pdf_slides",
        "pdf_informe",
        "markdown",
        "video",
        "imagen",
      ],
      cgt_tipo_cita: ["academica", "hecho_historico", "obra", "otra"],
      cgt_tipo_referencia: [
        "paper",
        "libro",
        "web",
        "dataset",
        "video",
        "norma_legal",
        "reporte",
        "otro",
        "desconocido",
      ],
      cgt_visibilidad: ["privado", "proyecto"],
      cog_artifact_type: [
        "video",
        "audio",
        "document",
        "image",
        "other",
        "markdown",
        "pdf_report",
        "pdf_slides",
      ],
      cog_processing_status: [
        "pending",
        "uploading",
        "transcribing",
        "analyzing",
        "completed",
        "error",
      ],
      dimension_status: ["active", "inactive", "archived"],
      dimension_type: [
        "binary",
        "categorical",
        "text",
        "scale",
        "finite",
        "open",
      ],
      group_visibility: ["private", "project", "public"],
      hope_memory_type: ["Slow", "Fast", "Mixed"],
      job_status: ["pending", "processing", "completed", "failed", "running"],
      job_type: [
        "import_articles",
        "generate_embeddings",
        "preclassification",
        "batch_processing",
        "PRECLASSIFICATION",
        "RECONCILIATION",
        "TRANSLATION",
        "cognetica_metabolizacion",
      ],
      note_visibility: ["private", "project", "public"],
      paragraph_status: [
        "draft",
        "ai_processing",
        "ai_proposal",
        "human_review",
        "accepted",
        "rejected",
        "final",
      ],
      preclassification_phase_status: [
        "planning",
        "active",
        "completed",
        "archived",
        "annulled",
        "inactive",
      ],
      system_type: ["F0-SlowMemory", "F1-FastMemory", "Mixto"],
      tdc_color: ["green", "yellow", "red"],
      tdc_status: ["coherent", "broken"],
    },
  },
} as const
