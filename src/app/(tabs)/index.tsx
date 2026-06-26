import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/core/auth/session';
import { PantallaModulo } from '@/core/ui/pantalla-modulo';
import { paletaClara, radios } from '@/core/theme/tokens';

const c = paletaClara;

export default function InicioScreen() {
  const usuario = useSession((s) => s.usuario);
  const cerrar = useSession((s) => s.cerrar);

  return (
    <PantallaModulo titulo="Inicio" descripcion={`Hola, ${usuario?.nombre || 'bienvenido'}`}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dashboard</Text>
        <Text style={styles.cardText}>Aquí irá el resumen de ventas del día y del mes.</Text>
      </View>
      <Pressable style={styles.salir} onPress={() => void cerrar()}>
        <Text style={styles.salirText}>Cerrar sesión</Text>
      </Pressable>
    </PantallaModulo>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
  },
  cardText: {
    fontSize: 14,
    color: c.muted,
    marginTop: 6,
  },
  salir: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  salirText: {
    color: c.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});
