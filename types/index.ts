// Types for the CrewManager Tripulante App

export interface TripulanteProfile {
  id_solicitud: number;
  crew_id: string;
  nombres: string;
  apellidos: string;
  nombres_apellidos: string;
  pasaporte: string;
  identidad?: string;
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

export interface SolicitudRegistro {
  crew_id: string;
  nombres: string;
  apellidos: string;
  pasaporte: string;
  identidad?: string;
  posicion: number;
  password: string;
  imageUri?: string;
}

export interface EstadoSolicitud {
  crew_id: string;
  nombres_apellidos: string;
  estado: 'Pendiente' | 'Aprobado' | 'Denegado';
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  motivo_rechazo?: string;
}

export interface Posicion {
  id_posicion: number;
  codigo_posicion: string;
  descripcion: string;
}