import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { routing } from './app.routing';

import { customHttpProvider } from './_helpers/index';
import { AlertComponent } from './_directives/index';
import { AuthGuard } from './_guards/index';
import { AlertService, AuthenticationService, UserService } from './_services/index';
import { HomeComponent } from './home/index';
import { LoginComponent } from './login/index';
import { RegisterComponent } from './register/index';
import { OptionsComponent } from './options/index';

import { TranslationModule, LocaleService, TranslationService } from 'angular-l10n';


@NgModule({
    imports: [  
        BrowserModule,
        FormsModule,
        HttpModule,
        routing,
        TranslationModule.forRoot()
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        LoginComponent,
        RegisterComponent,
        OptionsComponent
    ],
    providers: [
        customHttpProvider,
        AuthGuard,
        AlertService,
        AuthenticationService,
        UserService
    ],
    bootstrap: [AppComponent]
})

export class AppModule {

    constructor(public locale: LocaleService, public translation: TranslationService) {
        this.locale.addConfiguration()
            .addLanguages(['de', 'en'])
            .setCookieExpiration(30)
            .defineLanguage('de');

        this.translation.addConfiguration()
            .addProvider('./assets/locale-');

        this.translation.init();
    }

}