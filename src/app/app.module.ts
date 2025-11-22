import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeRo from '@angular/common/locales/ro';

import { AppRoutingModule } from './app-routing.module';

// Înregistrează locale-ul românesc
registerLocaleData(localeRo);
import { AppComponent } from './app.component';
import { PostUserComponent } from './components/post-user/post-user.component';
import { GetAllUsersComponent } from './components/get-all-users/get-all-users.component';
import { UpdateUserComponent } from './components/update-user/update-user.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import {} from '@angular/common/http';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MesagerieComponent } from './components/mesagerie/mesagerie.component';

@NgModule({
  declarations: [
    AppComponent,
    PostUserComponent,
    GetAllUsersComponent,
    UpdateUserComponent,
    LoginComponent,
    DashboardComponent,
    HomeComponent,
    MesagerieComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,ConfirmDialogComponent
  ],

  providers: [
    provideClientHydration(withEventReplay()),
    { provide: LOCALE_ID, useValue: 'ro' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
