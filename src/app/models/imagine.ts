export interface Imagine {
  id: string;
  pacientId: string; // Reference to Pacient ID
  nume: string;
  tip: string;
  imageUrl: string;
  cloudinaryPublicId: string;
}