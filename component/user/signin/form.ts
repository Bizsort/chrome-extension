import { Guid } from '../../../src/system'
import { IView, Form as Form$, OpenAction, Session } from '../../../src/viewmodel/signin/form'
import { ServiceProvider } from '../../../src/session'

//https://github.com/Microsoft/TypeScript/issues/563 (partial classes)
export class Form extends Form$ {
    constructor(view: IView) {
        super(view);
        this.Remember = true;
    }

    SignIn() {
        this.Submit();
    }

    Show(options: OpenAction = {}) {
        this._options = options;
        this.SignInAction.Invoke(this, {
            open: options
        });
    }

    Hide() {
    }

    remember(signinType: ServiceProvider) {
        Session.Remember((token) => {
            if (token && token.length > 0) {
                token = Guid.Deserialize(token);
            }
            if (!Guid.isEmpty(token)) {
                this.SignInAction.Invoke(this, {
                    remember: token
                });
            }
        });
    }
}