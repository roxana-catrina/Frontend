import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../service/user/user.service';
import { Imagine } from '../../models/imagine';
import { CommonModule } from '@angular/common';
import { ImagineService } from '../../service/imagine/imagine.service';
import { DashboardComponent } from '../dashboard/dashboard.component';

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
          next: (image: any) => {
            this.image = {
              id: image.id,
              imagine: `data:${image.tip};base64,${image.imagine}`,
              tip: image.tip
            };
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
    if (this.image) {
      const userId = localStorage.getItem('id');
      if (!userId) {
        console.error('User ID not found in local storage');
        return;
      }
   
      this.imageService.deleteImage(this.image.id, userId)
        .subscribe({
          next: () => {
            console.log('Image deleted:', this.image);
            // Send event to update dashboard's list
            const event = new CustomEvent('imageDeleted', { 
              detail: { imageId: this.image?.id }
            });
            window.dispatchEvent(event);
            
          }
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard']).then(() => {
            // Force reload of dashboard component
            window.location.reload();
          });
        }, 100);
    }
  }
}
