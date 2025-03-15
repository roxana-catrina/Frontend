import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../service/user/user.service';
import { Imagine } from '../../models/imagine';
import { CommonModule } from '@angular/common';

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
    private userService: UserService
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
}
