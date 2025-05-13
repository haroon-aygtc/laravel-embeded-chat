import type { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    isActive: true,
    avatar: '',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'editor',
    isActive: true,
    avatar: '',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    role: 'viewer',
    isActive: false,
    avatar: '',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];
