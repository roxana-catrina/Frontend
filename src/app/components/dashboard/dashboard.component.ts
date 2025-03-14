import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../service/storage/storage.service';
import { User } from '../../models/user';
import { Imagine } from '../../models/imagine';
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
  imagini: Imagine[] = [];
  message: string = '';
  base64Data: any;
  retrievedImage: any;
  retrieveResonse: any;
  contextMenuVisible = false;
  menuX = 0;
  menuY = 0;
  selectedImageId: string | null = null;
  selectedImageData: string | null = null;
  selectedIndex: number | null = null;

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

  loadUserImages() {
    let id: string | null = localStorage.getItem("id");
    let userId: number = id ? Number(id) : 0;

    this.userService.getUserImages(userId).subscribe({
      next: (imageDataArray: any) => {
        console.log("Date primite de la API:", imageDataArray);

        if (!imageDataArray || imageDataArray.length === 0) {
          console.warn("Nu s-au primit imagini.");
          this.imagini = [];
          return;
        }

        this.imagini = imageDataArray.map((image: any) => ({
          id: image.id,
          nume: image.nume,
          tip: image.tip,
          imagine: `data:${image.tip};base64,${image.imagine}`
        }));

        console.log("Imagini procesate:", this.imagini);
      },
      error: (error) => {
        console.error("Eroare la încărcarea imaginilor:", error);
      }
    });
  }
  
    onRightClick(event: MouseEvent, image: Imagine, index: number) {
      event.preventDefault();
      this.contextMenuVisible = true;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.selectedImageData = image.imagine;
      this.selectedIndex = index;
    }

  deleteImage() {
    if (this.selectedIndex !== null && this.selectedImageData) {
      const userId = localStorage.getItem("id");
      this.userService.deleteImage(
        this.selectedImageData,
        this.selectedIndex,
        this.imagini,
        userId,
        () => {
          this.contextMenuVisible = false;
          this.loadUserImages(); // Reload images after deletion
        }
      );
    }
  }
  uploadImage() {
    this.selectedFiles.forEach(file => {
      let id: string | null = localStorage.getItem("id");
      let userId: number = id ? Number(id) : 0;
        const fileType = file.type;
        const newImage: Imagine = {
          id: 0,
          imagine: URL.createObjectURL(file),
          tip: fileType
        };
        this.imagini.push(newImage); // in next nu merge
        this.userService.uploadImage(userId, file).subscribe({
          next: (response: any) => {
            console.log("Imagine încărcată cu succes", response);
            this.selectedFiles = [];
          },
          error: (error) => {
            console.error("Eroare la încărcarea imaginii:", error);
          }
        });
     
    });
  }
  

  onClickOutside() {
    this.contextMenuVisible = false;
  }


}