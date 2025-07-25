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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_courses: {
        Row: {
          content_md: string | null
          created_at: string
          description: string | null
          duration: string | null
          id: string
          image_url: string | null
          level: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content_md?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          level?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          level?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_exercises: {
        Row: {
          course_id: string | null
          created_at: string
          difficulty: number | null
          id: string
          question_md: string
          solution_md: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          difficulty?: number | null
          id?: string
          question_md: string
          solution_md?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          difficulty?: number | null
          id?: string
          question_md?: string
          solution_md?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_exercises_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notebooks: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          linked_course_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          linked_course_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          linked_course_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notebooks_linked_course_id_fkey"
            columns: ["linked_course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignations: {
        Row: {
          code_module: string
          created_at: string
          date_creneau: string
          id: string
          mois: number
          referent_id: string
          updated_at: string
        }
        Insert: {
          code_module: string
          created_at?: string
          date_creneau: string
          id?: string
          mois: number
          referent_id: string
          updated_at?: string
        }
        Update: {
          code_module?: string
          created_at?: string
          date_creneau?: string
          id?: string
          mois?: number
          referent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignations_referent_id_fkey"
            columns: ["referent_id"]
            isOneToOne: false
            referencedRelation: "referents"
            referencedColumns: ["id"]
          },
        ]
      }
      Courses: {
        Row: {
          description: string | null
          duration: string | null
          image: string | null
          level: string | null
          locked: boolean | null
          path: string | null
          title: string
          topics: string[] | null
        }
        Insert: {
          description?: string | null
          duration?: string | null
          image?: string | null
          level?: string | null
          locked?: boolean | null
          path?: string | null
          title?: string
          topics?: string[] | null
        }
        Update: {
          description?: string | null
          duration?: string | null
          image?: string | null
          level?: string | null
          locked?: boolean | null
          path?: string | null
          title?: string
          topics?: string[] | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: []
      }
      documentsfin: {
        Row: {
          chapter: string | null
          content: string | null
          embedding: string | null
          lang: string | null
          niveau: string | null
          page: number | null
          source: string | null
          theme: string | null
          type: string | null
          uid: string
        }
        Insert: {
          chapter?: string | null
          content?: string | null
          embedding?: string | null
          lang?: string | null
          niveau?: string | null
          page?: number | null
          source?: string | null
          theme?: string | null
          type?: string | null
          uid: string
        }
        Update: {
          chapter?: string | null
          content?: string | null
          embedding?: string | null
          lang?: string | null
          niveau?: string | null
          page?: number | null
          source?: string | null
          theme?: string | null
          type?: string | null
          uid?: string
        }
        Relationships: []
      }
      formations: {
        Row: {
          code_formation: string
          created_at: string
          date_debut: string
          date_fin: string
          id: string
          n_convention: string | null
          updated_at: string
        }
        Insert: {
          code_formation: string
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          n_convention?: string | null
          updated_at?: string
        }
        Update: {
          code_formation?: string
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          n_convention?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lieux: {
        Row: {
          code_lieu: string
          created_at: string
          id: string
          nom_lieu: string
          updated_at: string
        }
        Insert: {
          code_lieu: string
          created_at?: string
          id?: string
          nom_lieu: string
          updated_at?: string
        }
        Update: {
          code_lieu?: string
          created_at?: string
          id?: string
          nom_lieu?: string
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          code_module: string
          created_at: string
          duree_total_module: number
          formation_id: string | null
          id: string
          nom_module: string
          updated_at: string
        }
        Insert: {
          code_module: string
          created_at?: string
          duree_total_module: number
          formation_id?: string | null
          id?: string
          nom_module: string
          updated_at?: string
        }
        Update: {
          code_module?: string
          created_at?: string
          duree_total_module?: number
          formation_id?: string | null
          id?: string
          nom_module?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          date_inscription: string
          email: string
          id: string
          nom: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          prenom: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          date_inscription?: string
          email: string
          id: string
          nom?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          prenom?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          date_inscription?: string
          email?: string
          id?: string
          nom?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          prenom?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string
          created_at: string | null
          difficulty: number | null
          explanation: string | null
          id: string
          on_wrong_answer: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          difficulty?: number | null
          explanation?: string | null
          id?: string
          on_wrong_answer?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          difficulty?: number | null
          explanation?: string | null
          id?: string
          on_wrong_answer?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
        }
        Relationships: []
      }
      referents: {
        Row: {
          code_ref: string
          created_at: string
          id: string
          nom: string
          prenom: string
          tel: string | null
          updated_at: string
        }
        Insert: {
          code_ref: string
          created_at?: string
          id?: string
          nom: string
          prenom: string
          tel?: string | null
          updated_at?: string
        }
        Update: {
          code_ref?: string
          created_at?: string
          id?: string
          nom?: string
          prenom?: string
          tel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referents_dispos: {
        Row: {
          am: boolean
          code_session: string
          created_at: string
          date_creneau: string
          id: string
          pm: boolean
          referent_id: string
          updated_at: string
        }
        Insert: {
          am?: boolean
          code_session: string
          created_at?: string
          date_creneau: string
          id?: string
          pm?: boolean
          referent_id: string
          updated_at?: string
        }
        Update: {
          am?: boolean
          code_session?: string
          created_at?: string
          date_creneau?: string
          id?: string
          pm?: boolean
          referent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referents_dispos_referent_id_fkey"
            columns: ["referent_id"]
            isOneToOne: false
            referencedRelation: "referents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          details: Json | null
          id: string
          module_path: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          module_path?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          module_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { embedding_input: string; match_count?: number }
        Returns: {
          content: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_plan: "freemium" | "basic" | "pro" | "admin"
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
      app_role: ["admin", "moderator", "user"],
      user_plan: ["freemium", "basic", "pro", "admin"],
    },
  },
} as const
