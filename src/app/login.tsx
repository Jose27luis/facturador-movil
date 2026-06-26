import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/core/auth/auth.api';
import { useSession } from '@/core/auth/session';
import { env } from '@/core/config/env';
import { fuentes, paletaClara, radios } from '@/core/theme/tokens';

const c = paletaClara;

export default function LoginScreen() {
  const iniciar = useSession((s) => s.iniciar);
  const tenantGuardado = useSession((s) => s.tenant);

  const [empresa, setEmpresa] = useState(tenantGuardado);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puedeEntrar = empresa.trim() !== '' && email.trim() !== '' && password !== '';
  const sufijo = empresa.includes('.') ? '' : `.${env.baseDomain}`;

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
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoText}>mf</Text>
          </View>
          <Text style={styles.title}>Móvil Facturador</Text>
          <Text style={styles.subtitle}>Tu facturación electrónica, en el bolsillo</Text>

          <Text style={styles.label}>Empresa</Text>
          <View style={styles.campo}>
            <TextInput
              style={[styles.input, styles.mono]}
              value={empresa}
              onChangeText={setEmpresa}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Empresa o subdominio"
            />
            {sufijo ? <Text style={styles.sufijo}>{sufijo}</Text> : null}
          </View>

          <Text style={styles.label}>Usuario</Text>
          <View style={styles.campo}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              accessibilityLabel="Usuario"
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.campo}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!verPass}
              accessibilityLabel="Contraseña"
            />
            <Pressable onPress={() => setVerPass((v) => !v)}>
              <Text style={styles.mostrar}>{verPass ? 'Ocultar' : 'Mostrar'}</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, !puedeEntrar && styles.buttonDisabled]}
            onPress={entrar}
            disabled={!puedeEntrar || cargando}
          >
            {cargando ? (
              <ActivityIndicator color={c.onBrand} />
            ) : (
              <>
                <Text style={styles.buttonText}>Ingresar</Text>
                <Ionicons name="arrow-forward" size={17} color={c.onBrand} />
              </>
            )}
          </Pressable>

          <Text style={styles.footer}>Conecta con tu facturador electrónico pro8 · SUNAT</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  content: { padding: 28, paddingTop: 60, flexGrow: 1, justifyContent: 'center' },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: c.onBrand, fontWeight: '800', fontSize: 24, letterSpacing: -1 },
  title: { fontSize: 27, fontWeight: '800', color: c.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#7A7163', fontWeight: '500', marginTop: 4, marginBottom: 28 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A7163',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 7,
    marginTop: 16,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, color: c.text },
  mono: { fontFamily: fuentes.mono },
  sufijo: { fontFamily: fuentes.mono, fontSize: 15, color: c.faint },
  mostrar: { fontSize: 13, color: '#7A7163', fontWeight: '600' },
  error: { color: c.danger, fontSize: 13, fontWeight: '600', marginTop: 14 },
  button: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', marginTop: 18, fontSize: 12.5, color: '#9A9183' },
});
