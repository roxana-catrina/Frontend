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
  tip?: string; // "text", "pacient_partajat", "imagine_partajata"
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
  pacientImagini?: string; // JSON string cu array de imagini
  
  // Câmpuri pentru imagine partajată
  imagineId?: string;
  imagineUrl?: string;
  imagineNume?: string;
  imagineTip?: string;
  imagineDataIncarcare?: string;
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
  pacientImagini?: string; // JSON string cu array de imagini
  
  // Câmpuri pentru imagine partajată
  imagineId?: string;
  imagineUrl?: string;
  imagineNume?: string;
  imagineTip?: string;
  imagineDataIncarcare?: string;
}

// Interface pentru informații imagine partajată
export interface ImaginePartajata {
  id: string;
  nume: string;
  tip: string;
  dataIncarcare: string;
  statusAnaliza?: string;
  areTumoare?: boolean;
  tipTumoare?: string;
  confidenta?: number;
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
