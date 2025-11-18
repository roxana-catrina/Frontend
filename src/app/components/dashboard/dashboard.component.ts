import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../service/storage/storage.service';
import { User } from '../../models/user';
import { Imagine } from '../../models/imagine';
import { Programare, ProgramareDTO, StatusProgramare } from '../../models/programare';
import { UserService } from '../../service/user/user.service';
import { BrainTumorService, PredictionResult } from '../../service/brain-tumor/brain-tumor.service';
import { ProgramareService } from '../../service/programare/programare.service';


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
  showProgramareModal: boolean = false;
  
  // Date formular programare
  programareNume: string = '';
  programarePrenume: string = '';
  programareCnp: string = '';
  programareOra: string = '';
  programareTip: string = '';
  programareDetalii: string = '';
  programareDurata: number = 30;
  
  // Autocomplete pentru pacienți
  pacientiSuggestions: Imagine[] = [];
  showPacientiSuggestions: boolean = false;
  pacientiFiltrati: Imagine[] = [];

 // userId = 1; // ID-ul utilizatorului

  constructor(
    private router: Router,
    private userService: UserService,
    private brainTumorService: BrainTumorService,
    private programareService: ProgramareService
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

  // Inițializare calendar
  this.generateCalendar();
  this.loadProgramari();
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
    
    // Resetează selecția anterioară
    this.calendarDays.forEach(d => d.selected = false);
    day.selected = true;
    
    this.selectedDate = new Date(this.currentYear, this.currentMonth, day.day);
    console.log('Zi selectată:', this.selectedDate);
    
    // Deschide modalul pentru creare programare
    this.showProgramareModal = true;
  }

  // Metode pentru programări
  loadProgramari() {
    let id: string | null = localStorage.getItem("id");
    let userId: number = id ? Number(id) : 0;

    console.log('=== ÎNCĂRCARE PROGRAMĂRI ===');
    console.log('User ID:', userId);
    console.log('An curent:', this.currentYear);
    console.log('Luna curentă (0-11):', this.currentMonth);
    console.log('Luna pentru API (1-12):', this.currentMonth + 1);

    // Încarcă programările pentru luna curentă
    this.programareService.getProgramariByMonth(userId, this.currentYear, this.currentMonth + 1).subscribe({
      next: (programari) => {
        console.log('✅ Răspuns GET programări luna:', programari);
        console.log('Număr programări:', programari.length);
        this.programari = programari;
        this.markCalendarDaysWithAppointments();
      },
      error: (error) => {
        console.error('❌ Eroare la încărcarea programărilor lunii:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
      }
    });

    // Încarcă programările viitoare
    console.log('📞 Apelăm /upcoming pentru userId:', userId);
    this.programareService.getProgramariViitoare(userId).subscribe({
      next: (programari) => {
        console.log('✅ Răspuns GET programări viitoare:', programari);
        console.log('Număr programări viitoare:', programari.length);
        this.programariViitoare = programari.slice(0, 5); // Primele 5
      },
      error: (error) => {
        console.error('❌ Eroare la încărcarea programărilor viitoare:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
      }
    });

    // DEBUG: Încearcă să obții TOATE programările
    console.log('📞 DEBUG - Apelăm /user/{userId} pentru TOATE programările');
    this.programareService.getAllProgramari(userId).subscribe({
      next: (toateProgramarile) => {
        console.log('🔍 DEBUG - TOATE programările:', toateProgramarile);
        console.log('Număr TOTAL programări:', toateProgramarile.length);
      },
      error: (error) => {
        console.error('❌ DEBUG - Eroare la încărcarea TUTUROR programărilor:', error);
      }
    });
  }

  markCalendarDaysWithAppointments() {
    console.log('📅 Marcare zile cu programări...');
    console.log('Total programări:', this.programari.length);
    
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
            console.log(`Zi ${day.day} - Programare găsită:`, prog);
            markedDays++;
          }
          return match;
        });
      }
    });
    console.log(`✅ ${markedDays} zile marcate cu programări`);
  }

  createProgramare() {
    if (!this.selectedDate || !this.programareNume || !this.programarePrenume || !this.programareOra) {
      alert('Te rog completează toate câmpurile obligatorii!');
      return;
    }

    let id: string | null = localStorage.getItem("id");
    let userId: number = id ? Number(id) : 0;

    // Combină data selectată cu ora
    const [hours, minutes] = this.programareOra.split(':');
    const dataProgramare = new Date(this.selectedDate);
    dataProgramare.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Format în ISO local (fără conversie UTC)
    const year = dataProgramare.getFullYear();
    const month = String(dataProgramare.getMonth() + 1).padStart(2, '0');
    const day = String(dataProgramare.getDate()).padStart(2, '0');
    const hour = String(dataProgramare.getHours()).padStart(2, '0');
    const minute = String(dataProgramare.getMinutes()).padStart(2, '0');
    const second = String(dataProgramare.getSeconds()).padStart(2, '0');
    
    // Format: YYYY-MM-DDTHH:mm:ss
    const dataFormatata = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

    const programareDTO: ProgramareDTO = {
      userId: userId,
      pacientNume: this.programareNume,
      pacientPrenume: this.programarePrenume,
      pacientCnp: this.programareCnp,
      dataProgramare: dataFormatata,
      durataMinute: this.programareDurata,
      tipConsultatie: this.programareTip,
      detalii: this.programareDetalii
    };

    console.log('=== DATE TRIMISE CĂTRE BACKEND ===');
    console.log('URL:', 'http://localhost:8083/api/programari');
    console.log('ProgramareDTO:', JSON.stringify(programareDTO, null, 2));
    console.log('User ID:', userId);
    console.log('Data și ora programării:', dataProgramare);
    console.log('===================================');

    this.programareService.createProgramare(programareDTO).subscribe({
      next: (response) => {
        console.log('Programare creată cu succes:', response);
        this.closeProgramareModal();
        this.loadProgramari();
        alert('Programare adăugată cu succes!');
      },
      error: (error) => {
        console.error('Eroare la crearea programării:', error);
        alert('Eroare la adăugarea programării!');
      }
    });
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

    // Filtrează pacienții unici după nume
    const pacientiUnici = new Map<string, Imagine>();
    
    this.imagini.forEach(img => {
      if (img.numePacient && img.prenumePacient) {
        const key = `${img.numePacient}_${img.prenumePacient}_${img.cnp || ''}`;
        const numeComplet = `${img.numePacient} ${img.prenumePacient}`.toLowerCase();
        const numeLower = img.numePacient.toLowerCase();
        
        if (numeLower.includes(searchTerm) || numeComplet.includes(searchTerm)) {
          if (!pacientiUnici.has(key)) {
            pacientiUnici.set(key, img);
          }
        }
      }
    });

    this.pacientiFiltrati = Array.from(pacientiUnici.values());
    this.showPacientiSuggestions = this.pacientiFiltrati.length > 0;
  }

  selectPacient(pacient: Imagine) {
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

  deleteProgramare(id: number) {
    if (confirm('Sigur dorești să ștergi această programare?')) {
      this.programareService.deleteProgramare(id).subscribe({
        next: () => {
          console.log('Programare ștearsă cu succes');
          this.loadProgramari();
        },
        error: (error) => {
          console.error('Eroare la ștergerea programării:', error);
        }
      });
    }
  }

  formatProgramareDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  }

  formatProgramareTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
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
}