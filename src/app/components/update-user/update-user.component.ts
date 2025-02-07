import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../service/user.service';
import { FormBuilder, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms'; 
import { Router } from '@angular/router';
@Component({
  selector: 'app-update-user',
  standalone: false,
  
  templateUrl: './update-user.component.html',
  styleUrl: './update-user.component.css'
})
export class UpdateUserComponent {
  id: number;
  updateUserForm!: FormGroup;
  constructor(private activatedRoute: ActivatedRoute,
              private serviceUser: UserService,
            private fb: FormBuilder,
          private router:Router) {
      this.id = this.activatedRoute.snapshot.params["id"];
  }
  
  ngOnInit(){
     this.updateUserForm = this.fb.group({
          nume: [null, Validators.required],
          parola: [null, Validators.required],
          data_nasterii: [null, Validators.required],
          prenume: [null, Validators.required],
          email: [null, [Validators.required, Validators.email]],
          numar_telefon: [null, [Validators.required]],
          sex: [null, Validators.required],
          tara: [null, Validators.required]
        });
     this.getUserById(this.id);
  }
  getUserById(id:number){
    this.serviceUser.getUserById(this.id).subscribe((data)=>{
      console.log(data);
      this.updateUserForm.patchValue(data); //ca sa completeze automat date in text cand dai pe update
    })
  }

  updateUser(){
    this.serviceUser.updateUser(this.id,this.updateUserForm.value).subscribe((data)=>{
      console.log(data);
      if(data.id!=null)
        this.router.navigateByUrl("");
    })
  }

}


