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

  constructor(private router: Router) { }
  ngOnInit() {
    if (!localStorage.getItem('user')) {
      this.router.navigateByUrl('/'); // Redirecționare la login dacă nu e logat
    }

    // Previne cache-ul pentru această pagină
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
  }

  logout() {
    StorageService.logout();
    this.router.navigateByUrl('/').then(() => {
      window.location.reload(); // Reîncărcăm pagina
    });
  }
  
}