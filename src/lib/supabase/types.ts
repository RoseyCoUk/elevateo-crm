// Hand-written types matching supabase/migrations/0001_init.sql.
// If the schema drifts, regenerate with `supabase gen types typescript`.

export type DivisionCode = 'sales' | 'marketing' | 'technology' | 'ecommerce' | 'admin';
export type UserRole = 'owner' | 'executive' | 'lead' | 'member' | 'reservist' | 'external';
export type ClientStatus = 'prospect' | 'active' | 'paused' | 'archived';
export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'review'
  | 'on_hold'
  | 'completed'
  | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review_pending'
  | 'approved'
  | 'rejected'
  | 'done';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType =
  | 'task_assigned'
  | 'task_mentioned'
  | 'task_review_requested'
  | 'task_approved'
  | 'task_rejected'
  | 'comment_reply'
  | 'project_assigned'
  | 'approval_pending'
  | 'announcement'
  | 'chat_mention';
export type ChatRoomKind = 'division' | 'dm' | 'group';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author_id: string | null;
  pinned: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  sort_index: number;
  is_active: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_on: string;
  created_at: string;
}

export interface Division {
  id: string;
  code: DivisionCode;
  name: string;
  description: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  skin_tone: string | null;
  timezone: string | null;
  bio: string | null;
  nationality: string | null;
  supports: string | null;
  last_seen_at: string | null;
  /** Manual override: 'online' | 'away' | 'dnd' | null (null = auto). */
  presence_status: string | null;
  cold_call_goal: number;
  /** Primary division — drives sidebar / default filtering / division lists. */
  division_id: string | null;
  /** Full set of divisions this person works across (includes the primary). */
  divisions: DivisionCode[];
  manager_id: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  primary_division_id: string | null;
  account_lead_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string | null;
  division_id: string | null;
  lead_id: string | null;
  title: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientMember {
  client_id: string;
  user_id: string;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  reviewer_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  blocked_by: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string | null;
  body: string;
  mentions: string[];
  created_at: string;
}

export interface Approval {
  id: string;
  task_id: string;
  requested_by: string | null;
  reviewer_id: string;
  status: ApprovalStatus;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  task_id: string | null;
  project_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  action: string;
  diff: Record<string, unknown> | null;
  created_at: string;
}

export interface FileRow {
  id: string;
  client_id: string | null;
  project_id: string | null;
  task_id: string | null;
  storage_path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  kind: ChatRoomKind;
  division_id: string | null;
  user_a_id: string | null;
  user_b_id: string | null;
  name: string | null;
  created_at: string;
}

export interface ChatRoomMember {
  room_id: string;
  user_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  author_id: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
}

export interface ChatReadState {
  user_id: string;
  room_id: string;
  last_read_at: string;
}

// Generic Database shape for createServerClient<Database>().
export interface Database {
  public: {
    Tables: {
      divisions: { Row: Division; Insert: Partial<Division>; Update: Partial<Division> };
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      client_members: {
        Row: ClientMember;
        Insert: Partial<ClientMember>;
        Update: Partial<ClientMember>;
      };
      project_members: {
        Row: ProjectMember;
        Insert: Partial<ProjectMember>;
        Update: Partial<ProjectMember>;
      };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      task_comments: {
        Row: TaskComment;
        Insert: Partial<TaskComment>;
        Update: Partial<TaskComment>;
      };
      approvals: { Row: Approval; Insert: Partial<Approval>; Update: Partial<Approval> };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
      };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: Partial<ActivityLogEntry>;
        Update: Partial<ActivityLogEntry>;
      };
      files: { Row: FileRow; Insert: Partial<FileRow>; Update: Partial<FileRow> };
      chat_rooms: { Row: ChatRoom; Insert: Partial<ChatRoom>; Update: Partial<ChatRoom> };
      chat_room_members: {
        Row: ChatRoomMember;
        Insert: Partial<ChatRoomMember>;
        Update: Partial<ChatRoomMember>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Partial<ChatMessage>;
        Update: Partial<ChatMessage>;
      };
      chat_read_state: {
        Row: ChatReadState;
        Insert: Partial<ChatReadState>;
        Update: Partial<ChatReadState>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      in_division: { Args: { div_id: string }; Returns: boolean };
      manages_user: { Args: { target_user: string }; Returns: boolean };
      my_role: { Args: Record<string, never>; Returns: UserRole };
    };
    Enums: {
      division_code: DivisionCode;
      user_role: UserRole;
      client_status: ClientStatus;
      project_status: ProjectStatus;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      approval_status: ApprovalStatus;
      notification_type: NotificationType;
    };
  };
}
