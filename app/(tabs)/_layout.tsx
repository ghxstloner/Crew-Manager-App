import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTintColor: colors.white,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -5,
        },
        tabBarItemStyle: {
          paddingTop: 5,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="crew"
        options={{
          title: 'Inicio',
          headerTitle: 'Mis Tripulantes',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: focused ? colors.primary + '15' : 'transparent',
              padding: 5,
              borderRadius: 10,
            }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="enroll"
        options={{
          title: 'Enrolar',
          headerTitle: 'Enrolar Tripulante',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: focused ? colors.primary + '15' : 'transparent',
              padding: 5,
              borderRadius: 10,
            }}>
              <Ionicons name={focused ? "person-add" : "person-add-outline"} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerTitle: 'Mi Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: focused ? colors.primary + '15' : 'transparent',
              padding: 5,
              borderRadius: 10,
            }}>
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}