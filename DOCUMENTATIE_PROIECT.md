# Documentație Proiect - Platformă Medicală de Analiză Imagini

## 1. Prezentare Generală

Aplicație web pentru gestionarea pacienților și analiza imaginilor medicale (RMN, CT, DICOM) cu detecție automată de tumori cerebrale folosind inteligență artificială.

**Stack tehnologic:**
- **Frontend:** Angular 19, TypeScript, Bootstrap 5, Angular Material
- **Backend:** Java Spring Boot (port 8083)
- **Bază de date:** MongoDB
- **Storage imagini:** Cloudinary
- **ML/AI:** Python (Flask) — model de detecție tumori cerebrale
- **Comunicare real-time:** WebSocket (STOMP over SockJS)

---

## 2. Arhitectura Aplicației

```
┌─────────────┐     HTTP/REST      ┌──────────────┐     HTTP      ┌─────────────┐
│   Angular   │ ◄──────────────► │  Spring Boot  │ ◄──────────► │  Python ML  │
│  Frontend   │                    │   Backend     │              │   Server    │
│  (port 4200)│     WebSocket      │  (port 8083)  │              │             │
│             │ ◄──────────────► │               │              │             │
└─────────────┘                    └──────────────┘              └─────────────┘
                                         │
                                         ▼
                                   ┌──────────┐     ┌────────────┐
                                   │ MongoDB  │     │ Cloudinary │
                                   └──────────┘     └────────────┘
```

---

## 3. Module Principale

### 3.1 Autentificare & Utilizatori
- **Login/Register** cu JWT token
- Token stocat în `localStorage` sub cheia `token`
- ID utilizator: `localStorage.getItem('id')`
- Toate request-urile autentificate au header: `Authorization: Bearer <token>`

### 3.2 Dashboard — Gestionare Pacienți
- CRUD pacienți (nume, prenume, CNP, sex, istoric medical)
- Fiecare pacient are o listă de imagini medicale
- Poză de profil pacient

### 3.3 Imagini Medicale
- Upload imagini (PNG, JPG, DICOM)
- Vizualizare cu zoom, pan, adnotare (desen, text, gumă)
- Salvare imagini adnotate (re-upload pe Cloudinary)
- Metadate DICOM extrase client-side cu `dicom-parser`
- Upload serie DICOM (multiple fișiere simultan)

### 3.4 Analiză AI — Detecție Tumori
- Endpoint: `POST /api/brain-tumor/predict-from-url`
- Trimite URL-ul imaginii de pe Cloudinary
- Returnează: `hasTumor`, `confidence`, `type`
- Segmentare (heatmap): `POST /api/brain-tumor/predict-from-url-with-segmentation`

### 3.5 Reconstrucție 3D (MPR)
- Încarcă serie DICOM de pe Cloudinary
- Parsează pixel data cu `dicom-parser`
- Construiește volum 3D în memorie (Int16Array)
- Randează pe canvas: Axial (+ Sagital/Coronal dacă 50+ slice-uri)
- Slider pentru navigare prin slice-uri

### 3.6 Mesagerie în Timp Real
- Chat între utilizatori (doctori)
- Partajare pacienți și imagini medicale în conversație
- Mesaje text, imagini partajate, fișiere DICOM
- Polling + WebSocket pentru mesaje noi
- Istoric apeluri video în conversație

### 3.7 Video Call (WebRTC)
- Apel video peer-to-peer între utilizatori
- Semnalizare prin WebSocket (STOMP)
- Funcționează pe orice pagină (serviciu global)
- Controale: mute, camera off, end call
- Toast notification la apel respins

---

## 4. Comunicare Frontend ↔ Backend

### 4.1 Endpoint-uri REST principale

| Modul | Endpoint | Metodă | Descriere |
|-------|----------|--------|-----------|
| Auth | `/authenticate` | POST | Login, returnează JWT |
| Users | `/api/user` | GET/POST/PUT | CRUD utilizatori |
| Pacienți | `/api/user/{userId}/pacient` | GET/POST | Lista/adaugă pacienți |
| Imagini | `/api/user/{userId}/pacient/{pacientId}/imagine` | POST | Upload imagine |
| Imagini | `/api/user/{userId}/pacient/{pacientId}/imagine/{id}` | PUT/DELETE | Update/șterge |
| Adnotare | `/api/user/{userId}/pacient/{pacientId}/imagine/{id}/annotate` | POST | Salvează imagine adnotată |
| AI | `/api/brain-tumor/predict-from-url` | POST | Analiză tumoră |
| AI | `/api/brain-tumor/predict-from-url-with-segmentation` | POST | Analiză + heatmap |
| Mesaje | `/api/mesaje/trimite` | POST | Trimite mesaj |
| Mesaje | `/api/mesaje/conversatie/{id1}/{id2}` | GET | Istoric conversație |
| Mesaje | `/api/mesaje/necitite/{userId}` | GET | Contor necitite |
| Notificări | `/api/notificari/user/{userId}` | GET | Lista notificări |

### 4.2 WebSocket (STOMP)

**Conexiune:** `SockJS → http://localhost:8083/ws`

**Subscripții (per utilizator):**
- `/user/{userId}/queue/messages` — mesaje chat
- `/user/{userId}/queue/notifications` — notificări
- `/user/{userId}/queue/typing` — indicator tastare
- `/user/{userId}/queue/read-receipts` — confirmare citire
- `/user/{userId}/queue/video-call` — semnalizare video call

**Publish (client → server):**
- `/app/chat.send` — trimite mesaj
- `/app/chat.typing` — indicator tastare
- `/app/video-call.signal` — semnal WebRTC (offer/answer/ICE/end)

**Header STOMP la CONNECT:**
```
connectHeaders: { userId: '<id_utilizator>' }
```

### 4.3 Video Call — Flux WebRTC

```
User A                    Backend                    User B
  │                         │                         │
  │── call-offer ──────────►│── call-offer ──────────►│
  │                         │                         │
  │◄── call-answer ────────│◄── call-answer ────────│
  │                         │                         │
  │── ice-candidate ──────►│── ice-candidate ──────►│
  │◄── ice-candidate ──────│◄── ice-candidate ──────│
  │                         │                         │
  │        ◄═══ Conexiune P2P directă ═══►           │
  │                         │                         │
  │── call-ended ──────────►│── call-ended ──────────►│
```

---

## 5. Modele de Date (TypeScript)

### Imagine
```typescript
interface Imagine {
  id: string;
  pacientId: string;
  nume: string;
  tip: string; // 'RMN', 'CT', 'Radiografie', etc.
  imageUrl: string;
  cloudinaryPublicId: string;
  isDicom?: boolean;
  dicomMetadata?: DicomMetadata;
  seriesId?: string; // pentru grupare în serie DICOM
  areTumoare?: boolean;
  tipTumoare?: string;
  confidenta?: number; // 0-100
  statusAnaliza?: 'neanalizata' | 'in_procesare' | 'finalizata' | 'eroare';
  dataAnalizei?: Date;
  observatii?: string;
  dataIncarcare?: Date;
}
```

### Mesaj
```typescript
interface Mesaj {
  id?: string;
  expeditorId: string;
  destinatarId: string;
  continut: string;
  dataTrimitere?: Date;
  citit?: boolean;
  tip?: string; // 'text', 'pacient_partajat', 'imagine_partajata', 'apel_video'
  apelStatus?: 'primit' | 'pierdut' | 'respins';
  apelDurata?: number;
}
```

---

## 6. Servicii Angular Importante

| Serviciu | Rol |
|----------|-----|
| `WebsocketService` | Conexiune STOMP, subscripții, send |
| `VideoCallService` | WebRTC, semnalizare, stare apel (singleton global) |
| `BrainTumorService` | Comunicare cu AI pentru predicții |
| `MesajService` | CRUD mesaje, conversații |
| `ImagineService` | Upload, update, delete imagini |
| `PacientService` | CRUD pacienți |
| `AuthService` | Login, token management |

---

## 7. Funcționalități Cheie Implementate

### DICOM
- Parsare client-side cu `dicom-parser`
- Vizualizare cu `cornerstone-core`
- Extragere metadate (pacient, modalitate, dimensiuni)
- Upload pe Cloudinary ca `resource_type: "raw"`
- Reconstrucție 3D MPR din serie de slice-uri

### Adnotare Imagini
- Canvas suprapus pe imagine
- Instrumente: creion, text, gumă
- Zoom + pan în modul adnotare
- Salvare ca PNG pe Cloudinary
- Funcționează și pentru DICOM (convertit în PNG)

### Segmentare Tumoră (Heatmap)
- Backend generează overlay colorat
- Afișat ca imagine base64 în card dedicat
- Buton disponibil doar când tumoare detectată

---

## 8. Structura Fișierelor Principale

```
src/app/
├── components/
│   ├── dashboard/          — pagina principală cu pacienți
│   ├── imagine/            — vizualizare/editare imagine medicală
│   ├── mesagerie/          — chat între utilizatori
│   ├── video-call/         — component global video call
│   ├── login/              — autentificare
│   └── ...
├── service/
│   ├── websocket/          — WebSocket STOMP
│   ├── video-call/         — WebRTC logic
│   ├── brain-tumor/        — comunicare AI
│   ├── mesaj/              — mesagerie REST
│   ├── imagine/            — imagini REST
│   ├── pacient/            — pacienți REST
│   └── ...
├── models/
│   ├── imagine.ts          — Imagine, DicomMetadata, SegmentationResult
│   ├── mesaj.ts            — Mesaj, MesajRequest, Notificare
│   ├── pacient.ts          — Pacient, Sex
│   └── user.ts             — User
└── app.component.ts        — inițializare VideoCallService global
```

---

## 9. Configurare & Rulare

```bash
# Instalare dependențe
npm install

# Rulare development
ng serve
# sau
npm start  (cu proxy config)

# Build producție
ng build
```

**Porturi:**
- Frontend: `http://localhost:4200`
- Backend Java: `http://localhost:8083`
- WebSocket: `ws://localhost:8083/ws` (SockJS)

---

## 10. Dependențe Externe Importante

| Pachet | Versiune | Rol |
|--------|----------|-----|
| `@angular/core` | 19.1 | Framework |
| `cornerstone-core` | 2.6.1 | Vizualizare DICOM |
| `dicom-parser` | 1.8.21 | Parsare fișiere DICOM |
| `@stomp/stompjs` | 7.2.1 | Client STOMP WebSocket |
| `sockjs-client` | 1.6.1 | Transport WebSocket fallback |
| `@angular/material` | 19.2 | UI components (dialog, button) |
| `bootstrap` | 5.3 | CSS framework |

---

## 11. Note pentru Backend Java

### Câmpuri necesare pe entitatea Imagine:
- `seriesId` (String) — pentru grupare serie DICOM
- `isDicom` (Boolean) — flag DICOM
- `apelStatus`, `apelDurata` — pentru mesaje de tip apel video

### Upload DICOM pe Cloudinary:
```java
// OBLIGATORIU resource_type: "raw" pentru DICOM
String resourceType = isDicom ? "raw" : "image";
cloudinary.uploader().upload(file, ObjectUtils.asMap("resource_type", resourceType));
```

### WebSocket — Principal din header STOMP:
```java
// În configureClientInboundChannel:
String userId = accessor.getFirstNativeHeader("userId");
accessor.setUser(() -> userId);
```

### Video Call Controller:
```java
@MessageMapping("/video-call.signal")
public void handleSignal(@Payload Map<String, Object> signal) {
    messagingTemplate.convertAndSendToUser(
        signal.get("toUserId").toString(),
        "/queue/video-call",
        signal
    );
}
```


---

## 12. Cum Funcționează WebSocket-ul

### Ce este WebSocket?
WebSocket este un protocol de comunicare bidirecțională între browser și server. Spre deosebire de HTTP (unde clientul trimite cerere → serverul răspunde), WebSocket menține o conexiune permanentă deschisă prin care ambele părți pot trimite mesaje oricând.

### De ce folosim WebSocket în acest proiect?
- **Mesaje în timp real** — când cineva îți trimite un mesaj, îl primești instant (fără refresh)
- **Notificări live** — badge-uri de mesaje necitite se actualizează automat
- **Semnalizare video call** — offer/answer/ICE candidates trebuie transmise instant
- **Indicator de tastare** — "X scrie..."

### Protocolul STOMP
Nu folosim WebSocket pur, ci **STOMP** (Simple Text Oriented Messaging Protocol) peste WebSocket. STOMP adaugă conceptul de:
- **Destinații** (topics/queues) — ex: `/user/123/queue/messages`
- **Subscribe** — clientul se abonează la o destinație
- **Publish** — clientul trimite un mesaj la o destinație

### SockJS
SockJS este un fallback — dacă browserul nu suportă WebSocket nativ, SockJS folosește alte tehnici (long-polling, etc.) pentru a simula comportamentul.

### Fluxul complet de conexiune:

```
1. Angular pornește → AppComponent.ngOnInit()
2. VideoCallService.initialize(userId) → WebsocketService.connect(userId)
3. WebsocketService creează client STOMP cu SockJS
4. Trimite CONNECT cu header { userId: '...' }
5. Backend primește CONNECT → setează Principal (identitate)
6. Backend răspunde CONNECTED
7. Frontend se abonează la 5 queue-uri personale:
   - /user/{id}/queue/messages
   - /user/{id}/queue/notifications
   - /user/{id}/queue/typing
   - /user/{id}/queue/read-receipts
   - /user/{id}/queue/video-call
8. Conexiunea rămâne deschisă (heartbeat la 4 secunde)
9. Când serverul are un mesaj pentru user → îl trimite pe queue-ul corespunzător
10. Frontend primește mesajul → actualizează UI-ul
```

### Exemplu concret — trimitere mesaj:

```
User A scrie "Salut" și apasă Send:

1. Frontend A → POST /api/mesaje/trimite { expeditorId: A, destinatarId: B, continut: "Salut" }
2. Backend salvează mesajul în MongoDB
3. Backend trimite mesajul prin WebSocket: convertAndSendToUser(B, "/queue/messages", mesaj)
4. Frontend B primește mesajul pe subscripția /user/B/queue/messages
5. Frontend B adaugă mesajul în lista de mesaje → apare instant în chat
```

---

## 13. Cum Funcționează WebRTC (Video Call)

### Ce este WebRTC?
WebRTC (Web Real-Time Communication) este o tehnologie care permite comunicare audio/video **direct între browsere** (peer-to-peer), fără ca stream-ul să treacă prin server.

### De ce avem nevoie de server dacă e peer-to-peer?
Serverul e necesar doar pentru **semnalizare** — adică pentru ca cele două browsere să se "găsească" și să negocieze conexiunea. Odată conectate, video-ul merge direct browser-to-browser.

### Concepte cheie:

| Concept | Explicație |
|---------|-----------|
| **Offer** | "Vreau să vorbesc cu tine, iată ce pot face (video, audio, codecuri)" |
| **Answer** | "OK, accept, iată ce pot face eu" |
| **ICE Candidate** | "Mă poți contacta la această adresă IP/port" |
| **STUN Server** | Server public care îți spune adresa ta IP externă |
| **RTCPeerConnection** | Obiectul browser care gestionează conexiunea P2P |

### Fluxul complet al unui apel video:

```
User A apasă butonul de video call:

1. A: navigator.mediaDevices.getUserMedia({video, audio})
   → Browser cere permisiune cameră/microfon
   → Primește MediaStream local

2. A: new RTCPeerConnection(ICE_SERVERS)
   → Creează conexiunea P2P
   → Adaugă track-urile locale (video + audio)

3. A: peerConnection.createOffer()
   → Generează SDP (Session Description Protocol) cu capabilitățile

4. A: peerConnection.setLocalDescription(offer)
   → Setează offer-ul local

5. A → WebSocket → Backend → WebSocket → B:
   { type: 'call-offer', sdp: offer, fromUserId: A, toUserId: B }

6. B: Primește offer-ul → afișează ecranul "Apel incoming"

7. B: Apasă "Acceptă"
   → getUserMedia() → cameră/microfon
   → new RTCPeerConnection()
   → setRemoteDescription(offer)
   → createAnswer()
   → setLocalDescription(answer)

8. B → WebSocket → Backend → WebSocket → A:
   { type: 'call-answer', sdp: answer }

9. A: setRemoteDescription(answer)
   → Conexiunea se stabilește

10. În paralel (pașii 5-9), ambele părți trimit ICE candidates:
    A → { type: 'ice-candidate', candidate: {...} } → B
    B → { type: 'ice-candidate', candidate: {...} } → A
    → Fiecare candidat e o posibilă rută de comunicare

11. Când o rută funcționează → stream-ul video/audio curge direct A ↔ B
    → peerConnection.ontrack → primește stream-ul remote
    → Afișează în <video> element

12. La închidere:
    A → { type: 'call-ended' } → B
    → Ambii opresc track-urile, închid peerConnection
```

### STUN Servers folosite:
```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```
Acestea sunt servere publice Google care ajută la descoperirea adresei IP externe (NAT traversal).

### De ce apelul funcționează pe orice pagină?
`VideoCallService` este un **singleton global** injectat în `AppComponent`. Se inițializează la login și rămâne activ pe tot ciclul de viață al aplicației. `VideoCallComponent` (UI-ul cu modalul de apel) este montat în `app.component.html` — deci e prezent pe toate paginile.

---

## 14. Cum Funcționează Analiza AI (Detecție Tumori)

### Arhitectura ML:

```
Angular Frontend
      │
      │ POST /api/brain-tumor/predict-from-url
      │ Body: { imageUrl: "https://cloudinary.com/..." }
      ▼
Spring Boot Backend
      │
      │ Descarcă imaginea de pe Cloudinary
      │ Trimite la serviciul Python
      ▼
Python Flask Server (ML)
      │
      │ Preprocesare imagine (resize 224x224, normalizare)
      │ Rulează modelul CNN (Convolutional Neural Network)
      │ Returnează predicție
      ▼
Răspuns: { hasTumor: true, confidence: 0.94, type: "glioma" }
```

### Tipuri de tumori detectate:
- **Glioma** — tumoare din celulele gliale
- **Meningioma** — tumoare din meninge
- **Pituitary** — tumoare hipofizară
- **No tumor** — fără tumoare

### Segmentare (Heatmap):
- Endpoint separat: `predict-from-url-with-segmentation`
- Returnează `overlayImageBase64` — imagine PNG cu zonele suspecte colorate
- Afișată ca overlay peste imaginea originală

---

## 15. Cum Funcționează Reconstrucția 3D (MPR)

### Ce este MPR?
MPR (Multi-Planar Reconstruction) permite vizualizarea unui volum 3D din 3 planuri ortogonale:
- **Axial** — vedere de sus (ca un CT normal)
- **Sagital** — vedere din lateral
- **Coronal** — vedere din față

### Cum se construiește volumul:

```
1. Utilizatorul uploadează N fișiere DICOM (slice-uri)
2. Fiecare slice e stocat pe Cloudinary ca "raw"
3. La click pe "Vizualizare 3D":
   a. Se descarcă fiecare slice (fetch → blob → ArrayBuffer)
   b. Se parsează cu dicom-parser (extrage pixel data)
   c. Se normalizează pixelii la 0-255 (grayscale)
   d. Se stochează într-un array mare: volumeData[slice][row][col]
4. Se randează pe canvas:
   - Axial: volumeData[sliceIndex][y][x]
   - Sagital: volumeData[z][y][sliceIndex]
   - Coronal: volumeData[z][sliceIndex][x]
5. Slider-ul schimbă sliceIndex → re-randare
```

### Limitări:
- Sagital/Coronal apar doar cu 50+ slice-uri (altfel sunt prea comprimate)
- Cloudinary poate corupe fișierele DICOM dacă nu sunt uploadate ca `raw`
- Parsarea manuală poate eșua pe formate DICOM nestandard

---

## 16. Cum Funcționează Mesageria

### Tipuri de mesaje:
| Tip | Descriere |
|-----|-----------|
| `text` | Mesaj normal de text |
| `pacient_partajat` | Card cu informații pacient + imagini |
| `imagine_partajata` | Imagine medicală partajată (cu preview) |
| `apel_video` | Înregistrare apel (primit/pierdut/respins + durată) |

### Flux mesaj text:
```
1. User scrie mesaj → apasă Enter/Send
2. POST /api/mesaje/trimite → Backend salvează în DB
3. Backend returnează mesajul salvat (cu ID, timestamp)
4. Frontend adaugă mesajul local (apare instant la expeditor)
5. Backend trimite prin WebSocket la destinatar
6. Destinatarul primește → adaugă în lista de mesaje
```

### Polling (backup):
Pe lângă WebSocket, există un polling la 2 secunde care verifică mesaje noi. Asta e un fallback în caz că WebSocket-ul pierde un mesaj.

### Mesaje necitite:
- La deschiderea conversației → `PUT /api/mesaje/citeste/{userId}/{expeditorId}`
- Badge-ul se actualizează prin `GET /api/mesaje/necitite/{userId}`

---

## 17. Cum Funcționează Upload-ul de Imagini

### Imagine normală (PNG/JPG):
```
1. User selectează fișier
2. Frontend creează FormData: { file, nume, tip, observatii }
3. POST /api/user/{userId}/pacient/{pacientId}/imagine
4. Backend uploadează pe Cloudinary (resource_type: "image")
5. Cloudinary returnează URL + publicId
6. Backend salvează în MongoDB: { imageUrl, cloudinaryPublicId, ... }
7. Frontend primește răspunsul → actualizează UI
```

### Imagine DICOM:
```
1. User selectează fișier .dcm
2. Frontend detectează DICOM (extensie sau content-type)
3. Frontend extrage metadate cu dicom-parser (client-side)
4. FormData: { file, nume, tip, isDicom: "true", dicomMetadata: JSON }
5. Backend uploadează pe Cloudinary cu resource_type: "raw"
6. URL-ul Cloudinary va fi: /raw/upload/... (nu /image/upload/)
```

### Serie DICOM (multiple):
```
1. User selectează N fișiere .dcm simultan
2. Frontend generează un seriesId unic
3. Uploadează secvențial (unul câte unul) cu seriesId comun
4. La final, creează un card "Serie DICOM" în UI
5. Click pe card → deschide vizualizarea 3D
```

---

## 18. Cum Funcționează Adnotarea Imaginilor

### Principiu:
Un canvas HTML5 transparent e suprapus peste imagine. Utilizatorul desenează pe canvas, iar la salvare se combină imaginea originală + canvas-ul într-o singură imagine.

### Flux:
```
1. Click "Desenează" → activează modul adnotare
2. Canvas se dimensionează la naturalWidth × naturalHeight al imaginii
3. Mouse events pe canvas → desenează linii/text/șterge
4. Zoom funcționează prin CSS transform (nu afectează coordonatele canvas)
5. La "Salvează":
   a. Creează canvas final (dimensiuni naturale)
   b. Desenează imaginea originală
   c. Desenează canvas-ul de adnotare peste
   d. Exportă ca base64 PNG
   e. POST /annotate → Backend uploadează pe Cloudinary
   f. Imaginea veche e înlocuită cu cea adnotată
```

### Pentru DICOM:
- Se generează un data URL PNG din pixel data (la încărcarea DICOM)
- Acest PNG e folosit ca bază pentru adnotare
- După salvare, imaginea devine PNG (nu mai e DICOM)

---

## 19. Securitate

### Autentificare:
- JWT token cu expirare
- Stocat în localStorage
- Trimis în header `Authorization: Bearer <token>` la fiecare request

### WebSocket:
- userId trimis în header STOMP la CONNECT
- Backend setează Principal din acest header
- `convertAndSendToUser` livrează mesaje doar utilizatorului corect

### CORS:
- Backend permite `http://localhost:4200`
- Cloudinary permite cross-origin pentru imagini

---

## 20. Probleme Cunoscute & Soluții

| Problemă | Cauză | Soluție |
|----------|-------|---------|
| DICOM nu se afișează după salvare adnotări | isDicom rămâne true dar fișierul e PNG | Se setează isDicom = false după salvare |
| Reconstrucție 3D negru | Cloudinary corupe DICOM-uri | Upload cu resource_type: "raw" |
| Video call nu ajunge la celălalt | Backend nu rutează semnalul | Verifică VideoCallController + Principal |
| 403 la endpoint-uri | Token lipsă | Adaugă Authorization header |
| Canvas tainted (CORS) | crossOrigin pe imagini externe | Folosim fetch → blob → ObjectURL |


---

## 21. Editarea Imaginilor Medicale — Cod Cheie & Cum să Scrii pentru Licență

### 21.1 Cum să Prezinți în Lucrarea de Licență

Titlu recomandat pentru capitol: **"Modul de Adnotare și Editare a Imaginilor Medicale"**

Structura paragrafelor:

> "Modulul de editare a imaginilor medicale a fost implementat utilizând API-ul Canvas al HTML5, care permite desenarea directă pe suprafețe grafice în browser. Arhitectura aleasă utilizează un canvas transparent suprapus peste imaginea medicală, permițând modificarea nedestructivă — imaginea originală nu este alterată până la momentul salvării explicite."

> "Soluția propusă rezolvă problema coordonatelor la zoom: deoarece imaginea poate fi mărită/micșorată prin CSS transform, coordonatele mouse-ului trebuie scalate înapoi la spațiul natural al imaginii. Acest lucru se realizează prin împărțirea coordonatelor client la factorul de scalare (naturalWidth / offsetWidth)."

---

### 21.2 Codul Esențial — Adnotare

#### Inițializarea canvas-ului (dimensiuni naturale)
```typescript
private initAnnotationCanvas(): void {
  const canvas = this.annotationCanvas?.nativeElement;
  const img = this.baseImage?.nativeElement;
  if (!canvas || !img) return;

  // Canvas dimensionat la dimensiunile NATURALE ale imaginii
  // Dimensiunile naturale = rezoluția originală a imaginii
  // offsetWidth = dimensiunea afișată pe ecran (după zoom CSS)
  canvas.width = img.naturalWidth || img.offsetWidth;
  canvas.height = img.naturalHeight || img.offsetHeight;

  this.ctx = canvas.getContext('2d');
  this.canvasInitialized = true;
}
```

**De ce e important:** Canvas-ul are coordonate independente de zoom-ul CSS. Dacă am seta canvas-ul la offsetWidth (dimensiunea vizuală), desenele s-ar scala urât la zoom.

---

#### Conversia coordonatelor mouse → spațiu natural
```typescript
private getCanvasPos(event: MouseEvent): { x: number; y: number } {
  const img = this.baseImage?.nativeElement;
  if (!img) return { x: 0, y: 0 };

  const imgRect = img.getBoundingClientRect(); // rect-ul DUPĂ zoom CSS
  
  // scaleX = câți pixeli naturali corespund unui pixel vizual
  const scaleX = img.naturalWidth / imgRect.width;
  const scaleY = img.naturalHeight / imgRect.height;

  return {
    x: (event.clientX - imgRect.left) * scaleX,
    y: (event.clientY - imgRect.top) * scaleY
  };
}
```

**De ce e important:** Aceasta este funcția cheie care face ca desenul să fie precis indiferent de nivelul de zoom. Fără această conversie, liniile desenate la zoom 200% ar apărea în locuri greșite la zoom 100%.

---

#### Desenarea liberă (creion)
```typescript
onCanvasMouseMove(event: MouseEvent): void {
  if (!this.isDrawingOnCanvas || !this.ctx) return;
  event.preventDefault();
  event.stopPropagation();

  const pos = this.getCanvasPos(event);

  if (this.annotationTool === 'pen') {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = this.annotationColor;
    // lineWidth în spațiul natural — grosimea rămâne constantă la orice zoom
    this.ctx.lineWidth = 3 / this.zoomLevel;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  } else if (this.annotationTool === 'eraser') {
    // destination-out = șterge pixelii existenți (face transparent)
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.lineWidth = this.eraserSize / this.zoomLevel;
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }
}
```

**De ce e important:** `lineWidth = 3 / this.zoomLevel` asigură că grosimea vizuală a liniei rămâne constantă indiferent de zoom. `globalCompositeOperation = 'destination-out'` face guma funcțională.

---

#### Salvarea imaginii adnotate
```typescript
saveAnnotatedImage(): void {
  if (!this.image || !this.pacient || !this.annotationCanvas || !this.baseImage) return;

  this.isSavingAnnotation = true;
  const annotCanvas = this.annotationCanvas.nativeElement;

  const img = new Image();

  img.onload = () => {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    // Canvas final = dimensiunile naturale
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = w;
    finalCanvas.height = h;
    const finalCtx = finalCanvas.getContext('2d')!;

    // Pasul 1: Desenează imaginea originală
    finalCtx.drawImage(img, 0, 0, w, h);
    
    // Pasul 2: Desenează adnotările peste (cu scalare)
    finalCtx.drawImage(annotCanvas, 0, 0, w, h);

    // Pasul 3: Exportă ca PNG (fără pierdere calitate)
    const base64 = finalCanvas.toDataURL('image/png');
    
    // Pasul 4: Trimite la backend pentru upload pe Cloudinary
    this.uploadAnnotatedImage(base64);
  };

  // Pentru DICOM: folosim data URL PNG (nu fișierul .dcm original)
  if (this.image.isDicom && this.dicomImageDataUrl) {
    img.src = this.dicomImageDataUrl; // PNG generat din pixel data DICOM
  } else {
    img.crossOrigin = 'anonymous'; // necesar pentru imagini externe (Cloudinary)
    img.src = this.image.imageUrl;
  }
}
```

**De ce e important:** Combină imaginea originală cu adnotările la rezoluție completă. `crossOrigin = 'anonymous'` permite citirea pixelilor din imagini externe (fără CORS error pe canvas).

---

### 21.3 Codul Esențial — Vizualizare DICOM

#### Generarea data URL din pixel data DICOM
```typescript
private generateDicomDataUrl(
  pixelData: Int16Array | Uint16Array | Uint8Array,
  rows: number,
  cols: number,
  minVal: number,
  maxVal: number
): void {
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(cols, rows);
  const range = maxVal - minVal || 1;

  for (let i = 0; i < rows * cols; i++) {
    // Normalizare lineară: valoare DICOM → 0-255 grayscale
    const normalized = Math.max(0, Math.min(255,
      Math.round(((pixelData[i] - minVal) / range) * 255)
    ));
    const idx = i * 4;
    imageData.data[idx] = normalized;     // R
    imageData.data[idx + 1] = normalized; // G
    imageData.data[idx + 2] = normalized; // B
    imageData.data[idx + 3] = 255;        // A (opac)
  }

  ctx.putImageData(imageData, 0, 0);
  this.dicomImageDataUrl = canvas.toDataURL('image/png');
}
```

**De ce e important:** Imaginile DICOM stochează pixelii ca valori pe 16 biți (-32768 la +32767 pentru CT, 0-4096 pentru RMN). Această funcție le convertește la 8 biți (0-255) pentru afișare vizuală.

---

### 21.4 Cum să Descrii Tehnic în Lucrare

#### Secțiunea "Implementare canvas adnotare":

> "Implementarea modulului de adnotare utilizează arhitectura de tip overlay-canvas: un element `<canvas>` transparent este poziționat absolut peste elementul `<img>` al imaginii medicale. Această abordare prezintă avantajul că imaginea originală nu este modificată în memoria browser-ului, adnotările existând independent ca un strat separat."

> "O provocare tehnică importantă a constituit-o sincronizarea coordonatelor mouse-ului cu spațiul de coordonate al canvas-ului în condițiile în care utilizatorul poate aplica zoom prin transformări CSS. Soluția adoptată constă în calcularea factorilor de scalare (scaleX, scaleY) ca raport între dimensiunile naturale ale imaginii și dimensiunile sale afișate după aplicarea transformărilor CSS, folosind metoda `getBoundingClientRect()`."

> "Guma de șters a fost implementată utilizând proprietatea `globalCompositeOperation = 'destination-out'` a contextului 2D Canvas, care setează transparența pixelilor afectați în loc să îi suprascrie cu o culoare."

---

#### Secțiunea "Procesarea imaginilor DICOM":

> "Fișierele DICOM (Digital Imaging and Communications in Medicine) reprezintă standardul internațional pentru imagini medicale. Spre deosebire de formatele obișnuite (PNG, JPEG), un fișier DICOM conține atât datele pixelilor cât și metadate clinice complexe (date pacient, parametri achiziție, informații echipament)."

> "Parsarea fișierelor DICOM se realizează client-side, direct în browser, utilizând biblioteca `dicom-parser`. Datele de pixeli sunt stocate în format brut pe 16 biți, ceea ce necesită o etapă de normalizare lineară pentru conversia la spațiul de culoare pe 8 biți specific afișării vizuale."

> "Pentru compatibilitate cu modulul de adnotare, imaginile DICOM sunt convertite intern într-un data URL de tip PNG, generat din pixel data-ul parsat. Această conversie permite utilizarea aceluiași flux de procesare Canvas atât pentru imagini standard cât și pentru fișiere DICOM."

---

#### Secțiunea "Salvarea și persistența adnotărilor":

> "La finalizarea sesiunii de adnotare, imaginea editată este reconstituită prin compozitarea imaginii originale cu stratul de adnotări, ambele scalate la rezoluția naturală. Rezultatul este serializat în format PNG Base64 și transmis backend-ului Java printr-un request HTTP POST."

> "Backend-ul reuplooadează imaginea rezultată pe platforma Cloudinary, înlocuind URL-ul original al imaginii din baza de date MongoDB. Această abordare asigură că adnotările sunt persistate permanent și vizibile în toate sesiunile ulterioare."

---

### 21.5 Diagrama Fluxului de Adnotare

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Angular)                  │
│                                                      │
│  ┌──────────┐     ┌─────────────────────────────┐   │
│  │  <img>   │     │     <canvas> transparent    │   │
│  │ (imagine │◄────│  (adnotări: linii, text)    │   │
│  │ originală│     │                             │   │
│  │ Cloudinary│    └─────────────────────────────┘   │
│  └──────────┘              │ mouse events            │
│                            ▼                         │
│              getCanvasPos() → scale coordinates      │
│              ctx.lineTo() → draw on canvas           │
│                                                      │
│  La salvare:                                         │
│  ┌──────────────────────────────────────┐            │
│  │   finalCanvas = img + annotCanvas    │            │
│  │   → toDataURL('image/png')           │            │
│  │   → POST /api/.../annotate           │            │
│  └──────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
                        │
                        ▼ base64 PNG
              ┌──────────────────┐
              │  Spring Boot     │
              │  Backend         │
              │  → Cloudinary    │
              │  → MongoDB update│
              └──────────────────┘
```
