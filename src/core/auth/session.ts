import { create } from 'zustand';

import { secureStorage } from '@/core/storage/secure-storage';

const TOKEN_KEY = 'mf-token';
const TENANT_KEY = 'mf-tenant';
const USER_KEY = 'mf-user';

export interface Usuario {
  nombre: string;
  email: string;
  ruc: string;
}

interface SessionState {
  tenant: string;
  token: string | null;
  usuario: Usuario | null;
  hidratado: boolean;
  autenticado: boolean;
  hidratar: () => Promise<void>;
  iniciar: (tenant: string, token: string, usuario: Usuario) => Promise<void>;
  cerrar: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  tenant: '',
  token: null,
  usuario: null,
  hidratado: false,
  autenticado: false,

  hidratar: async () => {
    const [token, tenant, usuarioRaw] = await Promise.all([
      secureStorage.get(TOKEN_KEY),
      secureStorage.get(TENANT_KEY),
      secureStorage.get(USER_KEY),
    ]);
    set({
      token,
      tenant: tenant ?? '',
      usuario: usuarioRaw ? (JSON.parse(usuarioRaw) as Usuario) : null,
      autenticado: token !== null,
      hidratado: true,
    });
  },

  iniciar: async (tenant, token, usuario) => {
    await Promise.all([
      secureStorage.set(TOKEN_KEY, token),
      secureStorage.set(TENANT_KEY, tenant),
      secureStorage.set(USER_KEY, JSON.stringify(usuario)),
    ]);
    set({ tenant, token, usuario, autenticado: true });
  },

  cerrar: async () => {
    await Promise.all([secureStorage.remove(TOKEN_KEY), secureStorage.remove(USER_KEY)]);
    set({ token: null, usuario: null, autenticado: false });
  },
}));
