// services/api.ts
const API_BASE = 'https://crew.amaxoniaerp.com/api';

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    tripulante: TripulanteUser;
  };
  message: string;
}

interface RegisterResponse {
  success: boolean;
  data: {
    id_solicitud: number;
    crew_id: string;
    nombres_apellidos: string;
    estado: string;
    fecha_solicitud: string;
  };
  message: string;
}

interface StatusResponse {
  success: boolean;
  data: {
    crew_id: string;
    nombres_apellidos: string;
    estado: 'Pendiente' | 'Aprobado' | 'Denegado';
    fecha_solicitud: string;
    fecha_aprobacion?: string;
    motivo_rechazo?: string;
  };
  message: string;
}

interface PosicionesResponse {
  success: boolean;
  data: Posicion[];
  message: string;
}

// Nueva interface para aerolíneas
interface AerolineasResponse {
  success: boolean;
  data: Aerolinea[];
  message: string;
}

interface PlanificacionesResponse {
  success: boolean;
  data: Planificacion[];
  pagination?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  message: string;
}

interface UserInfoResponse {
  success: boolean;
  data: TripulanteUser;
  message: string;
}

class ApiService {
  private token: string | null = null;
  private currentUser: TripulanteUser | null = null;

  setToken(token: string) {
    this.token = token;
  }

  setCurrentUser(user: TripulanteUser) {
    this.currentUser = user;
  }

  getCurrentUser(): TripulanteUser | null {
    return this.currentUser;
  }

  private getHeaders(isFormData: boolean = false) {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Iniciar sesión de tripulante
   */
  async login(crewId: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        crew_id: crewId,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de login:', errorData);
      throw new Error(errorData.message || 'Credenciales inválidas');
    }

    const data = await response.json();
    
    if (data.success) {
      this.setToken(data.data.token);
      this.setCurrentUser(data.data.tripulante);
    }

    return data;
  }

  /**
   * Registrar nuevo tripulante (ACTUALIZADO CON AEROLÍNEA)
   */
  async register(tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    pasaporte: string;
    identidad?: string;
    iata_aerolinea: string; // ← NUEVO CAMPO
    posicion: number;
    password: string;
    imageUri?: string;
  }): Promise<RegisterResponse> {
    
    const formData = new FormData();
    
    // Agregar campos de texto
    formData.append('crew_id', tripulanteData.crew_id);
    formData.append('nombres', tripulanteData.nombres);
    formData.append('apellidos', tripulanteData.apellidos);
    formData.append('pasaporte', tripulanteData.pasaporte);
    formData.append('iata_aerolinea', tripulanteData.iata_aerolinea); // ← NUEVO CAMPO
    formData.append('posicion', tripulanteData.posicion.toString());
    formData.append('password', tripulanteData.password);
    
    if (tripulanteData.identidad) {
      formData.append('identidad', tripulanteData.identidad);
    }
    
    // Agregar imagen si existe
    if (tripulanteData.imageUri) {
      formData.append('image', {
        uri: tripulanteData.imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de registro:', errorData);
      throw new Error(errorData.message || 'Error al procesar el registro');
    }

    return await response.json();
  }

  /**
   * Verificar estado de solicitud
   */
  async checkStatus(crewId: string): Promise<StatusResponse['data']> {
    const response = await fetch(`${API_BASE}/auth/check-status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        crew_id: crewId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al verificar estado:', errorData);
      throw new Error(errorData.message || 'Error al verificar estado');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Obtener información del tripulante autenticado
   */
  async getUserInfo(): Promise<UserInfoResponse> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener información del usuario:', errorData);
      throw new Error(errorData.message || 'Error al obtener información del usuario');
    }

    return await response.json();
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: this.getHeaders(),
        });
      } catch (error) {
        console.warn('Error durante logout:', error);
      }
    }
    
    this.token = null;
    this.currentUser = null;
  }

  /**
   * Obtener todas las posiciones disponibles (sin autenticación para registro)
   */
  async getPosiciones(): Promise<PosicionesResponse> {
    const response = await fetch(`${API_BASE}/posiciones`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener posiciones:', errorData);
      throw new Error(errorData.message || 'Error al obtener posiciones');
    }

    return await response.json();
  }

  /**
   * Obtener todas las aerolíneas disponibles (NUEVO - sin autenticación para registro)
   */
  async getAerolineas(): Promise<AerolineasResponse> {
    const response = await fetch(`${API_BASE}/aerolineas`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener aerolíneas:', errorData);
      throw new Error(errorData.message || 'Error al obtener aerolíneas');
    }

    return await response.json();
  }

  /**
   * Obtener planificaciones del tripulante autenticado
   */
  async getPlanificaciones(page: number = 1, search?: string): Promise<PlanificacionesResponse> {
    let url = `${API_BASE}/tripulante/planificaciones?page=${page}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener planificaciones:', errorData);
      throw new Error(errorData.message || 'Error al obtener planificaciones');
    }

    return await response.json();
  }

  /**
   * Obtener perfil del tripulante
   */
  async getProfile(): Promise<UserInfoResponse> {
    const response = await fetch(`${API_BASE}/tripulante/profile`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener perfil:', errorData);
      throw new Error(errorData.message || 'Error al obtener perfil');
    }

    return await response.json();
  }

  /**
   * Actualizar perfil del tripulante
   */
  async updateProfile(profileData: {
    nombres?: string;
    apellidos?: string;
    pasaporte?: string;
    identidad?: string;
    imageUri?: string;
  }): Promise<UserInfoResponse> {
    
    if (profileData.imageUri) {
      // Usar FormData si hay imagen
      const formData = new FormData();
      
      if (profileData.nombres) formData.append('nombres', profileData.nombres);
      if (profileData.apellidos) formData.append('apellidos', profileData.apellidos);
      if (profileData.pasaporte) formData.append('pasaporte', profileData.pasaporte);
      if (profileData.identidad) formData.append('identidad', profileData.identidad);
      
      formData.append('image', {
        uri: profileData.imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await fetch(`${API_BASE}/tripulante/profile`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      return await response.json();
    } else {
      // Usar JSON si no hay imagen
      const response = await fetch(`${API_BASE}/tripulante/profile`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      return await response.json();
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await fetch(`${API_BASE}/tripulante/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al cambiar contraseña');
    }

    return await response.json();
  }

  // Métodos de utilidad
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearAuth(): void {
    this.token = null;
    this.currentUser = null;
  }
}

export const apiService = new ApiService();

// Interfaces actualizadas para tripulantes
export interface TripulanteUser {
  id_solicitud: number;
  crew_id: string;
  nombres: string;
  apellidos: string;
  nombres_apellidos: string;
  pasaporte: string;
  identidad?: string;
  iata_aerolinea: string; // ← NUEVO CAMPO
  posicion: {
    id_posicion: number;
    codigo_posicion: string;
    descripcion: string;
  };
  imagen_url?: string;
  activo: boolean;
  estado: 'Pendiente' | 'Aprobado' | 'Denegado';
  fecha_solicitud: string;
  fecha_aprobacion?: string;
}

export interface Posicion {
  id_posicion: number;
  codigo_posicion: string;
  descripcion: string;
}

// Nueva interface para aerolíneas
export interface Aerolinea {
  id_aerolinea: number;
  descripcion: string;
  siglas: string;
}

export interface Planificacion {
  id_planificacion: number;
  crew_id: string;
  fecha_vuelo: string;
  hora_salida: string;
  hora_llegada: string;
  origen: string;
  destino: string;
  numero_vuelo: string;
  aeronave: string;
  posicion: string;
  estado: string;
  observaciones?: string;
}

export interface SolicitudEstado {
  crew_id: string;
  nombres_apellidos: string;
  estado: 'Pendiente' | 'Aprobado' | 'Denegado';
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  motivo_rechazo?: string;
}

// Re-export User as TripulanteUser for compatibility
export type User = TripulanteUser;

// Exportar tipos de respuesta también
export type { 
  LoginResponse, 
  RegisterResponse, 
  StatusResponse, 
  PosicionesResponse,
  AerolineasResponse, // ← NUEVO
  PlanificacionesResponse,
  UserInfoResponse
};