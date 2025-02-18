import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../service/storage/storage.service';
@Component({
  selector: 'app-dashboard',
  standalone: false,
  
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  prenume: string | null = localStorage.getItem("prenume");
  nume: string | null = localStorage.getItem("nume");

  constructor(private router: Router) {}

  logout() {  
    StorageService.logout();
    this.router.navigateByUrl(""); // Redirecționăm la login
  }
}