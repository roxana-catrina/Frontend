import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Mesaj } from '../../models/mesaj';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private currentUserId: string | null = null;

  private connected = new BehaviorSubject<boolean>(false);
  private messageSubject    = new BehaviorSubject<Mesaj | null>(null);
  private notificationSubject = new BehaviorSubject<any>(null);
  private typingSubject     = new BehaviorSubject<any>(null);
  private readReceiptSubject = new BehaviorSubject<any>(null);
  private videoCallSubject  = new BehaviorSubject<any>(null);

  constructor() {}

  // ── Connection ─────────────────────────────────────────────────────────────

  connect(userId: string): void {
    // Dacă suntem deja conectați cu același userId, nu facem nimic
    if (this.stompClient?.connected && this.currentUserId === userId) {
      console.log('✅ WebSocket deja conectat pentru userId:', userId);
      return;
    }

    // Dacă există un client vechi (alt userId sau deconectat), îl oprim
    if (this.stompClient) {
      console.log('🔄 WebSocket: deactivez clientul vechi...');
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connected.next(false);
    }

    this.currentUserId = userId;
    console.log('🔌 WebSocket: conectare pentru userId:', userId);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8083/ws') as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // ← Trimite userId în header-ul CONNECT pentru ca backend-ul să seteze Principal
      connectHeaders: {
        userId: userId
      },
      debug: (str) => console.log('STOMP: ' + str)
    });

    this.stompClient.onConnect = (frame) => {
      console.log('✅ WebSocket conectat:', frame);
      this.connected.next(true);
      this.subscribeToQueues(userId);
    };

    this.stompClient.onDisconnect = () => {
      console.log('🔌 WebSocket deconectat');
      this.connected.next(false);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame.headers['message'], frame.body);
      this.connected.next(false);
    };

    this.stompClient.onWebSocketClose = () => {
      console.log('🔌 WebSocket închis');
      this.connected.next(false);
    };

    this.stompClient.activate();
  }

  private subscribeToQueues(userId: string): void {
    if (!this.stompClient) return;

    // Mesaje chat
    this.stompClient.subscribe(`/user/${userId}/queue/messages`, (msg) => {
      console.log('📨 Mesaj primit:', msg.body);
      this.messageSubject.next(JSON.parse(msg.body));
    });

    // Notificări
    this.stompClient.subscribe(`/user/${userId}/queue/notifications`, (msg) => {
      console.log('📢 Notificare primită:', msg.body);
      this.notificationSubject.next(JSON.parse(msg.body));
    });

    // Typing indicators
    this.stompClient.subscribe(`/user/${userId}/queue/typing`, (msg) => {
      this.typingSubject.next(JSON.parse(msg.body));
    });

    // Read receipts
    this.stompClient.subscribe(`/user/${userId}/queue/read-receipts`, (msg) => {
      this.readReceiptSubject.next(JSON.parse(msg.body));
    });

    // Video call signaling
    this.stompClient.subscribe(`/user/${userId}/queue/video-call`, (msg) => {
      const signal = JSON.parse(msg.body);
      console.log('📹 Video call signal primit:', signal.type, 'de la:', signal.fromUserId);
      this.videoCallSubject.next(signal);
    });

    console.log('✅ Subscripții WebSocket active pentru userId:', userId);
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.currentUserId = null;
      this.connected.next(false);
      console.log('🔌 WebSocket deconectat manual');
    }
  }

  // ── Send methods ───────────────────────────────────────────────────────────

  sendMessage(mesaj: any): void {
    this.publishWhenReady('/app/chat.send', mesaj);
  }

  sendTypingIndicator(data: any): void {
    this.publishWhenReady('/app/chat.typing', data);
  }

  /**
   * Trimite un semnal de video call.
   * Dacă WebSocket-ul nu e conectat încă, așteaptă conexiunea (max 5s).
   */
  sendVideoCallSignal(signal: any): void {
    console.log('📹 Trimitere semnal video call:', signal.type, '→', signal.toUserId);

    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/video-call.signal',
        body: JSON.stringify(signal)
      });
      console.log('✅ Semnal video call trimis');
    } else {
      console.warn('⚠️ WebSocket nu e conectat, aștept conexiunea...');
      // Așteptăm până la 5 secunde pentru conexiune
      this.connected.pipe(
        filter(isConnected => isConnected),
        take(1)
      ).subscribe(() => {
        if (this.stompClient?.connected) {
          this.stompClient.publish({
            destination: '/app/video-call.signal',
            body: JSON.stringify(signal)
          });
          console.log('✅ Semnal video call trimis după reconectare');
        } else {
          console.error('❌ Nu s-a putut trimite semnalul video call - WebSocket indisponibil');
        }
      });

      // Timeout de siguranță - dacă nu se conectează în 5s, logăm eroarea
      setTimeout(() => {
        if (!this.stompClient?.connected) {
          console.error('❌ Timeout: WebSocket nu s-a conectat în 5s, semnal pierdut:', signal.type);
        }
      }, 5000);
    }
  }

  private publishWhenReady(destination: string, body: any): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({ destination, body: JSON.stringify(body) });
    } else {
      console.error('❌ WebSocket nu e conectat, nu pot trimite la:', destination);
    }
  }

  // ── Observables ────────────────────────────────────────────────────────────

  onMessage(): Observable<Mesaj | null> {
    return this.messageSubject.asObservable();
  }

  onNotification(): Observable<any> {
    return this.notificationSubject.asObservable();
  }

  onTyping(): Observable<any> {
    return this.typingSubject.asObservable();
  }

  onReadReceipt(): Observable<any> {
    return this.readReceiptSubject.asObservable();
  }

  onVideoCallSignal(): Observable<any> {
    return this.videoCallSubject.asObservable();
  }

  isConnected(): Observable<boolean> {
    return this.connected.asObservable();
  }

  isCurrentlyConnected(): boolean {
    return this.stompClient?.connected ?? false;
  }
}
