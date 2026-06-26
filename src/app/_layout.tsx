import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';

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
    const enTabs = segments[0] === '(tabs)';
    if (!autenticado && !enLogin) {
      router.replace('/login');
    } else if (autenticado && !enTabs) {
      router.replace('/(tabs)');
    }
  }, [hidratado, autenticado, segments, router]);

  return null;
}

export default function RootLayout() {
  const hidratar = useSession((s) => s.hidratar);

  useEffect(() => {
    void hidratar();
  }, [hidratar]);

  return (
    <QueryClientProvider client={queryClient}>
      <GuardiaAuth />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
