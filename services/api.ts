// services/api.ts
// const API_BASE = 'http://192.168.2.11:8000/api';
const API_BASE = 'https://crew.amaxoniaerp.com/api';

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: number;
      login: string;
      name: string;
      email: string;
      aerolinea: {
        id: number;
        nombre: string;
        siglas: string;
        logo_base64?: string;
      };
    };
  };
  message: string;
}

interface TripulanteResponse {
  success: boolean;
  data: Array<{
    id_tripulante: number;
    crew_id: string;
    nombres: string;
    apellidos: string;
    nombres_apellidos: string;
    pasaporte: string;
    identidad: string;
    posicion: number;
    posicion_info: {
      id_posicion: number;
      codigo_posicion: string;
      descripcion: string;
    };
    aerolinea: {
      id_aerolinea: number;
      descripcion: string;
      siglas: string;
    };
    imagen_url?: string;
    fecha_creacion: string;
  }>;
  pagination: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  message: string;
}

interface CreateTripulanteRequest {
  crew_id: string;
  nombres: string;
  apellidos: string;
  pasaporte: string;
  identidad?: string;
  posicion: number;
  imagen?: string;
  iata_aerolinea: string;
  id_aerolinea?: number;
}

interface PosicionesResponse {
  success: boolean;
  data: Posicion[];
  message: string;
}

class ApiService {
  private token: string | null = null;
  private currentUser: any = null;

  setToken(token: string) {
    this.token = token;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  private getHeaders(isFormData: boolean = false) {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // ✅ Solo agregar Content-Type si NO es FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        login: username,
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
      this.setCurrentUser(data.data.user);
    }

    return data;
  }

  async getTripulantes(page: number = 1, search?: string): Promise<TripulanteResponse> {
    let url = `${API_BASE}/crew?page=${page}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener tripulantes:', errorData);
      throw new Error(errorData.message || 'Error al obtener tripulantes');
    }

    const data = await response.json();
    return data;
  }

  // ✅ Método corregido para React Native
  async createTripulante(tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    pasaporte: string;
    doc_identidad?: string;
    id_posicion: number;
    imageUri?: string;
  }): Promise<any> {
  
    // Verificar que tenemos usuario logueado
    if (!this.currentUser || !this.currentUser.aerolinea) {
      console.error('No hay usuario logueado o falta aerolínea');
      throw new Error('Usuario no autenticado correctamente');
    }
  
    // ✅ Validar id_posicion antes de usar toString()
    if (!tripulanteData.id_posicion || tripulanteData.id_posicion === 0) {
      throw new Error('Debe seleccionar una posición válida');
    }
  
    // ✅ CRÍTICO: Verificar que tenemos id_aerolinea
    if (!this.currentUser.aerolinea.id_aerolinea) {
      console.error('Usuario sin id_aerolinea:', this.currentUser);
      throw new Error('Usuario sin aerolínea válida');
    }
  
    // ✅ Crear FormData para React Native
    const formData = new FormData();
    
    // Agregar campos de texto
    formData.append('crew_id', tripulanteData.crew_id);
    formData.append('nombres', tripulanteData.nombres);
    formData.append('apellidos', tripulanteData.apellidos);
    formData.append('pasaporte', tripulanteData.pasaporte);
    formData.append('posicion', tripulanteData.id_posicion.toString());
    formData.append('iata_aerolinea', this.currentUser.aerolinea.siglas);
    formData.append('id_aerolinea', this.currentUser.aerolinea.id_aerolinea.toString()); // ✅ FIX: Era .id
    
    // Agregar campos opcionales solo si tienen valor
    if (tripulanteData.doc_identidad) {
      formData.append('identidad', tripulanteData.doc_identidad);
    }
    
    // ✅ Agregar imagen para React Native
    if (tripulanteData.imageUri) {
      formData.append('image', {
        uri: tripulanteData.imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }

  
    const response = await fetch(`${API_BASE}/crew`, {
      method: 'POST',
      headers: this.getHeaders(true), // ✅ Indicar que es FormData
      body: formData, // ✅ Enviar FormData directamente
    });
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error del servidor:', errorData);
      throw new Error(errorData.message || 'Error al crear tripulante');
    }
  
    const data = await response.json();
    return data;
  }

  async getTripulante(id: number): Promise<any> {

    const response = await fetch(`${API_BASE}/crew/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener tripulante:', errorData);
      throw new Error(errorData.message || 'Error al obtener tripulante');
    }

    const data = await response.json();
    return data;
  }

  async updateTripulante(id: number, tripulanteData: {
    crew_id?: string;
    nombres?: string;
    apellidos?: string;
    pasaporte?: string;
    doc_identidad?: string;
    id_posicion?: number;
    imageUri?: string; // ✅ También cambiar update para URI
  }): Promise<any> {

    // ✅ Si hay imagen, usar FormData; si no, usar JSON
    if (tripulanteData.imageUri) {
      // Usar FormData para actualización con imagen
      const formData = new FormData();
      
      if (tripulanteData.crew_id !== undefined) formData.append('crew_id', tripulanteData.crew_id);
      if (tripulanteData.nombres !== undefined) formData.append('nombres', tripulanteData.nombres);
      if (tripulanteData.apellidos !== undefined) formData.append('apellidos', tripulanteData.apellidos);
      if (tripulanteData.pasaporte !== undefined) formData.append('pasaporte', tripulanteData.pasaporte);
      if (tripulanteData.doc_identidad !== undefined) formData.append('identidad', tripulanteData.doc_identidad);
      if (tripulanteData.id_posicion !== undefined) formData.append('posicion', tripulanteData.id_posicion.toString());
      
      if (this.currentUser?.aerolinea?.siglas) {
        formData.append('iata_aerolinea', this.currentUser.aerolinea.siglas);
      }
      
      // ✅ Agregar imagen para React Native
      formData.append('image', {
        uri: tripulanteData.imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await fetch(`${API_BASE}/crew/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error al actualizar tripulante:', errorData);
        throw new Error(errorData.message || 'Error al actualizar tripulante');
      }

      const data = await response.json();
      return data;
    } else {
      // Usar JSON para actualización sin imagen
      const requestData: any = {};
      
      if (tripulanteData.crew_id !== undefined) requestData.crew_id = tripulanteData.crew_id;
      if (tripulanteData.nombres !== undefined) requestData.nombres = tripulanteData.nombres;
      if (tripulanteData.apellidos !== undefined) requestData.apellidos = tripulanteData.apellidos;
      if (tripulanteData.pasaporte !== undefined) requestData.pasaporte = tripulanteData.pasaporte;
      if (tripulanteData.doc_identidad !== undefined) requestData.identidad = tripulanteData.doc_identidad;
      if (tripulanteData.id_posicion !== undefined) requestData.posicion = tripulanteData.id_posicion;
      
      if (this.currentUser?.aerolinea?.siglas) {
        requestData.iata_aerolinea = this.currentUser.aerolinea.siglas;
      }

      const response = await fetch(`${API_BASE}/crew/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error al actualizar tripulante:', errorData);
        throw new Error(errorData.message || 'Error al actualizar tripulante');
      }

      const data = await response.json();
      return data;
    }
  }

  async deleteTripulante(id: number): Promise<any> {

    const response = await fetch(`${API_BASE}/crew/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al eliminar tripulante:', errorData);
      throw new Error(errorData.message || 'Error al eliminar tripulante');
    }

    const data = await response.json();
    return data;
  }

  async getPosiciones(): Promise<PosicionesResponse> {

    const response = await fetch(`${API_BASE}/crew/posiciones/lista`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      console.error('Error al obtener posiciones, intentando endpoint alternativo...');
      
      // Intentar endpoint alternativo
      const altResponse = await fetch(`${API_BASE}/crew/posiciones`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!altResponse.ok) {
        const errorData = await altResponse.json().catch(() => ({}));
        console.error('Error al obtener posiciones:', errorData);
        throw new Error(errorData.message || 'Error al obtener posiciones');
      }

      const data = await altResponse.json();
      return data;
    }

    const data = await response.json();
    return data;
  }

  async getUserInfo(): Promise<any> {

    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al obtener información del usuario:', errorData);
      throw new Error(errorData.message || 'Error al obtener información del usuario');
    }

    const data = await response.json();
    return data;
  }

  async refreshToken(): Promise<any> {

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error al refrescar token:', errorData);
      throw new Error(errorData.message || 'Error al refrescar token');
    }

    const data = await response.json();
    
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }

    return data;
  }

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

// Tipos para la app
export interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  is_admin: string;
  aerolinea: {
    id_aerolinea: number;  // ✅ Era "id", debe ser "id_aerolinea"
    descripcion: string;   // ✅ Era "nombre", debe ser "descripcion"
    siglas: string;
    logo_base64?: string;
  };
}

export interface Tripulante {
  id_tripulante: number;
  crew_id: string;
  nombres: string;
  apellidos: string;
  nombres_apellidos: string;
  pasaporte: string;
  identidad?: string;
  posicion_info: {
    id_posicion: number;
    codigo_posicion: string;
    descripcion: string;
  };
  aerolinea: {
    id_aerolinea: number;
    descripcion: string;
    siglas: string;
  };
  imagen_url?: string;
  fecha_creacion: string;
}

export interface Posicion {
  id_posicion: number;
  codigo_posicion: string;
  descripcion: string;
}

// Exportar tipos de respuesta también
export type { LoginResponse, TripulanteResponse, CreateTripulanteRequest, PosicionesResponse };