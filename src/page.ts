import { OperationException, OperationExceptionType, SessionException, SessionExceptionType } from './exception'
import { Post, TranslateFault } from './service'
import { Event, Guid } from './system'
import { Context as SessionContext, Session, SigninStatus, SessionService } from './session'
import { IView, ViewModel } from './viewmodel'
import * as Navigation from './navigation'
import * as Signin from './viewmodel/signin/form'
export { IView, Session }

interface IContentTab {
    bizsrtAdminContentTab;
}

interface IOptionsStoreItems {
    userLogin;
    webSiteOrigin;
    serviceOrigin;
}

export enum PopulateOptions {
    None = 0,
    Store = 1,
    Reset = 2
}

export enum NavigationState {
    Inactive = 0,
    Active = 1,
    Navigating = 2
}

export interface PageModel extends ViewModel {
    Meta?: PageMetadata;
    Token?: any;
    ReflectToken?: (populateParams?: boolean) => void;
    Load: (args?) => void;
}

export class PageMetadata {
    Token;

    set Description(description: string) {
    }

    static setMetaTag(name, value) {
    }
}

export class Page {
    static _page: Page;
    static get Current(): Page {
        return Page._page || function () {
            Page._page = new Page();
            return Page._page;
        }();
    }

    get Token(): any {
        return this._viewModel.Token;
    }

    constructor() {
        //Page.Current = this; -> Page.Current.get
        //Session.User = new Model.Session.User(); -> Session.User.get

        window.onerror = (e: any, file, line) => {
            debugger;
            var message = 'JavaScript error: \t' + Error.getMessage(e);
            if (file) {
                message += '\nFile name:      \t' + file;
                if (line)
                    message += '\nLine number:       \t' + line;
            }
            this.HandleError(message);
            return true;
        };

        window.addEventListener("beforeunload", function () {
            try {
                if (SessionContext.Id) {
                    Session.Exit(function (response) {
                        SessionContext.Id = '';
                    });
                }
            }
            catch (e) {
                console.error(Error.getMessage(e));
            }
        });
    }

    protected _viewModel: PageModel;
    get ViewModel(): PageModel {
        return this._viewModel;
    }
    set ViewModel(viewModel: PageModel) {
        if (!this._viewModel) {
            viewModel.Page = viewModel;
            viewModel.Meta = new PageMetadata();
            viewModel.Token = new Navigation.Token();
                
            this._viewModel = viewModel;
        }
        else
            throw "Page's ViewModel has already been set";
    }

    protected _signIn: Signin.Form;
    Initialize()
    {
        this._viewModel.Initialize();
        this._viewModel.Initialized = true;
        if (this._viewModel.ReflectToken)
            this._viewModel.ReflectToken(true);

        if (!this._signIn) {
            this._signIn = <Signin.Form>this._viewModel.getViewModel('signIn');
            this._signIn.SignInAction.AddHandler((sender, action) => {
                if (action.success) {
                    this._viewModel.Load();
                }
                else if (action.remember) {
                    chrome.storage.sync.set({
                        userLogin: {
                            Name: Session.User.Name,
                            Token: action.remember
                        }
                    });
                }
            });
        }
        chrome.storage.sync.get('userLogin', (storeItems: IOptionsStoreItems) => {
            if (storeItems.userLogin && !Guid.isEmpty(storeItems.userLogin.Token)) {
                SessionService.SignIn_Auto(storeItems.userLogin.Token, (loginResponse) => {
                    if (!loginResponse || loginResponse.Status != SigninStatus.Success) {
                        this._enterSession();
                        this._signIn.Show();
                    }
                    else
                        this._viewModel.Load();
                }, (ex) => {
                    this._enterSession();
                    this._signIn.Show();
                    this._signIn.Invalidate(ex);
                });
            }
            else {
                this._enterSession();
                this._signIn.Show();
            }
        });
    }

    //Password reset and account create require session
    protected _enterSession() {
        if (SessionContext.Id || SessionContext.EnterPromise)
            return;
        SessionContext.EnterPromise = Session.Enter((enterResponse) => {
            try {
                if (SessionContext.EnterPromise) {
                    delete SessionContext.EnterPromise;
                }
                if (enterResponse) {
                    if (!Guid.isEmpty(enterResponse.Token)) {
                        //New session was created
                        if (!Guid.isEmpty(SessionContext.Id) && SessionContext.Id != enterResponse.Token) {
                            debugger;
                            console.warn('Server session ' + SessionContext.Id + ' has been recycled, new session ' + enterResponse.Token);
                            if (Session.User.Id) {
                                console.warn('User obtained from Handoff cookie will be reset');
                                Session.User.Exit();
                            }
                        }
                        else
                            console.log('Entered session ' + enterResponse.Token);

                        SessionContext.Id = enterResponse.Token;
                    }
                    else //if (sessionRequired)
                        throw new SessionException(SessionExceptionType.Unavailable);

                    if (Session.User.Id == 0) {
                        /*TryLoginUser moved to Session.EnterPromise*/
                    }
                    else if (!Guid.isEmpty(enterResponse.Key))
                        Post.Key(enterResponse.Key);
                    else
                        throw new SessionException(SessionExceptionType.NotAuthenticated);
                }
                else
                    throw new SessionException(SessionExceptionType.Unavailable);
            }
            catch (e) {
                console.error('Session handhshake error [1]: ' + Error.getMessage(e));
            }
        }, (ex) => {
            if (ex instanceof OperationException && (<OperationException>ex).Type == OperationExceptionType.InvalidInteraction)
                console.error('Session handhshake error [1]: Server user mismatch, attempting to Recover');
            else
                console.error('Session handhshake error [2]: ' + Error.getMessage(ex)) + ', attempting to Recover';
        });
    }

    HandleError(error, options?) {
        return this._viewModel.HandleError(error, options);
    }

    HandleAjaxError(request, error, handler) {
        error = TranslateFault(request) || request.statusText || error;
        if (!handler || typeof handler !== 'function') {
            this.HandleError(error, {
                ajax: true,
                silent: handler && handler.silent
            });
        }
        else
            handler(error, { ajax: true });
    }

    HandleAction(action: string): boolean {
        return this._viewModel.HandleAction ? this._viewModel.HandleAction(action) : false;
    }

    static notifyContentScript(message) {
        //chrome.tabs.getCurrent not working reliably
        chrome.storage.local.get('bizsrtAdminContentTab', (storeItems: IContentTab) => {
            //https://developer.chrome.com/extensions/messaging
            if (storeItems.bizsrtAdminContentTab)
                chrome.tabs.sendMessage(storeItems.bizsrtAdminContentTab.Id/*tab.openerTabId*/, message); //openerTabId comes back undefined
        });
    }

    static setMenuItem(menuItems, name) {
        switch (name) {
            case "Email":
            case "Name":
            case "Title":
            case "Description":
            case "Phone":
            case "Fax":
            case "Address":
            case "Image":
            case "Image":
                break;
            case "Description1":
                name = "Description";
                break;
            default:
                name = null;
                break;
        }
        if (name) {
            menuItems[name] = {
                isSet: true
            };
        }
    }

    ResponsiveWidth;
    ContentWidth;
    ContentHeight;
}