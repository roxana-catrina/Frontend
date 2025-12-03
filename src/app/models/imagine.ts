export interface Imagine {
  id: string;
  pacientId: string; // Reference to Pacient ID
  nume: string;
  tip: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  
  // Informații despre analiză
  areTumoare?: boolean;
  tipTumoare?: string; // ex: 'glioma', 'meningioma', 'pituitary', etc.
  confidenta?: number; // Procentaj încredere detecție (0-100)
  dataAnalizei?: Date;
  statusAnaliza?: 'neanalizata' | 'in_procesare' | 'finalizata' | 'eroare';
  
  // Observații și detalii
  observatii?: string;
  dataIncarcare?: Date;
  dataModificare?: Date;
}