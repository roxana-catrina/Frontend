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
      numar_telefon: [null, [Validators.required]],
      sex: [null, Validators.required],
      tara: [null, Validators.required]
    });

    // Preluarea țărilor din CountryService
    this.countryService.getCountries().subscribe(data => {
      this.countriesList = data;
    });
  }

  postUser() {
    console.log(this.postUserForm.value);
    this.userService.postUser(this.postUserForm.value).subscribe(data => {
      console.log(data);
      this.router.navigateByUrl("/");
    });
  }

}
