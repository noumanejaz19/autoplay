// Supabase type definitions for Autoplay
// Updated to include all feature additions from migration 003

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          email: string;
          role: "admin" | "user";
          job_title: string | null;
          department: string | null;
          profile_photo_url: string | null;
          phone: string | null;
          timezone: string;
          location: string | null;
          bio: string | null;
          skills: string[];
          years_experience: number;
          certifications: string[];
          linkedin_url: string | null;
          portfolio_url: string | null;
          availability_status: "Available" | "Busy" | "Away" | "On Leave";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          company_name: string;
          contact_person_name: string;
          contact_email: string | null;
          contact_phone: string | null;
          whatsapp: string | null;
          timezone: string | null;
          preferred_channel: "WhatsApp" | "Email" | "Slack" | "Telegram" | "Zoom" | "Phone";
          industry: string | null;
          website: string | null;
          project_owner_id: string | null;
          priority: "Low" | "Medium" | "High" | "Urgent";
          status: "Upcoming" | "In The Talk" | "Prioritized" | "Active" | "Closed" | "Completed" | "Archived";
          health_status: "Healthy" | "At Risk" | "Blocked" | "Completed" | "Good";
          internal_notes: string | null;
          drive_folder_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          client_id: string | null;
          project_name: string;
          description: string | null;
          project_type: string | null;
          start_date: string | null;
          expected_due_date: string | null;
          actual_completion_date: string | null;
          status: string;
          priority: "Low" | "Medium" | "High" | "Urgent";
          progress_percentage: number;
          project_manager_id: string | null;
          estimated_hours: number | null;
          budget: number | null;
          tags: string[];
          internal_notes: string | null;
          overdue_reason: string | null;
          employee_category: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          project_role: string;
          assigned_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_members"]["Row"], "id" | "assigned_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["project_members"]["Row"]>;
        Relationships: [];
      };
      project_documents: {
        Row: {
          id: string;
          project_id: string;
          section_type: "setup_requirements" | "what_is_needed" | "plans" | "overdeliver";
          notes: string | null;
          link_url: string | null;
          link_title: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_documents"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["project_documents"]["Row"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string | null;
          client_id: string | null;
          title: string;
          description: string | null;
          assigned_to: string | null;
          created_by: string | null;
          status: string;
          priority: "Low" | "Medium" | "High" | "Critical";
          due_date: string | null;
          estimated_hours: number | null;
          client_visible: boolean;
          internal_only: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
        Relationships: [];
      };
      time_logs: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          project_id: string | null;
          task_id: string | null;
          work_date: string;
          hours: number;
          work_description: string | null;
          category: string;
          billable: boolean;
          approved: boolean;
          approved_by: string | null;
          recording_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["time_logs"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["time_logs"]["Row"]>;
        Relationships: [];
      };
      client_assets: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          asset_type: string;
          file_url: string | null;
          external_url: string | null;
          uploaded_by: string | null;
          provided_by_client: boolean;
          visibility: "Internal" | "Project Team" | "Client-visible";
          is_pinned: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["client_assets"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["client_assets"]["Row"]>;
        Relationships: [];
      };
      access_items: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          service_name: string;
          category: string;
          access_status: string;
          responsible_user_id: string | null;
          secure_location_ref: string | null;
          login_email: string | null;
          access_notes: string | null;
          action_required: string | null;
          last_tested_date: string | null;
          priority: "Low" | "Medium" | "High" | "Critical";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["access_items"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["access_items"]["Row"]>;
        Relationships: [];
      };
      blockers: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          related_task_id: string | null;
          related_access_id: string | null;
          title: string;
          description: string | null;
          needed_from: "Client" | "Team" | "Vendor" | "Technical";
          impact: "Low" | "Medium" | "High" | "Critical";
          status: "Open" | "In Progress" | "Asked Client" | "Resolved" | "Escalated";
          responsible_user_id: string | null;
          requested_date: string;
          follow_up_date: string | null;
          resolved_at: string | null;
          resolution_notes: string | null;
          asked_client_at: string | null;
          asked_client_message: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["blockers"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["blockers"]["Row"]>;
        Relationships: [];
      };
      deliverables: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          deliverable_type: string;
          status: "Draft" | "Ready" | "Sent" | "Approved" | "Needs Revision";
          file_url: string | null;
          external_url: string | null;
          created_by: string | null;
          sent_date: string | null;
          approved_date: string | null;
          client_visible: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deliverables"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["deliverables"]["Row"]>;
        Relationships: [];
      };
      approvals: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          related_deliverable_id: string | null;
          approval_type: string;
          title: string;
          description: string | null;
          status: string;
          submitted_by: string | null;
          approved_by: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["approvals"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["approvals"]["Row"]>;
        Relationships: [];
      };
      timeline_entries: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          created_by: string | null;
          entry_type: string;
          title: string;
          description: string | null;
          related_task_id: string | null;
          related_asset_id: string | null;
          related_deliverable_id: string | null;
          visibility: "Internal" | "Project Team" | "Client-visible";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["timeline_entries"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["timeline_entries"]["Row"]>;
        Relationships: [];
      };
      client_updates: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          posted_by: string | null;
          content: string;
          update_type: "general" | "progress" | "blocker" | "milestone" | "note";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["client_updates"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["client_updates"]["Row"]>;
        Relationships: [];
      };
      user_permissions: {
        Row: {
          id: string;
          profile_id: string;
          allowed_client_ids: string[];
          can_view_all_clients: boolean;
          can_view_time_logs: boolean;
          can_view_reports: boolean;
          can_post_updates: boolean;
          can_manage_assets: boolean;
          can_manage_tasks: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_permissions"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["user_permissions"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string | null;
          type: "info" | "success" | "warning" | "error" | "task" | "blocker" | "approval";
          related_entity_type: string | null;
          related_entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at"> & { id?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile_id: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_project_member: { Args: { p_project_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type ProjectDocument = Database["public"]["Tables"]["project_documents"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TimeLog = Database["public"]["Tables"]["time_logs"]["Row"];
export type ClientAsset = Database["public"]["Tables"]["client_assets"]["Row"];
export type AccessItem = Database["public"]["Tables"]["access_items"]["Row"];
export type Blocker = Database["public"]["Tables"]["blockers"]["Row"];
export type Deliverable = Database["public"]["Tables"]["deliverables"]["Row"];
export type Approval = Database["public"]["Tables"]["approvals"]["Row"];
export type TimelineEntry = Database["public"]["Tables"]["timeline_entries"]["Row"];
export type ClientUpdate = Database["public"]["Tables"]["client_updates"]["Row"];
export type UserPermission = Database["public"]["Tables"]["user_permissions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// Insert types
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectDocumentInsert = Database["public"]["Tables"]["project_documents"]["Insert"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TimeLogInsert = Database["public"]["Tables"]["time_logs"]["Insert"];
export type ClientAssetInsert = Database["public"]["Tables"]["client_assets"]["Insert"];
export type AccessItemInsert = Database["public"]["Tables"]["access_items"]["Insert"];
export type BlockerInsert = Database["public"]["Tables"]["blockers"]["Insert"];
export type DeliverableInsert = Database["public"]["Tables"]["deliverables"]["Insert"];
export type ApprovalInsert = Database["public"]["Tables"]["approvals"]["Insert"];
export type TimelineEntryInsert = Database["public"]["Tables"]["timeline_entries"]["Insert"];
export type ClientUpdateInsert = Database["public"]["Tables"]["client_updates"]["Insert"];
export type UserPermissionInsert = Database["public"]["Tables"]["user_permissions"]["Insert"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
