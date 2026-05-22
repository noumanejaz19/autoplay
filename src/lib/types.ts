export type ClientStatus = "Active" | "Paused" | "Completed" | "At Risk" | "Onboarding";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type HealthScore = "Healthy" | "At Risk" | "Critical" | "Good";
export type WaitingOn = "Client" | "Team" | "Vendor" | "None";

export interface Client {
  id: string;
  name: string;
  company: string;
  avatar?: string;
  initials: string;
  color: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  preferredChannel: "WhatsApp" | "Email" | "Slack" | "Telegram" | "Zoom";
  timezone: string;
  projectType: string;
  assignedOwner: string;
  assignedTeam: string[];
  status: ClientStatus;
  healthScore: HealthScore;
  priority: Priority;
  lastActivity: string;
  openBlockers: number;
  totalHoursSpent: number;
  projectStage: string;
  progress: number;
  latestUpdate: string;
  completedItems: string[];
  pendingItems: string[];
  blockingItems: string[];
  neededFromClient: string[];
  pinnedLinks: { title: string; url: string; type: string }[];
  contractStart: string;
  contractEnd?: string;
  revenue?: number;
  notes?: string;
}

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled";
export type ProjectPhase =
  | "Discovery"
  | "Access Collection"
  | "Setup"
  | "Development"
  | "Testing"
  | "Client Review"
  | "Deployment"
  | "Handover"
  | "Maintenance";

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  description: string;
  projectType: string;
  startDate: string;
  dueDate: string;
  currentPhase: ProjectPhase;
  status: ProjectStatus;
  progress: number;
  assignedTeam: string[];
  milestones: Milestone[];
  timeSpent: number;
  estimatedHours: number;
  internalNotes?: string;
  tags: string[];
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export type TaskStatus =
  | "Backlog"
  | "To Do"
  | "In Progress"
  | "Waiting on Client"
  | "Waiting on Internal Review"
  | "Testing"
  | "Completed"
  | "Blocked";

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  assignedPerson: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  estimatedHours: number;
  loggedHours: number;
  tags: string[];
  isInternal: boolean;
  isClientVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  color: string;
  role: string;
  department: string;
  skills: string[];
  bio: string;
  yearsOfExperience: number;
  activeClients: string[];
  activeTasks: number;
  weeklyHoursLogged: number;
  availabilityStatus: "Available" | "Busy" | "Away" | "On Leave";
  strengths: string[];
  location: string;
  timezone: string;
  certifications: string[];
  featuredProjects: string[];
  email: string;
  linkedin?: string;
  github?: string;
}

export type TimeCategory =
  | "Development"
  | "Research"
  | "Deployment"
  | "Communication"
  | "Testing"
  | "Documentation"
  | "Meeting"
  | "Support"
  | "Design"
  | "Planning";

export interface TimeLog {
  id: string;
  teamMemberId: string;
  teamMemberName: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  approved: boolean;
  category: TimeCategory;
}

export type AssetType =
  | "Google Drive"
  | "Google Sheet"
  | "Google Doc"
  | "Loom"
  | "PDF"
  | "Image"
  | "API Docs"
  | "Brand Assets"
  | "Video"
  | "Document"
  | "Transcript"
  | "Contract"
  | "Other";

export interface Asset {
  id: string;
  title: string;
  type: AssetType;
  url: string;
  providedBy: string;
  dateAdded: string;
  tags: string[];
  visibility: "Internal" | "Client-visible";
  notes?: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  taskId?: string;
  isPinned: boolean;
}

export type AccessStatus =
  | "Pending"
  | "Received"
  | "Configured"
  | "Tested"
  | "Not Working"
  | "Need Client Action"
  | "Revoked";

export interface AccessItem {
  id: string;
  serviceName: string;
  category: string;
  status: AccessStatus;
  owner: string;
  lastTested?: string;
  notes?: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  secureLocation: string;
  actionRequired?: string;
  priority: Priority;
}

export type BlockerStatus = "Open" | "In Progress" | "Resolved" | "Escalated";
export type BlockerImpact = "Low" | "Medium" | "High" | "Critical";
export type BlockerNeededFrom = "Client" | "Team" | "Vendor" | "Technical";

export interface Blocker {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  whatIsBlocked: string;
  whatWeNeed: string;
  neededFrom: BlockerNeededFrom;
  requestedDate: string;
  followUpDate: string;
  status: BlockerStatus;
  impact: BlockerImpact;
  owner: string;
  notes?: string;
  relatedAccessId?: string;
  relatedAssetId?: string;
}

export type DeliverableStatus = "Draft" | "Ready" | "Sent" | "Approved" | "Needs Revision";
export type DeliverableType =
  | "Report"
  | "CSV"
  | "Dashboard"
  | "Deployed URL"
  | "Demo Video"
  | "GitHub PR"
  | "Documentation"
  | "Testing Results"
  | "Handover Docs"
  | "Client Update"
  | "Other";

export interface Deliverable {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  type: DeliverableType;
  status: DeliverableStatus;
  link?: string;
  sentDate?: string;
  approvedDate?: string;
  notes?: string;
  relatedMilestone?: string;
  createdAt: string;
}

export type ApprovalStatus =
  | "Not Submitted"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Changes Requested";

export interface Approval {
  id: string;
  title: string;
  type: string;
  clientId: string;
  clientName: string;
  projectId: string;
  status: ApprovalStatus;
  submittedDate?: string;
  resolvedDate?: string;
  notes?: string;
  requestedBy: string;
}

export type TimelineEntryType =
  | "client_request"
  | "internal_note"
  | "meeting_note"
  | "decision"
  | "follow_up"
  | "delivered"
  | "blocker_update"
  | "access_update"
  | "ai_summary"
  | "status_change";

export interface TimelineEntry {
  id: string;
  clientId: string;
  type: TimelineEntryType;
  person: string;
  date: string;
  description: string;
  projectId?: string;
  taskId?: string;
  links?: string[];
  visibility: "Internal" | "Client-visible";
}

export interface AISummary {
  id: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  type:
    | "client_update"
    | "weekly_report"
    | "project_summary"
    | "blocker_analysis"
    | "handover_notes"
    | "client_message"
    | "daily_summary"
    | "needs_from_client"
    | "manager_summary";
  content: string;
  generatedAt: string;
  generatedBy: string;
}
