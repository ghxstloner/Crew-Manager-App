// services/api.ts - INTERFACES ACTUALIZADAS PARA DATOS REALES
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

interface InitiateRegisterResponse {
  success: boolean;
  data: {
    verification_key: string;
    email: string;
    crew_id: string;
    expires_in_minutes: number;
  };
  message: string;
}

interface VerifyEmailResponse {
  success: boolean;
  data: {
    id_solicitud: number;
    crew_id: string;
    nombres_apellidos: string;
    estado: string;
    fecha_solicitud: string;
    email_verified: boolean;
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
   * Registrar nuevo tripulante
   */
  async register(tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    pasaporte: string;
    identidad?: string;
    email: string;
    iata_aerolinea: string;
    posicion: number;
    password: string;
    imageUri?: string;
  }): Promise<RegisterResponse> {
    
    const formData = new FormData();
    
    formData.append('crew_id', tripulanteData.crew_id);
    formData.append('nombres', tripulanteData.nombres);
    formData.append('apellidos', tripulanteData.apellidos);
    formData.append('pasaporte', tripulanteData.pasaporte);
    formData.append('email', tripulanteData.email);
    formData.append('iata_aerolinea', tripulanteData.iata_aerolinea);
    formData.append('posicion', tripulanteData.posicion.toString());
    formData.append('password', tripulanteData.password);
    
    if (tripulanteData.identidad) {
      formData.append('identidad', tripulanteData.identidad);
    }
    
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
      
      // Manejo específico de errores de validación
      if (response.status === 422 && errorData.errors) {
        const specificErrors = this.getSpecificValidationError(errorData);
        throw new Error(specificErrors.message);
      }
      
      throw new Error(errorData.message || 'Error al procesar el registro');
    }
  
    return await response.json();
  }

  /**
   * Extraer errores específicos de validación
   */
  private getSpecificValidationError(errorData: any): { message: string; details: any } {
    const errors = errorData.errors || {};
    const errorDetails = errorData.error_details || {};
    
    // Priorizar los errores más importantes
    const priorityFields = ['crew_id', 'pasaporte', 'email'];
    
    for (const field of priorityFields) {
      if (errors[field]) {
        return {
          message: errors[field][0], // Primer mensaje del campo
          details: errorDetails[field] || errors[field]
        };
      }
    }
    
    // Si no hay errores prioritarios, tomar el primero disponible
    const firstField = Object.keys(errors)[0];
    if (firstField && errors[firstField]) {
      return {
        message: errors[firstField][0],
        details: errorDetails[firstField] || errors[firstField]
      };
    }
    
    return {
      message: errorData.message || 'Error de validación',
      details: errors
    };
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
   * Obtener todas las posiciones disponibles
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
   * Obtener todas las aerolíneas disponibles
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

  /**
   * Obtener información de marcación para una planificación procesada
   */
  async getMarcacionInfo(planificacionId: number): Promise<MarcacionResponse> {
    const response = await fetch(`${API_BASE}/tripulante/planificaciones/${planificacionId}/marcacion`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener información de marcación');
    }

    return await response.json();
  }

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

  /**
   * Iniciar registro con verificación de email
   */
  async initiateRegister(tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    pasaporte: string;
    identidad?: string;
    email: string;
    iata_aerolinea: string;
    posicion: number;
    password: string;
    imageUri?: string;
  }): Promise<InitiateRegisterResponse> {
    
    const formData = new FormData();
    
    formData.append('crew_id', tripulanteData.crew_id);
    formData.append('nombres', tripulanteData.nombres);
    formData.append('apellidos', tripulanteData.apellidos);
    formData.append('pasaporte', tripulanteData.pasaporte);
    formData.append('email', tripulanteData.email);
    formData.append('iata_aerolinea', tripulanteData.iata_aerolinea);
    formData.append('posicion', tripulanteData.posicion.toString());
    formData.append('password', tripulanteData.password);
    
    if (tripulanteData.identidad) {
      formData.append('identidad', tripulanteData.identidad);
    }
    
    if (tripulanteData.imageUri) {
      formData.append('image', {
        uri: tripulanteData.imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }
  
    const response = await fetch(`${API_BASE}/auth/initiate-register`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al iniciar registro:', errorData);
      
      // Manejo específico de errores de validación
      if (response.status === 422 && errorData.errors) {
        const specificErrors = this.getSpecificValidationError(errorData);
        throw new Error(specificErrors.message);
      }
      
      throw new Error(errorData.message || 'Error al procesar la solicitud de registro');
    }
  
    return await response.json();
  }

  /**
   * Verificar email con PIN y completar registro
   */
  async verifyEmailAndRegister(verification_key: string, pin: string): Promise<VerifyEmailResponse> {
    const response = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        verification_key,
        pin,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de verificación:', errorData);
      throw new Error(errorData.message || 'Error al verificar email');
    }

    return await response.json();
  }

  /**
   * Reenviar PIN de verificación
   */
  async resendVerificationPin(verification_key: string): Promise<InitiateRegisterResponse> {
    const response = await fetch(`${API_BASE}/auth/resend-pin`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        verification_key,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al reenviar PIN:', errorData);
      throw new Error(errorData.message || 'Error al reenviar código de verificación');
    }

    return await response.json();
  }
}

export const apiService = new ApiService();

// INTERFACES ACTUALIZADAS PARA DATOS REALES
export interface TripulanteUser {
  id_solicitud: number;
  crew_id: string;
  nombres: string;
  apellidos: string;
  nombres_apellidos: string;
  pasaporte: string;
  identidad?: string;
  iata_aerolinea: string;
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

export interface Aerolinea {
  id_aerolinea: number;
  descripcion: string;
  siglas: string;
}

// INTERFACE PLANIFICACION ACTUALIZADA CON DATOS REALES
export interface Planificacion {
  id_planificacion: number;
  crew_id: string;
  fecha_vuelo: string;
  numero_vuelo: string | null;
  hora_salida: string | null; // Tu campo real hora_vuelo
  iata_aerolinea: string | null;
  estado: string; // Mapeado de estatus: P=Pendiente, R=Procesada
  posicion: string | null; // Código de posición
  
  // Campos que NO existen en tu tabla pero el frontend los espera
  origen: string | null;
  destino: string | null;
  hora_llegada: string | null;
  aeronave: string | null;
  observaciones: string | null;
}

export interface SolicitudEstado {
  crew_id: string;
  nombres_apellidos: string;
  estado: 'Pendiente' | 'Aprobado' | 'Denegado';
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  motivo_rechazo?: string;
}

export interface MarcacionInfo {
  id_marcacion: number;
  fecha_marcacion: string;
  hora_marcacion: string;
  lugar_marcacion: {
    id: number;
    nombre: string;
    codigo: string;
  };
  punto_control: {
    id: number;
    descripcion: string;
    aeropuerto: string;
  };
  dispositivo: {
    device_id: number;
    device_sn: string;
  } | null;
  procesado: boolean;
  tipo_marcacion: number;
  usuario_sistema: string;
  planificacion: {
    id: number;
    numero_vuelo: string;
    fecha_vuelo: string;
    hora_vuelo: string;
    iata_aerolinea: string;
  };
}

export interface MarcacionResponse {
  success: boolean;
  data: MarcacionInfo;
  message: string;
}

export type User = TripulanteUser;

export type { 
  LoginResponse, 
  RegisterResponse, 
  InitiateRegisterResponse,
  VerifyEmailResponse,
  StatusResponse, 
  PosicionesResponse,
  AerolineasResponse,
  PlanificacionesResponse,
  UserInfoResponse
};