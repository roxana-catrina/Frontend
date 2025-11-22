import { Component, OnInit } from '@angular/core';
import { UserService } from '../../service/user/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mesagerie',
  standalone: false,
  
  templateUrl: './mesagerie.component.html',
  styleUrl: './mesagerie.component.css'
})
export class MesagerieComponent implements OnInit {
  searchTerm: string = '';
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  currentUserId: number | null = null;
  currentUserName: string = '';
  
  // Chat state
  showChat: boolean = false;
  selectedUser: any = null;
  messageText: string = '';
  messages: any[] = [];

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obținem user-ul curent din localStorage
    const idString = localStorage.getItem('id');
    if (idString) {
      this.currentUserId = parseInt(idString, 10);
    }

    const prenume = localStorage.getItem('prenume') || '';
    const nume = localStorage.getItem('nume') || '';
    this.currentUserName = `${prenume} ${nume}`.trim();

    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Filtrăm utilizatorul curent din listă
        this.allUsers = users.filter((user: any) => user.id !== this.currentUserId);
        this.filteredUsers = [...this.allUsers];
      },
      error: (error) => {
        console.error('Eroare la încărcarea utilizatorilor:', error);
      }
    });
  }

  searchUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.allUsers];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.allUsers.filter(user => {
      const fullName = `${user.prenume || ''} ${user.nume || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchUsers();
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.showChat = true;
    this.messages = []; // În viitor, aici vei încărca mesajele existente
    console.log('Chat deschis cu:', user);
  }

  closeChat(): void {
    this.showChat = false;
    this.selectedUser = null;
    this.messageText = '';
    this.messages = [];
  }

  sendMessage(): void {
    if (!this.messageText.trim()) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: this.messageText,
      sender: 'me',
      timestamp: new Date(),
      senderName: this.currentUserName
    };

    this.messages.push(newMessage);
    this.messageText = '';
    
    // Scroll la ultimul mesaj
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
