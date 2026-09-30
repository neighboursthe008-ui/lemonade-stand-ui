export interface Branch { id: number; name: string; is_primary: boolean }

/** Shape of GET /api/v1/auth/me */
export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  roles: string[];
  permissions: string[];
  organization_id: number | null;
  branch_id: number | null;
  branches: Branch[];
  is_super_admin: boolean;
  must_change_password: boolean;
  pin_verified_at: string | null;
}
