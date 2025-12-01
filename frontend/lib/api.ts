// Get the base API URL from environment variable or default to localhost
const getBaseUrl = () => {

  // Default to env var or localhost for web
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

const API_URL = getBaseUrl();

export interface ApiError {
  error: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      // @ts-ignore
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Auth API
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email?: string;
    fullName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  fullName: string;
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/api/auth/login', data),
  register: (data: RegisterRequest) => api.post('/api/auth/register', data),
  getCurrentUser: () => api.get('/api/auth/me'),
  changePassword: (data: ChangePasswordRequest) => api.post('/api/auth/change-password', data),
};

// Admin API
export interface User {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  role: string;
  createdAt: string;
  groups?: Group[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  users?: User[];
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
  questions: any; // Can be string (content) or array (legacy format)
  isActive: boolean;
  category?: Category;
}

// Public API (available to all authenticated users)
export const publicApi = {
  getCategories: () => api.get<Category[]>('/api/public/categories'),
  getTemplates: () => api.get<Template[]>('/api/public/templates'),
  getUsers: () => api.get<User[]>('/api/public/users'),
  getGroups: () => api.get<Group[]>('/api/public/groups'),
};

export const adminApi = {
  // Users
  getUsers: () => api.get<User[]>('/api/admin/users'),
  createUser: (data: Partial<User> & { password: string; groupIds?: string[] }) => api.post<User>('/api/admin/users', data),
  updateUser: (id: string, data: Partial<User> & { groupIds?: string[] }) => api.put<User>(`/api/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),

  // Groups
  getGroups: () => api.get<Group[]>('/api/admin/groups'),
  createGroup: (data: Partial<Group> & { userIds?: string[] }) => api.post<Group>('/api/admin/groups', data),
  updateGroup: (id: string, data: Partial<Group> & { userIds?: string[] }) => api.put<Group>(`/api/admin/groups/${id}`, data),
  deleteGroup: (id: string) => api.delete(`/api/admin/groups/${id}`),

  // Categories
  getCategories: () => api.get<Category[]>('/api/admin/categories'),
  createCategory: (data: Partial<Category>) => api.post<Category>('/api/admin/categories', data),
  updateCategory: (id: string, data: Partial<Category>) => api.put<Category>(`/api/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/api/admin/categories/${id}`),

  // Templates
  getTemplates: () => api.get<Template[]>('/api/admin/templates'),
  createTemplate: (data: Partial<Template> & { questions: string | any[] }) => api.post<Template>('/api/admin/templates', data),
  updateTemplate: (id: string, data: Partial<Template> & { questions: string | any[] }) => api.put<Template>(`/api/admin/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/api/admin/templates/${id}`),
};

// Announcements API
export interface AnnouncementResponse {
  id: string;
  announcementId: string;
  userId: string;
  response: string;
  createdAt: string;
  user?: User;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  isSticky: boolean;
  isPinned: boolean;
  targetDate: string | null;
  createdAt: string;
  archivedAt?: string;
  category?: Category;
  author?: User;
  taggedUsers?: User[];
  taggedGroups?: Group[];
  responses?: AnnouncementResponse[];
}

export const announcementApi = {
  getAnnouncements: (params?: { categoryId?: string; isSticky?: boolean; archived?: boolean; search?: string; targetDate?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get<Announcement[]>(`/api/announcements${queryString ? `?${queryString}` : ''}`);
  },
  getAnnouncement: (id: string) => api.get<Announcement>(`/api/announcements/${id}`),
  createAnnouncement: (data: Partial<Announcement> & { title: string; content: string; categoryId: string; taggedUserIds?: string[]; taggedGroupIds?: string[]; targetDate?: string }) =>
    api.post<Announcement>('/api/announcements', data),
  respondToAnnouncement: (id: string, response: string) => api.post<AnnouncementResponse>(`/api/announcements/${id}/respond`, { response }),
  updateAnnouncement: (id: string, data: Partial<Announcement>) => api.put<Announcement>(`/api/announcements/${id}`, data),
  archiveAnnouncement: (id: string) => api.post(`/api/announcements/${id}/archive`),
  deleteAnnouncement: (id: string) => api.delete(`/api/announcements/${id}`),
};

// Passover API
export interface PassoverAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface Passover {
  id: string;
  outgoingUserId: string;
  incomingUserId?: string | null;
  groupId?: string | null;
  categoryId: string;
  content: any;
  attachments?: PassoverAttachment[] | null;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
  archivedAt?: string;
  outgoingUser?: User;
  incomingUser?: User | null;
  group?: Group | null;
  category?: Category;
  responses?: any[];
}

export const passoverApi = {
  getPassovers: (params?: { status?: string; categoryId?: string; outgoingUserId?: string; incomingUserId?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get<Passover[]>(`/api/passover${queryString ? `?${queryString}` : ''}`);
  },
  getPassover: (id: string) => api.get<Passover>(`/api/passover/${id}`),
  createPassover: (data: { incomingUserId?: string; groupId?: string; categoryId: string; content: string; attachments?: PassoverAttachment[] }) =>
    api.post<Passover>('/api/passover', data),
  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/passover/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json() as Promise<{ files: PassoverAttachment[] }>;
  },
  acknowledgePassover: (id: string) => api.post(`/api/passover/${id}/acknowledge`),
  respondToPassover: (id: string, response: string) => api.post(`/api/passover/${id}/respond`, { response }),
  archivePassover: (id: string) => api.post(`/api/passover/${id}/archive`),
  deletePassover: (id: string) => api.delete(`/api/passover/${id}`),
};

// Notifications API
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: (isRead?: boolean) => {
    const query = isRead !== undefined ? `?isRead=${isRead}` : '';
    return api.get<Notification[]>(`/api/notifications${query}`);
  },
  getUnreadCount: () => api.get<{ count: number }>('/api/notifications/unread/count'),
  markAsRead: (id: string) => api.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
};

// Temperature Monitoring API
export interface FridgeSection {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  fridges?: Fridge[];
  picContacts?: PICContact[];
}

export interface Fridge {
  id: string;
  sectionId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  section?: FridgeSection;
}

export interface PICContact {
  id: string;
  sectionId: string;
  name: string;
  phoneNumber: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  section?: FridgeSection;
}

export interface TemperatureReportEntry {
  id: string;
  reportId: string;
  fridgeId: string;
  temperatureInRange: boolean;
  createdAt: string;
  fridge?: Fridge;
}

export interface TemperatureReport {
  id: string;
  date: string;
  time: string;
  remarks?: string | null;
  submittedBy: string;
  createdAt: string;
  submitter?: User;
  entries?: TemperatureReportEntry[];
}

export const temperatureApi = {
  // Fridge Sections
  getFridgeSections: () => api.get<FridgeSection[]>('/api/temperature/sections'),
  createFridgeSection: (data: { name: string; sortOrder?: number }) =>
    api.post<FridgeSection>('/api/temperature/sections', data),
  updateFridgeSection: (id: string, data: { name?: string; sortOrder?: number }) =>
    api.put<FridgeSection>(`/api/temperature/sections/${id}`, data),
  deleteFridgeSection: (id: string) => api.delete(`/api/temperature/sections/${id}`),

  // Fridges
  createFridge: (data: { sectionId: string; name: string; sortOrder?: number }) =>
    api.post<Fridge>('/api/temperature/fridges', data),
  updateFridge: (id: string, data: { name?: string; sortOrder?: number }) =>
    api.put<Fridge>(`/api/temperature/fridges/${id}`, data),
  deleteFridge: (id: string) => api.delete(`/api/temperature/fridges/${id}`),

  // PIC Contacts
  createPICContact: (data: { sectionId: string; name: string; phoneNumber: string; sortOrder?: number }) =>
    api.post<PICContact>('/api/temperature/pic-contacts', data),
  updatePICContact: (id: string, data: { name?: string; phoneNumber?: string; sortOrder?: number }) =>
    api.put<PICContact>(`/api/temperature/pic-contacts/${id}`, data),
  deletePICContact: (id: string) => api.delete(`/api/temperature/pic-contacts/${id}`),

  // Temperature Reports
  getTemperatureReports: (params?: { date?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return api.get<TemperatureReport[]>(`/api/temperature/reports${queryString ? `?${queryString}` : ''}`);
  },
  getTemperatureReport: (id: string) => api.get<TemperatureReport>(`/api/temperature/reports/${id}`),
  createTemperatureReport: (data: {
    date: string;
    time: string;
    remarks?: string;
    entries: { fridgeId: string; temperatureInRange: boolean }[]
  }) => api.post<TemperatureReport>('/api/temperature/reports', data),
  deleteTemperatureReport: (id: string) => api.delete(`/api/temperature/reports/${id}`),
};
