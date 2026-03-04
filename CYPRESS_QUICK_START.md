# 🎯 Ghid Rapid - Teste Cypress PhotoSolve

## 🚀 Start Rapid

### 1. Pornește aplicația
```bash
npm start
```

### 2. Deschide Cypress
```bash
npm run cypress:open
```

### 3. Selectează un test și urmărește execuția!

---

## 📊 Sumar Teste (50 total)

| Categorie | Fișier | Teste |
|-----------|--------|-------|
| 🔐 Login | 01-login.cy.ts | 10 |
| 📊 Dashboard | 02-dashboard.cy.ts | 5 |
| 💬 Mesagerie | 03-mesagerie.cy.ts | 8 |
| 👥 Utilizatori | 04-user-management.cy.ts | 10 |
| 🖼️ Imagini | 05-images.cy.ts | 7 |
| 🔑 Reset Password | 06-password-reset.cy.ts | 5 |
| 🧭 Navigare & Validări | 07-navigation-validation.cy.ts | 5 |

---

## 🔧 Comenzi Utile

```bash
# Instalare
npm install

# Pornește aplicația
npm start

# Deschide Cypress UI
npm run cypress:open

# Rulează toate testele (headless)
npm run cypress:run

# Rulează un test specific
npx cypress run --spec "cypress/e2e/01-login.cy.ts"

# Rulează teste pentru un browser specific
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge

# Rulează teste cu video
npx cypress run --config video=true
```

---

## 📝 Structura Proiectului

```
cypress/
├── e2e/                          # Testele
│   ├── 01-login.cy.ts
│   ├── 02-dashboard.cy.ts
│   ├── 03-mesagerie.cy.ts
│   ├── 04-user-management.cy.ts
│   ├── 05-images.cy.ts
│   ├── 06-password-reset.cy.ts
│   └── 07-navigation-validation.cy.ts
├── fixtures/                     # Date de test
│   ├── testData.json
│   └── test-image.jpg
├── support/                      # Configurări & comenzi custom
│   ├── commands.ts
│   ├── e2e.ts
│   └── index.d.ts
└── README.md                     # Documentație completă
```

---

## 💡 Tips & Tricks

### Debugging
- Folosește `.debug()` pentru a opri execuția: `cy.get('.element').debug()`
- Click pe comandă în UI pentru a vedea starea în acel moment
- Folosește Time Travel pentru a vedea snapshot-uri

### Selectors
- Preferă selectors semantici: `cy.contains('Login')`
- Folosește `data-cy` attributes în cod: `cy.get('[data-cy="login-btn"]')`
- Evită selectors fragili bazați pe poziție

### Waiting
- Evită `cy.wait()` cu timeout hardcodat
- Folosește assertions: `cy.get('.element').should('be.visible')`
- Cypress așteaptă automat pentru elemente

### Best Practices
- Un test = O funcționalitate
- Teste independente (nu depind unul de altul)
- Cleanup automat în `beforeEach`/`afterEach`

---

## 🎨 Exemple de Cod

### Login rapid
```typescript
cy.login('admin@test.com', 'password123');
```

### Verificare element
```typescript
cy.get('.button').should('be.visible');
cy.get('.error').should('not.exist');
```

### Completare formular
```typescript
cy.get('input[name="email"]').type('test@test.com');
cy.get('input[name="password"]').type('password123');
cy.get('button[type="submit"]').click();
```

### Așteptare răspuns API
```typescript
cy.intercept('POST', '/api/login').as('loginRequest');
cy.get('button[type="submit"]').click();
cy.wait('@loginRequest');
```

---

## ⚠️ Troubleshooting

### Testele eșuează la login?
- Verifică dacă backend-ul rulează
- Verifică credențialele în `testData.json` și actualizează-le cu credențiale valide din aplicație
- Verifică proxy-ul în `proxy.conf.json`
- **IMPORTANT:** Ruta de login este `/authenticate` nu `/login`

### Rute importante în aplicație:
- Login: `/authenticate`
- Dashboard: `/dashboard`
- Utilizatori: `/user`
- Mesagerie: `/mesagerie`
- Forgot Password: `/forgot-password`
- Reset Password: `/reset-password`

### Timeout errors?
- Crește timeout: `cy.get('.element', { timeout: 20000 })`
- Verifică dacă elementul se încarcă efectiv
- Verifică console-ul pentru erori JavaScript

### Elements not found?
- Verifică dacă selectorul este corect
- Folosește Cypress UI pentru a vedea DOM-ul
- Verifică dacă elementul este în iframe

---

## 📧 Support

Pentru ajutor sau întrebări:
1. Verifică [documentația Cypress](https://docs.cypress.io)
2. Verifică README-ul complet în `cypress/README.md`
3. Contactează echipa de dezvoltare

---

**Happy Testing! 🎉**
