import { Component } from '@angular/core';
import { UserService } from '../../service/user.service';
@Component({
  selector: 'app-get-all-users',
  standalone: false,
  
  templateUrl: './get-all-users.component.html',
  styleUrl: './get-all-users.component.css'
})
export class GetAllUsersComponent {
   constructor(private userService: UserService){}

   users!:any[]; //array
    ngOnInit(){
      this.getAllUsers();
    }
    getAllUsers(){
      this.userService.getAllUsers().subscribe((data)=>{
        console.log(data);
        this.users = data;
      })
    }
    deleteUser(id:number){
      this.userService.deleteUser(id).subscribe((data)=>{
        console.log(data);
      this.getAllUsers();
      })
    }
}
