import { IdName, ResolvedLocation } from '../model'
import { Autocomplete, Node, NodeRef, SubType } from '../model/foundation'
import { Group } from '../service/master'
import { Action, Get as Get$, Post as Post$, Page } from '../service'
import { Shell } from '../navigation'

export function Autocomplete(parent: number, name: string, scope: IdName, callback: Action<Autocomplete[]>, faultCallback) {
    return Get$("/master/category/Autocomplete?parent=" + parent + "&name=" + name + (scope ? "&scope=" + JSON.stringify(scope) : ''), {
        callback: callback,
        faultCallback: faultCallback
    });
}

export function Get(category, ...args) {
    var callback, faultCallback;
    if (arguments.length >= 2) {
        if (typeof arguments[1] == 'number' && typeof arguments[2] == "function") {
            var type = arguments[1];
            callback = arguments[2];
            if (arguments.length == 4)
                faultCallback = arguments[3];
            return Get$("/master/category/Get_Ref?category=" + category + "&type=" + type, { callback: callback, faultCallback: faultCallback });
        }
        else if (typeof arguments[1] == "function") {
            callback = arguments[1];
            if (arguments.length == 3)
                faultCallback = arguments[2];
            return Get$("/master/category/Get?category=" + category, { callback: callback, faultCallback: faultCallback });
        }
    }
}

export function PopulateWithChildren(parent: number, type: SubType, memberType: number, callback: Action<Node>, faultCallback) {
    var token = this._token;
    return Get$("/master/category/PopulateWithChildren?parent=" + parent + "&type=" + type + "&memberType=" + memberType, {
        callback: (data) => {
            if (data) {
                var token = Page.Current.Token.Clone;
                Node.Deserialize(data, {}, {
                    navToken: (category) => {
                        token.CategoryId = category.Id;
                        return Shell.Href(token);
                    }
                });
            }
            callback(data);
        },
        faultCallback: faultCallback
    });
}

export function GetChildren(parentCategory: number, lookupCategory: number, callback: Action<NodeRef[]>, faultCallback?) {
    return Get$("/master/category/GetChildren?parentCategory=" + parentCategory + "&lookupCategory=" + lookupCategory, {
        session: true,
        callback: (data) => {
            if (data) {
                var token = Page.Current.Token.Clone;
                Node.DeserializeChildren(data, null, {
                    populate: function () { },
                    navToken: (category) => {
                        token.CategoryId = category.Id;
                        token.EntityName = category.Name;
                        return Shell.Href(token);
                    }
                });
            }
            callback(data);
        },
        faultCallback: faultCallback
    });
}

export function GetPath(category: number, scope: IdName, callback: Action</*Group.*/IdName[]>, faultCallback) {
    return Group.GetPath("/master/category/GetPath?category=" + category, category, scope, callback, faultCallback);
}