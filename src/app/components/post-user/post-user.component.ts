import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-post-user',
  standalone: false,
  
  templateUrl: './post-user.component.html',
  styleUrl: './post-user.component.css'
})
export class PostUserComponent {

  postUserForm!: FormGroup;
  constructor( private userService :UserService,
    private fb:FormBuilder,
  private router:Router) { }
  ngOnInit(){
    this.postUserForm = this.fb.group({
      nume: [null, Validators.required],
      parola: [null, Validators.required],
      data_nasterii: [null, Validators.required],
      prenume: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      numar_telefon: [null, [Validators.required]],
      sex: [null, Validators.required],
      tara: [null, Validators.required]
    });
  };

  postUser(){
    console.log(this.postUserForm.value);
    this.userService.postUser(this.postUserForm.value).subscribe(data=>{
      console.log(data);
      this.router.navigateByUrl("/");
    });
  }
 
  }


