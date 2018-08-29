import { Action, Get as Get$, Post as Post$ } from '../../service'
import { Category as Category$, Category_List, CategoryLocationSearchInput, Config, List } from '../../model/admin/category'
import { Node, ReflectLocked } from '../../model/foundation'
import { Session } from '../../session'
import { SessionException, SessionExceptionType } from '../../exception'

export namespace Category {
    export function Get(parentCategory: number, lookupCategory: number, callback: Action<Category$[]>, faultCallback) {
        return Get$("/admin/master/category/GetFolders?parentCategory=" + parentCategory + "&lookupCategory=" + lookupCategory + "&admin=" + Session.User.Id, {
            session: true,
            callback: (data) => {
                if (data)
                    Node.DeserializeChildren(data, null);
                callback(data);
            },
            faultCallback: faultCallback
        });
    }

    export function GetList(parentCategory: number | Category$, callback: Action<Category_List[]>, faultCallback) {
        var parentNode: Category$;
        if (typeof parentCategory === "object") {
            parentNode = <Category$>parentCategory;
            parentCategory = parentNode.Id;
        }
        else if (!parentCategory)
            parentCategory = 0;
        return Get$("/admin/master/category/GetList?parentCategory=" + parentCategory + "&admin=" + Session.User.Id, {
            session: true,
            callback: (data) => {
                if (data && data.length) {
                    for (var i = 0, l = data.length; i < l; i++) {
                        ReflectLocked(<any>data[i]);
                        if (parentNode)
                            data[i].Parent = parentNode;
                    }
                }
                callback(data);
            },
            faultCallback: faultCallback
        });
    }

    export function GetBusinesses(queryInput: CategoryLocationSearchInput, callback: Action<List.Filter.QueryOutput>, faultCallback) {
        return Get$("/admin/master/category/GetBusinesses?queryInput=" + JSON.stringify(queryInput) + "&admin=" + Session.User.Id, {
            session: true,
            callback: (data) => {
                if (data.Facets) //Model.Semantic.Facet.deserialize(data.Facets);
                    delete data.Facets;
                callback(data);
            },
            faultCallback: faultCallback
        });
    }

    export function GetProducts(queryInput: CategoryLocationSearchInput, callback: Action<List.Filter.QueryOutput>, faultCallback) {
        return Get$("/admin/master/category/GetProducts?queryInput=" + JSON.stringify(queryInput) + "&admin=" + Session.User.Id, {
            session: true,
            callback: (data) => {
                if (data.Facets) //Model.Semantic.Facet.deserialize(data.Facets);
                    delete data.Facets;
                callback(data);
            },
            faultCallback: faultCallback
        });
    }

    export function GetConfig(category: number, callback: Action<Config>, faultCallback) {
        return Get$("/admin/master/category/GetConfig?category=" + category, {
            callback: callback,
            faultCallback: faultCallback
        });
    }

    export function Save(category: Category$, callback: Action<number>, faultCallback) {
        if (Session.User.SecurityProfile.CanManage_Categories) {
            Post$("/admin/master/category/Save", {
                authorize: true,
                data: {
                    Admin: Session.User.Id,
                    'Category': category
                },
                callback: (data) => {
                    if (data)
                        data.Timestamp = Date.deserialize(data.Timestamp);
                    callback(data.Value);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Move(categories: number[], parentCategory: number, callback: Action<boolean>, faultCallback) {
        if (Session.User.SecurityProfile.CanManage_Categories) {
            Post$("/admin/master/category/Move", {
                authorize: true,
                data: {
                    Admin: Session.User.Id,
                    Categories: categories,
                    ParentCategory: parentCategory
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Delete(category: number | number[], callback: Action<boolean>, faultCallback) {
        if (Session.User.SecurityProfile.CanManage_Categories) {
            var data, method;
            if (typeof category == "number") {
                data = {
                    Admin: Session.User.Id,
                    'Category': category
                }
                method = "Delete";
            }
            else {
                data = {
                    Admin: Session.User.Id,
                    Categories: category
                };
                method = "Delete_Multi";
            }
            Post$("/admin/master/category/" + method, {
                authorize: true,
                data: data,
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }
}