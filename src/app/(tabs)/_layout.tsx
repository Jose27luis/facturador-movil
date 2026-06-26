import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { paletaClara } from '@/core/theme/tokens';

const c = paletaClara;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ventas"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compras"
        options={{
          title: 'Compras',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="productos"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
