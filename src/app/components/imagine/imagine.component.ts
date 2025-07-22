import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../service/user/user.service';
import { Imagine } from '../../models/imagine';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { ImagineService } from '../../service/imagine/imagine.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
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

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private imageService: ImagineService,
   // private dashboardComponent: DashboardComponent
  ) {}

 ngOnInit() {
  const imageId = this.route.snapshot.paramMap.get('id');
  const userId = localStorage.getItem('id');

  if (imageId && userId) {
    this.userService.getImage(Number(userId), Number(imageId))
      .subscribe({
        next: (image: Imagine) => {
          this.image = image;
         
          
          // Aici poți face procesări suplimentare dacă e cazul
          console.log('Image loaded:', this.image);
        },
        error: (error) => {
          console.error('Error loading image:', error);
          this.router.navigate(['/dashboard']);
        }
      });
  }
}

    
  

  goBack() {
    this.router.navigate(['/dashboard']);
  }


  
  
deleteImage(): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: { message: 'Ești sigur că vrei să ștergi această imagine?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const userId = localStorage.getItem('id');
      if (!userId || !this.image) {
        console.error('Lipsesc informații');
        return;
      }

      this.imageService.deleteImage(this.image.id, userId)
        .subscribe({
          next: () => {
            const event = new CustomEvent('imageDeleted', {
              detail: { imageId: this.image?.id }
            });
            window.dispatchEvent(event);
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            console.error('Eroare la ștergere:', err);
            this.router.navigate(['/dashboard']);
          }
        });
    }
  });
  }
}

  

