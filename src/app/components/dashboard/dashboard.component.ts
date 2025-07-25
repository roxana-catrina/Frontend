import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class DashboardComponent implements OnInit, OnDestroy {
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
  
    selectedFile: File | null = null;
numePacient: string = '';
prenumePacient: string = '';
detalii: string = '';
dataNasterii: string ='';
istoricMedical: string = '';
sex: string = '';
cnp: string = '';
numarTelefon: string = '';
  private imageDeletedListener: any;

 // userId = 1; // ID-ul utilizatorului

  constructor(private router: Router,
    private userService:UserService
  ) { }
  ngOnInit() {
    this.loadDashboardData();
   
    if (!localStorage.getItem('user')) {
      this.router.navigateByUrl('/'); // Redirecționare la login dacă nu e logat
      
    }

    // Previne cache-ul pentru această pagină
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };

   

    // Add event listener for image deletion
    this.imageDeletedListener = (event: CustomEvent) => {
      console.log('Image deleted event received', event.detail);
      const deletedImageId = event.detail.imageId;
      // Update the local array
      this.imagini = this.imagini.filter(img => img.id !== deletedImageId);
      // Reload images from server
      
    };
    
     this.loadDashboardData();

  window.addEventListener('imageDeleted', (event: any) => {
    const deletedId = event.detail.imageId;
    this.imagini = this.imagini.filter(img => img.id !== deletedId);
  });
  }

  ngOnDestroy() {
    // Remove event listener when component is destroyed
    window.removeEventListener('imageDeleted', this.imageDeletedListener);
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
          imagine: image.imageUrl , // Asigură-te că imageUrl este corect
          tip: image.tip
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
      console.log("Selected image data:", this.selectedImageData);
      console.log(image.imagine);
      this.selectedIndex = index;
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
         const formData = new FormData();
  formData.append('file', file);
  formData.append('nume_pacient', this.numePacient);
  formData.append('prenume_pacient', this.prenumePacient);
  formData.append('sex', this.sex);
  formData.append('istoric_medical', this.istoricMedical);
formData.append("data_nasterii", this.dataNasterii ? this.dataNasterii.substring(0, 10) : "");
 
formData.append('detalii', this.detalii);
  formData.append('cnp', this.cnp);
  formData.append('numar_telefon', this.numarTelefon);
   ;
   for (const pair of formData.entries()) {
  console.log(`${pair[0]}:`, pair[1]);
}
        //this.imagini.push(newImage); // in next nu merge
        this.userService.uploadImage(userId, formData).subscribe({
          next: (response: any) => {
        
            console.log("Imagine încărcată cu succes", response);
            this.selectedFiles = [];
            this.loadDashboardData();
          this.loadUserImages()
  

          },
          error: (error) => {
            console.error("Eroare la încărcarea imaginii:", error);
             this.loadDashboardData();
          this.loadUserImages()
          console.log("UserId:", userId);
  


               
          }
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard']).then(() => {
               this.loadDashboardData();
this.loadUserImages          });
        }, 100);
        
     
    });
    
  }
  
 

loadDashboardData(): void {
  let id: string | null = localStorage.getItem("id");
  let userId: number = id ? Number(id) : 0;

  this.userService.getUserImages(userId).subscribe({
    next: (images: any) => {
      console.log("Date primite de la API:", images);

      if (!images || images.length === 0) {
        console.warn("Nu s-au primit imagini.");
        this.imagini = [];
        return;
      }

      this.imagini = images.map((image: any) => ({
        id: image.id,
        imagine: image.imageUrl, // doar URL-ul, nu base64
        tip: image.tip
      }));

      console.log("Imagini procesate:", this.imagini);
    },
    error: (error) => {
      console.error("Eroare la încărcarea imaginilor:", error);
    }
  });
}



  onClickOutside() {
    this.contextMenuVisible = false;
  }

  viewImage(image: Imagine) {
     // Check if image exists in the current list
  const exists = this.imagini.some(img => img.id === image.id);
  console.log("Image exists in current list:", exists);
  console.log("Selected image:", image);
  
  if (!exists) {
    console.warn('Image not found in current list, reloading images...');
   // this.loadUserImages();
    return;
  }
  
  console.log("Navigating to image:", image);

  this.router.navigate(['dashboard/imagine', image.id]);
  }
}