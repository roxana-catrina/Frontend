import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PostUserComponent } from './components/post-user/post-user.component';
import { GetAllUsersComponent } from './components/get-all-users/get-all-users.component';
import { UpdateUserComponent } from './components/update-user/update-user.component';

const routes: Routes = [
  {path: 'user',component:PostUserComponent},
  {path: '',component:GetAllUsersComponent},
  {path: 'user/:id',component:UpdateUserComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
