import { Role, Permission } from './permissions';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar?: string;
    permissions?: Permission[];
    last_login?: string;
    created_at: string;
    updated_at: string;
}
