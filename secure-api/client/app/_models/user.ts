export class User {
    _id: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    eMail: string;
    userRole: string; //admin, superuser, vip, regular, guest
    apiKey: string;
}