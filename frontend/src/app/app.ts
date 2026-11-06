import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ConnectionStatus } from './shared/connection-status/connection-status';
import { NavBar } from './shared/nav-bar/nav-bar';
import { SiteFooter } from './shared/site-footer/site-footer';
import { ToastContainer } from './shared/toast-container/toast-container';
import { WhatsappFab } from './shared/whatsapp-fab/whatsapp-fab';

@Component({
  imports: [RouterOutlet, NavBar, SiteFooter, WhatsappFab, ConnectionStatus, ToastContainer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
