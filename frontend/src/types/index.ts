export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'user';
  isActive: boolean;
  avatar: string | null;
  bio: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO extends Omit<User, 'id' | 'createdAt' | 'lastLogin'> {
  password?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface Session {
  id: string;
  device: string;
  ip_address: string;
  last_active: string;
  created_at: string;
}

export interface SecuritySettings {
  enableMFA: boolean;
  loginNotifications: boolean;
  sessionTimeout: string;
}

export interface SelectorConfig {
  name: string;
  selector: string;
}

export interface TableInfo {
  name: string;
  columns: string[];
}
