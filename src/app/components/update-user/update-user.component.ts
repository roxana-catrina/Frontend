import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../service/user.service';
import { FormBuilder, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms'; 
import { Router } from '@angular/router';
import { CountryService } from '../../service/country/country.service';
import { PhoneService } from '../../service/phone/phone.service';

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
  constructor(private activatedRoute: ActivatedRoute,
              private serviceUser: UserService,
            private fb: FormBuilder,
          private router:Router,
          private phoneService:PhoneService,
        private countryService:CountryService) {
      this.id = this.activatedRoute.snapshot.params["id"];
  }
  
  ngOnInit(){
     this.updateUserForm = this.fb.group({
          nume: [null, Validators.required],
          parola: [null, Validators.required],
          data_nasterii: [null, Validators.required],
          prenume: [null, Validators.required],
          email: [null, [Validators.required, Validators.email]],
          numar_telefon: [null ],
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

 
 updateUser(){
  const formValue=this.updateUserForm.value;
  const result=this.phoneService.schimbarePrefix(formValue.tara,formValue.numar_telefon);
  if(result){
  const userData = { ...formValue, numar_telefon: result.numarTelefonComplet };

    this.serviceUser.updateUser(this.id, userData).subscribe((data)=>{
      console.log(data);
      if(data.id!=null)
        this.router.navigateByUrl("");
    
    });
  }}
}


