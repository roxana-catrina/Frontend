import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoCallService } from './service/video-call/video-call.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'fronted_for_photosolve';

  constructor(
    private router: Router,
    private videoCallService: VideoCallService
  ) {}

  ngOnInit(): void {
    // Blochează butonul back
    history.pushState(null, '', location.href);
    window.onpopstate = () => {
      history.pushState(null, '', location.href);
    };

    // Inițializează serviciul de video call dacă utilizatorul e deja logat
    // (de ex. după refresh de pagină)
    const userId = localStorage.getItem('id');
    const prenume = localStorage.getItem('prenume') || '';
    const nume = localStorage.getItem('nume') || '';
    if (userId) {
      const userName = `${prenume} ${nume}`.trim();
      this.videoCallService.initialize(userId, userName);
    }
  }
}