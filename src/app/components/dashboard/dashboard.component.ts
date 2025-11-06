import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../service/storage/storage.service';
import { User } from '../../models/user';
import { Imagine } from '../../models/imagine';
import { UserService } from '../../service/user/user.service';
import { BrainTumorService, PredictionResult } from '../../service/brain-tumor/brain-tumor.service';


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

  // Proprietăți pentru căutare
  searchTerm: string = '';
  filteredImagini: Imagine[] = [];

  // Adăugați proprietăți pentru predicție
  predictionResult: string = '';
  predictionConfidence: number = 0;
  isAnalyzing: boolean = false;

 // userId = 1; // ID-ul utilizatorului

  constructor(
    private router: Router,
    private userService: UserService,
    private brainTumorService: BrainTumorService
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
    if (this.selectedFiles.length > 0) {
      this.selectedFile = this.selectedFiles[0];
      // Reset prediction results when new file is selected
      this.predictionResult = '';
      this.predictionConfidence = 0;
    }
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


  analyzeTumor() {
    if (!this.selectedFile) {
      this.message = 'Te rog selectează o imagine mai întâi!';
      return;
    }

    this.isAnalyzing = true;
    this.predictionResult = 'Se analizează imaginea pentru tumori cerebrale...';
    
    this.brainTumorService.predictTumor(this.selectedFile).subscribe({
      next: (prediction: PredictionResult) => {
        this.isAnalyzing = false;
        if (prediction.success) {
          this.predictionResult = prediction.hasTumor 
            ? `ATENȚIE: Tumoare detectată (${prediction.prediction})` 
            : 'Nu s-a detectat tumoare';
          this.predictionConfidence = prediction.confidence;
          this.message = 'Analiza completă!';
        } else {
          this.predictionResult = prediction.error || 'Serviciul ML nu este disponibil momentan';
          this.message = 'Serviciul de analiză nu este disponibil';
          console.warn('ML service unavailable:', prediction.error);
        }
      },
      error: (error) => {
        this.isAnalyzing = false;
        this.predictionResult = 'Eroare la analizarea imaginii. Serviciul ML nu este disponibil.';
        this.message = 'Eroare la analiza imaginii';
        console.error('ML prediction error:', error);
      }
    });
  }

  uploadImage() {
    this.selectedFiles.forEach(file => {
      let id: string | null = localStorage.getItem("id");
      let userId: number = id ? Number(id) : 0;
      const fileType = file.type;
      
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

      // Încărcați imaginea în baza de date (fără analiză automată)
      this.userService.uploadImage(userId, formData).subscribe({
        next: (response: any) => {
          console.log("Imagine încărcată cu succes", response);
          this.message = 'Imagine încărcată cu succes!';
          this.selectedFiles = [];
          this.selectedFile = null;
          
          // Resetați formularul
          this.resetForm();
          
          this.loadDashboardData();
          this.loadUserImages();
        },
        error: (error) => {
          console.error("Eroare la încărcarea imaginii:", error);
          this.message = 'Eroare la încărcarea imaginii';
          this.loadDashboardData();
          this.loadUserImages();
        }
      });
    });
  }

  resetForm() {
    this.numePacient = '';
    this.prenumePacient = '';
    this.sex = '';
    this.dataNasterii = '';
    this.detalii = '';
    this.istoricMedical = '';
    this.cnp = '';
    this.numarTelefon = '';
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

      // Backend-ul returnează doar: id, imageUrl, nume (filename), tip, cloudinaryPublicId
      // Trebuie să facem apeluri individuale pentru a obține datele pacientului
      this.imagini = images.map((image: any) => {
        console.log("Procesare imagine:", image);
        return {
          id: image.id,
          imagine: image.imageUrl,
          tip: image.tip,
          nume: image.nume, // numele fișierului
          numePacient: '',  // Va fi încărcat separat
          prenumePacient: '', // Va fi încărcat separat
          cnp: '',
          dataNasterii: '',
          sex: '',
          detalii: '',
          istoricMedical: '',
          numarTelefon: ''
        };
      });

      // Încarcă detaliile complete pentru fiecare imagine
      this.imagini.forEach((img, index) => {
        this.userService.getImage(userId, img.id).subscribe({
          next: (fullImage: any) => {
            console.log("Date complete pentru imagine", img.id, ":", fullImage);
            // Actualizează imaginea cu datele complete
            this.imagini[index] = {
              ...this.imagini[index],
              numePacient: fullImage.numePacient || fullImage.nume_pacient || '',
              prenumePacient: fullImage.prenumePacient || fullImage.prenume_pacient || '',
              cnp: fullImage.cnp || '',
              dataNasterii: fullImage.dataNasterii || fullImage.data_nasterii || '',
              sex: fullImage.sex || '',
              detalii: fullImage.detalii || '',
              istoricMedical: fullImage.istoricMedical || fullImage.istoric_medical || '',
              numarTelefon: fullImage.numarTelefon || fullImage.numar_telefon || ''
            };
            // Actualizează și imaginile filtrate
            this.filteredImagini = [...this.imagini];
          },
          error: (err) => {
            console.error("Eroare la încărcarea detaliilor imaginii", img.id, err);
          }
        });
      });

      this.filteredImagini = [...this.imagini];
      console.log("Imagini procesate:", this.imagini);
      console.log("Imagini filtrate initial:", this.filteredImagini);
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

  // Metodă pentru filtrarea imaginilor după numele pacientului
  searchImages() {
    const term = this.searchTerm.toLowerCase().trim();
    
    console.log("Căutare pentru:", term);
    console.log("Total imagini disponibile:", this.imagini.length);
    
    if (!term) {
      this.filteredImagini = [...this.imagini];
      console.log("Căutare goală - afișez toate imaginile:", this.filteredImagini.length);
      return;
    }

    this.filteredImagini = this.imagini.filter(image => {
      const numePacient = (image.numePacient || '').toLowerCase();
      const prenumePacient = (image.prenumePacient || '').toLowerCase();
      const cnp = (image.cnp || '').toLowerCase();
      const numeComplet = `${numePacient} ${prenumePacient}`.trim();
      
      console.log(`Verificare imagine ${image.id}:`, {
        numePacient,
        prenumePacient,
        cnp,
        numeComplet,
        matches: numePacient.includes(term) || prenumePacient.includes(term) || numeComplet.includes(term) || cnp.includes(term)
      });
      
      return numePacient.includes(term) || 
             prenumePacient.includes(term) || 
             numeComplet.includes(term) ||
             cnp.includes(term);
    });
    
    console.log("Rezultate găsite:", this.filteredImagini.length);
  }

  // Metodă pentru resetarea căutării
  clearSearch() {
    this.searchTerm = '';
    this.filteredImagini = [...this.imagini];
  }
}