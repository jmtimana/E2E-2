import type { LoginRequest, RegisterRequest } from "../types/auth.type";
import type { AuthResponse } from "../types/auth.type";
import api from "./api";


export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", data);
  return response.data;
}