# Modificări Backend Java - Funcționalitate Partajare Pacient și Imagini

## 📋 Modificări necesare pentru implementarea funcționalității de partajare pacient și imagini prin mesagerie

---

## 1️⃣ **Modificare Entitate `Mesaj.java`**

📁 **Fișier**: `src/main/java/com/example/backend/entity/Mesaj.java`

### Adaugă următoarele câmpuri noi în clasa `Mesaj`:

```java
@Entity
@Table(name = "mesaje")
public class Mesaj {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    // ... Câmpurile existente (expeditorId, destinatarId, continut, etc.) ...
    
    // ==================== CÂMPURI NOI ====================
    
    @Column(name = "tip")
    private String tip = "text"; // "text", "pacient_partajat", sau "imagine_partajata"
    
    @Column(name = "pacient_id")
    private String pacientId; // ID-ul pacientului partajat (nullable)
    
    @Column(name = "pacient_nume", length = 100)
    private String pacientNume;
    
    @Column(name = "pacient_prenume", length = 100)
    private String pacientPrenume;
    
    @Column(name = "pacient_cnp", length = 13)
    private String pacientCnp;
    
    @Column(name = "pacient_data_nasterii")
    private String pacientDataNasterii;
    
    @Column(name = "pacient_sex", length = 20)
    private String pacientSex;
    
    @Column(name = "pacient_numar_telefon", length = 20)
    private String pacientNumarTelefon;
    
    @Column(name = "pacient_istoric_medical", columnDefinition = "TEXT")
    private String pacientIstoricMedical;
    
    @Column(name = "pacient_detalii", columnDefinition = "TEXT")
    private String pacientDetalii;
    
    @Column(name = "pacient_numar_imagini")
    private Integer pacientNumarImagini;
    
    // ==================== CÂMPURI NOI PENTRU IMAGINI ====================
    
    @Column(name = "imagine_id")
    private String imagineId; // ID-ul imaginii partajate (nullable)
    
    @Column(name = "imagine_url", columnDefinition = "TEXT")
    private String imagineUrl; // URL-ul imaginii
    
    @Column(name = "imagine_nume", length = 255)
    private String imagineNume; // Numele imaginii
    
    @Column(name = "imagine_tip", length = 50)
    private String imagineTip; // Tipul imaginii (ex: image/jpeg, image/png)
    
    @Column(name = "imagine_data_incarcare")
    private String imagineDataIncarcare; // Data încărcării imaginii
    
    @Column(name = "imagine_metadata", columnDefinition = "TEXT")
    private String imagineMetadata; // Metadate DICOM în format JSON
    
    // ==================== GETTERS ȘI SETTERS ====================
    
    public String getTip() {
        return tip;
    }
    
    public void setTip(String tip) {
        this.tip = tip;
    }
    
    public String getPacientId() {
        return pacientId;
    }
    
    public void setPacientId(String pacientId) {
        this.pacientId = pacientId;
    }
    
    public String getPacientNume() {
        return pacientNume;
    }
    
    public void setPacientNume(String pacientNume) {
        this.pacientNume = pacientNume;
    }
    
    public String getPacientPrenume() {
        return pacientPrenume;
    }
    
    public void setPacientPrenume(String pacientPrenume) {
        this.pacientPrenume = pacientPrenume;
    }
    
    public String getPacientCnp() {
        return pacientCnp;
    }
    
    public void setPacientCnp(String pacientCnp) {
        this.pacientCnp = pacientCnp;
    }
    
    // ... restul getters/setters pentru câmpurile pacient ...
    
    // Getters și setters pentru imagini
    public String getImagineId() {
        return imagineId;
    }
    
    public void setImagineId(String imagineId) {
        this.imagineId = imagineId;
    }
    
    public String getImagineUrl() {
        return imagineUrl;
    }
    
    public void setImagineUrl(String imagineUrl) {
        this.imagineUrl = imagineUrl;
    }
    
    public String getImagineNume() {
        return imagineNume;
    }
    
    public void setImagineNume(String imagineNume) {
        this.imagineNume = imagineNume;
    }
    
    public String getImagineTip() {
        return imagineTip;
    }
    
    public void setImagineTip(String imagineTip) {
        this.imagineTip = imagineTip;
    }
    
    public String getImagineDataIncarcare() {
        return imagineDataIncarcare;
    }
    
    public void setImagineDataIncarcare(String imagineDataIncarcare) {
        this.imagineDataIncarcare = imagineDataIncarcare;
    }
}
    
    public String getPacientDataNasterii() {
        return pacientDataNasterii;
    }
    
    public void setPacientDataNasterii(String pacientDataNasterii) {
        this.pacientDataNasterii = pacientDataNasterii;
    }
    
    public String getPacientSex() {
        return pacientSex;
    }
    
    public void setPacientSex(String pacientSex) {
        this.pacientSex = pacientSex;
    }
}
```

---

## 2️⃣ **Modificare DTO `MesajRequest.java`**

📁 **Fișier**: `src/main/java/com/example/backend/dto/MesajRequest.java`

### Adaugă câmpurile pentru pacient partajat:

```java
public class MesajRequest {
    
    private String expeditorId;
    private String destinatarId;
    private String continut;
    
    // ==================== CÂMPURI NOI ====================
    
    private String tip = "text"; // Default "text"
    private String pacientId;
    private String pacientNume;
    private String pacientPrenume;
    private String pacientCnp;
    private String pacientDataNasterii;
    private String pacientSex;
    private String pacientNumarTelefon;
    private String pacientIstoricMedical;
    private String pacientDetalii;
    private Integer pacientNumarImagini;
    
    // ==================== GETTERS ȘI SETTERS ====================
    
    public String getTip() {
        return tip;
    }
    
    public void setTip(String tip) {
        this.tip = tip;
    }
    
    public String getPacientId() {
        return pacientId;
    }
    
    public void setPacientId(String pacientId) {
        this.pacientId = pacientId;
    }
    
    public String getPacientNume() {
        return pacientNume;
    }
    
    public void setPacientNume(String pacientNume) {
        this.pacientNume = pacientNume;
    }
    
    public String getPacientPrenume() {
        return pacientPrenume;
    }
    
    public void setPacientPrenume(String pacientPrenume) {
        this.pacientPrenume = pacientPrenume;
    }
    
    public String getPacientCnp() {
        return pacientCnp;
    }
    
    public void setPacientCnp(String pacientCnp) {
        this.pacientCnp = pacientCnp;
    }
    
    public String getPacientDataNasterii() {
        return pacientDataNasterii;
    }
    
    public void setPacientDataNasterii(String pacientDataNasterii) {
        this.pacientDataNasterii = pacientDataNasterii;
    }
    
    public String getPacientSex() {
        return pacientSex;
    }
    
    public void setPacientSex(String pacientSex) {
        this.pacientSex = pacientSex;
    }
}
```

---

## 3️⃣ **Modificare Service `MesajService.java`**

📁 **Fișier**: `src/main/java/com/example/backend/service/MesajService.java`

### Actualizează metoda `trimiteMesaj()`:

```java
@Service
public class MesajService {
    
    @Autowired
    private MesajRepository mesajRepository;
    
    @Autowired
    private WebSocketService webSocketService; // Dacă există
    
    public Mesaj trimiteMesaj(MesajRequest mesajRequest) {
        Mesaj mesaj = new Mesaj();
        
        // Setări de bază
        mesaj.setExpeditorId(mesajRequest.getExpeditorId());
        mesaj.setDestinatarId(mesajRequest.getDestinatarId());
        mesaj.setContinut(mesajRequest.getContinut());
        mesaj.setDataTrimitere(LocalDateTime.now());
        mesaj.setCitit(false);
        
        // ==================== SETĂRI NOI ====================
        
        // Setează tipul mesajului (default: "text")
        mesaj.setTip(mesajRequest.getTip() != null ? mesajRequest.getTip() : "text");
        
        // Dacă este mesaj cu pacient partajat, setează datele pacientului
        if ("pacient_partajat".equals(mesajRequest.getTip())) {
            mesaj.setPacientId(mesajRequest.getPacientId());
            mesaj.setPacientNume(mesajRequest.getPacientNume());
            mesaj.setPacientPrenume(mesajRequest.getPacientPrenume());
            mesaj.setPacientCnp(mesajRequest.getPacientCnp());
            mesaj.setPacientDataNasterii(mesajRequest.getPacientDataNasterii());
            mesaj.setPacientSex(mesajRequest.getPacientSex());
            mesaj.setPacientNumarTelefon(mesajRequest.getPacientNumarTelefon());
            mesaj.setPacientIstoricMedical(mesajRequest.getPacientIstoricMedical());
            mesaj.setPacientDetalii(mesajRequest.getPacientDetalii());
            mesaj.setPacientNumarImagini(mesajRequest.getPacientNumarImagini());
            
            System.out.println("📋 Mesaj cu pacient partajat salvat:");
            System.out.println("   - Pacient: " + mesajRequest.getPacientNume() + " " + mesajRequest.getPacientPrenume());
            System.out.println("   - CNP: " + mesajRequest.getPacientCnp());
            System.out.println("   - Istoric medical: " + (mesajRequest.getPacientIstoricMedical() != null ? "DA" : "NU"));
            System.out.println("   - Număr imagini: " + mesajRequest.getPacientNumarImagini());
        }
        
        // Salvare în baza de date
        Mesaj savedMesaj = mesajRepository.save(mesaj);
        
        System.out.println("✅ Mesaj salvat: ID=" + savedMesaj.getId() + ", Tip=" + savedMesaj.getTip());
        
        // Trimite prin WebSocket dacă este configurat
        if (webSocketService != null) {
            webSocketService.sendMessageToUser(mesajRequest.getDestinatarId(), savedMesaj);
        }
        
        return savedMesaj;
    }
    
    // ... Restul metodelor existente ...
}
```

---

## 4️⃣ **Actualizare Bază de Date**

### Adaugă coloanele noi în tabelul `mesaje`:

```sql
-- Modificare tabel mesaje pentru suport partajare pacient și imagini

ALTER TABLE mesaje ADD COLUMN tip VARCHAR(50) DEFAULT 'text';
ALTER TABLE mesaje ADD COLUMN pacient_numar_telefon VARCHAR(20);
ALTER TABLE mesaje ADD COLUMN pacient_istoric_medical TEXT;
ALTER TABLE mesaje ADD COLUMN pacient_detalii TEXT;
ALTER TABLE mesaje ADD COLUMN pacient_numar_imagini INT;
ALTER TABLE mesaje ADD COLUMN pacient_id VARCHAR(255);
ALTER TABLE mesaje ADD COLUMN pacient_nume VARCHAR(100);
ALTER TABLE mesaje ADD COLUMN pacient_prenume VARCHAR(100);
ALTER TABLE mesaje ADD COLUMN pacient_cnp VARCHAR(13);
ALTER TABLE mesaje ADD COLUMN pacient_data_nasterii VARCHAR(50);
ALTER TABLE mesaje ADD COLUMN pacient_sex VARCHAR(20);

-- Coloane pentru partajare imagini
ALTER TABLE mesaje ADD COLUMN imagine_id VARCHAR(255);
ALTER TABLE mesaje ADD COLUMN imagine_url TEXT;
ALTER TABLE mesaje ADD COLUMN imagine_nume VARCHAR(255);
ALTER TABLE mesaje ADD COLUMN imagine_tip VARCHAR(50);
ALTER TABLE mesaje ADD COLUMN imagine_data_incarcare VARCHAR(50);
ALTER TABLE mesaje ADD COLUMN imagine_metadata TEXT;

-- Index pentru căutări rapide după tip
CREATE INDEX idx_mesaje_tip ON mesaje(tip);
CREATE INDEX idx_mesaje_pacient_id ON mesaje(pacient_id);
CREATE INDEX idx_mesaje_imagine_id ON mesaje(imagine_id);
```

**SAU** dacă folosești **Liquibase/Flyway**, creează un changelog nou:

```xml
<!-- V1.X__add_patient_and_image_sharing_to_messages.xml -->
<changeSet id="add-patient-sharing-columns" author="developer">
    <addColumn tableName="mesaje">
        <column name="tip" type="varchar(50)" defaultValue="text">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_id" type="varchar(255)">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_nume" type="varchar(100)">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_prenume" type="varchar(100)">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_cnp" type="varchar(13)">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_data_nasterii" type="varchar(50)">
            <constraints nullable="true"/>
        <column name="pacient_numar_telefon" type="varchar(20)">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_istoric_medical" type="text">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_detalii" type="text">
            <constraints nullable="true"/>
        </column>
        <column name="pacient_numar_imagini" type="int">
            <constraints nullable="true"/>
        </column>
        </column>
        <column name="pacient_sex" type="varchar(20)">
            <constraints nullable="true"/>
        </column>
    </addColumn>
    
    <createIndex indexName="idx_mesaje_tip" tableName="mesaje">
        <column name="tip"/>
    </createIndex>
    
    <createIndex indexName="idx_mesaje_pacient_id" tableName="mesaje">
        <column name="pacient_id"/>
    </createIndex>
</changeSet>
```

---

## 5️⃣ **Testare Endpoint**

### Test manual cu Postman/cURL:
,
  "pacientNumarTelefon": "0712345678",
  "pacientIstoricMedical": "Hipertensiune arterială diagnosticată în 2015. Fără alergii cunoscute.",
  "pacientDetalii": "Consultație de control trimestrial.",
  "pacientNumarImagini": 3
```bash
POST http://localhost:8083/api/mesaje/trimite
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "expeditorId": "doctor-id-1",
  "destinatarId": "doctor-id-2",
  "continut": "Pacient partajat: Ion Popescu",
  "tip": "pacient_partajat",
  "pacientId": "pacient-id-123",
  "pacientNume": "Popescu",
  "pacientPrenume": "Ion",
  "pacientCnp": "1234567890123",
  "pacientDataNasterii": "1980-05-15",
  "pacientSex": "MASCULIN"
}
```
pacientNumarTelefon": "0712345678",
  "pacientIstoricMedical": "Hipertensiune arterială diagnosticată în 2015. Fără alergii cunoscute.",
  "pacientDetalii": "Consultație de control trimestrial.",
  "pacientNumarImagini": 3,
  "
**Răspuns așteptat:**

```json
{
  "id": "mesaj-uuid",
  "expeditorId": "doctor-id-1",
  "destinatarId": "doctor-id-2",
  "continut": "Pacient partajat: Ion Popescu",
  "tip": "pacient_partajat",
  "pacientId": "pacient-id-123",
  "pacientNume": "Popescu",
  "pacientPrenume": "Ion",
  "pacientCnp": "1234567890123",
  "pacientDataNasterii": "1980-05-15",
  "pacientSex": "MASCULIN",
  "citit": false,
  "dataTrimitere": "2025-12-16T10:30:00"
}
```

---

## 🔧 **PROBLEMA CRITICĂ: Conversații duplicate între utilizatori**

### **Problema:**
Frontend-ul primește aceleași mesaje pentru toți utilizatorii. Conversația dintre User A și User B apare identică cu conversația dintre User A și User C.

### **Cauză:**
Endpoint-ul `/api/mesaje/conversatie/{user1Id}/{user2Id}` **NU FILTREAZĂ CORECT** mesajele.

### **Soluție în Controller:**

```java
@GetMapping("/conversatie/{user1Id}/{user2Id}")
public ResponseEntity<List<Mesaj>> getConversation(
    @PathVariable String user1Id,
    @PathVariable String user2Id) {
    
    try {
        // IMPORTANT: Trebuie să returneze DOAR mesajele dintre acești 2 utilizatori
        List<Mesaj> mesaje = mesajRepository.findConversationBetweenUsers(user1Id, user2Id);
        
        // Sortează după data trimiterii
        mesaje.sort(Comparator.comparing(Mesaj::getDataTrimitere));
        
        return ResponseEntity.ok(mesaje);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

### **Adaugă în MesajRepository.java:**

```java
@Query("SELECT m FROM Mesaj m WHERE " +
       "(m.expeditorId = :user1Id AND m.destinatarId = :user2Id) OR " +
       "(m.expeditorId = :user2Id AND m.destinatarId = :user1Id) " +
       "ORDER BY m.dataTrimitere ASC")
List<Mesaj> findConversationBetweenUsers(@Param("user1Id") String user1Id, 
                                          @Param("user2Id") String user2Id);
```

### **Verificare:**
După implementare, execută în Postman:
```
GET http://localhost:8083/api/mesaje/conversatie/user1-id/user2-id
```

Răspunsul trebuie să conțină **DOAR** mesajele între acești 2 utilizatori, NU toate mesajele din sistem.

---

## ✅ **Checklist Implementare**

- [ ] Modificat `Mesaj.java` - adăugate câmpuri noi
- [ ] Adăugate getters/setters în `Mesaj.java`
- [ ] Modificat `MesajRequest.java` - adăugate câmpuri
- [ ] Adăugate getters/setters în `MesajRequest.java`
- [ ] Actualizat `MesajService.java` - metoda `trimiteMesaj()`
- [ ] Rulat migrare bază de date (ALTER TABLE sau Liquibase)
- [ ] **ADĂUGAT** query `findConversationBetweenUsers` în `MesajRepository.java`
- [ ] **VERIFICAT** că endpoint-ul `/conversatie/{user1Id}/{user2Id}` returnează mesajele corecte
- [ ] Testat endpoint cu Postman
- [ ] Verificat că mesajele se salvează corect în baza de date
- [ ] Testat în frontend că mesajele apar corect

---

## 🎯 **Rezultat Final**

După aceste modificări, vei putea:

1. ✅ **Partaja un pacient** din pagina imagine/pacient
2. ✅ **Selecta un doctor** din lista de utilizatori
3. ✅ **Trimite mesaj special** cu datele pacientului
4. ✅ **Vizualiza în mesagerie** un card frumos cu informațiile pacientului
5. ✅ **Mesajele rămân doar read-only** pentru destinatar (nu poate modifica pacientul)
6. ✅ **Partaja imagini medicale** (inclusiv DICOM) prin mesagerie
7. ✅ **Conversații separate** pentru fiecare utilizator (fără duplicate)

---

## 📞 **Support**

Dacă întâmpini probleme la implementare:
- Verifică că toate câmpurile au getters/setters
- Asigură-te că migrarea bazei de date s-a executat cu succes
- Verifică log-urile backend pentru erori de mapping
- Testează endpoint-ul cu Postman înainte de a testa în frontend
- **IMPORTANT:** Verifică că query-ul de conversație filtrează corect după cei 2 utilizatori
