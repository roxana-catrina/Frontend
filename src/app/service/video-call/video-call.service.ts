import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { WebsocketService } from '../websocket/websocket.service';
import { MesajService } from '../mesaj/mesaj.service';

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

export interface CallParticipant {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoCallService implements OnDestroy {

  // ── State observables ──────────────────────────────────────────────────────
  callStatus$        = new BehaviorSubject<CallStatus>('idle');
  remoteParticipant$ = new BehaviorSubject<CallParticipant | null>(null);
  localStream$       = new BehaviorSubject<MediaStream | null>(null);
  remoteStream$      = new BehaviorSubject<MediaStream | null>(null);
  callDuration$      = new BehaviorSubject<number>(0);
  toastMessage$      = new BehaviorSubject<string | null>(null);

  // ── Internal state ─────────────────────────────────────────────────────────
  private currentUserId: string | null = null;
  private currentUserName: string = '';
  private peerConnection: RTCPeerConnection | null = null;
  private pendingOffer: RTCSessionDescriptionInit | null = null;
  private callDurationInterval: any = null;
  private videoCallSubscription?: Subscription;
  private initialized = false;

  private readonly ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(private websocketService: WebsocketService, private mesajService: MesajService) {}

  // ── Initialization ─────────────────────────────────────────────────────────

  initialize(userId: string, userName: string): void {
    // Dacă deja inițializat cu același userId, nu facem nimic
    if (this.initialized && this.currentUserId === userId) {
      console.log('📹 VideoCallService: deja inițializat pentru', userId);
      return;
    }

    this.currentUserId = userId;
    this.currentUserName = userName;
    this.initialized = true;

    console.log('📹 VideoCallService: inițializare pentru userId:', userId, 'name:', userName);

    // Conectează WebSocket-ul
    this.websocketService.connect(userId);

    // Subscrie la semnalele de video call
    this.videoCallSubscription?.unsubscribe();
    this.videoCallSubscription = this.websocketService.onVideoCallSignal().subscribe({
      next: (signal) => {
        if (!signal) return;
        console.log('📹 VideoCallService: signal primit:', signal.type, 'de la:', signal.fromUserId);
        this.handleSignal(signal);
      },
      error: (err) => console.error('❌ Eroare video call signal:', err)
    });

    console.log('✅ VideoCallService: subscripție la video-call signals activă');
  }

  // ── Signal handling ────────────────────────────────────────────────────────

  private handleSignal(signal: any): void {
    switch (signal.type) {
      case 'call-offer':
        this.onIncomingCall(signal);
        break;
      case 'call-answer':
        this.onCallAnswered(signal);
        break;
      case 'ice-candidate':
        this.onIceCandidate(signal);
        break;
      case 'call-rejected':
        this.onCallRejected(signal);
        break;
      case 'call-ended':
        this.onCallEnded();
        break;
      default:
        console.warn('📹 Signal necunoscut:', signal.type);
    }
  }

  private onIncomingCall(signal: any): void {
    console.log('📞 Apel incoming de la:', signal.fromUserName, '(', signal.fromUserId, ')');

    // Dacă suntem deja într-un apel, respinge automat
    if (this.callStatus$.value !== 'idle') {
      console.log('📹 Deja într-un apel, respinge automat');
      this.websocketService.sendVideoCallSignal({
        type: 'call-rejected',
        fromUserId: this.currentUserId,
        toUserId: signal.fromUserId
      });
      return;
    }

    this.pendingOffer = signal.sdp;
    this.remoteParticipant$.next({ id: signal.fromUserId, name: signal.fromUserName });
    this.callStatus$.next('incoming');
    console.log('✅ Status setat la incoming, modal ar trebui să apară');
  }

  private onCallAnswered(signal: any): void {
    console.log('📹 Apel acceptat, setez remote description...');
    if (!this.peerConnection) {
      console.error('❌ Nu există peerConnection la primirea answer-ului');
      return;
    }
    this.peerConnection
      .setRemoteDescription(new RTCSessionDescription(signal.sdp))
      .then(() => {
        this.callStatus$.next('connected');
        this.startTimer();
        console.log('✅ Apel conectat!');
      })
      .catch(err => console.error('❌ setRemoteDescription error:', err));
  }

  private onIceCandidate(signal: any): void {
    if (!this.peerConnection || !signal.candidate) return;
    this.peerConnection
      .addIceCandidate(new RTCIceCandidate(signal.candidate))
      .catch(err => console.error('❌ addIceCandidate error:', err));
  }

  private onCallRejected(signal: any): void {
    const name = this.remoteParticipant$.value?.name || 'Utilizatorul';
    console.log('📹 Apel respins de:', name);
    // Doar apelantul salvează record-ul (eu sunt apelantul dacă primesc "rejected")
    this.saveCallRecord('respins', 0);
    this.showToast(`${name} nu a putut răspunde la apel`);
    this.resetState();
  }

  private onCallEnded(): void {
    console.log('📹 Apel încheiat de cealaltă parte');
    // Nu salvăm nimic — cel care a apăsat "end" salvează din endCall()
    this.resetState();
  }

  

  startCall(toUser: CallParticipant): Promise<void> {
    if (!this.currentUserId) {
      return Promise.reject('Nu ești autentificat');
    }
    this.remoteParticipant$.next(toUser);
    this.callStatus$.next('calling');

    return navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.localStream$.next(stream);
        this.createPeerConnection();
        return this.peerConnection!.createOffer();
      })
      .then(offer => {
        return this.peerConnection!.setLocalDescription(offer).then(() => offer);
      })
      .then(offer => {
        const signal = {
          type: 'call-offer',
          fromUserId: this.currentUserId,
          toUserId: toUser.id,
          fromUserName: this.currentUserName,
          sdp: offer
        };
        this.websocketService.sendVideoCallSignal(signal);
      })
      .catch(err => {
        this.resetState();
        throw err;
      });
  }

  acceptCall(): Promise<void> {
    if (!this.pendingOffer || !this.remoteParticipant$.value) {
      return Promise.reject('Nu există apel de acceptat');
    }

    const caller = this.remoteParticipant$.value;
    console.log('📹 Acceptare apel de la:', caller.name);

    return navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log('✅ Camera/microfon accesate');
        this.localStream$.next(stream);
        this.createPeerConnection();
        return this.peerConnection!.setRemoteDescription(
          new RTCSessionDescription(this.pendingOffer!)
        );
      })
      .then(() => {
        console.log('✅ Remote description setată, creez answer...');
        return this.peerConnection!.createAnswer();
      })
      .then(answer => this.peerConnection!.setLocalDescription(answer).then(() => answer))
      .then(answer => {
        this.websocketService.sendVideoCallSignal({
          type: 'call-answer',
          fromUserId: this.currentUserId,
          toUserId: caller.id,
          sdp: answer
        });
        this.callStatus$.next('connected');
        this.startTimer();
        this.pendingOffer = null;
        console.log('✅ Answer trimis, apel conectat!');
      })
      .catch(err => {
        console.error('❌ Eroare la acceptarea apelului:', err);
        this.resetState();
        throw err;
      });
  }

  rejectCall(): void {
    const caller = this.remoteParticipant$.value;
    if (caller) {
      this.websocketService.sendVideoCallSignal({
        type: 'call-rejected',
        fromUserId: this.currentUserId,
        toUserId: caller.id
      });
      // NU salvăm aici — apelantul salvează când primește "call-rejected"
    }
    this.resetState();
  }

  endCall(): void {
    const remote = this.remoteParticipant$.value;
    const durata = this.callDuration$.value;
    const wasConnected = this.callStatus$.value === 'connected';

    if (remote && this.currentUserId) {
      this.websocketService.sendVideoCallSignal({
        type: 'call-ended',
        fromUserId: this.currentUserId,
        toUserId: remote.id
      });
      // Salvează apelul în istoricul ambilor participanți
      if (wasConnected) {
        this.saveCallRecord('primit', durata);
      } else {
        // Apelantul a închis înainte ca celălalt să răspundă → apel pierdut
        this.saveCallRecord('pierdut', 0);
      }
    }
    this.resetState();
  }

  toggleMute(stream: MediaStream | null): boolean {
    if (!stream) return false;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return false;
    audioTrack.enabled = !audioTrack.enabled;
    return !audioTrack.enabled;
  }

  toggleCamera(stream: MediaStream | null): boolean {
    if (!stream) return false;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;
    videoTrack.enabled = !videoTrack.enabled;
    return !videoTrack.enabled;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(this.ICE_SERVERS);
    console.log('✅ RTCPeerConnection creat');

    const localStream = this.localStream$.value;
    localStream?.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, localStream);
    });

    this.peerConnection.ontrack = (event) => {
      console.log('📹 Remote track primit!');
      this.remoteStream$.next(event.streams[0]);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const remote = this.remoteParticipant$.value;
        if (remote) {
          this.websocketService.sendVideoCallSignal({
            type: 'ice-candidate',
            fromUserId: this.currentUserId,
            toUserId: remote.id,
            candidate: event.candidate
          });
        }
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE state:', this.peerConnection?.iceConnectionState);
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 Connection state:', state);
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.onCallEnded();
      }
    };
  }

  private startTimer(): void {
    this.callDuration$.next(0);
    this.callDurationInterval = setInterval(() => {
      this.callDuration$.next(this.callDuration$.value + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.callDurationInterval) {
      clearInterval(this.callDurationInterval);
      this.callDurationInterval = null;
    }
  }

  private resetState(): void {
    this.localStream$.value?.getTracks().forEach(t => t.stop());
    this.localStream$.next(null);
    this.remoteStream$.next(null);
    this.peerConnection?.close();
    this.peerConnection = null;
    this.pendingOffer = null;
    this.stopTimer();
    this.callDuration$.next(0);
    this.remoteParticipant$.next(null);
    this.callStatus$.next('idle');
    console.log('🔄 VideoCallService: state resetat');
  }

  // ── Call record ────────────────────────────────────────────────────────────

  /**
   * Salvează un apel video în istoricul conversației.
   * status: 'primit' = apel efectuat și răspuns
   *         'pierdut' = apelantul a închis înainte de răspuns
   *         'respins' = destinatarul a respins explicit
   */
  private saveCallRecord(status: 'primit' | 'pierdut' | 'respins', durata: number): void {
    const remote = this.remoteParticipant$.value;
    if (!remote || !this.currentUserId) return;

    const continut = this.buildCallContinut(status, durata);

    const request = {
      expeditorId: this.currentUserId,
      destinatarId: remote.id,
      continut,
      tip: 'apel_video',
      apelStatus: status,
      apelDurata: durata
    };

    this.mesajService.trimiteMesaj(request).subscribe({
      next: (msg) => console.log('✅ Apel salvat în conversație:', msg.id),
      error: (err) => console.error('❌ Eroare la salvarea apelului:', err)
    });
  }

  private buildCallContinut(status: 'primit' | 'pierdut' | 'respins', durata: number): string {
    switch (status) {
      case 'primit':
        return `Apel video • ${this.formatDurata(durata)}`;
      case 'pierdut':
        return 'Apel video pierdut';
      case 'respins':
        return 'Apel video respins';
    }
  }

  formatDurata(secunde: number): string {
    if (secunde < 60) return `${secunde}s`;
    const m = Math.floor(secunde / 60);
    const s = secunde % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  private showToast(message: string): void {
    this.toastMessage$.next(message);
    setTimeout(() => this.toastMessage$.next(null), 4000);
  }

  // ── Destroy ────────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.videoCallSubscription?.unsubscribe();
    this.resetState();
  }
}
