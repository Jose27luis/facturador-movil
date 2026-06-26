import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { login } from '@/core/auth/auth.api';
import { useSession } from '@/core/auth/session';
import { paletaClara, radios } from '@/core/theme/tokens';

const c = paletaClara;

export default function LoginScreen() {
  const iniciar = useSession((s) => s.iniciar);
  const tenantGuardado = useSession((s) => s.tenant);

  const [empresa, setEmpresa] = useState(tenantGuardado);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puedeEntrar = empresa.trim() !== '' && email.trim() !== '' && password !== '';

  const entrar = async () => {
    if (!puedeEntrar || cargando) {
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const resultado = await login(empresa.trim(), email.trim(), password);
      await iniciar(empresa.trim(), resultado.token, resultado.usuario);
    } catch {
      setError('No se pudo iniciar sesión. Revisa la empresa y tus credenciales.');
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>MF</Text>
        </View>
        <Text style={styles.title}>Móvil Facturador</Text>
        <Text style={styles.subtitle}>Ingresa a tu empresa para empezar.</Text>

        <Text style={styles.label}>Empresa</Text>
        <TextInput
          style={styles.input}
          value={empresa}
          onChangeText={setEmpresa}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Empresa o subdominio"
        />

        <Text style={styles.label}>Usuario</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          accessibilityLabel="Usuario"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Contraseña"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, !puedeEntrar && styles.buttonDisabled]}
          onPress={entrar}
          disabled={!puedeEntrar || cargando}
        >
          {cargando ? (
            <ActivityIndicator color={c.onBrand} />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.bg,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: radios.xl,
    borderWidth: 1,
    borderColor: c.border,
    padding: 24,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radios.md,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: c.onBrand,
    fontWeight: '800',
    fontSize: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: c.text,
  },
  subtitle: {
    fontSize: 14,
    color: c.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: c.muted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: c.text,
    backgroundColor: c.bg,
  },
  error: {
    color: c.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
  },
  button: {
    height: 50,
    borderRadius: radios.md,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: c.onBrand,
    fontSize: 16,
    fontWeight: '700',
  },
});
