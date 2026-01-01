import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../service/user/user.service';
import { MesajService } from '../../service/mesaj/mesaj.service';
import { WebsocketService } from '../../service/websocket/websocket.service';
import { NotificareService } from '../../service/notificare/notificare.service';
import { Router } from '@angular/router';
import { Mesaj, MesajRequest, ImaginePartajata } from '../../models/mesaj';
import { Subscription } from 'rxjs';
import { PacientService } from '../../service/pacient/pacient.service';
import { Pacient } from '../../models/pacient';
import { Imagine } from '../../models/imagine';

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
  currentUserId: string | null = null;
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
  
  // Polling pentru mesaje noi (workaround până când WebSocket funcționează)
  private pollingInterval: any = null;
  private lastMessageId: string | undefined = undefined;
  
  // Proprietăți pentru partajare imagini
  showImageSelectorModal: boolean = false;
  pacienti: Pacient[] = [];
  selectedPacientForSharing: Pacient | null = null;
  imaginiDisponibile: Imagine[] = [];
  searchPacientTerm: string = '';
  searchImagineTerm: string = '';
  filteredPacientiForSharing: Pacient[] = [];
  filteredImaginiForSharing: Imagine[] = [];

  constructor(
    private userService: UserService,
    private mesajService: MesajService,
    private websocketService: WebsocketService,
    private notificareService: NotificareService,
    private router: Router,
    private pacientService: PacientService
  ) {}

  ngOnInit(): void {
    // Obținem user-ul curent din localStorage
    const idString = localStorage.getItem('id');
    if (idString) {
      this.currentUserId = idString;
      console.log('🆔 Current User ID:', this.currentUserId);
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
    
    // Oprește polling-ul
    this.stopPolling();
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
        const userIdsWithMessages = new Set<string>();
        const unreadCounts = new Map<string, number>();

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

    console.log('🔌 Conectare WebSocket pentru userId:', this.currentUserId);
    this.websocketService.connect(this.currentUserId.toString());

    // Subscribe to incoming messages
    this.messageSubscription = this.websocketService.onMessage().subscribe({
      next: (mesaj) => {
        console.log('🔔 Mesaj WebSocket primit:', mesaj);
        
        if (!mesaj) {
          console.log('⚠️ Mesaj null, ignorat');
          return;
        }
        
        // Verifică dacă mesajul aparține conversației active
        const isFromSelectedUser = mesaj.expeditorId === this.selectedUser?.id && mesaj.destinatarId === this.currentUserId;
        const isToSelectedUser = mesaj.destinatarId === this.selectedUser?.id && mesaj.expeditorId === this.currentUserId;
        const isActiveConversation = this.selectedUser && this.showChat && (isFromSelectedUser || isToSelectedUser);
        
        if (isActiveConversation) {
          console.log('✅ Mesaj pentru conversația activă - adăugat INSTANT');
          
          // Verifică dacă mesajul există deja (pe baza ID-ului dacă există)
          const existingMessage = mesaj.id 
            ? this.messages.find(m => m.id === mesaj.id)
            : this.messages.find(m => 
                m.expeditorId === mesaj.expeditorId && 
                m.destinatarId === mesaj.destinatarId && 
                m.continut === mesaj.continut &&
                m.dataTrimitere && mesaj.dataTrimitere &&
                Math.abs(new Date(m.dataTrimitere).getTime() - new Date(mesaj.dataTrimitere).getTime()) < 1000
              );
          
          if (!existingMessage) {
            console.log('➕ Adaugă mesaj nou (ID:', mesaj.id, ')');
            this.messages.push(mesaj);
            setTimeout(() => this.scrollToBottom(), 50);
            
            // Marchează ca citit IMEDIAT dacă este de la utilizatorul selectat
            if (mesaj.expeditorId === this.selectedUser.id && mesaj.destinatarId === this.currentUserId) {
              this.markAsRead(mesaj.expeditorId);
            }
          } else {
            console.log('⏭️ Mesaj duplicat ignorat (ID:', mesaj.id, ')');
          }
        } else {
          console.log('📨 Mesaj pentru altă conversație - actualizez contoare');
        }
        
        // Actualizează contorul și badge-urile
        this.updateUnreadCountAndBadges();
      },
      error: (error) => console.error('❌ Eroare WebSocket message:', error)
    });

    // Subscribe to notifications
    this.notificationSubscription = this.websocketService.onNotification().subscribe({
      next: (notification) => {
        console.log('🔔 Notificare primită:', notification);
        
        if (notification) {
          console.log('📬 Tip notificare:', notification.tip);
          
          // Mesajele sunt deja gestionate de messageSubscription
          // Aici doar actualizăm contoarele
          this.updateUnreadCountAndBadges();
        }
      },
      error: (error) => console.error('❌ Eroare WebSocket notification:', error)
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
    
    // Așteaptă 500ms pentru ca backend-ul să salveze mesajul
    setTimeout(() => {
      // Actualizează contorul global
      this.mesajService.countUnreadMessages(this.currentUserId!).subscribe({
        next: (count) => {
          this.unreadCount = count;
          console.log('Contor actualizat:', count);
          
          // Reîncarcă conversațiile pentru a actualiza badge-urile individuale
          this.loadRecentConversations();
        },
        error: (error) => console.error('Error updating unread count:', error)
      });
    }, 500);
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
          
          // Salvează ID-ul ultimului mesaj pentru polling
          if (mesaje.length > 0) {
            this.lastMessageId = mesaje[mesaje.length - 1].id;
          }
          
          // Marchează mesajele ca citite
          this.markAsRead(user.id);
          
          // Începe polling-ul pentru mesaje noi
          this.startPolling();
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
    this.stopPolling();
    this.showChat = false;
    this.selectedUser = null;
    this.messageText = '';
    this.messages = [];
    this.lastMessageId = undefined;
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.currentUserId || !this.selectedUser) {
      console.warn('⚠️ Nu se poate trimite mesajul:');
      console.warn('   messageText:', this.messageText.trim() ? 'OK' : 'EMPTY');
      console.warn('   currentUserId:', this.currentUserId || 'NULL');
      console.warn('   selectedUser:', this.selectedUser || 'NULL');
      return;
    }

    const mesajRequest: MesajRequest = {
      expeditorId: this.currentUserId,
      destinatarId: this.selectedUser.id,
      continut: this.messageText.trim()
    };

    console.log('=== TRIMITERE MESAJ ===');
    console.log('📤 Request:', JSON.stringify(mesajRequest, null, 2));
    console.log('   expeditorId:', mesajRequest.expeditorId);
    console.log('   destinatarId:', mesajRequest.destinatarId);
    console.log('   continut:', mesajRequest.continut);

    // Trimite mesajul prin API
    this.mesajService.trimiteMesaj(mesajRequest).subscribe({
      next: (mesaj) => {
        console.log('✅ Mesaj trimis cu succes prin HTTP (ID:', mesaj.id, ')');
        
        // Adaugă mesajul local imediat pentru feedback instant
        const existingMessage = this.messages.find(m => m.id === mesaj.id);
        
        if (!existingMessage) {
          console.log('➕ Adaugă mesajul trimis la conversație (ID:', mesaj.id, ')');
          console.log('   Total mesaje după adăugare:', this.messages.length + 1);
          this.messages.push(mesaj);
          setTimeout(() => this.scrollToBottom(), 50);
        } else {
          console.log('⏭️ Mesajul există deja în conversație (ID:', mesaj.id, ')');
        }
        
        // NU mai trimitem prin WebSocket - backend-ul deja procesează mesajul
        // și polling-ul îl va prinde pentru destinatar
        
        this.messageText = '';
      },
      error: (error) => {
        console.error('❌ Eroare la trimiterea mesajului:');
        console.error('   Status:', error.status);
        console.error('   Status Text:', error.statusText);
        console.error('   Message:', error.message);
        console.error('   Error body:', error.error);
        console.error('   URL:', error.url);
        console.error('   Eroare completă:', JSON.stringify(error, null, 2));
        alert('Eroare la trimiterea mesajului. Verifică consola pentru detalii.');
      }
    });
  }

  markAsRead(expeditorId: string): void {
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

  /**
   * Parsează și returnează imaginile partajate dintr-un mesaj
   */
  getPacientImagini(message: Mesaj): ImaginePartajata[] {
    if (!message.pacientImagini) return [];
    
    try {
      return JSON.parse(message.pacientImagini);
    } catch (error) {
      console.error('Eroare la parsarea imaginilor pacientului:', error);
      return [];
    }
  }

  /**
   * Verifică dacă o imagine are analiză finalizată
   */
  hasAnalysis(imagine: ImaginePartajata): boolean {
    return imagine.statusAnaliza === 'finalizata' && imagine.areTumoare !== null && imagine.areTumoare !== undefined;
  }

  // Polling pentru mesaje noi (workaround până când WebSocket funcționează)
  private startPolling(): void {
    // Oprește polling-ul existent dacă există
    this.stopPolling();
    
    console.log('🔄 Start polling pentru mesaje noi (interval: 2s)');
    
    // Verifică mesaje noi la fiecare 2 secunde
    this.pollingInterval = setInterval(() => {
      if (!this.currentUserId || !this.selectedUser || !this.showChat) {
        this.stopPolling();
        return;
      }
      
      this.checkForNewMessages();
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      console.log('⏹️ Stop polling');
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private checkForNewMessages(): void {
    if (!this.currentUserId || !this.selectedUser) return;
    
    this.mesajService.getConversation(this.currentUserId, this.selectedUser.id).subscribe({
      next: (mesaje) => {
        // Găsește mesaje noi (care nu sunt în lista curentă)
        const currentIds = new Set(this.messages.map(m => m.id));
        const newMessages = mesaje.filter(msg => msg.id && !currentIds.has(msg.id));
        
        if (newMessages.length > 0) {
          console.log('📬 Polling: Găsite', newMessages.length, 'mesaje noi');
          console.log('   IDs curente:', Array.from(currentIds));
          console.log('   IDs noi:', newMessages.map(m => m.id));
          
          newMessages.forEach(msg => {
            console.log('  ➕ Adaugă mesaj nou (ID:', msg.id, '):', msg.continut?.substring(0, 30) + '...');
            this.messages.push(msg);
          });
          
          // Salvează ID-ul ultimului mesaj
          if (mesaje.length > 0) {
            this.lastMessageId = mesaje[mesaje.length - 1].id;
          }
          
          setTimeout(() => this.scrollToBottom(), 50);
          
          // Marchează ca citit dacă sunt mesaje de la cealaltă persoană
          const hasNewFromOther = newMessages.some(msg => msg.expeditorId === this.selectedUser.id);
          if (hasNewFromOther) {
            this.markAsRead(this.selectedUser.id);
          }
          
          // Actualizează contoarele
          this.updateUnreadCountAndBadges();
        }
      },
      error: (error) => {
        console.error('❌ Eroare la verificarea mesajelor noi:', error);
      }
    });
  }
  
  // Metode pentru partajare imagini
  openImageSelector(): void {
    console.log('🖼️ Deschidere selector imagini...');
    this.showImageSelectorModal = true;
    this.loadPacienti();
    console.log('Modal state:', this.showImageSelectorModal);
  }
  
  closeImageSelector(): void {
    this.showImageSelectorModal = false;
    this.selectedPacientForSharing = null;
    this.imaginiDisponibile = [];
    this.searchPacientTerm = '';
    this.searchImagineTerm = '';
  }
  
  loadPacienti(): void {
    if (!this.currentUserId) return;
    
    console.log('📥 Încărcare pacienți pentru userId:', this.currentUserId);
    
    this.pacientService.getAllPacienti(this.currentUserId).subscribe({
      next: (pacienti) => {
        console.log('✅ Pacienți primiți:', pacienti.length);
        this.pacienti = pacienti.filter(p => p.imagini && p.imagini.length > 0);
        console.log('📸 Pacienți cu imagini:', this.pacienti.length);
        this.filteredPacientiForSharing = [...this.pacienti];
      },
      error: (error) => {
        console.error('❌ Eroare la încărcarea pacienților:', error);
      }
    });
  }
  
  searchPacienti(): void {
    if (!this.searchPacientTerm.trim()) {
      this.filteredPacientiForSharing = [...this.pacienti];
      return;
    }
    
    const searchLower = this.searchPacientTerm.toLowerCase();
    this.filteredPacientiForSharing = this.pacienti.filter(p => 
      p.numePacient?.toLowerCase().includes(searchLower) ||
      p.prenumePacient?.toLowerCase().includes(searchLower) ||
      p.cnp?.includes(searchLower)
    );
  }
  
  selectPacientForSharing(pacient: Pacient): void {
    this.selectedPacientForSharing = pacient;
    this.imaginiDisponibile = pacient.imagini || [];
    this.filteredImaginiForSharing = [...this.imaginiDisponibile];
    this.searchImagineTerm = '';
  }
  
  searchImagini(): void {
    if (!this.searchImagineTerm.trim()) {
      this.filteredImaginiForSharing = [...this.imaginiDisponibile];
      return;
    }
    
    const searchLower = this.searchImagineTerm.toLowerCase();
    this.filteredImaginiForSharing = this.imaginiDisponibile.filter(img => 
      img.nume?.toLowerCase().includes(searchLower) ||
      img.tip?.toLowerCase().includes(searchLower)
    );
  }
  
  backToPacientList(): void {
    this.selectedPacientForSharing = null;
    this.imaginiDisponibile = [];
    this.searchImagineTerm = '';
  }
  
  shareImage(imagine: Imagine): void {
    if (!this.currentUserId || !this.selectedUser) return;
    
    const mesajRequest = {
      expeditorId: this.currentUserId,
      destinatarId: this.selectedUser.id,
      continut: `📷 Imagine medicală partajată: ${imagine.nume}`,
      tip: 'imagine_partajata',
      imagineId: imagine.id,
      imagineUrl: imagine.imageUrl,
      imagineNume: imagine.nume,
      imagineTip: imagine.tip,
      imagineDataIncarcare: imagine.dataIncarcare
    } as MesajRequest;
    
    this.mesajService.trimiteMesaj(mesajRequest).subscribe({
      next: (mesaj) => {
        console.log('✅ Imagine partajată cu succes');
        this.messages.push(mesaj);
        setTimeout(() => this.scrollToBottom(), 50);
        this.closeImageSelector();
      },
      error: (error) => {
        console.error('❌ Eroare la partajarea imaginii:', error);
        alert('Eroare la partajarea imaginii. Încearcă din nou.');
      }
    });
  }
}

