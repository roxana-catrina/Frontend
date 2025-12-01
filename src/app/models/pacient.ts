import { Imagine } from './imagine';

export enum Sex {
  MASCULIN = 'MASCULIN',
  FEMININ = 'FEMININ'
}

export interface Pacient {
  id: string;
  userId: string; // Reference to User ID
  numePacient: string;
  prenumePacient: string;
  sex: Sex;
  detalii?: string;
  dataNasterii: string; // LocalDate from backend
  cnp: string;
  numarTelefon: string;
  istoricMedical?: string;
  imagini: Imagine[]; // List of images
}
