import { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User } from '../services/api';

interface AuthContextType {
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  user: null,
  token: null,
  isLoading: false,
});

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        const userDataRaw = JSON.parse(storedUser);
        const aerolineaRaw = (userDataRaw.aerolinea ?? {}) as any;
        const userData: User = {
          id: userDataRaw.id,
          login: userDataRaw.login,
          name: userDataRaw.name,
          email: userDataRaw.email,
          is_admin: (userDataRaw as any).is_admin ?? '',
          aerolinea: {
            id_aerolinea: (aerolineaRaw.id_aerolinea ?? aerolineaRaw.id) ?? 0,
            descripcion: (aerolineaRaw.descripcion ?? aerolineaRaw.nombre) ?? '',
            siglas: aerolineaRaw.siglas ?? '',
            logo_base64: aerolineaRaw.logo_base64,
          },
        };
        
        setToken(storedToken);
        setUser(userData);
        apiService.setToken(storedToken);
        apiService.setCurrentUser(userData); // ✅ LÍNEA CRÍTICA QUE FALTABA
        
        // Verificar si el token sigue siendo válido
        try {
          await apiService.getUserInfo();
        } catch (error) {
          // Token inválido, limpiar
          await signOut();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const response = await apiService.login(username, password);
      
      if (response.success) {
        const { token: authToken, user: userDataRaw } = response.data;
        const aerolineaRaw = (userDataRaw.aerolinea ?? {}) as any;
        const userData: User = {
          id: userDataRaw.id,
          login: userDataRaw.login,
          name: userDataRaw.name,
          email: userDataRaw.email,
          is_admin: (userDataRaw as any).is_admin ?? '',
          aerolinea: {
            id_aerolinea: (aerolineaRaw.id_aerolinea ?? aerolineaRaw.id) ?? 0,
            descripcion: (aerolineaRaw.descripcion ?? aerolineaRaw.nombre) ?? '',
            siglas: aerolineaRaw.siglas ?? '',
          },
        };
        
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
        apiService.setToken(authToken);
        apiService.setCurrentUser(userData); // ✅ LÍNEA CRÍTICA QUE FALTABA
      } else {
        throw new Error(response.message || 'Error en el login');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Credenciales inválidas');
    }
  };

  const signOut = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
      apiService.clearAuth(); // ✅ LIMPIAR TAMBIÉN EL APISERVICE
    }
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, user, token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}