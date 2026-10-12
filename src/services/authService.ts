import api from "../api/axios";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  role: string;
}

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/api/auth/login",
    credentials,
  );

  return response.data;
};
