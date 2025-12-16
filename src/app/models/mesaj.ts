export interface Mesaj {
  id?: string;
  expeditorId: string;
  expeditorNume?: string;
  expeditorPrenume?: string;
  destinatarId: string;
  destinatarNume?: string;
  destinatarPrenume?: string;
  continut: string;
  dataTrimitere?: Date;
  citit?: boolean;
  dataCitire?: Date;
  
  // Câmpuri pentru mesaje speciale
  tip?: string; // "text", "pacient_partajat"
  pacientId?: string;
  pacientNume?: string;
  pacientPrenume?: string;
  pacientCnp?: string;
  pacientDataNasterii?: string;
  pacientSex?: string;
  pacientNumarTelefon?: string;
  pacientIstoricMedical?: string;
  pacientDetalii?: string;
  pacientNumarImagini?: number;
}

export interface MesajRequest {
  expeditorId: string;
  destinatarId: string;
  continut: string;
  
  // Câmpuri opționale pentru mesaje speciale
  tip?: string;
  pacientId?: string;
  pacientNume?: string;
  pacientPrenume?: string;
  pacientCnp?: string;
  pacientDataNasterii?: string;
  pacientSex?: string;
  pacientNumarTelefon?: string;
  pacientIstoricMedical?: string;
  pacientDetalii?: string;
  pacientNumarImagini?: number;
}

export interface Notificare {
  id?: string;
  userId: string;
  tip: string;
  mesajId?: string;
  continut: string;
  citit?: boolean;
  dataCreare?: Date;
  expeditorId?: string;
  expeditorNume?: string;
  expeditorPrenume?: string;
}
