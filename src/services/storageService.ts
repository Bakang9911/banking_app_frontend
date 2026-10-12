const TOKEN_KEY = "banking_access_token";
const USERNAME_KEY = "banking_username";
const ROLE_KEY = "banking_role";

export const saveAuthData = (
  token: string,
  username: string,
  role: string,
): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(ROLE_KEY, role);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUsername = (): string | null => {
  return localStorage.getItem(USERNAME_KEY);
};

export const getRole = (): string | null => {
  return localStorage.getItem(ROLE_KEY);
};

export const clearAuthData = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ROLE_KEY);
};
