# Cypress E2E Tests - PhotoSolve Application

Acest director conține 50 de teste automate E2E pentru aplicația PhotoSolve, create cu Cypress.

## Structura testelor

### 📁 01-login.cy.ts (10 teste)
- Verificarea paginii de login
- Autentificare cu credențiale valide/invalide
- Validarea formularului
- Toggle vizibilitate parolă
- Navigare la "Forgot Password"

### 📁 02-dashboard.cy.ts (5 teste)
- Încărcarea dashboard-ului
- Afișarea componentelor principale
- Navigare între secțiuni
- Statistici
- Responsivitate meniu

### 📁 03-mesagerie.cy.ts (8 teste)
- Afișarea mesajelor
- Crearea mesajelor noi
- Validarea câmpurilor
- Căutare în mesaje
- Ștergere mesaje
- WebSocket real-time

### 📁 04-user-management.cy.ts (10 teste)
- Listarea utilizatorilor
- Adăugarea utilizatorilor noi
- Editarea utilizatorilor
- Ștergerea utilizatorilor
- Căutare și filtrare
- Sortare tabel
- Validări formular

### 📁 05-images.cy.ts (7 teste)
- Galeria de imagini medicale
- Upload imagini noi
- Vizualizare detalii imagine
- Zoom pe imagine
- Filtrare după tip
- Ștergere imagini

### 📁 06-password-reset.cy.ts (5 teste)
- Pagina "Forgot Password"
- Trimitere email resetare
- Validare email
- Formular resetare parolă
- Validarea potrivirii parolelor

### 📁 07-navigation-validation.cy.ts (5 teste)
- Navigare între pagini
- Protejarea rutelor (Auth Guard)
- Validare CNP
- Validare număr telefon
- Responsivitate pe diferite device-uri

## Cum să rulezi testele

### 1. Instalare dependențe
```bash
npm install
```

### 2. Pornește aplicația
```bash
npm start
```
Aplicația va rula pe http://localhost:4200

### 3. Rulează testele

#### Mod interactiv (Cypress UI)
```bash
npm run cypress:open
```

#### Mod headless (CI/CD)
```bash
npm run cypress:run
```

#### Rulează un singur fișier de test
```bash
npx cypress run --spec "cypress/e2e/01-login.cy.ts"
```

## Configurare

Configurația Cypress se află în `cypress.config.ts`:
- **baseUrl**: http://localhost:4200
- **viewport**: 1280x720
- **timeout**: 10000ms
- **video**: dezactivat (pentru performanță)
- **screenshots**: activate la eroare

## Date de test

Datele de test sunt stocate în `cypress/fixtures/testData.json`:
- Utilizatori de test (admin, doctor)
- Date de pacient
- Template-uri de mesaje

## Comenzi custom

În `cypress/support/commands.ts`:
- `cy.login(email, password)` - Login rapid
- `cy.logout()` - Logout rapid

## Best Practices

1. **Izolarea testelor**: Fiecare test este independent
2. **Cleanup**: Testele își fac cleanup după ele
3. **Waiting**: Folosim `cy.wait()` doar când e necesar
4. **Selectors**: Preferăm selectori stabili (data-cy, semantic)
5. **Fixtures**: Date de test centralizate

## Debugging

Pentru debugging, deschide Cypress UI:
```bash
npm run cypress:open
```

Apoi selectează testul dorit și urmărește execuția pas cu pas.

## Raportare

Rezultatele testelor sunt afișate în terminal.
Screenshot-urile de eroare sunt salvate în `cypress/screenshots/`.

## Întegrare CI/CD

Pentru CI/CD, folosește:
```bash
npm run e2e
```
Aceasta va porni aplicația, astepta să fie gata, și va rula toate testele.

## Cerințe

- Node.js >= 16
- Angular CLI
- Backend pornit și accesibil
- Browser modern (Chrome, Firefox, Edge)

## Probleme cunoscute

- Unele teste pot eșua dacă backend-ul nu răspunde
- Testele de WebSocket necesită conexiune stabilă
- Testele de upload necesită fișiere în `cypress/fixtures/`

## Contact

Pentru probleme sau sugestii, contactați echipa de dezvoltare.
