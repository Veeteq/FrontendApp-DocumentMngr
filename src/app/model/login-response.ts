import { User } from "./user";

export interface LoginResponse {
  refreshTokenExpiresAt: string; // ISO date string
  user: User;
  roles: string[];
  token: string;
  type: string;
  expiresIn: number;
  expiresAt: string; // ISO date string
}