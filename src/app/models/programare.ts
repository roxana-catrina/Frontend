export enum StatusProgramare {
  PROGRAMAT = 'PROGRAMAT',
  CONFIRMAT = 'CONFIRMAT',
  IN_DESFASURARE = 'IN_DESFASURARE',
  FINALIZAT = 'FINALIZAT',
  ANULAT = 'ANULAT'
}

export interface Programare {
  id?: number;
  userId: number;
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
  userId: number;
  pacientNume: string;
  pacientPrenume: string;
  pacientCnp?: string;
  dataProgramare: Date | string;
  durataMinute?: number;
  tipConsultatie?: string;
  detalii?: string;
}
