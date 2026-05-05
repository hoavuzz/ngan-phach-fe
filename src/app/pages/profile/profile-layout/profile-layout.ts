import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileSidebar } from '../profile-sidebar/profile-sidebar';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet, ProfileSidebar],
  templateUrl: './profile-layout.html',
})
export class ProfileLayout {}
