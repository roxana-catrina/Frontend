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
  sliceLocation?: string;
  seriesInstanceUID?: string;
  instanceNumber?: number;
  [key: string]: any; // Pentru alte metadate custom
}

// ── Segmentare tumoră ────────────────────────────────────────────────────────

export interface TumorDimensions {
  widthPixels: number;
  heightPixels: number;
  widthMm: number;
  heightMm: number;
  areaPixels: number;
  areaMm2: number;
  tumorPercentage: number;
  pixelSpacingMm: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentationResult {
  overlayImageBase64: string;
  contourImageBase64: string;
  dimensions: TumorDimensions;
  boundingBox: BoundingBox;
  tumorAreaPixels: number;
  tumorPercentage: number;
}

export interface PredictionResponse {
  success: boolean;
  prediction: string;
  hasTumor: boolean;
  confidence: number;
  tumorType?: string;
  tumorTypeConfidence?: number;
  tumorTypeProbabilities?: { [key: string]: number };
  segmentation?: SegmentationResult;
}

// ── Imagine ──────────────────────────────────────────────────────────────────

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
  
  // Serie DICOM — dacă face parte dintr-o serie, are seriesId
  seriesId?: string;
  
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

// ── Serie DICOM (grupare de slice-uri) ───────────────────────────────────────

export interface DicomSeries {
  id: string;           // ID unic generat la upload
  name: string;         // Nume serie (ex: "Serie RMN Craniu")
  modality: string;     // CT, MR, etc.
  sliceCount: number;   // Număr de slice-uri
  sliceIds: string[];   // ID-urile imaginilor din serie
  createdAt: Date;
}