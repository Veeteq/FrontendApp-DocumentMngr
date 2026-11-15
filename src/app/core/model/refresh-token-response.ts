export interface RefreshTokenResponse {
  refreshTokenExpiresAt: string; // ISO date string
  token: string;
  type: string;
  expiresIn: number;
  expiresAt: string; // ISO date string
}