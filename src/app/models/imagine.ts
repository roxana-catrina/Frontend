export interface DicomMetadata {
  patientName?: string;
  patientID?: string;
  patientBirthDate?: string;
  patientSex?: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  seriesDescription?: string;
  modality?: string;
  institutionName?: string;
  manufacturer?: string;
  manufacturerModelName?: string;
  sliceThickness?: string;
  imagePosition?: string;
  imageOrientation?: string;
  pixelSpacing?: string;
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  samplesPerPixel?: number;
  photometricInterpretation?: string;
  windowCenter?: string;
  windowWidth?: string;
  rescaleIntercept?: string;
  rescaleSlope?: string;
  [key: string]: any; // Pentru alte metadate custom
}

export interface Imagine {
  id: string;
  pacientId: string; // Reference to Pacient ID
  nume: string;
  tip: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  
  // DICOM metadata
  isDicom?: boolean;
  dicomMetadata?: DicomMetadata;
  
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