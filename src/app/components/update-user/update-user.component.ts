import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../service/user/user.service';
import { FormBuilder, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms'; 
import { Router } from '@angular/router';
import { CountryService } from '../../service/country/country.service';
import { PhoneService } from '../../service/phone/phone.service';
import { DataNastereInvalida } from '../../validari/data-nasterii.validor';
import{Location} from '@angular/common';
@Component({
  selector: 'app-update-user',
  standalone: false,
  
  templateUrl: './update-user.component.html',
  styleUrl: './update-user.component.css'
})
export class UpdateUserComponent {
  countriesList: any[] = []; // Listă pentru țări
  id: number;
  prefix: string='';
  numarTelefonComplet:string='';
  numarFaraPrefix:string='';
  taraUser:string='';
  user: any;
  updateUserForm!: FormGroup;
  
  // Profile photo
  selectedProfilePhoto: File | null = null;
  profilePhotoPreview: string | null = null;
  defaultAvatar: string = 'https://via.placeholder.com/150/667eea/ffffff?text=Avatar';
  constructor(private activatedRoute: ActivatedRoute,
              private serviceUser: UserService,
            private fb: FormBuilder,
          private router:Router,
          private phoneService:PhoneService,
        private countryService:CountryService,
       public location : Location) {
      this.id = this.activatedRoute.snapshot.params["id"];
      
  }
  
  ngOnInit(){
     this.updateUserForm = this.fb.group({
          nume: [null, Validators.required],
          parola: [null, Validators.required],
          data_nasterii: [null, [Validators.required,DataNastereInvalida()]],
          prenume: [null, Validators.required],
          email: [null, [Validators.required, Validators.email]],
          numar_telefon: [null,[Validators.pattern("^[0-9]{8,15}$")] ],
          sex: [null, Validators.required],
          tara: [null, Validators.required]
          
        });
        this.countryService.getCountries().subscribe(data => {
          this.countriesList = data;
        });
     this.getUserById(this.id);
    
     
   
  }
  getUserById(id:number){
    
    this.serviceUser.getUserById(id).subscribe((data) => {
     // console.log(data);
    //  console.log("hei");
      const result = this.phoneService.schimbarePrefix(data.tara, data.numar_telefon);
    //  console.log("tara data ",data.tara)
      this.user=data;
      
      // Load profile photo if exists
      if (data.profilePhotoUrl) {
        this.profilePhotoPreview = data.profilePhotoUrl;
      } else {
        // Try to load from backend endpoint
        this.profilePhotoPreview = this.serviceUser.getProfilePhotoUrl(id);
      }
      
    //  console.log("results:",result)
      if (result) {
        this.prefix = result.prefix;
        this.numarTelefonComplet = result.numarTelefonComplet;
      //  console.log("nrtelfcomplet",this.numarTelefonComplet)
 
        this.numarFaraPrefix = data.numar_telefon.startsWith(result.prefix)
          ? data.numar_telefon.slice(result.prefix.length)
          : data.numar_telefon;
        //    console.log("numar fara prefix",this.numarFaraPrefix)
       this.updateUserForm.patchValue({...data,numar_telefon:this.numarFaraPrefix})

      }
    });
  }

  onPrefixChange(event:Event) {
    const result = this.phoneService.schimbarePrefix(this.updateUserForm.value.tara,this.updateUserForm.value.numar_telefon);
  //  console.log("tara din app"+this.updateUserForm.value.tara);
    if (result) {
      this.prefix = result.prefix;
      this.numarTelefonComplet = result.numarTelefonComplet;
    //  console.log("numr telf complet din on prefix change", this.numarTelefonComplet)
    }}

 
 updateUser() {
  const formValue = this.updateUserForm.value;
  const result = this.phoneService.schimbarePrefix(formValue.tara, formValue.numar_telefon);

  if (result) {
    const userData = { ...formValue, numar_telefon: result.numarTelefonComplet };

    // Update user data first
    this.serviceUser.updateUser(this.id, userData).subscribe({
      next: (data) => {
        console.log(data);
        
        // If profile photo is selected, upload it
        if (this.selectedProfilePhoto) {
          const formData = new FormData();
          formData.append('profilePhoto', this.selectedProfilePhoto);
          
          this.serviceUser.uploadProfilePhoto(this.id, formData).subscribe({
            next: (response) => {
              console.log('Profile photo uploaded:', response);
              this.router.navigate(['/dashboard']);
            },
            error: (error) => {
              console.error('Error uploading profile photo:', error);
              // Navigate anyway even if photo upload fails
              this.router.navigate(['/dashboard']);
            }
          });
        } else {
          // No photo to upload, just navigate
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        console.error('Error updating user:', error);
        alert('Eroare la actualizarea profilului. Încercați din nou.');
      }
    });
  }
}

goToDashboard() {
  this.router.navigate(['/dashboard']);
}

onProfilePhotoSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    this.selectedProfilePhoto = input.files[0];
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePhotoPreview = e.target.result;
    };
    reader.readAsDataURL(this.selectedProfilePhoto);
  }
}

removeProfilePhoto(): void {
  this.selectedProfilePhoto = null;
  this.profilePhotoPreview = null;
  const fileInput = document.getElementById('profilePhoto') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

}


