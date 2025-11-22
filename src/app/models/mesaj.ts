export interface Mesaj {
  id?: number;
  expeditorId: number;
  expeditorNume?: string;
  expeditorPrenume?: string;
  destinatarId: number;
  destinatarNume?: string;
  destinatarPrenume?: string;
  continut: string;
  dataTrimitere?: Date;
  citit?: boolean;
  dataCitire?: Date;
}

export interface MesajRequest {
  expeditorId: number;
  destinatarId: number;
  continut: string;
}

export interface Notificare {
  id?: number;
  userId: number;
  tip: string;
  mesajId?: number;
  continut: string;
  citit?: boolean;
  dataCreare?: Date;
  expeditorId?: number;
  expeditorNume?: string;
  expeditorPrenume?: string;
}
