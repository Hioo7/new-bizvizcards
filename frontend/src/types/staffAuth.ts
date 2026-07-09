export type StaffRole = "employee" | "admin" | "super_admin";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: StaffRole | null;
  emailVerified: boolean;
  banned: boolean | null;
}

export interface StaffAuthSession {
  token: string;
  user: StaffUser;
}

export type StaffOtpType = "sign-in";

export interface SendStaffOtpPayload {
  email: string;
  type: StaffOtpType;
}

export interface VerifyStaffOtpPayload {
  email: string;
  otp: string;
}

export interface StaffSessionResponse {
  session: { token: string } | null;
  user: StaffUser | null;
}

export type AssignableStaffRole = Exclude<StaffRole, "super_admin">;

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
}

export interface StaffListResponse {
  staff: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListStaffQuery {
  search?: string;
  role?: AssignableStaffRole;
  page: number;
  pageSize: number;
}

export interface CreateStaffPayload {
  email: string;
  name: string;
  role: AssignableStaffRole;
}

export interface UpdateStaffNamePayload {
  name: string;
}

export interface SetStaffRolePayload {
  role: AssignableStaffRole;
}

export interface BanStaffPayload {
  banReason?: string;
}

export interface UpdateStaffProfilePayload {
  name: string;
}
