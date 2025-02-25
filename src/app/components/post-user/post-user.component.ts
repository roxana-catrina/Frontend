import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { CountryService } from '../../service/country/country.service';

@Component({
  selector: 'app-post-user',
  standalone: false,
  templateUrl: './post-user.component.html',
  styleUrls: ['./post-user.component.css']
})
export class PostUserComponent {

  postUserForm!: FormGroup;
  countriesList: any[] = []; // Listă pentru țări
  numarTelefonComplet: string='';
  prefix: string='prefix';

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private countryService: CountryService
  ) { }

  ngOnInit() {
    this.postUserForm = this.fb.group({
      nume: [null, Validators.required],
      parola: [null, Validators.required],
      data_nasterii: [null, Validators.required],
      prenume: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      numar_telefon: ['', [Validators.required,Validators.pattern("^[0-9]{10,15}$")]],
      sex: [null, Validators.required],
      tara: [null, Validators.required],
      prefix :[{value:'',disable:true}]
    });

    // Preluarea țărilor din CountryService
    this.countryService.getCountries().subscribe(data => {
      this.countriesList = data;
     // console.log(data)
    });
  }
     schimbarePrefix(event: Event)
      {
  
      const country=this.postUserForm.value.tara;
      const tara= this.countriesList.find(tara=> tara.nume==country)
      console.log( "tara"+country,tara)
if(tara){
    this.prefix=tara.prefix;
     this.numarTelefonComplet=this.prefix+this.postUserForm.value.numar_telefon;
     console.log("numar complet"+this.numarTelefonComplet)
     this.postUserForm.patchValue({
      prefix: tara.prefix
     })
     
     
}else {
  console.error("Țara nu a fost găsită în lista countriesList!");
}

     }
     

  postUser() {
    
    // Creează un nou obiect de utilizator cu numărul complet
    const userData = { ...this.postUserForm.value, numar_telefon: this.numarTelefonComplet };
  
    console.log("user data"+userData);
    this.userService.postUser(userData).subscribe(data => {
      console.log(data);
      this.router.navigateByUrl("/");
    });
  }

}
 /* const taraSelectata=this.postUserForm.get('tara')?.value;
    this.postUserForm.get('prefix')?.patchValue(taraSelectata.prefix)
    const telefonCuPrefixTara=taraSelectata.prefix+ this.postUserForm.get('numar_telefon');
    this.postUserForm.get('numar_telefon')?.patchValue(telefonCuPrefixTara)
      console.log(taraSelectata, taraSelectata.prefix)*/