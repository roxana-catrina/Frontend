export enum StatusProgramare {
  PROGRAMAT = 'PROGRAMAT',
  CONFIRMAT = 'CONFIRMAT',
  IN_DESFASURARE = 'IN_DESFASURARE',
  FINALIZAT = 'FINALIZAT',
  ANULAT = 'ANULAT'
}

export interface Programare {
  id?: string;
  pacientId?: string; // Reference to Pacient ID
  pacientNume: string;
  pacientPrenume: string;
  pacientCnp?: string;
  dataProgramare: Date | string;
  durataMinute?: number;
  tipConsultatie?: string;
  status: StatusProgramare;
  detalii?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ProgramareDTO {
  pacientId?: string; // Reference to Pacient ID
  pacientNume: string;
  pacientPrenume: string;
  pacientCnp?: string;
  dataProgramare: Date | string;
  durataMinute?: number;
  tipConsultatie?: string;
  detalii?: string;
}
