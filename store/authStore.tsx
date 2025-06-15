import { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, TripulanteUser, RegisterResponse, SolicitudEstado } from '../services/api';

interface AuthContextType {
  signIn: (crewId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    email: string;
    pasaporte: string;
    iata_aerolinea: string;
    posicion: number;
    password: string;
    imageUri?: string;
  }) => Promise<RegisterResponse>;
  initiateRegister: (tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    email: string;
    pasaporte: string;
    iata_aerolinea: string;
    posicion: number;
    password: string;
    imageUri?: string;
  }) => Promise<{ verification_key: string; email: string; crew_id: string; expires_in_minutes: number }>;
  verifyEmailAndRegister: (verification_key: string, pin: string) => Promise<void>;
  resendVerificationPin: (verification_key: string) => Promise<void>;
  checkStatus: (crewId: string) => Promise<SolicitudEstado>;
  setUser: (user: TripulanteUser) => Promise<void>;
  user: TripulanteUser | null;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  register: async () => { throw new Error('Not implemented'); },
  initiateRegister: async () => { throw new Error('Not implemented'); },
  verifyEmailAndRegister: async () => { throw new Error('Not implemented'); },
  resendVerificationPin: async () => { throw new Error('Not implemented'); },
  checkStatus: async () => { throw new Error('Not implemented'); },
  setUser: async () => {},
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
  const [user, setUser] = useState<TripulanteUser | null>(null);
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
        let userData: TripulanteUser;
        
        try {
          userData = JSON.parse(storedUser);
        } catch (parseError) {
          console.log('Error al parsear datos de usuario, limpiando storage');
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          return;
        }
        
        setToken(storedToken);
        setUser(userData);
        apiService.setToken(storedToken);
        apiService.setCurrentUser(userData);
        
        // Verificar si el token sigue siendo válido
        try {
          const response = await apiService.getUserInfo();
          if (response.success) {
            // Actualizar datos del usuario desde el servidor
            setUser(response.data);
            await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
            apiService.setCurrentUser(response.data);
          }
        } catch (error) {
          console.log('Token inválido, limpiando sesión');
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

  const signIn = async (crewId: string, password: string) => {
    try {
      const response = await apiService.login(crewId, password);
      
      if (response.success) {
        const { token: authToken, tripulante } = response.data;
        console.log('Tripulante:', tripulante);

        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(tripulante));
        
        setToken(authToken);
        setUser(tripulante);
        apiService.setToken(authToken);
        apiService.setCurrentUser(tripulante);
      } else {
        throw new Error(response.message || 'Error en el login');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Credenciales inválidas');
    }
  };

  const register = async (tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    email: string;
    pasaporte: string;
    iata_aerolinea: string;
    posicion: number;
    password: string;
    imageUri?: string;
  }): Promise<RegisterResponse> => {
    try {
      const response = await apiService.register(tripulanteData);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al procesar el registro');
    }
  };

  const initiateRegister = async (tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    email: string;
    pasaporte: string;
    iata_aerolinea: string;
    posicion: number;
    password: string;
    imageUri?: string;
  }): Promise<{ verification_key: string; email: string; crew_id: string; expires_in_minutes: number }> => {
    try {
      const response = await apiService.initiateRegister(tripulanteData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar el registro');
    }
  };

  const verifyEmailAndRegister = async (verification_key: string, pin: string) => {
    try {
      await apiService.verifyEmailAndRegister(verification_key, pin);
    } catch (error: any) {
      throw new Error(error.message || 'Error al verificar y registrar correo');
    }
  };

  const resendVerificationPin = async (verification_key: string) => {
    try {
      await apiService.resendVerificationPin(verification_key);
    } catch (error: any) {
      throw new Error(error.message || 'Error al reenviar pin de verificación');
    }
  };

  const checkStatus = async (crewId: string): Promise<SolicitudEstado> => {
    try {
      const response = await apiService.checkStatus(crewId);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al verificar estado');
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
      apiService.clearAuth();
    }
  };

  const updateUser = async (updatedUser: TripulanteUser) => {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
      apiService.setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      signIn, 
      signOut, 
      register,
      initiateRegister,
      verifyEmailAndRegister,
      resendVerificationPin,
      checkStatus,
      setUser: updateUser,
      user, 
      token, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}