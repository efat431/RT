import { UserAccount } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'rongdhonu_auth_token';

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function removeAuthToken(): void {
  setAuthToken(null);
}

export const authApi = {
  async login(
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; user?: UserAccount; token?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || `Login failed (HTTP ${res.status})`,
        };
      }

      if (data.token) {
        setAuthToken(data.token);
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error during login',
      };
    }
  },

  async me(): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'No auth token found' };

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to authenticate session' };
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error fetching user' };
    }
  },

  async changePassword(
    newPassword: string,
    oldPassword?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ newPassword, oldPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to change password' };
      }

      return { success: true, message: data.message || 'Password changed successfully' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error changing password' };
    }
  },

  logout(): void {
    setAuthToken(null);
  },
};
