export interface Crew {
    crewId: string;
    nombres: string;
    apellidos: string;
    posicion: string;
    pasaporte: string;
    docIdentidad?: string;
  }
  
  export interface CrewMember extends Crew {
    id: string;
    photoUri?: string;
    createdAt: string;
    synced: boolean;
  }