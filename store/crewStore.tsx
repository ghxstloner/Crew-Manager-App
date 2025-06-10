import { createContext, useContext, useState, PropsWithChildren } from 'react';
import { apiService, Tripulante, Posicion } from '../services/api';

interface CrewContextType {
  tripulantes: Tripulante[];
  posiciones: Posicion[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  loadTripulantes: (page?: number, search?: string) => Promise<void>;
  loadPosiciones: () => Promise<void>;
  createTripulante: (tripulante: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    pasaporte: string;
    doc_identidad?: string;
    id_posicion: number;
    imageUri?: string;
  }) => Promise<void>;
  updateTripulante: (id: number, tripulante: {
    crew_id?: string;
    nombres?: string;
    apellidos?: string;
    pasaporte?: string;
    doc_identidad?: string;
    id_posicion?: number;
    imageUri?: string;
  }) => Promise<void>;
  deleteTripulante: (id: number) => Promise<void>;
  getTripulante: (id: number) => Promise<Tripulante>;
}

const CrewContext = createContext<CrewContextType>({
  tripulantes: [],
  posiciones: [],
  loading: false,
  totalPages: 0,
  currentPage: 1,
  loadTripulantes: async () => {},
  loadPosiciones: async () => {},
  createTripulante: async () => {},
  updateTripulante: async () => {},
  deleteTripulante: async () => {},
  getTripulante: async () => ({} as Tripulante),
});

export function useCrew() {
  const context = useContext(CrewContext);
  if (!context) {
    throw new Error('useCrew must be used within a CrewProvider');
  }
  return context;
}

export function CrewProvider({ children }: PropsWithChildren) {
  const [tripulantes, setTripulantes] = useState<Tripulante[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const loadTripulantes = async (page: number = 1, search?: string) => {
    setLoading(true);
    try {
      (`📋 Cargando tripulantes - Página: ${page}, Búsqueda: ${search || 'N/A'}`);
      
      const response = await apiService.getTripulantes(page, search);
      
      if (response.success) {
        setTripulantes(response.data || []);
        setTotalPages(Math.ceil(response.pagination.total / response.pagination.per_page));
        setCurrentPage(response.pagination.current_page);
        
        (`✅ Tripulantes cargados: ${response.data?.length || 0} registros`);
      } else {
        console.error('❌ Respuesta no exitosa:', response);
        throw new Error(response.message || 'Error al cargar tripulantes');
      }
    } catch (error: any) {
      console.error('❌ Error loading tripulantes:', error);
      throw new Error(error.message || 'Error al cargar tripulantes');
    } finally {
      setLoading(false);
    }
  };

  const loadPosiciones = async () => {
    try {
      ('📋 Cargando posiciones...');
      
      const response = await apiService.getPosiciones();
      
      if (response.success && Array.isArray(response.data)) {
        // ✅ Validar que todas las posiciones tengan datos válidos
        const validPosiciones = response.data.filter(pos => 
          pos && 
          typeof pos.id_posicion === 'number' && 
          pos.id_posicion > 0 &&
          pos.codigo_posicion &&
          pos.descripcion
        );
        
        setPosiciones(validPosiciones);
        (`✅ Posiciones cargadas: ${validPosiciones.length} registros válidos`);
        
        if (validPosiciones.length !== response.data.length) {
          console.warn(`⚠️ Se filtraron ${response.data.length - validPosiciones.length} posiciones inválidas`);
        }
      } else {
        console.error('❌ Respuesta de posiciones inválida:', response);
        throw new Error(response.message || 'Error al cargar posiciones');
      }
    } catch (error: any) {
      console.error('❌ Error loading posiciones:', error);
      throw new Error(error.message || 'Error al cargar posiciones');
    }
  };

  const createTripulante = async (tripulanteData: {
    crew_id: string;
    nombres: string;
    apellidos: string;
    pasaporte: string;
    doc_identidad?: string;
    id_posicion: number;
    imageUri?: string;
  }) => {
    ('=== 🚀 INICIANDO CREACIÓN DE TRIPULANTE ===');
    ('Datos recibidos en store:', {
      crew_id: tripulanteData.crew_id,
      nombres: tripulanteData.nombres,
      apellidos: tripulanteData.apellidos,
      pasaporte: tripulanteData.pasaporte,
      doc_identidad: tripulanteData.doc_identidad || 'N/A',
      id_posicion: tripulanteData.id_posicion,
      id_posicion_type: typeof tripulanteData.id_posicion,
      imageUri: tripulanteData.imageUri ? 'Presente' : 'Ausente'
    });

    // ✅ VALIDACIONES ROBUSTAS ANTES DE ENVIAR AL API
    try {
      // Validar campos requeridos
      if (!tripulanteData.crew_id?.trim()) {
        throw new Error('Crew ID es requerido');
      }
      
      if (!tripulanteData.nombres?.trim()) {
        throw new Error('Nombres es requerido');
      }
      
      if (!tripulanteData.apellidos?.trim()) {
        throw new Error('Apellidos es requerido');
      }
      
      if (!tripulanteData.pasaporte?.trim()) {
        throw new Error('Pasaporte es requerido');
      }

      // ✅ VALIDACIÓN CRÍTICA DE id_posicion
      if (tripulanteData.id_posicion === undefined || tripulanteData.id_posicion === null) {
        console.error('❌ id_posicion es undefined/null:', tripulanteData.id_posicion);
        throw new Error('Debe seleccionar una posición válida');
      }

      if (typeof tripulanteData.id_posicion !== 'number') {
        console.error('❌ id_posicion no es número:', {
          value: tripulanteData.id_posicion,
          type: typeof tripulanteData.id_posicion
        });
        throw new Error('ID de posición debe ser un número');
      }

      if (tripulanteData.id_posicion <= 0) {
        console.error('❌ id_posicion no es válido:', tripulanteData.id_posicion);
        throw new Error('ID de posición debe ser mayor a 0');
      }

      // Validar que la posición existe en la lista
      const posicionExiste = posiciones.find(pos => pos.id_posicion === tripulanteData.id_posicion);
      if (!posicionExiste) {
        console.error('❌ Posición no encontrada en la lista:', {
          id_posicion: tripulanteData.id_posicion,
          posiciones_disponibles: posiciones.map(p => ({ id: p.id_posicion, codigo: p.codigo_posicion }))
        });
        throw new Error('La posición seleccionada no es válida');
      }

      ('✅ Todas las validaciones pasaron, enviando al API...');

      // Llamar al API service
      const response = await apiService.createTripulante(tripulanteData);
      
      if (response.success) {
        ('✅ Tripulante creado exitosamente');
        
        // Recargar la lista para mostrar el nuevo tripulante
        await loadTripulantes(1);
        
        ('✅ Lista de tripulantes actualizada');
      } else {
        console.error('❌ API response no exitosa:', response);
        throw new Error(response.message || 'Error al crear tripulante');
      }
    } catch (error: any) {
      console.error('❌ Error creating tripulante:', error);
      
      // Mejorar el mensaje de error según el tipo
      if (error.message?.includes('toString')) {
        throw new Error('Error de datos: Verifique que todos los campos estén completos correctamente');
      } else if (error.message?.includes('fetch')) {
        throw new Error('Error de conexión: Verifique su conexión a internet');
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        throw new Error('Sesión expirada: Por favor inicie sesión nuevamente');
      } else {
        throw new Error(error.message || 'Error inesperado al crear tripulante');
      }
    }
  };

  const updateTripulante = async (id: number, tripulanteData: {
    crew_id?: string;
    nombres?: string;
    apellidos?: string;
    pasaporte?: string;
    doc_identidad?: string;
    id_posicion?: number;
    imageUri?: string;
  }) => {
    (`=== 📝 ACTUALIZANDO TRIPULANTE ${id} ===`);
    try {
      // Validar ID
      if (!id || id <= 0) {
        throw new Error('ID de tripulante inválido');
      }

      // Validar campos requeridos si están presentes
      if (tripulanteData.crew_id !== undefined && !tripulanteData.crew_id.trim()) {
        throw new Error('Crew ID es requerido');
      }
      if (tripulanteData.nombres !== undefined && !tripulanteData.nombres.trim()) {
        throw new Error('Nombres es requerido');
      }
      if (tripulanteData.apellidos !== undefined && !tripulanteData.apellidos.trim()) {
        throw new Error('Apellidos es requerido');
      }
      if (tripulanteData.pasaporte !== undefined && !tripulanteData.pasaporte.trim()) {
        throw new Error('Pasaporte es requerido');
      }

      // Validar id_posicion si está presente
      if (tripulanteData.id_posicion !== undefined) {
        if (typeof tripulanteData.id_posicion !== 'number' || tripulanteData.id_posicion <= 0) {
          throw new Error('ID de posición debe ser un número válido mayor a 0');
        }
        const posicionExiste = posiciones.find(pos => pos.id_posicion === tripulanteData.id_posicion);
        if (!posicionExiste) {
          throw new Error('La posición seleccionada no es válida');
        }
      }

      // Llamar al API service
      const response = await apiService.updateTripulante(id, tripulanteData);
      if (response.success) {
        ('✅ Tripulante actualizado exitosamente');
        await loadTripulantes(currentPage);
      } else {
        throw new Error(response.message || 'Error al actualizar tripulante');
      }
    } catch (error: any) {
      console.error('❌ Error updating tripulante:', error);
      // Mejorar el mensaje de error según el tipo
      if (error.message?.includes('toString')) {
        throw new Error('Error de datos: Verifique que todos los campos estén completos correctamente');
      } else if (error.message?.includes('fetch')) {
        throw new Error('Error de conexión: Verifique su conexión a internet');
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        throw new Error('Sesión expirada: Por favor inicie sesión nuevamente');
      } else {
        throw new Error(error.message || 'Error inesperado al actualizar tripulante');
      }
    }
  };

  const deleteTripulante = async (id: number) => {
    (`=== 🗑️ ELIMINANDO TRIPULANTE ${id} ===`);
    
    try {
      if (!id || id <= 0) {
        throw new Error('ID de tripulante inválido');
      }

      const response = await apiService.deleteTripulante(id);
      
      if (response.success) {
        ('✅ Tripulante eliminado exitosamente');
        await loadTripulantes(currentPage);
      } else {
        throw new Error(response.message || 'Error al eliminar tripulante');
      }
    } catch (error: any) {
      console.error('❌ Error deleting tripulante:', error);
      throw new Error(error.message || 'Error al eliminar tripulante');
    }
  };

  const getTripulante = async (id: number): Promise<Tripulante> => {
    (`=== 👤 OBTENIENDO TRIPULANTE ${id} ===`);
    
    try {
      if (!id || id <= 0) {
        throw new Error('ID de tripulante inválido');
      }

      const response = await apiService.getTripulante(id);
      
      if (response.success && response.data) {
        ('✅ Tripulante obtenido exitosamente');
        return response.data;
      } else {
        throw new Error(response.message || 'Tripulante no encontrado');
      }
    } catch (error: any) {
      console.error('❌ Error getting tripulante:', error);
      throw new Error(error.message || 'Error al obtener tripulante');
    }
  };

  // ✅ Función de utilidad para validar posiciones cargadas
  const validatePosicionesLoaded = () => {
    if (!posiciones || posiciones.length === 0) {
      console.warn('⚠️ No hay posiciones cargadas');
      return false;
    }
    return true;
  };

  return (
    <CrewContext.Provider value={{ 
      tripulantes, 
      posiciones,
      loading, 
      totalPages,
      currentPage,
      loadTripulantes, 
      loadPosiciones,
      createTripulante,
      updateTripulante,
      deleteTripulante,
      getTripulante
    }}>
      {children}
    </CrewContext.Provider>
  );
}

// ✅ Hook adicional para debugging
export function useCrewDebug() {
  const crew = useCrew();
  
  const debugInfo = () => {
    ('=== 🔍 CREW STORE DEBUG INFO ===');
    ('Tripulantes:', crew.tripulantes.length);
    ('Posiciones:', crew.posiciones.length);
    ('Loading:', crew.loading);
    ('Current Page:', crew.currentPage);
    ('Total Pages:', crew.totalPages);
    ('Posiciones detalle:', crew.posiciones.map(p => ({
      id: p.id_posicion,
      codigo: p.codigo_posicion,
      descripcion: p.descripcion
    })));
  };

  return { ...crew, debugInfo };
}