export interface Imagine {
    id: number;
    imagine: string;
    tip: string;
     image_url?: string; // Optional, in case the user has an image
    nume_pacient?: string; // Optional, if you want to store patient name
    prenume_pacient?: string; // Optional, if you want to store patient surname
    detalii?: string; // Optional, if you want to store details
    data_nasterii?: String; // Optional, if you want to store birth date
    istoric_medical?: string; // Optional, if you want to store medical history
    cnp?: string; // Optional, if you want to store CNP
    numar_telefon?: string; // Optional, if you want to store phone number
  
  }