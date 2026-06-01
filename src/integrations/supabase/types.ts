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
      branches: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      exam_events: {
        Row: {
          branch: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string | null
          id: string
          link: string | null
          semester: string | null
          title: string
          type: Database["public"]["Enums"]["exam_event_type"]
        }
        Insert: {
          branch?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          link?: string | null
          semester?: string | null
          title: string
          type: Database["public"]["Enums"]["exam_event_type"]
        }
        Update: {
          branch?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          link?: string | null
          semester?: string | null
          title?: string
          type?: Database["public"]["Enums"]["exam_event_type"]
        }
        Relationships: []
      }
      note_downloads: {
        Row: {
          downloaded_at: string
          id: string
          note_id: string
          user_id: string | null
        }
        Insert: {
          downloaded_at?: string
          id?: string
          note_id: string
          user_id?: string | null
        }
        Update: {
          downloaded_at?: string
          id?: string
          note_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_downloads_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          branch: string
          created_at: string
          description: string | null
          downloads: number
          file_size_kb: number | null
          id: string
          is_hot: boolean
          material_type: Database["public"]["Enums"]["material_type"]
          pdf_path: string | null
          pdf_url: string | null
          semester: string
          subject: string
          subject_id: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          branch: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_size_kb?: number | null
          id?: string
          is_hot?: boolean
          material_type?: Database["public"]["Enums"]["material_type"]
          pdf_path?: string | null
          pdf_url?: string | null
          semester: string
          subject: string
          subject_id?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          branch?: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_size_kb?: number | null
          id?: string
          is_hot?: boolean
          material_type?: Database["public"]["Enums"]["material_type"]
          pdf_path?: string | null
          pdf_url?: string | null
          semester?: string
          subject?: string
          subject_id?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          post_id: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          post_id: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          post_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          anonymous: boolean
          author_id: string
          comments_count: number
          created_at: string
          id: string
          likes_count: number
          tab: Database["public"]["Enums"]["post_tab"]
          text: string
        }
        Insert: {
          anonymous?: boolean
          author_id: string
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          tab?: Database["public"]["Enums"]["post_tab"]
          text: string
        }
        Update: {
          anonymous?: boolean
          author_id?: string
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          tab?: Database["public"]["Enums"]["post_tab"]
          text?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch: string | null
          created_at: string
          full_name: string | null
          id: string
          semester: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          semester?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          semester?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_notes: {
        Row: {
          created_at: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          branch: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          branch?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          branch?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      subjects: {
        Row: {
          branch: string
          created_at: string
          id: string
          name: string
          semester: string
          sort_order: number
        }
        Insert: {
          branch: string
          created_at?: string
          id?: string
          name: string
          semester: string
          sort_order?: number
        }
        Update: {
          branch?: string
          created_at?: string
          id?: string
          name?: string
          semester?: string
          sort_order?: number
        }
        Relationships: []
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
      app_role: "admin" | "user"
      exam_event_type: "timetable" | "notice" | "important_date" | "result"
      material_type:
        | "notes"
        | "pyqs"
        | "assignments"
        | "syllabus"
        | "important_questions"
        | "lab_manuals"
      post_tab: "Feed" | "Doubts" | "Internships" | "Confessions"
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
      app_role: ["admin", "user"],
      exam_event_type: ["timetable", "notice", "important_date", "result"],
      material_type: [
        "notes",
        "pyqs",
        "assignments",
        "syllabus",
        "important_questions",
        "lab_manuals",
      ],
      post_tab: ["Feed", "Doubts", "Internships", "Confessions"],
    },
  },
} as const
