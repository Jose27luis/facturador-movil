import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-mono';

import { queryClient } from '@/core/api/query-client';
import { useSession } from '@/core/auth/session';

function GuardiaAuth() {
  const router = useRouter();
  const segments = useSegments();
  const hidratado = useSession((s) => s.hidratado);
  const autenticado = useSession((s) => s.autenticado);

  useEffect(() => {
    if (!hidratado) {
      return;
    }
    const enLogin = segments[0] === 'login';
    const enRaiz = segments[0] === undefined;
    if (!autenticado && !enLogin) {
      router.replace('/login');
    } else if (autenticado && (enLogin || enRaiz)) {
      router.replace('/(tabs)');
    }
  }, [hidratado, autenticado, segments, router]);

  return null;
}

export default function RootLayout() {
  const hidratar = useSession((s) => s.hidratar);
  const [fuentesListas] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });

  useEffect(() => {
    void hidratar();
  }, [hidratar]);

  if (!fuentesListas) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GuardiaAuth />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="comprobante/[id]" />
        <Stack.Screen name="emitir" />
        <Stack.Screen name="resumenes" />
      </Stack>
    </QueryClientProvider>
  );
}
