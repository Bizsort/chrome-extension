import { Error, Guid } from '../system'
import { Post } from '../service'
import { Geocoder, ServiceProvider } from '../model'
import { Cache, Context, Session as Session$, SigninFlags, SigninStatus } from '../session'
import { Page } from '../page'
import { OperationException, OperationExceptionType, SessionException, SessionExceptionType } from '../exception'
export { ServiceProvider, SigninFlags, SigninStatus, SessionException, SessionExceptionType }

export namespace Session {
    export function Enter(callback, faultCallback) {
        return Post('/master/session/Enter', {
            data: {
                User: Session$.User.Id
            },
            //withCredentials: true, //Transmit the session cookie
            callback: (response) => {
                if (response) {
                    if (response.Token && response.Token.length > 0) {
                        response.Token = Guid.Deserialize(response.Token);
                    }

                    if (response.Key && response.Key.length > 0)
                        response.Key = Guid.Deserialize(response.Key);
                }

                callback(response);
            },
            faultCallback: faultCallback
        });
    }

    export function Exit (callback) {
        try {
            Post('/master/session/Exit', {
                async: false, //called from window.unload (IE and FF seem fine without it but not Chrome)
                //authorize: true, //Consistent with SL app, which won't send the key
                data: {
                    User: Session$.User.Id
                },
                callback: callback
            });
        }
        catch (e) {
            console.error(Error.getMessage(e));
        }

        Cache.Reset(true);
    }

    export function signIn(loginResponse) {
        if (loginResponse && loginResponse.Status == SigninStatus.Success && loginResponse.User) {
            Cache.Reset();
            Page.Current.Token.Reset(true); //hold on to the forward step
            
            if (loginResponse.Token && loginResponse.Token.length > 0) {
                loginResponse.Token = Guid.Deserialize(loginResponse.Token);
            }
            if (Context.Id != loginResponse.Token)
                Context.Id = loginResponse.Token;
            if (loginResponse.Key && loginResponse.Key.length > 0) {
                Post.Key(Guid.Deserialize(loginResponse.Key));
            }
            else
                throw new SessionException(SessionExceptionType.NotAuthenticated);
            Session$.User.Enter(loginResponse.User); //May trigger calls to admin endpoints
        }
        else
            Session$.User.Exit();

        if (loginResponse && Session$.User)
            delete loginResponse.User;
        return loginResponse;
    }

    export function SignIn (email, password, callback, faultCallback?) {
        if (Session$.User.Id == 0 && email && password) {
            Post('/master/session/UserLogin', {
                secure: true,
                data: {
                    Email: email,
                    Password: password
                },
                callback: (loginResponse) => {
                    callback(Session.signIn(loginResponse));
                },
                faultCallback: (error) => {
                    Session$.User.Exit();
                    if (faultCallback)
                        faultCallback(error);
                }
            });
        }
        else
            faultCallback(new OperationException(OperationExceptionType.Invalid));
    }

    export function SignIn_Auto (token, callback, faultCallback?) {
        if (Session$.User.Id == 0) {
            return Post('/master/session/UserLogin_Auto', {
                secure: true,
                data: {
                    Token: token
                },
                callback: (loginResponse) => {
                    callback(Session.signIn(loginResponse));
                },
                faultCallback: (error) => {
                    Session$.User.Exit();
                    if (faultCallback)
                        faultCallback(error);
                }
            });
        }
        else
            callback(null);
    }

    export function SignIn_External(provider: ServiceProvider, providerId: string, accessToken: string, location: Geocoder.Geolocation, callback, faultCallback) {
        if (Session$.User.Id == 0) {
            var data: any = {
                Provider: provider,
                PproviderId: providerId,
                AccessToken: accessToken
            };
            if (location)
                data.Location = location;
            Post('/master/session/UserLogin_External', {
                secure: true,
                data: data,
                callback: (loginResponse) => {
                    callback(Session.signIn(loginResponse));
                },
                faultCallback: (error) => {
                    Session$.User.Exit();
                    if (faultCallback)
                        faultCallback(error);
                }
            });
        }
        else
            faultCallback(new OperationException(OperationExceptionType.Invalid));
    }

    export function Remember(callback) {
        if (Session$.User.Id > 0) {
            Post('/master/session/Remember', {
                authorize: true,
                data: {
                    User: Session$.User.Id,
                    Business: Session$.User.Business.Id
                },
                callback: callback
            });
        }
        else
            callback();
    }

    export function SignOut () {
        var user = Session$.User.Id;
        Session$.User.Exit();
        Page.Current.Token.Reset(false);
        var logout = () => {
            Post.Key();
        }
        if (user > 0) {
            var data: any = {
                User: user
            };
            if (Session$.User.AutoSignin && Session$.User.AutoSigninToken)
                data.Forget = Session$.User.AutoSigninToken;
            Post('/master/session/Logout', {
                authorize: true,
                data: data,
                callback: logout,
                faultCallback: logout
            });
        }
        else
            logout();
        //if (User.AutoLogin != AutoLoginType.None && user > 0) {
        //    Post('/master/session/Forget', {
        //        data: {
        //            User: user
        //        }
        //    });
        //}
    }
}