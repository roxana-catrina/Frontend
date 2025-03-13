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
  message: string = '';
  base64Data: any;
  retrievedImage: any;
  retrieveResonse: any;
  
 // userId = 1; // ID-ul utilizatorului

  constructor(private router: Router,
    private userService:UserService
  ) { }
  ngOnInit() {
    this.loadUserImages();
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
  
      let objectURL = URL.createObjectURL(file);
      this.imagini.push(objectURL); // Adăugăm direct în listă
  
      this.userService.uploadImage(userId, file).subscribe({
        next: () => {
          console.log("Imagine încărcată cu succes");
          // Nu mai apelăm loadUserImages aici
        },
        error: (error) => {
          console.error("Eroare la încărcarea imaginii:", error);
        }
      });
    });
  }

  loadUserImages() {
    let id: string | null = localStorage.getItem("id");
    let userId: number = id ? Number(id) : 0;
    this.userService.getUserImages(userId).subscribe((imageDataArray: any) => {
      this.imagini = imageDataArray.map((base64String: string) => {
        return `data:image/jpeg;base64,${base64String}`;
      });
      console.log("Imagini primite:", this.imagini);
    });
  }




}