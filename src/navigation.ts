export class Token {
    get Clone() {
        return this;
    }

    //Stub for Session.signIn
    Reset(preserveSteps) {
    }
};

export namespace Shell {
    export function Href(token): string {
        return '';
    }

    export function Reflect(token) {
    }
}

export namespace Business {
    export function ProfileView(businessId, options) {
        return '';
    }

    export function ViewProducts(business, options) {
        return '';
    }
}

//TODO: *.html import
window['Navigation'] = {
    'Business': Business,
    'Shell': Shell,
    'Token': Token
};