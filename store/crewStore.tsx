import { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrewMember } from '../types';

interface CrewContextType {
  crew: CrewMember[];
  loading: boolean;
  addCrew: (member: CrewMember) => Promise<void>;
  updateCrew: (id: string, member: Partial<CrewMember>) => Promise<void>;
  deleteCrew: (id: string) => Promise<void>;
  loadCrew: () => Promise<void>;
  syncCrew: () => Promise<void>;
}

const CrewContext = createContext<CrewContextType>({
  crew: [],
  loading: false,
  addCrew: async () => {},
  updateCrew: async () => {},
  deleteCrew: async () => {},
  loadCrew: async () => {},
  syncCrew: async () => {},
});

export function useCrew() {
  const context = useContext(CrewContext);
  if (!context) {
    throw new Error('useCrew must be used within a CrewProvider');
  }
  return context;
}

export function CrewProvider({ children }: PropsWithChildren) {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCrew();
  }, []);

  const loadCrew = async () => {
    setLoading(true);
    try {
      const storedCrew = await AsyncStorage.getItem('crew');
      if (storedCrew) {
        setCrew(JSON.parse(storedCrew));
      }
    } catch (error) {
      console.error('Error loading crew:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCrew = async (newCrew: CrewMember[]) => {
    try {
      await AsyncStorage.setItem('crew', JSON.stringify(newCrew));
      setCrew(newCrew);
    } catch (error) {
      console.error('Error saving crew:', error);
      throw error;
    }
  };

  const addCrew = async (member: CrewMember) => {
    const newCrew = [...crew, member];
    await saveCrew(newCrew);
  };

  const updateCrew = async (id: string, updates: Partial<CrewMember>) => {
    const newCrew = crew.map(member => 
      member.id === id ? { ...member, ...updates } : member
    );
    await saveCrew(newCrew);
  };

  const deleteCrew = async (id: string) => {
    const newCrew = crew.filter(member => member.id !== id);
    await saveCrew(newCrew);
  };

  const syncCrew = async () => {
    // Aquí iría la lógica de sincronización con el servidor
    // Por ahora solo marcamos todos como sincronizados
    const syncedCrew = crew.map(member => ({ ...member, synced: true }));
    await saveCrew(syncedCrew);
  };

  return (
    <CrewContext.Provider value={{ crew, loading, addCrew, updateCrew, deleteCrew, loadCrew, syncCrew }}>
      {children}
    </CrewContext.Provider>
  );
}