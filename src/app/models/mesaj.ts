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
}

export interface MesajRequest {
  expeditorId: string;
  destinatarId: string;
  continut: string;
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
