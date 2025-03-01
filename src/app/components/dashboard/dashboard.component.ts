import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../service/storage/storage.service';
import { User } from '../../models/user';
import { UserService } from '../../service/user/user.service';
@Component({
  selector: 'app-dashboard',
  standalone: false,

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  prenume: string | null = localStorage.getItem("prenume");
  nume: string | null = localStorage.getItem("nume");
  id :string | null=localStorage.getItem("id");
  selectedFiles: File[] = [];
  imagini: string[] = [];
  
 // userId = 1; // ID-ul utilizatorului

  constructor(private router: Router,
    private userService:UserService
  ) { }
  ngOnInit() {
    if (!localStorage.getItem('user')) {
      this.router.navigateByUrl('/'); // Redirecționare la login dacă nu e logat
      
    }

    // Previne cache-ul pentru această pagină
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };

    this.loadUserImages();
  }

  logout() {
    StorageService.logout();
    this.router.navigateByUrl('/').then(() => {
      window.location.reload(); // Reîncărcăm pagina
    });
  }
  
  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  uploadImage() {
    this.selectedFiles.forEach(file => {
      let id: string | null = localStorage.getItem("id");
    let userId: number = id ? Number(id) : 0;
      this.userService.uploadImage(userId, file).subscribe(() => {
        this.loadUserImages();
      });
    });
  }

  loadUserImages() {
    let id: string | null = localStorage.getItem("id");
    let userId: number = id ? Number(id) : 0;
    this.userService.getUserImages(userId).subscribe((imageDataArray: any) => {
      this.imagini = imageDataArray.map((data: any) => {
        let objectURL = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: 'image/jpeg' }));
        return objectURL;
      });
    });
  }




}