import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Imagine } from '../../models/imagine';
import { Pacient } from '../../models/pacient';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { ImagineService } from '../../service/imagine/imagine.service';
import { PacientService } from '../../service/pacient/pacient.service';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

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

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private imageService: ImagineService,
    private pacientService: PacientService
  ) {}

  ngOnInit() {
    const imageId = this.route.snapshot.paramMap.get('id');
    const userId = localStorage.getItem('id');

    if (imageId && userId) {
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
  }

    
  

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  selectImage(img: Imagine) {
    // Update the current image and observatii
    this.image = img;
    this.observatiiEdit = img.observatii || '';
    this.isEditingObservatii = false;
    
    // Optionally navigate to the new image URL
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
        alert('Informațiile au fost salvate cu succes!');
      },
      error: (error: any) => {
        console.error('❌ Eroare la salvarea informațiilor:', error);
        alert('Eroare la salvarea informațiilor: ' + (error.error?.message || error.message));
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

    this.isAnalyzing = true;

    // Update status la 'in_procesare'
    this.image.statusAnaliza = 'in_procesare';
    
    console.log('🔬 Inițiere analiză imagine:', this.image.id);

    // Trimite cerere de analiză către backend
    this.imageService.updateImage(this.image.id, this.pacient.id, userId, this.image).subscribe({
      next: (updated: Imagine) => {
        console.log('✅ Analiză inițiată:', updated);
        this.image = updated;
        
        // TODO: Backend-ul ar trebui să trimită imaginea către serviciul AI
        // și să actualizeze rezultatele când sunt gata
        
        // Simulare pentru demonstrație (ȘTERGE CÂND AI BACKEND REAL)
        setTimeout(() => {
          this.simulateAnalysisComplete();
        }, 5000);

        alert('Analiza a fost inițiată! Rezultatele vor fi disponibile în curând.');
        this.isAnalyzing = false;
      },
      error: (error: any) => {
        console.error('❌ Eroare la inițierea analizei:', error);
        alert('Eroare la inițierea analizei: ' + (error.error?.message || error.message));
        this.isAnalyzing = false;
        if (this.image) {
          this.image.statusAnaliza = 'eroare';
        }
      }
    });
  }

  // Simulare rezultat analiză (DOAR PENTRU TESTARE - ȘTERGE CÂND AI BACKEND REAL)
  private simulateAnalysisComplete(): void {
    if (!this.image || !this.pacient) return;

    const userId = localStorage.getItem('id');
    if (!userId) return;

    // Simulare rezultat
    this.image.statusAnaliza = 'finalizata';
    this.image.areTumoare = Math.random() > 0.5; // Random pentru demo
    this.image.confidenta = Math.floor(Math.random() * 30) + 70; // 70-100%
    this.image.dataAnalizei = new Date();
    
    if (this.image.areTumoare) {
      const tipuri = ['Glioma', 'Meningioma', 'Pituitary Adenoma'];
      this.image.tipTumoare = tipuri[Math.floor(Math.random() * tipuri.length)];
    }

    console.log('✅ Analiză completată (simulare):', this.image);

    // Salvează rezultatul
    this.imageService.updateImage(this.image.id, this.pacient.id, userId, this.image).subscribe({
      next: (updated: Imagine) => {
        console.log('✅ Rezultat salvat:', updated);
        this.image = updated;
      },
      error: (error: any) => {
        console.error('❌ Eroare la salvarea rezultatului:', error);
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
    // Verifică tipul fișierului
    if (!file.type.startsWith('image/')) {
      alert('Te rugăm să selectezi un fișier imagine valid!');
      return;
    }

    // Verifică dimensiunea (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Fișierul este prea mare! Dimensiunea maximă este 10MB.');
      return;
    }

    this.newImageFile = file;

    // Creează preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = e.target.result;
    };
    reader.readAsDataURL(file);

    console.log('📁 Fișier selectat:', file.name, this.formatFileSize(file.size));
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.newImageFile = null;
    this.imagePreviewUrl = null;
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
      alert('Te rugăm să selectezi o imagine și să completezi informațiile!');
      return;
    }

    if (!this.newImageData.nume || !this.newImageData.tip) {
      alert('Te rugăm să completezi numele și tipul imaginii!');
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
    formData.append('file', this.newImageFile);
    formData.append('nume', this.newImageData.nume);
    formData.append('tip', this.newImageData.tip);
    if (this.newImageData.observatii) {
      formData.append('observatii', this.newImageData.observatii);
    }
    formData.append('statusAnaliza', this.autoAnalyze ? 'in_procesare' : 'neanalizata');

    console.log('📤 Încărcare imagine nouă pentru pacient:', this.pacient.id);
    console.log('   Nume:', this.newImageData.nume);
    console.log('   Tip:', this.newImageData.tip);
    console.log('   Auto-analiză:', this.autoAnalyze);

    // Upload imagine
    this.imageService.uploadImage(userId, this.pacient.id, formData).subscribe({
      next: (newImage: Imagine) => {
        console.log('✅ Imagine încărcată cu succes:', newImage);
        
        // Adaugă imaginea la lista de imagini a pacientului
        if (this.pacient && this.pacient.imagini) {
          this.pacient.imagini.push(newImage);
        }

        this.isUploading = false;
        this.closeAddImageModal();
        
        alert('Imaginea a fost încărcată cu succes!\n\n' + 
              (this.autoAnalyze ? 'Analiza este în curs de desfășurare...' : 'Poți analiza imaginea mai târziu.'));

        // Navighează la noua imagine
        this.router.navigate(['/imagine', newImage.id]);
      },
      error: (error: any) => {
        console.error('❌ Eroare la încărcarea imaginii:', error);
        this.isUploading = false;
        alert('Eroare la încărcarea imaginii: ' + (error.error?.message || error.message));
      }
    });
  }
}  




