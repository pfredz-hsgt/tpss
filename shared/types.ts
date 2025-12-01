// Shared types between frontend and backend

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum PassoverStatus {
  PENDING = 'PENDING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export enum NotificationType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  PASSOVER = 'PASSOVER',
  SYSTEM = 'SYSTEM',
}

export enum TargetDate {
  TODAY = 'TODAY',
  TOMORROW = 'TOMORROW',
  ALL_TIME = 'ALL_TIME',
}

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

export interface Template {
  id: string;
  categoryId: string;
  name: string;
  questions: Question[];
  isActive: boolean;
}

export interface Question {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'select';
  required?: boolean;
  options?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  isSticky: boolean;
  isPinned: boolean;
  targetDate: TargetDate;
  createdAt: string;
  archivedAt?: string;
  category?: Category;
  author?: User;
  taggedUsers?: User[];
  taggedGroups?: Group[];
}

export interface Passover {
  id: string;
  outgoingUserId: string;
  incomingUserId: string;
  categoryId: string;
  content: PassoverContent;
  status: PassoverStatus;
  createdAt: string;
  acknowledgedAt?: string;
  outgoingUser?: User;
  incomingUser?: User;
  category?: Category;
  responses?: PassoverResponse[];
}

export interface PassoverContent {
  tdmCases?: string[];
  tpnCases?: string[];
  pendingTasks?: string[];
  equipmentIssues?: string[];
  transportItems?: string[];
  notes?: string;
  [key: string]: any;
}

export interface PassoverResponse {
  id: string;
  passoverId: string;
  userId: string;
  response: {
    checked: boolean;
    timestamp: string;
    notes?: string;
  };
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

