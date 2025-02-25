import { Injectable } from '@angular/core';
import { CountryService } from '../../service/country/country.service';

@Injectable({
  providedIn: 'root'
})

export class PhoneService {
  countriesList: any[] = []; // Listă pentru țări

  constructor(private countryService:CountryService) { this.initializeCountries();}

  initializeCountries() {
    this.countryService.getCountries().subscribe(data => {
      this.countriesList = data;
      console.log("Countries loaded:", this.countriesList);
    });
  }
  
  schimbarePrefix(countryName: string, phoneNumber: string): { prefix: string, numarTelefonComplet: string } | null {
    console.log("tari"+this.countriesList);
    const tara = this.countriesList.find(tara => tara.nume == countryName);
    console.log("tara din servciu"+tara);
    if (tara) {
      return {
        prefix: tara.prefix,
        numarTelefonComplet: tara.prefix + phoneNumber
      };
    } else {
      console.error("Țara nu a fost găsită în lista countriesList!");
      return null;
    }
  }
 
}
