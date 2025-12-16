import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Imagine, DicomMetadata } from '../../models/imagine';
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
export class ImagineComponent implements OnInit {
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
  
  // DICOM support
  isDicomFile: boolean = false;
  dicomMetadata: DicomMetadata | null = null;
  showDicomMetadataModal: boolean = false;

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

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private imageService: ImagineService,
    private pacientService: PacientService,
    private brainTumorService: BrainTumorService,
    private userService: UserService,
    private mesajService: MesajService
  ) {}

  ngOnInit() {
    // Subscribe to route param changes to handle image/patient switching
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
            this.resetZoom();
            
            console.log('Image and patient loaded:', this.image, this.pacient);
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

  closeZoom() {
    this.isZoomed = false;
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
    if (this.zoomLevel > 1) {
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
      alert('Nu există imagine de analizat');
      return;
    }

    const userId = localStorage.getItem('id');
    if (!userId) return;

    // Verificăm dacă avem URL-ul imaginii
    if (!this.image.imageUrl) {
      alert('Nu există URL pentru imagine');
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
                alert(`Analiza s-a finalizat!\n\n${result.hasTumor ? '⚠️ Tumoare detectată' : '✅ Fără tumoare'}\nÎncredere: ${Math.round(result.confidence * 100)}%`);
              },
              error: (error: any) => {
                console.error('❌ Eroare la salvarea rezultatului:', error);
                this.isAnalyzing = false;
                alert('Rezultatul analizei este disponibil, dar nu a putut fi salvat pe server.');
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
          
          alert('Nu s-a putut finaliza analiza imaginii.\nVă rugăm să încercați din nou.');
        }
      },
      error: (error) => {
        console.error('❌ Eroare la comunicarea cu serviciul AI:', error);
        this.isAnalyzing = false;
        
        if (this.image) {
          this.image.statusAnaliza = 'neanalizata';
        }
        
        alert('Nu s-a putut comunica cu serviciul de analiză.\nVă rugăm să verificați dacă backend-ul rulează.');
      }
    });
  }

  // Metode pentru adăugare imagine nouă
  openAddImageModal(): void {
    this.showAddImageModal = true;
    this.resetNewImageForm();
  }

  closeAddImageModal(): void {
    this.showAddImageModal = false;
    this.resetNewImageForm();
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

  /**
   * Deschide modalul pentru partajare pacient
   */
  openSharePatientModal(): void {
    if (!this.pacient) {
      this.showToastMessage('Nu există pacient selectat pentru partajare.', 'error');
      return;
    }

    // Încarcă lista de doctori (toți utilizatorii mai puțin utilizatorul curent)
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        const currentUserId = localStorage.getItem('id');
        this.allDoctors = users.filter((user: any) => user.id !== currentUserId);
        this.filteredDoctors = [...this.allDoctors];
        this.showSharePatientModal = true;
      },
      error: (error) => {
        console.error('Eroare la încărcarea doctorilor:', error);
        this.showToastMessage('Eroare la încărcarea listei de utilizatori.', 'error');
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

  /**
   * Trimite pacientul prin mesagerie
   */
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

    // Calculează numărul de imagini
    const numarImagini = this.pacient.imagini ? this.pacient.imagini.length : 0;

    // Pregătește informațiile despre imagini pentru partajare
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

    console.log('📤 Partajare pacient:', mesajRequest);
    console.log('📷 Imagini partajate:', imaginiPartajate);

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
}  








