import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../service/storage/storage.service';
import { User } from '../../models/user';
import { Imagine } from '../../models/imagine';
import { Pacient, Sex } from '../../models/pacient';
import { Programare, ProgramareDTO, StatusProgramare } from '../../models/programare';
import { UserService } from '../../service/user/user.service';
import { PacientService } from '../../service/pacient/pacient.service';
import { ImagineService } from '../../service/imagine/imagine.service';
import { BrainTumorService, PredictionResult } from '../../service/brain-tumor/brain-tumor.service';
import { ProgramareService } from '../../service/programare/programare.service';
import { MesajService } from '../../service/mesaj/mesaj.service';


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
  pacienti: Pacient[] = []; // List of patients
  selectedPacient: Pacient | null = null; // Currently selected patient
  imagini: Imagine[] = []; // Images for display
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
  imagePreviewUrl: string | null = null;
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
  filteredPacienti: Pacient[] = [];

  // Adăugați proprietăți pentru predicție
  predictionResult: string = '';
  predictionConfidence: number = 0;
  isAnalyzing: boolean = false;

  // Proprietăți pentru calendar
  currentDate: Date = new Date();
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();
  currentMonthName: string = '';
  calendarDays: any[] = [];
  selectedDate: Date | null = null;

  // Proprietăți pentru programări
  programari: Programare[] = [];
  programariViitoare: Programare[] = [];
  programariZiSelectata: Programare[] = [];
  showProgramareModal: boolean = false;
  showProgramariZiModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  programareToDelete: string | null = null;
  
  // Notificări personalizate
  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' | 'warning' = 'success';
  
  // Date formular programare
  programareNume: string = '';
  programarePrenume: string = '';
  programareCnp: string = '';
  programareOra: string = '';
  programareTip: string = '';
  programareDetalii: string = '';
  programareDurata: number = 30;
  
  // Autocomplete pentru pacienți
  pacientiSuggestions: Pacient[] = [];
  showPacientiSuggestions: boolean = false;
  pacientiFiltrati: Pacient[] = [];

  // Mesaje necitite
  mesajeNecitite: number = 0;
  private mesajeCheckInterval: any;

 // userId = 1; // ID-ul utilizatorului

  constructor(
    private router: Router,
    private userService: UserService,
    private pacientService: PacientService,
    private imagineService: ImagineService,
    private brainTumorService: BrainTumorService,
    private programareService: ProgramareService,
    private mesajService: MesajService
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
  
  // Actualizează mesajele când utilizatorul revine la pagină
  window.addEventListener('focus', () => {
    this.loadMesajeNecitite();
  });

  // Inițializare calendar
  this.generateCalendar();
  this.loadProgramari();
  
  // Încarcă mesaje necitite
  this.loadMesajeNecitite();
  // Verifică mesaje necitite la fiecare 30 secunde
  this.mesajeCheckInterval = setInterval(() => {
    this.loadMesajeNecitite();
  }, 30000);
  }

  ngOnDestroy() {
    // Remove event listener when component is destroyed
    window.removeEventListener('imageDeleted', this.imageDeletedListener);
    
    // Clean up preview URL to prevent memory leaks
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
    }
    
    // Oprește verificarea mesajelor
    if (this.mesajeCheckInterval) {
      clearInterval(this.mesajeCheckInterval);
    }
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
      
      // Generate preview URL
      if (this.selectedFile) {
        // Clean up previous preview URL to avoid memory leaks
        if (this.imagePreviewUrl) {
          URL.revokeObjectURL(this.imagePreviewUrl);
        }
        // Create new preview URL
        this.imagePreviewUrl = URL.createObjectURL(this.selectedFile);
      }
    } else {
      // Clean up if no file selected
      if (this.imagePreviewUrl) {
        URL.revokeObjectURL(this.imagePreviewUrl);
        this.imagePreviewUrl = null;
      }
    }
  }

  loadPacienti() {
    let id: string | null = localStorage.getItem("id");
    if (!id) return;

    this.pacientService.getAllPacienti(id).subscribe({
      next: (pacienti: Pacient[]) => {
        console.log("Pacienți primiți de la API:", pacienti);
        this.pacienti = pacienti;
        
        // Flatten all images from all patients for display (kept for backwards compatibility)
        this.imagini = [];
        pacienti.forEach(pacient => {
          if (pacient.imagini && pacient.imagini.length > 0) {
            this.imagini.push(...pacient.imagini);
          }
        });
        
        this.filteredImagini = [...this.imagini];
        this.filteredPacienti = [...this.pacienti];
        console.log("Total pacienți:", this.pacienti.length);
        console.log("Total imagini încărcate:", this.imagini.length);
      },
      error: (error: any) => {
        console.error("Eroare la încărcarea pacienților:", error);
        this.pacienti = [];
        this.imagini = [];
        this.filteredPacienti = [];
      }
    });
  }
  
    onRightClick(event: MouseEvent, image: Imagine, index: number) {
      event.preventDefault();
      this.contextMenuVisible = true;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.selectedImageData = image.imageUrl;
      console.log("Selected image data:", this.selectedImageData);
      console.log(image.imageUrl);
      this.selectedIndex = index;
      this.selectedImageId = image.id;
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
          console.log("Predicție primită de la serviciul ML:", prediction);
        if (prediction.success) {
          this.predictionResult = prediction.hasTumor 
            ? `ATENȚIE: Tumoare detectată - Tip: ${prediction.type || prediction.prediction}` 
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
    if (!this.selectedFile) {
      this.showCustomNotification('Selectează o imagine mai întâi!', 'warning');
      return;
    }

    let id: string | null = localStorage.getItem("id");
    if (!id) {
      this.showCustomNotification('Eroare: Utilizator neautentificat', 'error');
      return;
    }

    // Validare date pacient
    if (!this.numePacient || !this.prenumePacient || !this.cnp || !this.dataNasterii || !this.sex || !this.numarTelefon) {
      this.showCustomNotification('Completează toate câmpurile obligatorii ale pacientului!', 'warning');
      return;
    }

    // Prepare FormData with both patient data and file
    const formData = new FormData();
    
    // Add patient data as JSON string
    const pacientData = {
      numePacient: this.numePacient,
      prenumePacient: this.prenumePacient,
      sex: this.sex,
      dataNasterii: this.dataNasterii,
      cnp: this.cnp,
      numarTelefon: this.numarTelefon,
      detalii: this.detalii || '',
      istoricMedical: this.istoricMedical || ''
    };
    
    formData.append('pacientData', JSON.stringify(pacientData));
    
    // Add the file
    formData.append('file', this.selectedFile, this.selectedFile.name);

    console.log('=== DEBUG: Înregistrare Pacient cu Imagine ===');
    console.log('User ID:', id);
    console.log('Date pacient trimise:', JSON.stringify(pacientData, null, 2));
    console.log('Fișier:', this.selectedFile.name, '-', this.selectedFile.type);
    console.log('Endpoint:', `/api/user/${id}/pacient/withdata`);
    console.log('==========================================');

    // Send to the new endpoint that handles both patient and image
    this.pacientService.createPacientWithImage(id, formData).subscribe({
      next: (response: any) => {
        console.log('✓ Răspuns de la backend:', JSON.stringify(response, null, 2));
        this.message = 'Pacient și imagine încărcate cu succes!';
        this.selectedFiles = [];
        this.selectedFile = null;
        
        // Reset form
        this.resetForm();
        
        // Clean up preview
        if (this.imagePreviewUrl) {
          URL.revokeObjectURL(this.imagePreviewUrl);
          this.imagePreviewUrl = null;
        }
        
        // Reload data
        this.loadDashboardData();
        
        // Show success notification
        this.showCustomNotification(response.message || 'Pacient și imagine încărcate cu succes!', 'success');
      },
      error: (error: any) => {
        console.error('✗ Eroare la crearea pacientului:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Detalii complete:', JSON.stringify(error, null, 2));
        this.showCustomNotification('Eroare la crearea pacientului', 'error');
      }
    });
  }

  // Metodă nouă pentru crearea pacientului fără imagine
  createPacientWithoutImage() {
    let id: string | null = localStorage.getItem("id");
    if (!id) {
      this.showCustomNotification('Eroare: Utilizator neautentificat', 'error');
      return;
    }

    // Validare date pacient
    if (!this.numePacient || !this.prenumePacient || !this.cnp || !this.dataNasterii || !this.sex || !this.numarTelefon) {
      this.showCustomNotification('Completează toate câmpurile obligatorii ale pacientului!', 'warning');
      return;
    }

    // Creează FormData fără fișier - backend-ul poate accepta doar datele
    const formData = new FormData();
    
    const pacientData = {
      numePacient: this.numePacient,
      prenumePacient: this.prenumePacient,
      sex: this.sex,
      dataNasterii: this.dataNasterii,
      cnp: this.cnp,
      numarTelefon: this.numarTelefon,
      detalii: this.detalii || '',
      istoricMedical: this.istoricMedical || ''
    };
    
    formData.append('pacientData', JSON.stringify(pacientData));
    // Nu adăugăm fișier - backend-ul ar trebui să accepte acest lucru

    console.log('=== DEBUG: Creare Pacient fără Imagine ===');
    console.log('User ID:', id);
    console.log('Date pacient:', JSON.stringify(pacientData, null, 2));
    console.log('Endpoint:', `/api/user/${id}/pacient/withdata`);
    console.log('==========================================');

    // Folosim același endpoint ca și pentru pacient cu imagine
    this.pacientService.createPacientWithImage(id, formData).subscribe({
      next: (response: any) => {
        console.log('✓ Pacient creat cu succes:', response);
        this.message = 'Pacient înregistrat cu succes!';
        
        // Reset form
        this.resetForm();
        
        // Reload data
        this.loadDashboardData();
        
        // Show success notification
        this.showCustomNotification('Pacient înregistrat cu succes!', 'success');
      },
      error: (error: any) => {
        console.error('✗ Eroare la crearea pacientului:', error);
        this.showCustomNotification('Eroare la crearea pacientului. Verifică că toate datele sunt corecte.', 'error');
      }
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
    this.selectedFile = null;
    this.selectedFiles = [];
    
    // Clean up preview
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
    }
  }

loadDashboardData(): void {
  let id: string | null = localStorage.getItem("id");
  if (!id) return;

  this.pacientService.getAllPacienti(id).subscribe({
    next: (pacienti: Pacient[]) => {
      console.log("Pacienți primiți de la API:", pacienti);
      this.pacienti = pacienti;
      
      // Flatten all images from all patients for display
      this.imagini = [];
      pacienti.forEach(pacient => {
        if (pacient.imagini && pacient.imagini.length > 0) {
          this.imagini.push(...pacient.imagini);
        }
      });
      
      this.filteredImagini = [...this.imagini];
      this.filteredPacienti = [...this.pacienti];
      console.log("Total pacienți:", this.pacienti.length);
      console.log("Total imagini încărcate:", this.imagini.length);
    },
    error: (error: any) => {
      console.error("Eroare la încărcarea pacienților:", error);
      this.pacienti = [];
      this.imagini = [];
      this.filteredPacienti = [];
    }
  });
}

loadMesajeNecitite(): void {
  let id: string | null = localStorage.getItem("id");
  if (!id) return;

  this.mesajService.countUnreadMessages(id).subscribe({
    next: (count: number) => {
      this.mesajeNecitite = count;
      console.log(`Mesaje necitite: ${count}`);
    },
    error: (error: any) => {
      console.error("Eroare la încărcarea mesajelor necitite:", error);
      this.mesajeNecitite = 0;
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

  viewPacient(pacient: Pacient) {
    console.log("Navigating to patient:", pacient);
    // Navigate to the first image of the patient, or to patient profile if no images
    if (pacient.imagini && pacient.imagini.length > 0) {
      // Dacă are imagini, mergem la prima imagine
      this.router.navigate(['dashboard/imagine', pacient.imagini[0].id]);
    } else {
      // Dacă nu are imagini, mergem la profilul pacientului folosind un ID special
      // Vom modifica componenta imagine să accepte și pacientId
      this.router.navigate(['dashboard/pacient', pacient.id]);
    }
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
      // Find the patient for this image
      const pacient = this.getPacientByImageId(image.id);
      if (!pacient) return false;
      
      const numePacient = (pacient.numePacient || '').toLowerCase();
      const prenumePacient = (pacient.prenumePacient || '').toLowerCase();
      const cnp = (pacient.cnp || '').toLowerCase();
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

  // Metodă pentru filtrarea pacienților după nume sau CNP


  searchPacienti() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredPacienti = [...this.pacienti];
      return;
    }
    this.filteredPacienti = this.pacienti.filter(pacient => {
      const numePacient = (pacient.numePacient || '').toLowerCase();
      const prenumePacient = (pacient.prenumePacient || '').toLowerCase();
      const cnp = (pacient.cnp || '').toLowerCase();
      const numeComplet = `${numePacient} ${prenumePacient}`.trim();
      
      return numePacient.includes(term) || 
             prenumePacient.includes(term) || 
             numeComplet.includes(term) ||
             cnp.includes(term);
    });
  }

  // Helper method to get patient by image ID
  getPacientByImageId(imageId: string): Pacient | null {
    for (const pacient of this.pacienti) {
      if (pacient.imagini && pacient.imagini.some(img => img.id === imageId)) {
        return pacient;
      }
    }
    return null;
  }

  // Metodă pentru resetarea căutării
  clearSearch() {
    this.searchTerm = '';
    this.filteredImagini = [...this.imagini];
    this.filteredPacienti = [...this.pacienti];
  }

  // Metode pentru calendar
  generateCalendar() {
    const year = this.currentYear;
    const month = this.currentMonth;
    
    // Nume lună
    const monthNames = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
                        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    this.currentMonthName = monthNames[month];

    // Prima zi a lunii
    const firstDay = new Date(year, month, 1);
    // Ultima zi a lunii
    const lastDay = new Date(year, month + 1, 0);
    
    // Ziua săptămânii pentru prima zi (0 = Duminică, 1 = Luni, etc.)
    let startingDayOfWeek = firstDay.getDay();
    // Ajustare pentru ca Luni să fie prima zi (0)
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Numărul de zile în lună
    const daysInMonth = lastDay.getDate();

    // Ziua curentă
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    this.calendarDays = [];

    // Adaugă zilele din luna anterioară
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      this.calendarDays.push({
        day: prevMonthLastDay - i,
        otherMonth: true,
        isToday: false,
        selected: false
      });
    }

    // Adaugă zilele din luna curentă
    for (let day = 1; day <= daysInMonth; day++) {
      this.calendarDays.push({
        day: day,
        otherMonth: false,
        isToday: isCurrentMonth && day === today.getDate(),
        selected: false
      });
    }

    // Completează restul până la 42 de zile (6 săptămâni)
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      this.calendarDays.push({
        day: day,
        otherMonth: true,
        isToday: false,
        selected: false
      });
    }
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
    this.loadProgramari();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
    this.loadProgramari();
  }

  selectDay(day: any) {
    if (day.otherMonth) return;
    
    // Verifică dacă ziua selectată este în trecut
    const selectedDate = new Date(this.currentYear, this.currentMonth, day.day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    const isPastDay = selectedDate < today;
    
    // Resetează selecția anterioară
    this.calendarDays.forEach(d => d.selected = false);
    day.selected = true;
    
    this.selectedDate = new Date(this.currentYear, this.currentMonth, day.day);
    console.log('Zi selectată:', this.selectedDate);
    
    // Verifică dacă există programări în această zi
    this.programariZiSelectata = this.programari.filter(prog => {
      const progDate = new Date(prog.dataProgramare);
      return progDate.getDate() === day.day &&
             progDate.getMonth() === this.currentMonth &&
             progDate.getFullYear() === this.currentYear;
    }).sort((a, b) => {
      // Sortează după oră
      return new Date(a.dataProgramare).getTime() - new Date(b.dataProgramare).getTime();
    });

    if (this.programariZiSelectata.length > 0) {
      // Dacă există programări, arată lista (fie zi trecută, fie viitoare)
      console.log(`Ziua ${day.day} are ${this.programariZiSelectata.length} programări`);
      this.showProgramariZiModal = true;
    } else {
      // Dacă nu există programări
      if (isPastDay) {
        // Zi din trecut fără programări - nu face nimic sau arată mesaj
        this.showCustomNotification('Nu există programări în această zi din trecut.', 'warning');
      } else {
        // Zi viitoare fără programări - permite crearea de programare nouă
        this.showProgramareModal = true;
      }
    }
  }

  // Metode pentru programări
  loadProgramari() {
    let id: string | null = localStorage.getItem("id");
    if (!id) {
      console.error('❌ Nu există user ID în localStorage!');
      return;
    }

    console.log('=== ÎNCĂRCARE PROGRAMĂRI ===');
    console.log('User ID (Doctor ID):', id);
    console.log('Tip userId:', typeof id);
    console.log('An curent:', this.currentYear);
    console.log('Luna curentă (0-11):', this.currentMonth);
    console.log('Luna pentru API (1-12):', this.currentMonth + 1);
    console.log('URL pentru luna:', `http://localhost:8083/api/programari/user/${id}/month?year=${this.currentYear}&month=${this.currentMonth + 1}`);
    console.log('URL pentru viitoare:', `http://localhost:8083/api/programari/user/${id}/upcoming`);

    // Încarcă programările pentru luna curentă
    this.programareService.getProgramariByMonth(id, this.currentYear, this.currentMonth + 1).subscribe({
      next: (programari) => {
        console.log('✅ SUCCESS - Răspuns GET programări luna:');
        console.log('   - Status: 200 OK');
        console.log('   - Tip răspuns:', typeof programari);
        console.log('   - Este array?:', Array.isArray(programari));
        console.log('   - Număr programări:', programari?.length || 0);
        console.log('   - Date brute:', JSON.stringify(programari, null, 2));
        
        if (programari && programari.length > 0) {
          this.programari = programari;
          console.log('   - Programări setate în component');
          
          programari.forEach((prog, index) => {
            console.log(`   ${index + 1}. Pacient: ${prog.pacientNume} ${prog.pacientPrenume}`);
            console.log(`      Data: ${prog.dataProgramare}`);
            console.log(`      Data convertită: ${new Date(prog.dataProgramare).toLocaleString()}`);
            console.log(`      Tip consultație: ${prog.tipConsultatie || 'N/A'}`);
            console.log(`      Status: ${prog.status || 'N/A'}`);
          });
          
          this.markCalendarDaysWithAppointments();
        } else {
          console.warn('⚠️ Array de programări este gol sau null');
          this.programari = [];
        }
      },
      error: (error) => {
        console.error('❌ EROARE - Programări luna:');
        console.error('   - Status:', error.status);
        console.error('   - Status Text:', error.statusText);
        console.error('   - Message:', error.message);
        console.error('   - Error body:', error.error);
        console.error('   - URL apelat:', error.url);
        console.error('   - Eroare completă:', JSON.stringify(error, null, 2));
        this.programari = [];
      }
    });

    // Încarcă programările viitoare
    console.log('📞 Apelăm /upcoming...');
    this.programareService.getProgramariViitoare(id).subscribe({
      next: (programari) => {
        console.log('✅ SUCCESS - Răspuns GET programări viitoare:');
        console.log('   - Status: 200 OK');
        console.log('   - Tip răspuns:', typeof programari);
        console.log('   - Este array?:', Array.isArray(programari));
        console.log('   - Număr programări:', programari?.length || 0);
        console.log('   - Date brute:', JSON.stringify(programari, null, 2));
        
        if (programari && programari.length > 0) {
          const now = new Date();
          // Filtrează doar programările viitoare (exclude cele din trecut)
          this.programariViitoare = programari
            .filter(p => new Date(p.dataProgramare) >= now)
            .sort((a, b) => new Date(a.dataProgramare).getTime() - new Date(b.dataProgramare).getTime())
            .slice(0, 5);
          
          console.log('   📅 Programări după filtrare (doar viitoare):', this.programariViitoare.length);
          
          this.programariViitoare.forEach((prog, index) => {
            console.log(`   ${index + 1}. Pacient: ${prog.pacientNume} ${prog.pacientPrenume}`);
            console.log(`      Data: ${new Date(prog.dataProgramare).toLocaleString()}`);
          });
        } else {
          console.warn('⚠️ Array de programări viitoare este gol sau null');
          this.programariViitoare = [];
        }
      },
      error: (error) => {
        console.error('❌ EROARE - Programări viitoare:');
        console.error('   - Status:', error.status);
        console.error('   - Status Text:', error.statusText);
        console.error('   - Message:', error.message);
        console.error('   - Error body:', error.error);
        console.error('   - URL apelat:', error.url);
        console.error('   - Eroare completă:', JSON.stringify(error, null, 2));
        this.programariViitoare = [];
      }
    });

    console.log('===========================');
  }

  markCalendarDaysWithAppointments() {
    let markedDays = 0;
    this.calendarDays.forEach(day => {
      if (!day.otherMonth) {
        const dayDate = new Date(this.currentYear, this.currentMonth, day.day);
        day.hasAppointment = this.programari.some(prog => {
          const progDate = new Date(prog.dataProgramare);
          const match = progDate.getDate() === day.day &&
                 progDate.getMonth() === this.currentMonth &&
                 progDate.getFullYear() === this.currentYear;
          
          if (match) {
            markedDays++;
          }
          return match;
        });
      }
    });
   
  }

  createProgramare() {
    if (!this.selectedDate || !this.programareNume || !this.programarePrenume || !this.programareOra) {
      this.showCustomNotification('Te rog completează toate câmpurile obligatorii!', 'warning');
      return;
    }

    let id: string | null = localStorage.getItem("id");
    if (!id) {
      this.showCustomNotification('Eroare: Utilizator neautentificat', 'error');
      return;
    }

    // Combină data selectată cu ora
    const [hours, minutes] = this.programareOra.split(':');
    const dataProgramare = new Date(this.selectedDate);
    dataProgramare.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Verifică dacă data programării este în trecut
    const now = new Date();
    if (dataProgramare < now) {
      this.showCustomNotification('Nu poți crea programări în trecut! Te rog selectează o dată viitoare.', 'warning');
      return;
    }

    console.log('=== VERIFICARE CONFLICT PROGRAMARE ===');
    console.log('Data nouă:', dataProgramare);
    console.log('Durata nouă (minute):', this.programareDurata);
    console.log('Programări existente de verificat:', this.programari.length);

    // Verifică dacă există conflict cu alte programări
    const conflict = this.verificaConflictProgramare(dataProgramare, this.programareDurata);
    if (conflict) {
      const startTime = this.formatProgramareTime(conflict.dataProgramare);
      const endTime = this.calculateEndTime(conflict.dataProgramare, conflict.durataMinute || 30);
      
      console.log('❌ CONFLICT DETECTAT!');
      console.log('Programare conflictuală:', conflict);
      
      this.showCustomNotification(
        `Există deja o programare în acest interval! Pacient: ${conflict.pacientNume} ${conflict.pacientPrenume} (${startTime} - ${endTime})`,
        'warning'
      );
      return;
    }
    
    console.log('✅ Nu există conflicte - se poate adăuga programarea');
    console.log('=====================================');

    // Format în ISO local (fără conversie UTC)
    const year = dataProgramare.getFullYear();
    const month = String(dataProgramare.getMonth() + 1).padStart(2, '0');
    const day = String(dataProgramare.getDate()).padStart(2, '0');
    const hour = String(dataProgramare.getHours()).padStart(2, '0');
    const minute = String(dataProgramare.getMinutes()).padStart(2, '0');
    const second = String(dataProgramare.getSeconds()).padStart(2, '0');
    
    // Format: YYYY-MM-DDTHH:mm:ss
    const dataFormatata = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

    // Găsește pacientul după nume, prenume și CNP
    const pacient = this.pacienti.find(p => 
      p.numePacient === this.programareNume &&
      p.prenumePacient === this.programarePrenume &&
      (!this.programareCnp || p.cnp === this.programareCnp)
    );

    const programareDTO: ProgramareDTO = {
      pacientId: pacient?.id || '', // Trimite ID-ul pacientului dacă există
      pacientNume: this.programareNume,
      pacientPrenume: this.programarePrenume,
      pacientCnp: this.programareCnp || '',
      dataProgramare: dataFormatata,
      durataMinute: this.programareDurata,
      tipConsultatie: this.programareTip || '',
      detalii: this.programareDetalii || ''
    };

    console.log('=== DEBUG: Creare Programare ===');
    console.log('URL:', 'http://localhost:8083/api/programari');
    console.log('Date programare trimise la backend:');
    console.log(JSON.stringify(programareDTO, null, 2));
    console.log('Câmpuri:');
    console.log('  - pacientId:', programareDTO.pacientId || '(gol - pacient nou)');
    console.log('  - pacientNume:', programareDTO.pacientNume);
    console.log('  - pacientPrenume:', programareDTO.pacientPrenume);
    console.log('  - pacientCnp:', programareDTO.pacientCnp || '(gol)');
    console.log('  - dataProgramare:', programareDTO.dataProgramare);
    console.log('  - durataMinute:', programareDTO.durataMinute);
    console.log('  - tipConsultatie:', programareDTO.tipConsultatie);
    console.log('  - detalii:', programareDTO.detalii || '(gol)');
    console.log('Data și ora originală:', dataProgramare);
    console.log('================================');

    this.programareService.createProgramare(programareDTO).subscribe({
      next: (response) => {
        console.log('✓ Programare creată cu succes:', JSON.stringify(response, null, 2));
        this.closeProgramareModal();
        this.loadProgramari();
        this.showCustomNotification('Programare adăugată cu succes!', 'success');
      },
      error: (error) => {
        console.error('✗ Eroare la crearea programării:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Detalii complete:', JSON.stringify(error, null, 2));
        this.showCustomNotification('Eroare la adăugarea programării!', 'error');
      }
    });
  }

  verificaConflictProgramare(dataNoua: Date, durataNoua: number): Programare | null {
    const startNoua = dataNoua.getTime();
    const endNoua = startNoua + (durataNoua * 60 * 1000); // convertește minute în milisecunde

    console.log('🔍 Verificare conflict:');
    console.log('   Interval nou: ', new Date(startNoua), ' -> ', new Date(endNoua));
    console.log('   Durata nouă:', durataNoua, 'minute');

    // Verifică toate programările existente
    for (const prog of this.programari) {
      const dataProg = new Date(prog.dataProgramare);
      const startExistent = dataProg.getTime();
      const durataExistent = prog.durataMinute || 30;
      const endExistent = startExistent + (durataExistent * 60 * 1000);

      // Verifică dacă intervalele se suprapun
      const seSuprapun = (startNoua < endExistent) && (endNoua > startExistent);
      
      console.log(`   Comparare cu: ${prog.pacientNume} ${prog.pacientPrenume}`);
      console.log(`      Interval existent: ${new Date(startExistent)} -> ${new Date(endExistent)}`);
      console.log(`      Se suprapun? ${seSuprapun}`);
      
      if (seSuprapun) {
        console.log('⚠️ CONFLICT GĂSIT!');
        console.log('   Programare conflictuală:', prog);
        console.log('   Start existent:', new Date(startExistent));
        console.log('   End existent:', new Date(endExistent));
        console.log('   Start nou:', new Date(startNoua));
        console.log('   End nou:', new Date(endNoua));
        return prog;
      }
    }

    console.log('   ✅ Nu s-a găsit niciun conflict');
    return null;
  }

  closeProgramareModal() {
    this.showProgramareModal = false;
    this.resetProgramareForm();
  }

  resetProgramareForm() {
    this.programareNume = '';
    this.programarePrenume = '';
    this.programareCnp = '';
    this.programareOra = '';
    this.programareTip = '';
    this.programareDetalii = '';
    this.programareDurata = 30;
    this.showPacientiSuggestions = false;
    this.pacientiFiltrati = [];
  }

  onProgramareNumeChange() {
    const searchTerm = this.programareNume.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
      this.showPacientiSuggestions = false;
      this.pacientiFiltrati = [];
      return;
    }

    // Filtrează pacienții după nume
    this.pacientiFiltrati = this.pacienti.filter(pacient => {
      const numeLower = pacient.numePacient.toLowerCase();
      const prenumeLower = pacient.prenumePacient.toLowerCase();
      const numeComplet = `${pacient.numePacient} ${pacient.prenumePacient}`.toLowerCase();
      
      return numeLower.includes(searchTerm) || 
             prenumeLower.includes(searchTerm) ||
             numeComplet.includes(searchTerm);
    });

    this.showPacientiSuggestions = this.pacientiFiltrati.length > 0;
  }

  selectPacient(pacient: Pacient) {
    this.programareNume = pacient.numePacient || '';
    this.programarePrenume = pacient.prenumePacient || '';
    this.programareCnp = pacient.cnp || '';
    this.showPacientiSuggestions = false;
    this.pacientiFiltrati = [];
  }

  hideSuggestions() {
    // Delay pentru a permite click pe sugestie
    setTimeout(() => {
      this.showPacientiSuggestions = false;
    }, 200);
  }

  closeProgramariZiModal() {
    this.showProgramariZiModal = false;
  }

  openCreateProgramareModal() {
    this.showProgramariZiModal = false;
    this.showProgramareModal = true;
  }

  deleteProgramare(id: string) {
    this.programareToDelete = id;
    this.showDeleteConfirmModal = true;
  }

  confirmDeleteProgramare() {
    if (this.programareToDelete === null) return;
    
    this.programareService.deleteProgramare(this.programareToDelete).subscribe({
      next: () => {
        console.log('Programare ștearsă cu succes');
        
        // Actualizează lista de programări din zi
        this.programariZiSelectata = this.programariZiSelectata.filter(p => p.id !== this.programareToDelete);
        
        // Închide modalul dacă nu mai sunt programări
        if (this.programariZiSelectata.length === 0) {
          this.closeProgramariZiModal();
        }
        
        // Reîncarcă toate programările și actualizează calendarul
        this.loadProgramari();
        
        this.showDeleteConfirmModal = false;
        this.programareToDelete = null;
      },
      error: (error) => {
        console.error('Eroare la ștergerea programării:', error);
        this.showDeleteConfirmModal = false;
        this.programareToDelete = null;
      }
    });
  }

  cancelDeleteProgramare() {
    this.showDeleteConfirmModal = false;
    this.programareToDelete = null;
  }

  formatProgramareDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  }

  formatProgramareTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  calculateEndTime(startDate: Date | string, durataMinute: number): string {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + (durataMinute * 60 * 1000));
    return end.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  formatProgramareInterval(date: Date | string, durata: number): string {
    const startTime = this.formatProgramareTime(date);
    const endTime = this.calculateEndTime(date, durata);
    return `${startTime} - ${endTime}`;
  }

  formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    };
    return this.selectedDate.toLocaleDateString('ro-RO', options);
  }

  isSelectedDateInPast(): boolean {
    if (!this.selectedDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(this.selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  }

  isProgramareInPast(programare: Programare): boolean {
    const programareDate = new Date(programare.dataProgramare);
    const now = new Date();
    return programareDate < now;
  }

  // Sistem de notificări personalizate
  showCustomNotification(message: string, type: 'success' | 'error' | 'warning') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Ascunde automat după 4 secunde
    setTimeout(() => {
      this.closeNotification();
    }, 4000);
  }

  closeNotification() {
    this.showNotification = false;
  }
}