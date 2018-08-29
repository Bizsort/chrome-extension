import { Action, Get as Get$, Post as Post$ } from '../service'
import { DictionaryType, IdName } from '../model'
import { Cache as SessionCache, CacheType as SessionCacheType, Session } from '../session'
import { WebSite as WebSiteSettings } from '../settings'
import { FetchOneCache } from '../session/cache'
import { OperationException, OperationExceptionType } from '../exception'

export namespace Group {
    export function GetPath (url, id, scope, callback, faultCallback) {
        return Get$(url + (scope ? "&scope=" + JSON.stringify(scope) : ''), {
            callback: (data) => {
                if (!data || data.length == 0 || data[data.length - 1].Id != id)
                    throw 'Returned sequence does not contain item ' + id;
                if (scope && scope.Name) {
                    if (data[0].Id == scope.Id)
                        data[0].Name = scope.Name;
                    else
                        throw 'Returned sequence does not contain the scope item ' + scope.Id;
                }
                callback(data);
            },
            faultCallback: faultCallback
        });
    }
}

export namespace Dictionary {
    interface CachedDictionary {
        Type: DictionaryType;
        Items: Object[]
    }

    class cache extends FetchOneCache<CachedDictionary>{
        constructor() {
            super(SessionCacheType.MasterDictionary);
            this.IsUserSpecific = false;
            this.ItemKey = "Type";
        }

        fetch(key, callback, faultCallback) {
            return Get$("/master/dictionary/Get?type=" + key, {
                callback: (dictionary) => {
                    callback({ Type: key, Items: dictionary.Items });
                },
                faultCallback: faultCallback
            });
        }

        Get(key: DictionaryType, callback: Action<Object[]>) {
            super.GetItem(key, (dictionary) => {
                callback(dictionary.Items);
            });
        }

        Serialize(items) {
            return JSON.stringify(items.map((item) => {
                return { Type: item.Type, Items: item.Items };
            }));
        }
    };

    let Cache: cache = SessionCache.Get(SessionCacheType.MasterDictionary, (type) => {
        return new cache();
    });

    export function Get<T>(type, callback: Action<T[]>) {
        return Cache.Get(type, callback);
    }
}

export namespace Account {
    class userCache extends FetchOneCache<IdName>{
        constructor () {
            super(SessionCacheType.UserName);
            this.IsUserSpecific = false;
            this.ItemKey = "Id";
        }

        fetch(user: number, callback: Action<IdName>, faultCallback) {
            return Get$("/master/account/GetName?user=" + user, {
                callback: (name) => {
                    callback({ Id: user, Name: name });
                },
                faultCallback: faultCallback
            });
        }

        Serialize(items) {
            return JSON.stringify(items.map((item) => {
                return { Id: item.Id, Name: item.Name };
            }));
        }
    }
    let UserCache: userCache = SessionCache.Get(SessionCacheType.UserName, (type) => {
        return new userCache();
    });

    export function GetName(user: number, callback: Action<IdName>) {
        return UserCache.GetItem(user, callback);
    }

    export function RequestPasswordReset(email: string, service: string, callback, faultCallback) {
        if (Session.User.Id == 0 && email) {
            Post$('/process/account/RequestPasswordReset', {
                data: {
                    Email: email,
                    Service: service || WebSiteSettings.Origin.Host
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new OperationException(OperationExceptionType.Invalid);
    }

    export function SendPin(email: string, resend: boolean, reCaptcha: string, service: string, callback, faultCallback) {
        if (Session.User.Id == 0) {
            var data = <any>{
                Email: email,
                SecurityCode: reCaptcha,
                Service: service || WebSiteSettings.Origin.Host
            };
            if (resend)
                data.Resend = true;
            Post$('/process/account/SendPin', {
                data: data,
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new OperationException(OperationExceptionType.Invalid);
    }

    export function ValidatePin(email: string, securityCode: number, callback, faultCallback) {
        if (Session.User.Id == 0) {
            Post$('/process/account/ValidatePin', {
                data: {
                    Email: email,
                    SecurityCode: securityCode
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new OperationException(OperationExceptionType.Invalid);
    }

    export function Create(email: string, password: string, name: string, location: string/*address*/, securityCode: string | number, service: string, callback, faultCallback) {
        if (Session.User.Id == 0) {
            var method;
            if (typeof securityCode == "string")
                method = "Create_Captcha";
            else if (typeof securityCode == "number") 
                method = "Create_Pin";
            else
                throw new OperationException(OperationExceptionType.Invalid);
            Post$('/process/account/' + method, {
                data: {
                    Email: email,
                    Password: password,
                    Name: name,
                    Location: location, //Address: address
                    SecurityCode: securityCode,
                    Service: service || WebSiteSettings.Origin.Host
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new OperationException(OperationExceptionType.Invalid);
    }
}