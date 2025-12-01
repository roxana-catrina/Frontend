import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Imagine } from '../../models/imagine';
import { Pacient } from '../../models/pacient';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule]
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
}  

