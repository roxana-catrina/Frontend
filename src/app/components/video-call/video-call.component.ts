import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoCallService, CallStatus, CallParticipant } from '../../service/video-call/video-call.service';

@Component({
  selector: 'app-video-call',
  standalone: false,
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.css'
})
export class VideoCallComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('localVideo')  localVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef?: ElementRef<HTMLVideoElement>;

  callStatus: CallStatus = 'idle';
  remoteParticipant: CallParticipant | null = null;
  callDuration: number = 0;
  isMuted: boolean = false;
  isCameraOff: boolean = false;
  toastMessage: string | null = null;

  // Streams locale pentru a seta srcObject pe elementele video
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private localStreamSet = false;
  private remoteStreamSet = false;

  private subs: Subscription[] = [];

  constructor(public videoCallService: VideoCallService) {}

  ngOnInit(): void {
    this.subs.push(
      this.videoCallService.callStatus$.subscribe(status => {
        this.callStatus = status;
        // Resetează flag-urile când apelul se termină
        if (status === 'idle') {
          this.localStreamSet = false;
          this.remoteStreamSet = false;
          this.isMuted = false;
          this.isCameraOff = false;
        }
      }),
      this.videoCallService.remoteParticipant$.subscribe(p => this.remoteParticipant = p),
      this.videoCallService.callDuration$.subscribe(d => this.callDuration = d),
      this.videoCallService.localStream$.subscribe(stream => {
        this.localStream = stream;
        this.localStreamSet = false; // forțează re-setarea
      }),
      this.videoCallService.remoteStream$.subscribe(stream => {
        this.remoteStream = stream;
        this.remoteStreamSet = false; // forțează re-setarea
      }),
      this.videoCallService.toastMessage$.subscribe(msg => this.toastMessage = msg)
    );
  }

  ngAfterViewChecked(): void {
    // Setează srcObject pe elementele video când sunt disponibile în DOM
    if (this.localStream && !this.localStreamSet && this.localVideoRef?.nativeElement) {
      this.localVideoRef.nativeElement.srcObject = this.localStream;
      this.localStreamSet = true;
    }
    if (this.remoteStream && !this.remoteStreamSet && this.remoteVideoRef?.nativeElement) {
      this.remoteVideoRef.nativeElement.srcObject = this.remoteStream;
      this.remoteStreamSet = true;
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get isVisible(): boolean {
    return this.callStatus !== 'idle';
  }

  acceptCall(): void {
    this.videoCallService.acceptCall().catch(err => {
      alert('Nu s-a putut accesa camera/microfonul. Verifică permisiunile browserului.');
    });
  }

  rejectCall(): void {
    this.videoCallService.rejectCall();
  }

  endCall(): void {
    this.videoCallService.endCall();
  }

  toggleMute(): void {
    this.isMuted = this.videoCallService.toggleMute(this.localStream);
  }

  toggleCamera(): void {
    this.isCameraOff = this.videoCallService.toggleCamera(this.localStream);
  }

  getCallDurationFormatted(): string {
    const m = Math.floor(this.callDuration / 60);
    const s = this.callDuration % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
