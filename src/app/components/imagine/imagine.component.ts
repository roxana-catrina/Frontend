import { Component, OnInit, AfterViewChecked, PLATFORM_ID, Inject, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Imagine, DicomMetadata, SegmentationResult, PredictionResponse } from '../../models/imagine';
import { Pacient } from '../../models/pacient';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { ImagineService } from '../../service/imagine/imagine.service';
import { PacientService } from '../../service/pacient/pacient.service';
import { BrainTumorService } from '../../service/brain-tumor/brain-tumor.service';
import { UserService } from '../../service/user/user.service';
import { MesajService } from '../../service/mesaj/mesaj.service';
import { MesajRequest } from '../../models/mesaj';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import * as dicomParser from 'dicom-parser';

@Component({
  selector: 'app-imagine',
  templateUrl: './imagine.component.html',
  styleUrls: ['./imagine.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ImagineComponent implements OnInit, AfterViewChecked {
  image: Imagine | null = null;
  pacient: Pacient | null = null;
  isZoomed: boolean = false;
  zoomLevel: number = 1;
  isDragging: boolean = false;
  startX: number = 0;
  startY: number = 0;
  translateX: number = 0;
  translateY: number = 0;
  
  // Observații
  isEditingObservatii: boolean = false;
  observatiiEdit: string = '';
  
  // Modal informații imagine
  showImageInfoModal: boolean = false;
  imageFormData: any = {
    nume: '',
    tip: '',
    observatii: ''
  };
  isAnalyzing: boolean = false;
  
  // Modal adaugă imagine nouă
  showAddImageModal: boolean = false;
  newImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  newImageData: any = {
    nume: '',
    tip: '',
    observatii: ''
  };
  autoAnalyze: boolean = false;
  isUploading: boolean = false;

  // Upload serie DICOM (multiple)
  isUploadingSeries: boolean = false;
  seriesUploadProgress: number = 0;
  seriesUploadTotal: number = 0;
  
  // DICOM support
  isDicomFile: boolean = false;
  dicomMetadata: DicomMetadata | null = null;
  showDicomMetadataModal: boolean = false;
  dicomImageDataUrl: string = ''; // Data URL generat din canvas DICOM pentru zoom/adnotare

  // Toast notifications
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastIcon: string = '';

  // Modal poza profil pacient
  showProfilePictureModal: boolean = false;
  profilePictureFile: File | null = null;
  profilePicturePreviewUrl: string | null = null;
  isUploadingProfile: boolean = false;

  // Partajare pacient prin mesagerie
  showSharePatientModal: boolean = false;
  allDoctors: any[] = [];
  filteredDoctors: any[] = [];
  searchDoctor: string = '';
  selectedDoctor: any = null;
  isSharingPatient: boolean = false;

  // Segmentare tumoră
  segmentationResult: SegmentationResult | null = null;
  showOverlay: boolean = true; // toggle între overlay și contour

  // Reconstrucție 3D MPR
  canReconstruct3D: boolean = false;
  dicomSeriesSlices: Imagine[] = [];
  show3DModal: boolean = false;
  is3DLoading: boolean = false;
  mprView: 'axial' | 'sagittal' | 'coronal' = 'axial';
  mprSliceIndex: number = 0;
  mprMaxSlice: number = 0;
  private volumeData: Int16Array | null = null;
  volumeRows: number = 0;
  volumeCols: number = 0;
  volumeSlices: number = 0;
  @ViewChild('mprCanvas', { static: false }) mprCanvas?: ElementRef<HTMLCanvasElement>;
  
  // ViewChild pentru canvas DICOM
  @ViewChild('dicomCanvas', { static: false }) dicomCanvas?: ElementRef<HTMLDivElement>;

  // Adnotare imagine
  isAnnotating: boolean = false;
  annotationTool: 'text' | 'pen' | 'eraser' = 'pen';
  annotationColor: string = '#FF0000';
  annotationFontSize: number = 20;
  annotationText: string = '';
  eraserSize: number = 20;
  isSavingAnnotation: boolean = false;
  private isDrawingOnCanvas: boolean = false;
  private drawStartX: number = 0;
  private drawStartY: number = 0;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvasInitialized: boolean = false;

  @ViewChild('annotationCanvas', { static: false }) annotationCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('baseImage', { static: false }) baseImage?: ElementRef<HTMLImageElement>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private imageService: ImagineService,
    private pacientService: PacientService,
    private brainTumorService: BrainTumorService,
    private userService: UserService,
    private mesajService: MesajService
  ) {}

  ngAfterViewChecked(): void {
    // Inițializează canvas-ul de adnotare când devine disponibil
    if (this.isAnnotating && this.annotationCanvas && this.baseImage && !this.canvasInitialized) {
      this.initAnnotationCanvas();
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const imageId = params.get('id');
      const pacientId = params.get('pacientId');
      const userId = localStorage.getItem('id');

      if (pacientId && userId) {
        // Încarcă pacientul direct fără imagine
        this.loadPacientData(pacientId, userId);
      } else if (imageId && userId) {
        // Încarcă imaginea (fluxul original)
        this.loadImageData(imageId, userId);
      }
    });
  }

  loadPacientData(pacientId: string, userId: string) {
    // Încarcă direct pacientul când nu are imagini
    this.pacientService.getAllPacienti(userId).subscribe({
      next: (pacienti: Pacient[]) => {
        const foundPacient = pacienti.find(p => p.id === pacientId);
        if (foundPacient) {
          this.pacient = foundPacient;
          this.image = null; // Nu avem imagine selectată
          this.observatiiEdit = '';
          
          // Reset editing states
          this.isEditingObservatii = false;
          this.isZoomed = false;
          this.isAnalyzing = false;
          this.resetZoom();
          
          console.log('Patient loaded without image:', this.pacient);
        } else {
          console.error('Patient not found');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error: any) => {
        console.error('Error loading patient:', error);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loadImageData(imageId: string, userId: string) {
    // First, get all patients to find which patient has this image
    this.pacientService.getAllPacienti(userId).subscribe({
      next: (pacienti: Pacient[]) => {
        // Find the patient that has this image
        for (const p of pacienti) {
          const foundImage = p.imagini?.find(img => img.id === imageId);
          if (foundImage) {
            this.image = foundImage;
            this.pacient = p;
            this.observatiiEdit = this.image.observatii || '';
            
            // Reset editing states
            this.isEditingObservatii = false;
            this.isZoomed = false;
            this.isAnalyzing = false;  // Reset analyzing flag când schimbăm imaginea
            this.segmentationResult = null; // Reset segmentare la schimbarea imaginii
            this.resetZoom();
            
            // Verifică dacă pacientul are suficiente slice-uri DICOM pentru reconstrucție 3D
            this.check3DReconstructionAvailability();
            
            console.log('Image and patient loaded:', this.image, this.pacient);
            
            // Dacă este DICOM, încarcă-l în canvas
            if (this.image.isDicom) {
              setTimeout(() => this.loadDicomImage(), 300);
            }
            
            return;
          }
        }
        // If no image found, navigate back
        console.error('Image not found');
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        console.error('Error loading patients:', error);
        this.router.navigate(['/dashboard']);
      }
    });
  }

    
  

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  selectImage(img: Imagine) {
    // Just navigate to the new image URL
    // The paramMap subscription in ngOnInit will handle reloading the data
    this.router.navigate(['/dashboard/imagine', img.id]);
  }

  toggleZoom() {
    this.isZoomed = !this.isZoomed;
    if (this.isZoomed) {
      this.zoomLevel = 1.5; // Start cu zoom moderat
    } else {
      this.resetZoom();
    }
  }

  /**
   * Deschide zoom-ul pentru imagini DICOM.
   * Convertește canvas-ul DICOM curent într-un data URL PNG
   * și deschide același modal de zoom + adnotare.
   */
  openDicomZoom(): void {
    if (!this.dicomCanvas?.nativeElement) return;

    const container = this.dicomCanvas.nativeElement;
    const sourceCanvas = container.querySelector('canvas') as HTMLCanvasElement;

    if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      // Cornerstone poate avea restricții pe toDataURL.
      // Creăm un canvas nou și copiem pixelii manual.
      try {
        // Încercăm toDataURL direct
        const dataUrl = sourceCanvas.toDataURL('image/png');
        if (dataUrl && dataUrl.length > 100) {
          this.dicomImageDataUrl = dataUrl;
        } else {
          throw new Error('toDataURL returned empty');
        }
      } catch (e) {
        // Fallback: copiem pixelii pe un canvas nou
        console.warn('⚠️ toDataURL eșuat, copiez pixelii manual');
        const copyCanvas = document.createElement('canvas');
        copyCanvas.width = sourceCanvas.width;
        copyCanvas.height = sourceCanvas.height;
        const copyCtx = copyCanvas.getContext('2d')!;
        copyCtx.drawImage(sourceCanvas, 0, 0);
        this.dicomImageDataUrl = copyCanvas.toDataURL('image/png');
      }
    } else {
      // Fallback: dacă nu găsim canvas-ul cornerstone, folosim URL-ul direct
      console.warn('⚠️ Canvas DICOM nu e disponibil');
      this.dicomImageDataUrl = this.image?.imageUrl || '';
    }

    console.log('📸 DICOM data URL generat, lungime:', this.dicomImageDataUrl.length);
    this.isZoomed = true;
    this.zoomLevel = 1;
  }

  closeZoom() {
    this.isZoomed = false;
    this.isAnnotating = false;
    this.canvasInitialized = false;
    this.ctx = null;
    this.resetZoom();
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
  }

  zoomIn() {
    if (this.zoomLevel < 5) {
      this.zoomLevel += 0.5;
    }
  }

  zoomOut() {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.5;
    }
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  onMouseDown(event: MouseEvent) {
    // Drag doar când nu desenăm și zoom > 1
    if (!this.isAnnotating && this.zoomLevel > 1) {
      this.isDragging = true;
      this.startX = event.clientX - this.translateX;
      this.startY = event.clientY - this.translateY;
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.translateX = event.clientX - this.startX;
      this.translateY = event.clientY - this.startY;
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  getImageTransform(): string {
    return `scale(${this.zoomLevel}) translate(${this.translateX / this.zoomLevel}px, ${this.translateY / this.zoomLevel}px)`;
  }


  
  
  // ===================== ADNOTARE IMAGINE =====================

  toggleAnnotationMode(): void {
    this.isAnnotating = !this.isAnnotating;
    this.canvasInitialized = false;
    this.ctx = null;
  }

  private initAnnotationCanvas(): void {
    const canvas = this.annotationCanvas?.nativeElement;
    const img = this.baseImage?.nativeElement;
    if (!canvas || !img) return;

    // Canvas dimensionat la dimensiunile NATURALE ale imaginii
    // Desenăm în spațiul imaginii originale — zoom-ul CSS nu afectează coordonatele
    canvas.width = img.naturalWidth || img.offsetWidth;
    canvas.height = img.naturalHeight || img.offsetHeight;

    this.ctx = canvas.getContext('2d');
    this.canvasInitialized = true;
  }

  /**
   * Convertește coordonatele mouse în coordonate ale imaginii naturale.
   * getBoundingClientRect() returnează rect-ul DUPĂ transformarea CSS (zoom),
   * deci împărțind la scaleX/scaleY obținem coordonatele în spațiul natural.
   */
  private getCanvasPos(event: MouseEvent): { x: number; y: number } {
    const img = this.baseImage?.nativeElement;
    if (!img) return { x: 0, y: 0 };

    const imgRect = img.getBoundingClientRect();
    // scaleX = naturalWidth / lățimea afișată după zoom
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    return {
      x: (event.clientX - imgRect.left) * scaleX,
      y: (event.clientY - imgRect.top) * scaleY
    };
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (!this.isAnnotating || !this.ctx) return;
    event.preventDefault();
    event.stopPropagation();

    this.isDrawingOnCanvas = true;
    const pos = this.getCanvasPos(event);

    if (this.annotationTool === 'pen') {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    } else if (this.annotationTool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    }
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isDrawingOnCanvas || !this.ctx) return;
    event.preventDefault();
    event.stopPropagation();

    const pos = this.getCanvasPos(event);

    if (this.annotationTool === 'pen') {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.annotationColor;
      // lineWidth în spațiul natural — arată constant indiferent de zoom
      this.ctx.lineWidth = 3 / this.zoomLevel;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    } else if (this.annotationTool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = this.eraserSize / this.zoomLevel;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    }
  }

  onCanvasMouseUp(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDrawingOnCanvas = false;
    if (this.ctx) {
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  onCanvasClick(event: MouseEvent): void {
    if (!this.isAnnotating || this.annotationTool !== 'text' || !this.ctx) return;
    event.preventDefault();
    event.stopPropagation();

    const text = this.annotationText.trim();
    if (!text) return;

    const pos = this.getCanvasPos(event);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.annotationColor;
    // Font în spațiul natural — arată constant indiferent de zoom
    this.ctx.font = `bold ${this.annotationFontSize / this.zoomLevel}px Arial`;
    this.ctx.fillText(text, pos.x, pos.y);
  }

  onCanvasWheel(event: WheelEvent): void {
    // Scroll pe canvas → zoom (nu desenăm cu scroll)
    event.preventDefault();
    event.stopPropagation();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  clearAnnotations(): void {
    if (!this.ctx || !this.annotationCanvas) return;
    const canvas = this.annotationCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  saveAnnotatedImage(): void {
    if (!this.image || !this.pacient || !this.annotationCanvas || !this.baseImage) return;

    this.isSavingAnnotation = true;
    const imgEl = this.baseImage.nativeElement;
    const annotCanvas = this.annotationCanvas.nativeElement;

    const img = new Image();

    img.onload = () => {
      // Canvas final = dimensiunile naturale ale imaginii încărcate
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      if (w === 0 || h === 0) {
        this.isSavingAnnotation = false;
        this.showToastMessage('Eroare: imaginea nu are dimensiuni valide.', 'error');
        return;
      }

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = w;
      finalCanvas.height = h;
      const finalCtx = finalCanvas.getContext('2d')!;

      // Imaginea originală
      finalCtx.drawImage(img, 0, 0, w, h);
      // Adnotările suprapuse
      finalCtx.drawImage(annotCanvas, 0, 0, w, h);

      const base64 = finalCanvas.toDataURL('image/png');
      this.uploadAnnotatedImage(base64);
    };

    img.onerror = (err) => {
      console.error('❌ Eroare la încărcarea imaginii pentru salvare:', err);
      this.isSavingAnnotation = false;
      this.showToastMessage('Eroare la procesarea imaginii.', 'error');
    };

    // Pentru DICOM, folosim data URL-ul PNG generat din canvas-ul Cornerstone
    if (this.image.isDicom && this.dicomImageDataUrl) {
      // Data URL — nu setăm crossOrigin
      img.src = this.dicomImageDataUrl;
    } else {
      // URL extern (Cloudinary) — necesită crossOrigin
      img.crossOrigin = 'anonymous';
      img.src = this.image.imageUrl;
    }
  }

  private uploadAnnotatedImage(base64: string): void {
    const userId = localStorage.getItem('id');
    if (!userId || !this.image || !this.pacient) return;

    const wasDicom = this.image.isDicom;

    this.imageService.saveAnnotatedImage(userId, this.pacient.id, this.image.id, base64).subscribe({
      next: (updated: Imagine) => {
        // Dacă era DICOM, acum e PNG pe Cloudinary — marcăm ca non-DICOM
        if (wasDicom) {
          updated.isDicom = false;
          this.dicomImageDataUrl = '';
        }

        this.image = updated;
        if (this.pacient?.imagini) {
          const idx = this.pacient.imagini.findIndex(i => i.id === updated.id);
          if (idx !== -1) this.pacient.imagini[idx] = updated;
        }
        this.isSavingAnnotation = false;
        this.isAnnotating = false;
        this.canvasInitialized = false;
        this.ctx = null;
        this.showToastMessage('Imaginea adnotată a fost salvată cu succes!', 'success');
      },
      error: (error: any) => {
        console.error('❌ Eroare la salvarea imaginii adnotate:', error);
        this.isSavingAnnotation = false;
        this.showToastMessage('Eroare la salvarea imaginii adnotate: ' + (error.error?.message || error.message), 'error');
      }
    });
  }

  // ===================== SFÂRŞIT ADNOTARE =====================

  deleteImage(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Ești sigur că vrei să ștergi această imagine?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const userId = localStorage.getItem('id');
        if (!userId || !this.image || !this.pacient) {
          console.error('Lipsesc informații');
          return;
        }

        this.imageService.deleteImage(this.image.id, userId, this.pacient.id)
          .subscribe({
            next: () => {
              const event = new CustomEvent('imageDeleted', {
                detail: { imageId: this.image?.id }
              });
              window.dispatchEvent(event);
              this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
              console.error('Eroare la ștergere:', err);
              this.router.navigate(['/dashboard']);
            }
          });
      }
    });
  }

  // Metode pentru observații
  startEditObservatii(): void {
    this.isEditingObservatii = true;
    this.observatiiEdit = this.image?.observatii || '';
  }

  cancelEditObservatii(): void {
    this.isEditingObservatii = false;
    this.observatiiEdit = this.image?.observatii || '';
  }

  saveObservatii(): void {
    if (!this.image || !this.pacient) return;

    const userId = localStorage.getItem('id');
    if (!userId) return;

    // Update local
    this.image.observatii = this.observatiiEdit;
    this.image.dataModificare = new Date();

    // Update în backend
    this.imageService.updateImage(this.image.id, this.pacient.id, userId, this.image).subscribe({
      next: (updated) => {
        console.log('✅ Observații salvate:', updated);
        this.image = updated;
        this.isEditingObservatii = false;
      },
      error: (error) => {
        console.error('❌ Eroare la salvarea observațiilor:', error);
        alert('Eroare la salvarea observațiilor');
      }
    });
  }

  // Metode pentru analiză
  getAnalysisStatus(): string {
    if (!this.image?.statusAnaliza) return 'Neanalizată';
    
    switch (this.image.statusAnaliza) {
      case 'neanalizata': return 'Neanalizată';
      case 'in_procesare': return 'În procesare...';
      case 'finalizata': return this.image.areTumoare ? 'Tumoare detectată' : 'Fără tumoare';
      case 'eroare': return 'Eroare la analiză';
      default: return 'Necunoscută';
    }
  }

  getAnalysisBadgeClass(): string {
    if (!this.image?.statusAnaliza) return 'badge-secondary';
    
    switch (this.image.statusAnaliza) {
      case 'neanalizata': return 'badge-secondary';
      case 'in_procesare': return 'badge-warning';
      case 'finalizata': return this.image.areTumoare ? 'badge-danger' : 'badge-success';
      case 'eroare': return 'badge-dark';
      default: return 'badge-secondary';
    }
  }

  getAnalysisIcon(): string {
    if (!this.image?.statusAnaliza) return 'bi bi-question-circle';
    
    switch (this.image.statusAnaliza) {
      case 'neanalizata': return 'bi bi-question-circle';
      case 'in_procesare': return 'bi bi-hourglass-split';
      case 'finalizata': return this.image.areTumoare ? 'bi bi-exclamation-triangle-fill' : 'bi bi-check-circle-fill';
      case 'eroare': return 'bi bi-x-circle-fill';
      default: return 'bi bi-question-circle';
    }
  }

  // Metode pentru modal
  openImageInfoModal(): void {
    if (!this.image) return;
    
    // Populează formularul cu datele curente
    this.imageFormData = {
      nume: this.image.nume || '',
      tip: this.image.tip || 'RMN',
      observatii: this.image.observatii || ''
    };
    
    this.showImageInfoModal = true;
  }

  closeImageInfoModal(): void {
    this.showImageInfoModal = false;
  }

  saveImageInfo(): void {
    if (!this.image || !this.pacient) return;

    const userId = localStorage.getItem('id');
    if (!userId) return;

    // Update local image data
    this.image.nume = this.imageFormData.nume;
    this.image.tip = this.imageFormData.tip;
    this.image.observatii = this.imageFormData.observatii;
    this.image.dataModificare = new Date();

    console.log('💾 Salvare informații imagine:', this.image);

    // Update în backend
    this.imageService.updateImage(this.image.id, this.pacient.id, userId, this.image).subscribe({
      next: (updated: Imagine) => {
        console.log('✅ Informații salvate:', updated);
        this.image = updated;
        this.closeImageInfoModal();
        this.showToastMessage('Informațiile au fost salvate cu succes!', 'success');
      },
      error: (error: any) => {
        console.error('Eroare la salvarea informațiilor:', error);
        this.showToastMessage('Eroare la salvarea informațiilor: ' + (error.error?.message || error.message), 'error');
      }
    });
  }

  analyzeImage(): void {
    if (!this.image || !this.pacient) {
      this.showToastMessage('Nu există imagine de analizat', 'error');
      return;
    }

    const userId = localStorage.getItem('id');
    if (!userId) return;

    // Verificăm dacă avem URL-ul imaginii
    if (!this.image.imageUrl) {
      this.showToastMessage('Nu există URL pentru imagine', 'error');
      return;
    }

    this.isAnalyzing = true;

    // Reset rezultate vechi și setează status la 'in_procesare'
    this.image.statusAnaliza = 'in_procesare';
    this.image.areTumoare = undefined;
    this.image.tipTumoare = undefined;
    this.image.confidenta = undefined;
    this.image.dataAnalizei = undefined;
    
    console.log('🔬 Inițiere analiză imagine:', this.image.id);
    console.log('📡 Analiză de pe URL:', this.image.imageUrl);

    // Folosește noul endpoint care primește URL-ul direct
    this.brainTumorService.predictFromUrl(this.image.imageUrl).subscribe({
      next: (result) => {
        console.log('✅ Rezultat primit de la AI:', result);
        
        // Verificăm dacă avem rezultat valid
        if ((result.success || result.hasTumor !== undefined) && this.image && this.pacient) {
          // Procesăm rezultatul AI
          this.image.statusAnaliza = 'finalizata';
          this.image.areTumoare = result.hasTumor;
          this.image.confidenta = Math.round(result.confidence * 100);
          this.image.tipTumoare = result.type || undefined;
          this.image.dataAnalizei = new Date();

          console.log('💾 Salvare rezultat în backend:', this.image);

          // Salvăm rezultatul în backend
          const userId = localStorage.getItem('id');
          if (userId) {
            this.imageService.updateImage(this.image.id, this.pacient.id, userId, this.image).subscribe({
              next: (updated: Imagine) => {
                console.log('✅ Rezultat salvat în backend:', updated);
                this.image = updated;
                
                // Actualizează și imaginea în lista pacientului
                if (this.pacient && this.pacient.imagini) {
                  const index = this.pacient.imagini.findIndex(img => img.id === updated.id);
                  if (index !== -1) {
                    this.pacient.imagini[index] = updated;
                  }
                }
                
                this.isAnalyzing = false;
                
                // Notifică utilizatorul
                this.showToastMessage(
                  result.hasTumor
                    ? `⚠️ Tumoare detectată — Încredere: ${Math.round(result.confidence * 100)}%`
                    : `✅ Fără tumoare — Încredere: ${Math.round(result.confidence * 100)}%`,
                  result.hasTumor ? 'error' : 'success'
                );
              },
              error: (error: any) => {
                console.error('❌ Eroare la salvarea rezultatului:', error);
                this.isAnalyzing = false;
                this.showToastMessage('Rezultatul analizei este disponibil, dar nu a putut fi salvat.', 'info');
              }
            });
          }
        } else {
          // Eroare la analiză
          console.error('❌ Analiza a eșuat:', result);
          this.isAnalyzing = false;
          
          if (this.image) {
            this.image.statusAnaliza = 'neanalizata';
          }
          
          this.showToastMessage('Nu s-a putut finaliza analiza imaginii. Încearcă din nou.', 'error');
        }
      },
      error: (error) => {
        console.error('❌ Eroare la comunicarea cu serviciul AI:', error);
        this.isAnalyzing = false;
        
        if (this.image) {
          this.image.statusAnaliza = 'neanalizata';
        }
        
        this.showToastMessage('Serviciul de analiză nu este disponibil. Verifică dacă backend-ul rulează.', 'error');
      }
    });
  }

  // ===================== ANALIZĂ CU SEGMENTARE =====================

  analyzeWithSegmentation(): void {
    if (!this.image || !this.pacient) {
      this.showToastMessage('Nu există imagine de analizat', 'error');
      return;
    }

    if (!this.image.imageUrl) {
      this.showToastMessage('Nu există URL pentru imagine', 'error');
      return;
    }

    this.isAnalyzing = true;
    this.segmentationResult = null;
    this.image.statusAnaliza = 'in_procesare';

    console.log('🔬 Analiză cu segmentare pentru:', this.image.imageUrl);

    this.brainTumorService.predictFromUrlWithSegmentation(this.image.imageUrl, 0.4).subscribe({
      next: (response: PredictionResponse) => {
        console.log('✅ Rezultat segmentare:', response);

        if (response.success && this.image && this.pacient) {
          this.image.statusAnaliza = 'finalizata';
          this.image.areTumoare = response.hasTumor;
          this.image.confidenta = Math.round(response.confidence * 100);
          this.image.tipTumoare = response.tumorType || undefined;
          this.image.dataAnalizei = new Date();

          // Afișează segmentarea dacă există (indiferent de hasTumor)
          if (response.segmentation) {
            this.segmentationResult = response.segmentation;
            console.log('🎨 Segmentare disponibilă - overlay + contour');
          } else {
            console.log('ℹ️ Nicio segmentare returnată de backend');
          }

          // Salvează rezultatul în backend
          const userId = localStorage.getItem('id');
          if (userId) {
            this.imageService.updateImage(this.image.id, this.pacient.id, userId, this.image).subscribe({
              next: (updated: Imagine) => {
                this.image = updated;
                if (this.pacient?.imagini) {
                  const idx = this.pacient.imagini.findIndex(i => i.id === updated.id);
                  if (idx !== -1) this.pacient.imagini[idx] = updated;
                }
                this.isAnalyzing = false;
                this.showToastMessage(
                  response.hasTumor
                    ? `⚠️ Tumoare detectată (${Math.round(response.confidence * 100)}% încredere)`
                    : `✅ Fără tumoare (${Math.round(response.confidence * 100)}% încredere)`,
                  response.hasTumor ? 'error' : 'success'
                );
              },
              error: () => {
                this.isAnalyzing = false;
                this.showToastMessage('Rezultatul e disponibil dar nu s-a putut salva.', 'info');
              }
            });
          } else {
            this.isAnalyzing = false;
          }
        } else {
          this.isAnalyzing = false;
          if (this.image) this.image.statusAnaliza = 'neanalizata';
          this.showToastMessage('Analiza nu a putut fi finalizată.', 'error');
        }
      },
      error: (error) => {
        console.error('❌ Eroare segmentare:', error);
        this.isAnalyzing = false;
        if (this.image) this.image.statusAnaliza = 'neanalizata';
        this.showToastMessage('Serviciul de segmentare nu este disponibil.', 'error');
      }
    });
  }

  // ===================== SFÂRŞIT SEGMENTARE =====================

  // ===================== RECONSTRUCȚIE 3D MPR =====================

  /**
   * Returnează imaginile vizibile (fără cele care aparțin unei serii DICOM).
   */
  getVisibleImages(): Imagine[] {
    if (!this.pacient?.imagini) return [];
    return this.pacient.imagini.filter(img => !img.seriesId);
  }

  /**
   * Returnează seriile DICOM grupate (pentru afișare ca un singur card).
   */
  getDicomSeriesGroups(): { seriesId: string; count: number }[] {
    if (!this.pacient?.imagini) return [];
    const groups = new Map<string, number>();
    for (const img of this.pacient.imagini) {
      if (img.seriesId) {
        groups.set(img.seriesId, (groups.get(img.seriesId) || 0) + 1);
      }
    }
    return Array.from(groups.entries()).map(([seriesId, count]) => ({ seriesId, count }));
  }

  /**
   * Deschide reconstrucția 3D pentru o serie specifică.
   */
  openSeriesFor3D(seriesId: string): void {
    if (!this.pacient?.imagini) return;
    this.dicomSeriesSlices = this.pacient.imagini.filter(img => img.seriesId === seriesId);
    if (this.dicomSeriesSlices.length >= 3) {
      this.canReconstruct3D = true;
      this.open3DReconstruction();
    } else {
      this.showToastMessage('Seria are prea puține slice-uri pentru reconstrucție 3D.', 'info');
    }
  }

  /**
   * Verifică dacă pacientul are suficiente slice-uri DICOM din aceeași serie
   * pentru a permite reconstrucția 3D.
   * Criterii: minim 5 imagini DICOM cu aceeași dimensiune (rows x cols).
   */
  check3DReconstructionAvailability(): void {
    if (!this.pacient?.imagini) {
      this.canReconstruct3D = false;
      return;
    }

    // Filtrează doar imaginile DICOM
    const dicomImages = this.pacient.imagini.filter(img => img.isDicom);

    if (dicomImages.length < 5) {
      this.canReconstruct3D = false;
      return;
    }

    // Grupează după dimensiuni (rows x cols) — slice-urile din aceeași serie au aceleași dimensiuni
    const sizeGroups = new Map<string, Imagine[]>();
    for (const img of dicomImages) {
      const rows = img.dicomMetadata?.rows || 0;
      const cols = img.dicomMetadata?.columns || 0;
      if (rows > 0 && cols > 0) {
        const key = `${rows}x${cols}`;
        if (!sizeGroups.has(key)) sizeGroups.set(key, []);
        sizeGroups.get(key)!.push(img);
      }
    }

    // Găsește cel mai mare grup cu minim 5 slice-uri
    let bestGroup: Imagine[] = [];
    for (const group of sizeGroups.values()) {
      if (group.length > bestGroup.length) {
        bestGroup = group;
      }
    }

    if (bestGroup.length >= 5) {
      this.canReconstruct3D = true;
      this.dicomSeriesSlices = bestGroup;
      console.log(`✅ Reconstrucție 3D disponibilă: ${bestGroup.length} slice-uri DICOM`);
    } else {
      this.canReconstruct3D = false;
      this.dicomSeriesSlices = [];
    }
  }

  /**
   * Deschide modalul de reconstrucție 3D și încarcă volumul.
   */
  open3DReconstruction(): void {
    if (!this.canReconstruct3D || this.dicomSeriesSlices.length < 5) return;

    this.show3DModal = true;
    this.is3DLoading = true;
    this.mprView = 'axial';
    this.mprSliceIndex = 0;

    this.loadVolumeData();
  }

  close3DModal(): void {
    this.show3DModal = false;
    this.volumeData = null;
    this.is3DLoading = false;
  }

  /**
   * Încarcă toate slice-urile DICOM și construiește volumul 3D.
   */
  private async loadVolumeData(): Promise<void> {
    try {
      // Sortează slice-urile după imagePosition (Z) sau instanceNumber
      const sortedSlices = [...this.dicomSeriesSlices].sort((a, b) => {
        const posA = this.getSliceZ(a);
        const posB = this.getSliceZ(b);
        return posA - posB;
      });

      // Determinăm dimensiunile din metadate sau din prima imagine încărcată
      const firstMeta = sortedSlices[0].dicomMetadata;
      let targetWidth = firstMeta?.columns || 256;
      let targetHeight = firstMeta?.rows || 256;

      this.volumeSlices = sortedSlices.length;

      console.log(`🔄 Încărcare volum: ${sortedSlices.length} slice-uri, target: ${targetWidth}x${targetHeight}`);
      console.log('🔗 URL-uri slice-uri:', sortedSlices.slice(0, 3).map(s => s.imageUrl));
      console.log('📋 Metadate primul slice:', sortedSlices[0].dicomMetadata);

      // Încarcă fiecare slice ca imagine (PNG/JPG de pe Cloudinary) și extrage grayscale
      const slicePixels: Uint8Array[] = [];
      let actualWidth = targetWidth;
      let actualHeight = targetHeight;

      for (let i = 0; i < sortedSlices.length; i++) {
        const slice = sortedSlices[i];
        try {
          // Încarcă imaginea ca <img> și desenează pe canvas pentru a extrage pixelii
          const pixels = await this.loadSliceAsGrayscale(slice.imageUrl, targetWidth, targetHeight);
          if (pixels) {
            slicePixels.push(pixels);
            if (i === 0) {
              // Folosim dimensiunile reale ale primei imagini
              actualWidth = targetWidth;
              actualHeight = targetHeight;
            }
          } else {
            // Slice gol — umple cu negru
            slicePixels.push(new Uint8Array(targetWidth * targetHeight));
          }
        } catch (err) {
          console.warn(`⚠️ Slice ${i} eșuat:`, err);
          slicePixels.push(new Uint8Array(targetWidth * targetHeight));
        }
      }

      // Construiește volumul din slice-urile grayscale
      this.volumeRows = actualHeight;
      this.volumeCols = actualWidth;
      const totalVoxels = this.volumeRows * this.volumeCols * this.volumeSlices;
      this.volumeData = new Int16Array(totalVoxels);

      const sliceSize = this.volumeRows * this.volumeCols;
      for (let i = 0; i < slicePixels.length; i++) {
        const pixels = slicePixels[i];
        for (let j = 0; j < Math.min(pixels.length, sliceSize); j++) {
          this.volumeData[i * sliceSize + j] = pixels[j];
        }
      }

      this.is3DLoading = false;
      this.updateMprMaxSlice();
      this.mprSliceIndex = Math.floor(this.mprMaxSlice / 2);

      setTimeout(() => this.renderMprSlice(), 100);
      console.log(`✅ Volum 3D încărcat: ${this.volumeCols}x${this.volumeRows}x${this.volumeSlices}`);

    } catch (err) {
      console.error('❌ Eroare la încărcarea volumului 3D:', err);
      this.is3DLoading = false;
      this.showToastMessage('Eroare la încărcarea volumului 3D.', 'error');
    }
  }

  /**
   * Încarcă o imagine de pe URL și returnează pixelii grayscale ca Uint8Array.
   * Folosește fetch + blob URL pentru a evita problemele CORS cu canvas.
   */
  private loadSliceAsGrayscale(url: string, width: number, height: number): Promise<Uint8Array | null> {
    return new Promise(async (resolve) => {
      try {
        // Descarcă imaginea ca blob pentru a evita CORS tainted canvas
        const response = await fetch(url);
        const blob = await response.blob();
        console.log(`📦 Blob: type=${blob.type}, size=${blob.size}, url=${url.substring(url.length - 30)}`);
        
        // Dacă blob-ul nu e o imagine (e un DICOM raw), nu putem folosi <img>
        if (blob.type && !blob.type.startsWith('image/')) {
          console.warn('⚠️ Blob nu e imagine:', blob.type, '- parsez ca DICOM');
          // Parsează DICOM din blob
          const buffer = await blob.arrayBuffer();
          const grayscale = this.parseDicomToGrayscale(new Uint8Array(buffer), width, height);
          resolve(grayscale);
          return;
        }

        // Dacă blob.type e gol (Cloudinary raw), încearcă ambele metode
        if (!blob.type || blob.type === 'application/octet-stream') {
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          // Verifică dacă e DICOM (magic bytes "DICM" la offset 128)
          if (bytes.length > 132 && String.fromCharCode(bytes[128], bytes[129], bytes[130], bytes[131]) === 'DICM') {
            console.log('📋 Detectat DICOM valid, parsez...');
            const grayscale = this.parseDicomToGrayscale(bytes, width, height);
            resolve(grayscale);
            return;
          }
        }

        const blobUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const grayscale = new Uint8Array(width * height);

            for (let i = 0; i < width * height; i++) {
              const r = imageData.data[i * 4];
              const g = imageData.data[i * 4 + 1];
              const b = imageData.data[i * 4 + 2];
              grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            }

            URL.revokeObjectURL(blobUrl);
            resolve(grayscale);
          } catch (e) {
            console.warn('⚠️ Eroare la extragerea pixelilor:', e);
            URL.revokeObjectURL(blobUrl);
            resolve(null);
          }
        };

        img.onerror = () => {
          console.warn('⚠️ img.onerror - nu e imagine validă, încerc DICOM parse');
          URL.revokeObjectURL(blobUrl);
          // Fallback: parsează ca DICOM
          blob.arrayBuffer().then(buffer => {
            const grayscale = this.parseDicomToGrayscale(new Uint8Array(buffer), width, height);
            resolve(grayscale);
          }).catch(() => resolve(null));
        };

        img.src = blobUrl;
      } catch (e) {
        console.warn('⚠️ Fetch eșuat pentru slice:', url, e);
        resolve(null);
      }
    });
  }

  /**
   * Parsează un fișier DICOM raw și returnează pixelii ca grayscale Uint8Array.
   * Folosește dicom-parser (librăria instalată) pentru parsare robustă.
   */
  private parseDicomToGrayscale(bytes: Uint8Array, targetWidth: number, targetHeight: number): Uint8Array | null {
    try {
      const dataSet = dicomParser.parseDicom(bytes);

      const rows = dataSet.uint16('x00280010') || 0;
      const cols = dataSet.uint16('x00280011') || 0;
      const bitsAllocated = dataSet.uint16('x00280100') || 16;
      const pixelRepresentation = dataSet.uint16('x00280103') || 0;

      const pixelDataElement = dataSet.elements['x7fe00010'];
      if (!rows || !cols || !pixelDataElement) {
        console.warn('⚠️ DICOM parse (dicom-parser): rows=', rows, 'cols=', cols, 'pixelData=', !!pixelDataElement);
        return null;
      }

      console.log(`✅ DICOM parsat (dicom-parser): ${cols}x${rows}, bits=${bitsAllocated}`);

      const sliceSize = rows * cols;
      let pixelData: Int16Array | Uint16Array | Uint8Array;

      if (bitsAllocated === 8) {
        pixelData = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, Math.min(pixelDataElement.length, sliceSize));
      } else {
        if (pixelRepresentation === 0) {
          pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, Math.min(pixelDataElement.length / 2, sliceSize));
        } else {
          pixelData = new Int16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, Math.min(pixelDataElement.length / 2, sliceSize));
        }
      }

      // Normalizează la 0-255
      let min = pixelData[0], max = pixelData[0];
      for (let i = 0; i < pixelData.length; i++) {
        if (pixelData[i] < min) min = pixelData[i];
        if (pixelData[i] > max) max = pixelData[i];
      }
      const range = max - min || 1;

      const grayscale = new Uint8Array(targetWidth * targetHeight);
      const scaleX = cols / targetWidth;
      const scaleY = rows / targetHeight;

      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const srcX = Math.floor(x * scaleX);
          const srcY = Math.floor(y * scaleY);
          const srcIdx = srcY * cols + srcX;
          if (srcIdx < pixelData.length) {
            grayscale[y * targetWidth + x] = Math.round(((pixelData[srcIdx] - min) / range) * 255);
          }
        }
      }

      return grayscale;
    } catch (e) {
      console.error('❌ Eroare parsare DICOM (dicom-parser):', e);
      return null;
    }
  }

  private getSliceZ(img: Imagine): number {
    // Încearcă imagePosition (al treilea element = Z)
    if (img.dicomMetadata?.imagePosition) {
      const parts = img.dicomMetadata.imagePosition.split('\\');
      if (parts.length >= 3) return parseFloat(parts[2]) || 0;
    }
    // Fallback pe sliceLocation
    if (img.dicomMetadata?.sliceLocation) {
      return parseFloat(img.dicomMetadata.sliceLocation) || 0;
    }
    // Fallback pe instanceNumber
    return img.dicomMetadata?.instanceNumber || 0;
  }

  setMprView(view: 'axial' | 'sagittal' | 'coronal'): void {
    this.mprView = view;
    this.updateMprMaxSlice();
    this.mprSliceIndex = Math.floor(this.mprMaxSlice / 2);
    this.renderMprSlice();
  }

  onMprSliderChange(): void {
    this.renderMprSlice();
  }

  private updateMprMaxSlice(): void {
    switch (this.mprView) {
      case 'axial':
        this.mprMaxSlice = this.volumeSlices - 1;
        break;
      case 'sagittal':
        this.mprMaxSlice = this.volumeCols - 1;
        break;
      case 'coronal':
        this.mprMaxSlice = this.volumeRows - 1;
        break;
    }
  }

  /**
   * Randează un slice din volum pe canvas în funcție de planul selectat.
   */
  renderMprSlice(): void {
    if (!this.volumeData || !this.mprCanvas?.nativeElement) return;

    const canvas = this.mprCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;

    switch (this.mprView) {
      case 'axial':
        width = this.volumeCols;
        height = this.volumeRows;
        break;
      case 'sagittal':
        width = this.volumeSlices;
        height = this.volumeRows;
        break;
      case 'coronal':
        width = this.volumeCols;
        height = this.volumeSlices;
        break;
    }

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const sliceSize = this.volumeRows * this.volumeCols;

    // Calculează min/max pentru windowing
    let min = 32767, max = -32768;
    for (let i = 0; i < this.volumeData.length; i += 100) {
      if (this.volumeData[i] < min) min = this.volumeData[i];
      if (this.volumeData[i] > max) max = this.volumeData[i];
    }
    const range = max - min || 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let voxelValue: number;

        switch (this.mprView) {
          case 'axial':
            voxelValue = this.volumeData[this.mprSliceIndex * sliceSize + y * this.volumeCols + x];
            break;
          case 'sagittal':
            // x = slice index, y = row
            voxelValue = this.volumeData[x * sliceSize + y * this.volumeCols + this.mprSliceIndex];
            break;
          case 'coronal':
            // x = col, y = slice index
            voxelValue = this.volumeData[y * sliceSize + this.mprSliceIndex * this.volumeCols + x];
            break;
        }

        // Normalizează la 0-255
        const normalized = Math.max(0, Math.min(255, Math.round(((voxelValue - min) / range) * 255)));
        const idx = (y * width + x) * 4;
        imageData.data[idx] = normalized;
        imageData.data[idx + 1] = normalized;
        imageData.data[idx + 2] = normalized;
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // ===================== SFÂRŞIT RECONSTRUCȚIE 3D =====================

  // Metode pentru adăugare imagine nouă
  openAddImageModal(): void {
    this.showAddImageModal = true;
    this.resetNewImageForm();
  }

  closeAddImageModal(): void {
    this.showAddImageModal = false;
    this.resetNewImageForm();
  }

  /**
   * Upload serie DICOM — selectare multiplă de fișiere.
   * Uploadează fiecare fișier secvențial cu un seriesId comun.
   * Seria apare ca un singur element în UI.
   */
  onDicomSeriesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    const userId = localStorage.getItem('id');
    if (!userId || !this.pacient) {
      this.showToastMessage('Utilizator sau pacient lipsă.', 'error');
      return;
    }

    // Filtrează doar fișierele DICOM
    const dicomFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isDcm = f.name.toLowerCase().endsWith('.dcm') ||
                    f.name.toLowerCase().endsWith('.dicom') ||
                    f.type === 'application/dicom';
      if (isDcm) dicomFiles.push(f);
    }

    if (dicomFiles.length === 0) {
      this.showToastMessage('Nu s-au găsit fișiere DICOM valide.', 'error');
      return;
    }

    // Generează un ID unic pentru serie
    const seriesId = 'series_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    this.isUploadingSeries = true;
    this.seriesUploadTotal = dicomFiles.length;
    this.seriesUploadProgress = 0;

    console.log(`📤 Upload serie DICOM: ${dicomFiles.length} fișiere, seriesId: ${seriesId}`);

    // Uploadează secvențial
    this.uploadNextInSeries(dicomFiles, 0, userId, seriesId);

    // Reset input-ul
    event.target.value = '';
  }

  private uploadNextInSeries(files: File[], index: number, userId: string, seriesId: string): void {
    if (index >= files.length) {
      // Terminat — creează seria local
      this.isUploadingSeries = false;
      this.showToastMessage(`✅ Serie DICOM încărcată (${files.length} slice-uri)!`, 'success');

      // Adaugă seria la pacient (local)
      if (!this.pacient!.dicomSeries) {
        this.pacient!.dicomSeries = [];
      }
      const sliceIds = this.pacient!.imagini
        .filter(img => img.seriesId === seriesId)
        .map(img => img.id);

      this.pacient!.dicomSeries.push({
        id: seriesId,
        name: `Serie DICOM (${files.length} slice-uri)`,
        modality: 'MR',
        sliceCount: sliceIds.length,
        sliceIds: sliceIds,
        createdAt: new Date()
      });

      // Verifică disponibilitatea 3D
      this.check3DReconstructionAvailability();
      return;
    }

    const file = files[index];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nume', `Slice ${index + 1}`);
    formData.append('tip', 'RMN');
    formData.append('isDicom', 'true');
    formData.append('seriesId', seriesId);

    this.imageService.uploadImage(userId, this.pacient!.id, formData).subscribe({
      next: (uploaded) => {
        uploaded.seriesId = seriesId; // Asigură-te că e setat local
        this.seriesUploadProgress = index + 1;
        console.log(`✅ Slice ${index + 1}/${files.length} uploadat`);

        // Adaugă la lista locală
        if (this.pacient?.imagini) {
          this.pacient.imagini.push(uploaded);
        }

        this.uploadNextInSeries(files, index + 1, userId, seriesId);
      },
      error: (err) => {
        console.error(`❌ Eroare la slice ${index + 1}:`, err);
        this.seriesUploadProgress = index + 1;
        this.uploadNextInSeries(files, index + 1, userId, seriesId);
      }
    });
  }

  resetNewImageForm(): void {
    this.newImageFile = null;
    this.imagePreviewUrl = null;
    this.newImageData = {
      nume: '',
      tip: '',
      observatii: ''
    };
    this.autoAnalyze = false;
    this.isDicomFile = false;
    this.dicomMetadata = null;
  }

  // Metode pentru poza de profil pacient
  openProfilePictureModal(): void {
    this.showProfilePictureModal = true;
    this.profilePictureFile = null;
    this.profilePicturePreviewUrl = this.pacient?.profilePictureUrl || null;
  }

  closeProfilePictureModal(): void {
    this.showProfilePictureModal = false;
    this.profilePictureFile = null;
    this.profilePicturePreviewUrl = null;
  }

  onProfilePictureSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.profilePictureFile = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicturePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfilePicture(event: Event): void {
    event.stopPropagation();
    this.profilePictureFile = null;
    this.profilePicturePreviewUrl = this.pacient?.profilePictureUrl || null;
  }

  uploadProfilePicture(): void {
    if (!this.pacient) {
      return;
    }

    const userId = localStorage.getItem('id');
    if (!userId) return;

    this.isUploadingProfile = true;

    // Dacă nu este selectată nicio poză, doar închidem modalul
    if (!this.profilePictureFile) {
      setTimeout(() => {
        this.isUploadingProfile = false;
        this.closeProfilePictureModal();
      }, 300);
      return;
    }

    // Aici ar trebui să trimiți imaginea către backend pentru upload pe Cloudinary
    // Deocamdată simulăm upload-ul
    const formData = new FormData();
    formData.append('file', this.profilePictureFile);
    formData.append('pacientId', this.pacient.id);
    formData.append('userId', userId);

    // TODO: Implementează upload-ul real către backend
    // this.pacientService.uploadProfilePicture(formData).subscribe({...})
    
    // Simulare - în practică ar trebui să aștepți răspunsul de la backend
    setTimeout(() => {
      alert('Funcția de upload pentru poza de profil va fi implementată în backend.');
      this.isUploadingProfile = false;
      this.closeProfilePictureModal();
    }, 1000);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File): void {
    // Verifică dacă este fișier DICOM
    const isDicom = file.name.toLowerCase().endsWith('.dcm') || 
                    file.name.toLowerCase().endsWith('.dicom') ||
                    file.type === 'application/dicom';

    this.isDicomFile = isDicom;

    // IMPORTANT: Setăm fișierul IMEDIAT, înainte de orice procesare
    this.newImageFile = file;

    // Verifică dimensiunea (max 50MB pentru DICOM, 10MB pentru altele)
    const maxSize = isDicom ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showToastMessage(`Fișierul este prea mare! Dimensiunea maximă este ${isDicom ? '50MB' : '10MB'}.`, 'error');
      return;
    }

    if (isDicom) {
      console.log('📋 Fișier DICOM detectat, se extrag metadatele...');
      this.extractDicomMetadata(file);
    } else {
      // Verifică tipul fișierului pentru imagini normale
      if (!file.type.startsWith('image/')) {
        alert('Te rugăm să selectezi un fișier imagine valid sau DICOM!');
        return;
      }
      
      // Creează preview doar pentru imagini normale
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    console.log('📁 Fișier selectat:', file.name, this.formatFileSize(file.size));
  }

  extractDicomMetadata(file: File): void {
    // Pentru DICOM trebuie să citim întreg fișierul
    // dar facem asta async și nu blocăm upload-ul
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      try {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);

        // Extrage doar metadatele esențiale pentru performanță
        this.dicomMetadata = {
          patientName: this.getString(dataSet, 'x00100010'),
          patientID: this.getString(dataSet, 'x00100020'),
          patientBirthDate: this.getString(dataSet, 'x00100030'),
          patientSex: this.getString(dataSet, 'x00100040'),
          studyDate: this.getString(dataSet, 'x00080020'),
          studyTime: this.getString(dataSet, 'x00080030'),
          studyDescription: this.getString(dataSet, 'x00081030'),
          seriesDescription: this.getString(dataSet, 'x0008103e'),
          modality: this.getString(dataSet, 'x00080060'),
          institutionName: this.getString(dataSet, 'x00080080'),
          manufacturer: this.getString(dataSet, 'x00080070'),
          manufacturerModelName: this.getString(dataSet, 'x00081090'),
          sliceThickness: this.getString(dataSet, 'x00180050'),
          imagePosition: this.getString(dataSet, 'x00200032'),
          imageOrientation: this.getString(dataSet, 'x00200037'),
          pixelSpacing: this.getString(dataSet, 'x00280030'),
          rows: this.getNumber(dataSet, 'x00280010'),
          columns: this.getNumber(dataSet, 'x00280011'),
          bitsAllocated: this.getNumber(dataSet, 'x00280100'),
          bitsStored: this.getNumber(dataSet, 'x00280101'),
          samplesPerPixel: this.getNumber(dataSet, 'x00280002'),
          photometricInterpretation: this.getString(dataSet, 'x00280004'),
          windowCenter: this.getString(dataSet, 'x00281050'),
          windowWidth: this.getString(dataSet, 'x00281051'),
          rescaleIntercept: this.getString(dataSet, 'x00281052'),
          rescaleSlope: this.getString(dataSet, 'x00281053')
        };

        console.log('✅ Metadate DICOM extrase:', this.dicomMetadata);

        // Pre-completează câmpurile dacă există informații
        if (this.dicomMetadata.seriesDescription && !this.newImageData.nume) {
          this.newImageData.nume = this.dicomMetadata.seriesDescription;
        }
        if (this.dicomMetadata.modality && !this.newImageData.tip) {
          // Mapează modalitatea DICOM la tipurile noastre
          const modalityMap: { [key: string]: string } = {
            'MR': 'RMN',
            'CT': 'CT',
            'CR': 'Radiografie',
            'DX': 'Radiografie',
            'US': 'Ecografie',
            'PT': 'PET'
          };
          this.newImageData.tip = modalityMap[this.dicomMetadata.modality] || 'Altele';
        }

      } catch (error) {
        console.error('❌ Eroare la parsarea DICOM:', error);
        // Nu blocăm upload-ul dacă parsarea eșuează
        console.warn('⚠️ Continuăm fără metadate DICOM');
        this.dicomMetadata = null;
      }
    };

    reader.onerror = () => {
      console.error('❌ Eroare la citirea fișierului DICOM');
      this.dicomMetadata = null;
    };

    // Citim întreg fișierul pentru a putea parsa corect DICOM
    reader.readAsArrayBuffer(file);
  }

  private getString(dataSet: any, tag: string): string | undefined {
    try {
      const element = dataSet.elements[tag];
      if (element) {
        return dataSet.string(tag);
      }
    } catch (error) {
      // Ignore
    }
    return undefined;
  }

  private getNumber(dataSet: any, tag: string): number | undefined {
    try {
      const element = dataSet.elements[tag];
      if (element) {
        return dataSet.uint16(tag);
      }
    } catch (error) {
      // Ignore
    }
    return undefined;
  }

  private createDicomPreview(dataSet: any, byteArray: Uint8Array): void {
    try {
      // Extrage informații despre pixeli
      const rows = this.getNumber(dataSet, 'x00280010') || 0;
      const columns = this.getNumber(dataSet, 'x00280011') || 0;
      const pixelDataElement = dataSet.elements.x7fe00010;

      if (pixelDataElement && rows && columns) {
        // Creează canvas pentru preview
        const canvas = document.createElement('canvas');
        canvas.width = columns;
        canvas.height = rows;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const imageData = ctx.createImageData(columns, rows);
          const pixelDataOffset = pixelDataElement.dataOffset;
          
          // Simplificat: afișează datele în grayscale
          for (let i = 0; i < rows * columns; i++) {
            const pixelValue = byteArray[pixelDataOffset + i * 2] || 0;
            imageData.data[i * 4] = pixelValue;     // R
            imageData.data[i * 4 + 1] = pixelValue; // G
            imageData.data[i * 4 + 2] = pixelValue; // B
            imageData.data[i * 4 + 3] = 255;        // A
          }

          ctx.putImageData(imageData, 0, 0);
          this.imagePreviewUrl = canvas.toDataURL();
        }
      }
    } catch (error) {
      console.warn('⚠️ Nu s-a putut crea preview pentru DICOM:', error);
      // Setează o imagine placeholder pentru DICOM
      this.imagePreviewUrl = null;
    }
  }

  openDicomMetadataModal(): void {
    this.showDicomMetadataModal = true;
  }

  closeDicomMetadataModal(): void {
    this.showDicomMetadataModal = false;
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.newImageFile = null;
    this.imagePreviewUrl = null;
    this.isDicomFile = false;
    this.dicomMetadata = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  uploadNewImage(): void {
    if (!this.newImageFile || !this.pacient) {
      this.showToastMessage('Te rugăm să selectezi o imagine și să compleți informațiile!', 'error');
      return;
    }

    if (!this.newImageData.nume || !this.newImageData.tip) {
      this.showToastMessage('Te rugăm să compleți numele și tipul imaginii!', 'error');
      return;
    }

    const userId = localStorage.getItem('id');
    if (!userId) {
      alert('Utilizator neautentificat!');
      return;
    }

    this.isUploading = true;

    // Creează FormData
    const formData = new FormData();
    formData.append('file', this.newImageFile, this.newImageFile.name); // Adaugă explicit filename
    formData.append('nume', this.newImageData.nume);
    formData.append('tip', this.newImageData.tip);
    if (this.newImageData.observatii) {
      formData.append('observatii', this.newImageData.observatii);
    }
    formData.append('statusAnaliza', this.autoAnalyze ? 'in_procesare' : 'neanalizata');
    
    // Adaugă flag pentru DICOM și metadatele
    if (this.isDicomFile) {
      formData.append('isDicom', 'true');
      if (this.dicomMetadata) {
        formData.append('dicomMetadata', JSON.stringify(this.dicomMetadata));
      }
    }

    console.log('📤 Încărcare imagine nouă pentru pacient:', this.pacient.id);
    console.log('   Fișier:', this.newImageFile.name);
    console.log('   Dimensiune:', this.formatFileSize(this.newImageFile.size));
    console.log('   Tip fișier:', this.newImageFile.type);
    console.log('   Nume:', this.newImageData.nume);
    console.log('   Tip:', this.newImageData.tip);
    console.log('   Este DICOM:', this.isDicomFile);
    console.log('   Auto-analiză:', this.autoAnalyze);

    // Upload imagine
    this.imageService.uploadImage(userId, this.pacient.id, formData).subscribe({
      next: (newImage: Imagine) => {
        console.log('✅ Imagine încărcată cu succes:', newImage);
        
        // Actualizează local în loc să reîncărcăm toți pacienții
        if (this.pacient && this.pacient.imagini) {
          this.pacient.imagini.push(newImage);
        }
        
        // Setează noua imagine ca imagine curentă
        this.image = newImage;
        this.observatiiEdit = newImage.observatii || '';
        
        this.isUploading = false;
        this.closeAddImageModal();
        
        const message = this.isDicomFile 
          ? 'Imaginea DICOM a fost încărcată cu succes împreună cu metadatele!'
          : 'Imaginea a fost încărcată cu succes!';
        
        this.showToastMessage(message, 'success');
        
        // Dacă autoAnalyze este activat, pornește analiza
        if (this.autoAnalyze && newImage.imageUrl) {
          console.log('🤖 Pornire analiză automată pentru imagine nouă...');
          this.triggerAutoAnalyze(newImage.imageUrl, newImage.id);
        }
      },
      error: (error: any) => {
        console.error('❌ Eroare la încărcarea imaginii:', error);
        this.isUploading = false;
        this.showToastMessage('Eroare la încărcarea imaginii: ' + (error.error?.message || error.message), 'error');
      }
    });
  }

  /**
   * Trigger auto-analiză pentru imagine nouă încărcată
   * Folosește URL-ul Cloudinary în loc să descarce fișierul
   */
  private triggerAutoAnalyze(imageUrl: string, imageId: string): void {
    console.log('🔬 Auto-analiză pentru imagine:', imageId);
    console.log('📡 Analiză de pe URL Cloudinary:', imageUrl);

    this.isAnalyzing = true;

    // Folosește noul endpoint care primește URL-ul direct
    this.brainTumorService.predictFromUrl(imageUrl).subscribe({
      next: (result) => {
        console.log('✅ Rezultat auto-analiză primit:', result);
        
        if ((result?.success || result?.hasTumor !== undefined) && this.image && this.pacient) {
          // Actualizăm imaginea curentă cu rezultatul
          this.image.statusAnaliza = 'finalizata';
          this.image.areTumoare = result.hasTumor;
          this.image.confidenta = Math.round(result.confidence * 100);
          this.image.tipTumoare = result.type || undefined;
          this.image.dataAnalizei = new Date();

          // Salvăm în backend
          const userId = localStorage.getItem('id');
          if (userId) {
            this.imageService.updateImage(this.image.id, this.pacient.id, userId, this.image).subscribe({
              next: (updated: Imagine) => {
                console.log('✅ Rezultat auto-analiză salvat în backend:', updated);
                this.image = updated;
                
                // Actualizează și în lista pacientului
                if (this.pacient && this.pacient.imagini) {
                  const index = this.pacient.imagini.findIndex(img => img.id === updated.id);
                  if (index !== -1) {
                    this.pacient.imagini[index] = updated;
                  }
                }
                
                this.isAnalyzing = false;
                
                // Notifică utilizatorul
                alert(`Analiza s-a finalizat!\n\n${result.hasTumor ? '⚠️ Tumoare detectată' : '✅ Fără tumoare'}\nÎncredere: ${Math.round(result.confidence * 100)}%`);
              },
              error: (error: any) => {
                console.error('❌ Eroare la salvarea rezultatului auto-analiză:', error);
                this.isAnalyzing = false;
                alert('Analiza s-a finalizat, dar rezultatul nu a putut fi salvat.');
              }
            });
          }
        } else {
          console.error('❌ Analiză eșuată:', result);
          this.isAnalyzing = false;
          alert('Analiza nu a putut fi finalizată. Vă rugăm să încercați din nou.');
        }
      },
      error: (error) => {
        console.error('❌ Eroare la auto-analiză:', error);
        this.isAnalyzing = false;
        this.showToastMessage('Eroare la comunicarea cu serviciul de analiză.', 'error');
      }
    });
  }

  /**
   * Afișează un mesaj Toast elegant
   */
  showToastMessage(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    
    // Setează iconița corespunzătoare
    switch (type) {
      case 'success':
        this.toastIcon = 'bi-check-circle-fill';
        break;
      case 'error':
        this.toastIcon = 'bi-exclamation-circle-fill';
        break;
      case 'info':
        this.toastIcon = 'bi-info-circle-fill';
        break;
    }
    
    this.showToast = true;
    
    // Ascunde automat după 4 secunde
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  /**
   * Închide Toast-ul manual
   */
  closeToast(): void {
    this.showToast = false;
  }

  
  openSharePatientModal(): void {
    if (!this.pacient) {
      return;
    }
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        const currentUserId = localStorage.getItem('id');
        this.allDoctors = users.filter((user: any) => user.id !== currentUserId);
        this.filteredDoctors = [...this.allDoctors];
        this.showSharePatientModal = true;
      },
      error: (error) => {
        this.showToastMessage('Eroare la incarcarea listei.', 'error');
      }
    });
  }

  /**
   * Închide modalul de partajare
   */
  closeSharePatientModal(): void {
    this.showSharePatientModal = false;
    this.selectedDoctor = null;
    this.searchDoctor = '';
    this.filteredDoctors = [];
    this.allDoctors = [];
  }

  /**
   * Caută doctori după nume
   */
  searchDoctors(): void {
    if (!this.searchDoctor.trim()) {
      this.filteredDoctors = [...this.allDoctors];
      return;
    }

    const searchLower = this.searchDoctor.toLowerCase().trim();
    this.filteredDoctors = this.allDoctors.filter(doctor => {
      const fullName = `${doctor.prenume || ''} ${doctor.nume || ''}`.toLowerCase();
      const email = (doctor.email || '').toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }

  /**
   * Selectează un doctor pentru partajare
   */
  selectDoctor(doctor: any): void {
    this.selectedDoctor = doctor;
  }


  sharePatientToDoctor(): void {
    if (!this.selectedDoctor || !this.pacient) {
      this.showToastMessage('Te rog selectează un destinatar!', 'error');
      return;
    }
    const currentUserId = localStorage.getItem('id');
    if (!currentUserId) {
      this.showToastMessage('Eroare: Utilizator neautentificat.', 'error');
      return;
    }
    this.isSharingPatient = true;
    const numarImagini = this.pacient.imagini ? this.pacient.imagini.length : 0;
    const imaginiPartajate = this.pacient.imagini ? this.pacient.imagini.map(img => ({
      id: img.id,
      nume: img.nume || 'Fără nume',
      tip: img.tip || 'Necunoscut',
      dataIncarcare: img.dataIncarcare,
      statusAnaliza: img.statusAnaliza,
      areTumoare: img.areTumoare,
      tipTumoare: img.tipTumoare,
      confidenta: img.confidenta
    })) : [];

    const mesajRequest: MesajRequest = {
      expeditorId: currentUserId,
      destinatarId: this.selectedDoctor.id,
      continut: `Pacient partajat: ${this.pacient.numePacient} ${this.pacient.prenumePacient}`,
      tip: 'pacient_partajat',
      pacientId: this.pacient.id,
      pacientNume: this.pacient.numePacient,
      pacientPrenume: this.pacient.prenumePacient,
      pacientCnp: this.pacient.cnp,
      pacientDataNasterii: this.pacient.dataNasterii,
      pacientSex: this.pacient.sex,
      pacientNumarTelefon: this.pacient.numarTelefon || '',
      pacientIstoricMedical: this.pacient.istoricMedical || '',
      pacientDetalii: this.pacient.detalii || '',
      pacientNumarImagini: numarImagini,
      pacientImagini: JSON.stringify(imaginiPartajate) // Serializează array-ul de imagini
    };
    this.mesajService.trimiteMesaj(mesajRequest).subscribe({
      next: (response) => {
        console.log('✅ Pacient partajat cu succes:', response);
        this.showToastMessage(`Pacient partajat cu succes către ${this.selectedDoctor.prenume} ${this.selectedDoctor.nume}!`, 'success');
        this.closeSharePatientModal();
        this.isSharingPatient = false;
      },
      error: (error) => {
        console.error('❌ Eroare la partajarea pacientului:', error);
        this.showToastMessage('Eroare la partajarea pacientului. Încearcă din nou.', 'error');
        this.isSharingPatient = false;
      }
    });
  }

  /**
   * Calculează vârsta pe baza datei nașterii
   */
  private calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Obține URL-ul pozei de profil a unui utilizator
   */
  getUserProfilePhoto(user: any): string {
    if (!user || !user.id) return '';
    return this.userService.getProfilePhotoUrl(user.id);
  }

  /**
   * Verifică dacă un utilizator are poză de profil
   */
  hasUserProfilePhoto(user: any): boolean {
    return !!user && !!user.id;
  }

  /**
   * Gestionează eroarea de încărcare a imaginii de profil doctor
   */
  onDoctorImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }
  
  /**
   * Încarcă și afișează imaginea DICOM folosind cornerstone
   */
  loadDicomImage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('⚠️ SSR detectat - DICOM va fi încărcat în browser');
      return;
    }
    
    if (!this.dicomCanvas?.nativeElement || !this.image) {
      console.error('⚠️ Canvas DICOM sau imagine nu este disponibil');
      return;
    }
    
    console.log('📊 Încărcare DICOM în dashboard:', this.image.imageUrl);
    
    const element = this.dicomCanvas.nativeElement;
    
    // Import dinamic cornerstone și dicom-parser (doar în browser)
    Promise.all([
      // @ts-ignore
      import('cornerstone-core'),
      // @ts-ignore
      import('dicom-parser')
    ]).then(([cornerstoneModule, dicomParserModule]) => {
      const cornerstone = cornerstoneModule;
      const dicomParser = dicomParserModule;
      
      // Enable elementul pentru cornerstone
      try {
        cornerstone.enable(element);
        console.log('✅ Cornerstone enabled pe element');
      } catch (e) {
        console.log('⚠️ Element deja enabled sau eroare:', e);
      }
      
      // Încarcă imaginea DICOM
      fetch(this.image!.imageUrl)
        .then(response => {
          console.log('📥 Response primit pentru DICOM');
          return response.arrayBuffer();
        })
        .then(arrayBuffer => {
          console.log('📦 ArrayBuffer size:', arrayBuffer.byteLength);
          
          // Parse DICOM cu dicom-parser
          const byteArray = new Uint8Array(arrayBuffer);
          const dataSet = dicomParser.parseDicom(byteArray);
          
          console.log('✅ DICOM parsat cu succes');
          
          // Extrage metadate DICOM
          if (!this.image!.dicomMetadata) {
            this.image!.dicomMetadata = this.extractDicomMetadataFromDataSet(dataSet);
            console.log('📋 Metadate DICOM:', this.image!.dicomMetadata);
          }
          
          // Obține informații despre imagine
          const rows = dataSet.uint16('x00280010');
          const columns = dataSet.uint16('x00280011');
          const bitsAllocated = dataSet.uint16('x00280100');
          const pixelRepresentation = dataSet.uint16('x00280103');
          const samplesPerPixel = dataSet.uint16('x00280002') || 1;
          
          console.log('📐 Dimensiuni:', { rows, columns, bitsAllocated, samplesPerPixel });
          
          if (!rows || !columns) {
            throw new Error('DICOM nu conține dimensiuni valide');
          }
          
          // Obține pixel data
          const pixelDataElement = dataSet.elements['x7fe00010'];
          if (!pixelDataElement) {
            throw new Error('DICOM nu conține pixel data');
          }
          
          console.log('🔢 Pixel data găsit');
          
          // Creează pixel array în funcție de bitsAllocated
          let pixelData: any;
          if (bitsAllocated === 8) {
            pixelData = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
          } else {
            // 16 bit
            if (pixelRepresentation === 0) {
              pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
            } else {
              pixelData = new Int16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
            }
          }
          
          // Calculează min/max pentru window/level
          let minPixelValue = pixelData[0];
          let maxPixelValue = pixelData[0];
          for (let i = 0; i < pixelData.length; i++) {
            if (pixelData[i] < minPixelValue) minPixelValue = pixelData[i];
            if (pixelData[i] > maxPixelValue) maxPixelValue = pixelData[i];
          }
          
          console.log('📊 Pixel range:', { min: minPixelValue, max: maxPixelValue });
          
          // Obține sau calculează window settings
          let windowCenter = dataSet.floatString('x00281050');
          let windowWidth = dataSet.floatString('x00281051');
          
          if (!windowCenter || !windowWidth) {
            windowCenter = (maxPixelValue + minPixelValue) / 2;
            windowWidth = maxPixelValue - minPixelValue;
          }
          
          console.log('🪟 Window settings:', { center: windowCenter, width: windowWidth });
          
          // Creează image object pentru cornerstone
          const image: any = {
            imageId: 'dicom:' + this.image!.imageUrl,
            minPixelValue: minPixelValue,
            maxPixelValue: maxPixelValue,
            slope: dataSet.floatString('x00281053') || 1,
            intercept: dataSet.floatString('x00281052') || 0,
            windowCenter: windowCenter,
            windowWidth: windowWidth,
            render: samplesPerPixel === 1 ? cornerstone.renderGrayscaleImage : cornerstone.renderColorImage,
            getPixelData: () => pixelData,
            rows: rows,
            columns: columns,
            height: rows,
            width: columns,
            color: samplesPerPixel > 1,
            columnPixelSpacing: dataSet.floatString('x00280030') || 1,
            rowPixelSpacing: dataSet.floatString('x00280030') || 1,
            invert: false,
            sizeInBytes: pixelData.byteLength
          };
          
          console.log('🖼️ Image object creat');
          
          // Display imaginea
          cornerstone.displayImage(element, image);
          
          // Generează data URL din pixel data direct (nu din canvas Cornerstone)
          this.generateDicomDataUrl(pixelData, rows, columns, minPixelValue, maxPixelValue);
          
          console.log('✅ DICOM încărcat și afișat cu succes în dashboard');
        })
        .catch(error => {
          console.error('❌ Eroare la încărcarea DICOM:', error);
          // Fallback: dacă fișierul nu e DICOM valid (a fost convertit la PNG),
          // tratează-l ca imagine normală
          if (this.image) {
            console.log('🔄 Fallback: tratez ca imagine normală (nu DICOM valid)');
            this.image.isDicom = false;
            this.dicomImageDataUrl = '';
          }
        });
    }).catch(error => {
      console.error('❌ Eroare la importul librăriilor DICOM:', error);
    });
  }
  
  /**
   * Generează un data URL PNG din pixel data DICOM (independent de Cornerstone canvas).
   * Asta garantează că avem o imagine validă pentru zoom/adnotare/salvare.
   */
  private generateDicomDataUrl(
    pixelData: Int16Array | Uint16Array | Uint8Array,
    rows: number,
    cols: number,
    minVal: number,
    maxVal: number
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(cols, rows);
    const range = maxVal - minVal || 1;

    for (let i = 0; i < rows * cols; i++) {
      const normalized = Math.max(0, Math.min(255, Math.round(((pixelData[i] - minVal) / range) * 255)));
      const idx = i * 4;
      imageData.data[idx] = normalized;
      imageData.data[idx + 1] = normalized;
      imageData.data[idx + 2] = normalized;
      imageData.data[idx + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    this.dicomImageDataUrl = canvas.toDataURL('image/png');
    console.log('📸 DICOM data URL generat din pixel data, lungime:', this.dicomImageDataUrl.length);
  }

  /**
   * Extrage metadatele DICOM dintr-un dataSet
   */
  extractDicomMetadataFromDataSet(dataSet: any): DicomMetadata {
    return {
      patientName: dataSet.string('x00100010') || 'N/A',
      patientId: dataSet.string('x00100020') || 'N/A',
      studyDate: dataSet.string('x00080020') || 'N/A',
      modality: dataSet.string('x00080060') || 'N/A',
      studyDescription: dataSet.string('x00081030') || 'N/A',
      seriesDescription: dataSet.string('x0008103e') || 'N/A'
    };
  }
}  








