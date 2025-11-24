import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PostUserComponent } from './components/post-user/post-user.component';
import { GetAllUsersComponent } from './components/get-all-users/get-all-users.component';
import { UpdateUserComponent } from './components/update-user/update-user.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ImagineComponent } from './components/imagine/imagine.component';
import { HomeComponent } from './home/home.component';
import { MesagerieComponent } from './components/mesagerie/mesagerie.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
const routes: Routes = [
  {path: 'user',component:PostUserComponent},
  {path: '',component:HomeComponent},
  {path: 'user/:id',component:UpdateUserComponent},
  {path: 'authenticate', component: LoginComponent},
  { path: 'dashboard', component: DashboardComponent},
  {path: 'dashboard/imagine/:id', component: ImagineComponent},
  {path: 'mesagerie', component: MesagerieComponent},
  {path: 'forgot-password', component: ForgotPasswordComponent},
  {path: 'reset-password', component: ResetPasswordComponent}
 // {path: '', redirectTo : 'authenticate'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
