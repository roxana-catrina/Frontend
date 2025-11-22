import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../service/user/user.service';
import { MesajService } from '../../service/mesaj/mesaj.service';
import { WebsocketService } from '../../service/websocket/websocket.service';
import { NotificareService } from '../../service/notificare/notificare.service';
import { Router } from '@angular/router';
import { Mesaj, MesajRequest } from '../../models/mesaj';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mesagerie',
  standalone: false,
  
  templateUrl: './mesagerie.component.html',
  styleUrl: './mesagerie.component.css'
})
export class MesagerieComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  usersWithMessages: any[] = []; // Utilizatori cu mesaje necitite
  otherUsers: any[] = []; // Restul utilizatorilor
  currentUserId: number | null = null;
  currentUserName: string = '';
  
  // Chat state
  showChat: boolean = false;
  selectedUser: any = null;
  messageText: string = '';
  messages: Mesaj[] = [];
  unreadCount: number = 0;
  isLoading: boolean = false;
  
  // WebSocket subscriptions
  private messageSubscription?: Subscription;
  private notificationSubscription?: Subscription;
  private connectionSubscription?: Subscription;

  constructor(
    private userService: UserService,
    private mesajService: MesajService,
    private websocketService: WebsocketService,
    private notificareService: NotificareService,
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
    this.connectWebSocket();
    this.loadUnreadCount();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    this.websocketService.disconnect();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Filtrăm utilizatorul curent din listă
        this.allUsers = users.filter((user: any) => user.id !== this.currentUserId);
        this.loadRecentConversations();
      },
      error: (error) => {
        console.error('Eroare la încărcarea utilizatorilor:', error);
      }
    });
  }

  loadRecentConversations(): void {
    if (!this.currentUserId) return;

    this.mesajService.getRecentConversations(this.currentUserId).subscribe({
      next: (recentMessages: Mesaj[]) => {
        // Extrage ID-urile utilizatorilor cu care ai avut conversații
        const userIdsWithMessages = new Set<number>();
        const unreadCounts = new Map<number, number>();

        recentMessages.forEach(msg => {
          const otherUserId = msg.expeditorId === this.currentUserId ? msg.destinatarId : msg.expeditorId;
          userIdsWithMessages.add(otherUserId);
          
          // Numără mesajele necitite de la fiecare utilizator
          if (!msg.citit && msg.destinatarId === this.currentUserId) {
            unreadCounts.set(otherUserId, (unreadCounts.get(otherUserId) || 0) + 1);
          }
        });

        // Separă utilizatorii în două categorii
        this.usersWithMessages = [];
        this.otherUsers = [];

        this.allUsers.forEach(user => {
          const unreadCount = unreadCounts.get(user.id) || 0;
          const userWithUnread = { ...user, unreadMessagesCount: unreadCount };

          if (userIdsWithMessages.has(user.id)) {
            this.usersWithMessages.push(userWithUnread);
          } else {
            this.otherUsers.push(userWithUnread);
          }
        });

        // Sortează utilizatorii cu mesaje - cei cu mesaje necitite primii
        this.usersWithMessages.sort((a, b) => {
          if (a.unreadMessagesCount !== b.unreadMessagesCount) {
            return b.unreadMessagesCount - a.unreadMessagesCount;
          }
          return 0;
        });

        // Actualizează lista filtrată
        this.updateFilteredUsers();
      },
      error: (error) => {
        console.error('Error loading recent conversations:', error);
        this.usersWithMessages = [];
        this.otherUsers = this.allUsers.map(user => ({ ...user, unreadMessagesCount: 0 }));
        this.updateFilteredUsers();
      }
    });
  }

  updateFilteredUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.usersWithMessages, ...this.otherUsers];
    } else {
      this.searchUsers();
    }
  }

  searchUsers(): void {
    if (!this.searchTerm.trim()) {
      this.updateFilteredUsers();
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    const allUsersToSearch = [...this.usersWithMessages, ...this.otherUsers];
    
    this.filteredUsers = allUsersToSearch.filter(user => {
      const fullName = `${user.prenume || ''} ${user.nume || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchUsers();
  }

  connectWebSocket(): void {
    if (!this.currentUserId) return;

    this.websocketService.connect(this.currentUserId.toString());

    // Subscribe to incoming messages
    this.messageSubscription = this.websocketService.onMessage().subscribe({
      next: (mesaj) => {
        console.log('Mesaj primit prin WebSocket:', mesaj);
        
        if (!mesaj) return;
        
        // Verifică dacă mesajul aparține conversației active
        const isActiveConversation = this.selectedUser && this.showChat &&
            ((mesaj.expeditorId === this.selectedUser.id && mesaj.destinatarId === this.currentUserId) ||
            (mesaj.destinatarId === this.selectedUser.id && mesaj.expeditorId === this.currentUserId));
        
        if (isActiveConversation) {
          console.log('Mesaj pentru conversația activă:', mesaj);
          
          // Adaugă mesajul la conversația curentă doar dacă nu există deja
          const existingMessage = this.messages.find(m => 
            m.expeditorId === mesaj.expeditorId && 
            m.destinatarId === mesaj.destinatarId && 
            m.continut === mesaj.continut &&
            m.dataTrimitere && mesaj.dataTrimitere &&
            Math.abs(new Date(m.dataTrimitere).getTime() - new Date(mesaj.dataTrimitere).getTime()) < 2000
          );
          
          if (!existingMessage) {
            console.log('Adaugă mesaj nou la conversație');
            this.messages.push(mesaj);
            setTimeout(() => this.scrollToBottom(), 100);
          } else {
            console.log('Mesaj duplicat, ignorat');
          }
          
          // Marchează ca citit dacă este de la utilizatorul selectat
          if (mesaj.expeditorId === this.selectedUser.id && mesaj.destinatarId === this.currentUserId) {
            setTimeout(() => {
              this.markAsRead(mesaj.expeditorId);
            }, 300);
          }
        } else {
          console.log('Mesaj nu este pentru conversația activă');
        }
        
        // Actualizează contorul și badge-urile
        this.updateUnreadCountAndBadges();
      },
      error: (error) => console.error('Error receiving message:', error)
    });

    // Subscribe to notifications
    this.notificationSubscription = this.websocketService.onNotification().subscribe({
      next: (notification) => {
        if (notification) {
          console.log('New notification:', notification);
          this.loadUnreadCount();
          // Poți afișa o notificare vizuală aici
        }
      }
    });
  }

  loadUnreadCount(): void {
    if (!this.currentUserId) return;
    
    this.mesajService.countUnreadMessages(this.currentUserId).subscribe({
      next: (count) => {
        this.unreadCount = count;
        // Reîncarcă conversațiile pentru a actualiza badge-urile
        this.loadRecentConversations();
      },
      error: (error) => console.error('Error loading unread count:', error)
    });
  }

  updateUnreadCountAndBadges(): void {
    if (!this.currentUserId) return;
    
    // Actualizează doar contorul fără a reîncărca toate conversațiile
    this.mesajService.countUnreadMessages(this.currentUserId).subscribe({
      next: (count) => {
        this.unreadCount = count;
        console.log('Contor actualizat:', count);
      },
      error: (error) => console.error('Error updating unread count:', error)
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.showChat = true;
    this.isLoading = true;
    
    // Încarcă istoricul conversației
    if (this.currentUserId) {
      this.mesajService.getConversation(this.currentUserId, user.id).subscribe({
        next: (mesaje) => {
          this.messages = mesaje;
          this.isLoading = false;
          this.scrollToBottom();
          
          // Marchează mesajele ca citite
          this.markAsRead(user.id);
        },
        error: (error) => {
          console.error('Error loading conversation:', error);
          this.messages = [];
          this.isLoading = false;
        }
      });
    }
  }

  closeChat(): void {
    this.showChat = false;
    this.selectedUser = null;
    this.messageText = '';
    this.messages = [];
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.currentUserId || !this.selectedUser) {
      return;
    }

    const mesajRequest: MesajRequest = {
      expeditorId: this.currentUserId,
      destinatarId: this.selectedUser.id,
      continut: this.messageText.trim()
    };

    // Trimite mesajul prin API
    this.mesajService.trimiteMesaj(mesajRequest).subscribe({
      next: (mesaj) => {
        console.log('Mesaj trimis cu succes:', mesaj);
        // Adaugă mesajul local imediat pentru feedback instant
        const existingMessage = this.messages.find(m => 
          m.expeditorId === mesaj.expeditorId && 
          m.destinatarId === mesaj.destinatarId && 
          m.continut === mesaj.continut
        );
        
        if (!existingMessage) {
          this.messages.push(mesaj);
          this.scrollToBottom();
        }
        
        this.messageText = '';
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert('Eroare la trimiterea mesajului. Încercați din nou.');
      }
    });
  }

  markAsRead(expeditorId: number): void {
    if (!this.currentUserId) return;
    
    this.mesajService.marcheazaCaCitite(this.currentUserId, expeditorId).subscribe({
      next: () => {
        // Actualizează statusul mesajelor locale
        this.messages.forEach(msg => {
          if (msg.expeditorId === expeditorId && !msg.citit) {
            msg.citit = true;
            msg.dataCitire = new Date();
          }
        });
        // Folosește metoda optimizată în loc de loadUnreadCount
        this.updateUnreadCountAndBadges();
      },
      error: (error) => console.error('Error marking as read:', error)
    });
  }

  scrollToBottom(): void {
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

  getMessageSender(mesaj: Mesaj): string {
    return mesaj.expeditorId === this.currentUserId ? 'me' : 'other';
  }

  getUserProfilePhoto(user: any): string {
    if (!user) return '';
    
    // Dacă obiectul user are profilePhotoUrl explicit
    if (user.profilePhotoUrl) {
      // Dacă URL-ul este relativ, adaugă baza
      if (!user.profilePhotoUrl.startsWith('http')) {
        return `http://localhost:8083${user.profilePhotoUrl}`;
      }
      return user.profilePhotoUrl;
    }
    
    // Altfel, construiește URL-ul bazat pe ID
    if (user.id) {
      return this.userService.getProfilePhotoUrl(user.id);
    }
    
    return '';
  }

  hasProfilePhoto(user: any): boolean {
    // Flag pentru a determina dacă să încercăm să afișăm imaginea
    return !!user && (!!user.profilePhotoUrl || !!user.id);
  }

  onImageError(event: Event): void {
    // Ascunde imaginea în caz de eroare pentru a afișa iconul
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // Forțează re-evaluarea pentru a afișa iconul
    if (img.parentElement) {
      img.parentElement.classList.add('no-image');
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
