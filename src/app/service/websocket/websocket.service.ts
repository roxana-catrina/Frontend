import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { Mesaj } from '../../models/mesaj';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private connected = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<Mesaj | null>(null);
  private notificationSubject = new BehaviorSubject<any>(null);
  private typingSubject = new BehaviorSubject<any>(null);
  private readReceiptSubject = new BehaviorSubject<any>(null);

  constructor() { }

  connect(userId: string): void {
    if (this.stompClient && this.stompClient.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8083/ws') as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('STOMP: ' + str);
      }
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket: ' + frame);
      this.connected.next(true);

      // Subscribe to personal message queue
      this.stompClient!.subscribe(`/user/${userId}/queue/messages`, (message) => {
        const mesaj: Mesaj = JSON.parse(message.body);
        this.messageSubject.next(mesaj);
      });

      // Subscribe to notifications
      this.stompClient!.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        console.log('📢 WebSocket: Notification message received on queue');
        console.log('📢 Message body:', message.body);
        const notification = JSON.parse(message.body);
        console.log('📢 Parsed notification:', notification);
        this.notificationSubject.next(notification);
        console.log('📢 Notification sent to subscribers');
      });

      // Subscribe to typing indicators
      this.stompClient!.subscribe(`/user/${userId}/queue/typing`, (message) => {
        const typing = JSON.parse(message.body);
        this.typingSubject.next(typing);
      });

      // Subscribe to read receipts
      this.stompClient!.subscribe(`/user/${userId}/queue/read-receipts`, (message) => {
        const receipt = JSON.parse(message.body);
        this.readReceiptSubject.next(receipt);
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      this.connected.next(false);
    };

    this.stompClient.onWebSocketClose = () => {
      console.log('WebSocket connection closed');
      this.connected.next(false);
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connected.next(false);
      console.log('Disconnected from WebSocket');
    }
  }

  sendMessage(mesaj: any): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(mesaj)
      });
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }

  sendTypingIndicator(data: any): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(data)
      });
    }
  }

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

  isConnected(): Observable<boolean> {
    return this.connected.asObservable();
  }
}
