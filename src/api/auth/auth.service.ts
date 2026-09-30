import { endpoints } from "@/api/registry";
import { request } from "@/api/client/http";
import type { CurrentUser } from "@/types/auth";

export const authService = {
  login: (email: string, password: string) =>
    request<{ user: Partial<CurrentUser>; token: string }>(endpoints.auth.login, { method: "POST", body: { email, password }, auth: false }),
  me: () => request<CurrentUser>(endpoints.auth.me),
  logout: () => request<null>(endpoints.auth.logout, { method: "POST" }),
  forgotPassword: (email: string) =>
    request<null>(endpoints.auth.forgotPassword, { method: "POST", body: { email }, auth: false }),
  resetPassword: (body: { token: string; email: string; password: string; password_confirmation: string }) =>
    request<null>(endpoints.auth.resetPassword, { method: "POST", body, auth: false }),
};
