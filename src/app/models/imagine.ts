export interface Imagine {
    id: number;
    imagine: string;
    tip: string;
     imageUrl?: string; // Optional, in case the user has an image
    numePacient?: string; // Optional, if you want to store patient name
    prenumePacient?: string; // Optional, if you want to store patient surname
    detalii?: string; // Optional, if you want to store details
    dataNasterii?: String; // Optional, if you want to store birth date
    istoricMedical?: string; // Optional, if you want to store medical history
    cnp?: string; // Optional, if you want to store CNP
    numarTelefon?: string; // Optional, if you want to store phone number
    sex?: string; // Optional, if you want
  
  }