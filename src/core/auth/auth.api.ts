import axios from 'axios';

import { env } from '@/core/config/env';
import { resolverBaseUrl } from '@/core/api/client';
import { Usuario } from '@/core/auth/session';

interface LoginResponse {
  success: boolean;
  token?: string;
  name?: string;
  email?: string;
  ruc?: string;
  message?: string;
}

export interface ResultadoLogin {
  token: string;
  usuario: Usuario;
}

export async function login(
  tenant: string,
  email: string,
  password: string
): Promise<ResultadoLogin> {
  const baseUrl = resolverBaseUrl(tenant);
  const { data } = await axios.post<LoginResponse>(
    `${baseUrl}/login`,
    { email, password },
    { timeout: env.requestTimeout }
  );
  if (!data.success || !data.token) {
    throw new Error(data.message ?? 'No se pudo iniciar sesión.');
  }
  return {
    token: data.token,
    usuario: {
      nombre: data.name ?? '',
      email: data.email ?? email,
      ruc: data.ruc ?? '',
    },
  };
}
