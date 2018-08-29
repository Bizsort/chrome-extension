import { Action, Get as Get$, Post as Post$ } from '../../service'
import { Guid } from '../../system'
import { Geocoder, CachedImage, ImageType, ImageSize, List, Semantic } from '../../model'
import { ValueTimestamp } from '../../model/admin'
import { EntityEdit } from '../../model/admin/personal'
import { Attributes as BusinessAttributes, Affiliation as BusinessAffiliation, Category as Category$, EntityEdit as BusinessEntityEdit, Enrichment as BusinessEnrichment, EntitySave as BusinessEntitySave, Member as Member$, MultiProduct, Office as BusinessOffice, OfficeCollection, Profile as BusinessProfile, Product as BusinessProduct, PWAProfile as BusinessPWAProfile } from '../../model/admin/business'
import { Category as CachedCategory, Preview as BusinessPreview, SearchInput, SearchItem, SearchOutput } from '../../model/business'
import { Cache as SessionCache, CacheType as SessionCacheType, Session } from '../../session'
import { TreeCache } from '../../session/cache'
import { Cache as ImageCache } from '../../service/image'
import { ArgumentException, ArgumentExceptionType, DataException, DataExceptionType, SessionException, SessionExceptionType } from '../../exception'
import { Business as BusinessNavigation } from '../../navigation'
export { BusinessEntityEdit as EntityEdit, BusinessEnrichment as Enrichment, BusinessPWAProfile as PWAProfile, BusinessAttributes as Attributes }

export function Edit(business: string | number, suppressNotFound: boolean, callback: Action<EntityEdit<BusinessProfile>>, faultCallback) {
    if (Session.User.Id > 0 && business) {
        var data, method;
        if (typeof business == "string") {
            data = {
                Business: Session.User.Business.Id,
                WebSite: business,
                Admin: Session.User.Id
            }
            if (suppressNotFound)
                data.SuppressNotFound = suppressNotFound;
            method = "Edit_Web";
        }
        else {
            data = {
                Business: business,
                Admin: Session.User.Id
            };
            method = "Edit";
        }
        Post$("/admin/business/profile/" + method, {
            authorize: true,
            data: data,
            callback: (data) => {
                var business: BusinessProfile;
                if (data && data.Entity) {
                    business = new BusinessProfile(data.Entity);
                    business.Updated = Date.deserialize(<string>business.Updated);
                    data.Entity = business;
                    if (data.SignedIn)
                        data.SignedIn = Date.deserialize(data.SignedIn);
                }
                callback(data);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.NotAuthenticated);
}

export function Save(account: EntityEdit<BusinessProfile>, newImages, callback, faultCallback) {
    if (Session.User.Id && (account.Entity.Id == Session.User.Business.Id // && account.Id == Session.User.Id
        || (!account.Entity.Id && Session.User.SecurityProfile.CanProduce_Business)
        || (account.Entity.Id && (Session.User.SecurityProfile.CanEdit_All || account.Entity.CreatedBy == Session.User.Id)))) {
        var business = Object.mixin({}, account.Entity);
        business.Images = {
            Entity: account.Entity.Images.Entity,
            Refs: account.Entity.Images.Refs.map((ir) => {
                var imageRef: any = {
                    Token: ir.Token ? ir.Token : Guid.Empty
                };
                if (ir.Id)
                    imageRef.Id = ir.Id;
                if (ir.IsOwned)
                    imageRef.IsOwned = true;
                if (ir.IsDefault)
                    imageRef.IsDefault = true;
                return imageRef;
            }),
            Deleted: account.Entity.Images.Deleted
        };
        if (account.Entity.Affiliations) {
            business.Affiliations = {
                Refs: account.Entity.Affiliations.Refs.map((ba) => {
                    return {
                        Id: ba.Id,
                        Business: {
                            Id: ba.Business.Id
                        }
                    };
                }),
                Deleted: account.Entity.Affiliations.Deleted
            };
        }
        if (business.HeadOffice)
            delete business.HeadOffice;
        if (business.EditOffice)
            delete business.EditOffice;
        if (account.Entity.Updated)
            business.Updated = Date.serialize(<Date>account.Entity.Updated);
        var accountBusiness = <any>{
            Id: account.Id,
            Entity: business
        };
        if (!account.Id)
            accountBusiness.Email = account.Email || business.Email;
        Post$("/admin/business/profile/Save", {
            authorize: true,
            data: {
                AccountBusiness: accountBusiness,
                Images: newImages,
                Admin: Session.User.Id
            },
            callback: (business) => {
                business.Timestamp = Date.deserialize(business.Timestamp);
                callback(business);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function Delete(business, callback, faultCallback) {
    if (Session.User.Id > 0 && business &&
        (business.Id == Session.User.Business.Id || business.CreatedBy == Session.User.Id || Session.User.SecurityProfile.CanReview_Staff)) {
        business.Timestamp = Date.serialize(business.Timestamp);
        delete business.CreatedBy;
        Post$('/admin/business/profile/Delete', {
            authorize: true,
            data: {
                Business: business,
                Admin: Session.User.Id,
            },
            callback: callback,
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function EditMultiProduct(business: string | number, product: number, suppressNotFound: boolean, callback: Action<BusinessEntityEdit<MultiProduct>>, faultCallback) {
    if (Session.User.Id > 0 && business) {
        var data, method;
        if (typeof business == "string") {
            data = {
                Business: Session.User.Business.Id,
                WebSite: business,
                Product: product || 0,
                Admin: Session.User.Id
            }
            method = "EditMultiProduct_Web";
        }
        else {
            data = {
                Business: business,
                Product: product || 0,
                Admin: Session.User.Id
            };
            method = "EditMultiProduct";
        }
        if (suppressNotFound)
            data.SuppressNotFound = suppressNotFound;
        Post$("/admin/business/profile/" + method, {
            authorize: true,
            data: data,
            callback: (data) => {
                if (data && data.Entity)
                    data.Entity.Updated = Date.deserialize(data.Entity.Updated);
                callback(data);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.NotAuthenticated);
}

export function SaveMultiProduct(business: BusinessEntityEdit<MultiProduct>, callback, faultCallback) {
    if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
        || (!business.Entity.Id && Session.User.SecurityProfile.CanProduce_Product)
        || (business.Entity.Id && (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id)))) {
        var product = Object.mixin({}, business.Entity);
        if (business.Entity.Updated)
            product.Updated = Date.serialize(<Date>business.Entity.Updated);
        Post$("/admin/business/profile/SaveMultiProduct", {
            authorize: true,
            data: {
                BusinessProduct: {
                    Id: business.Id,
                    Category: business.Category,
                    CreatedBy: business.CreatedBy,
                    Entity: product
                },
                Admin: Session.User.Id
            },
            callback: (product) => {
                product.Timestamp = Date.deserialize(product.Timestamp);
                callback(product);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function DeleteMultiProduct(business, product, callback, faultCallback) {
    if (Session.User.Id && business &&
        (business == Session.User.Business.Id || Session.User.SecurityProfile.CanReview_Staff)) {
        var product_ = Object.mixin({}, product);
        if (product_.Timestamp)
            product_.Timestamp = Date.serialize(product.Timestamp);
        Post$("/admin/business/profile/DeleteMultiProduct", {
            authorize: true,
            data: {
                Business: business,
                Product: product_,
                Admin: Session.User.Id
            },
            callback: (product) => {
                callback(product);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function GetProducts(business: number, queryInput: List.Filter.QueryInput, callback: Action<List.Filter.QueryOutput>, faultCallback) {
    if (Session.User.Id > 0 && business) {
        return Post$("/admin/business/profile/GetProducts", {
            authorize: true,
            data: {
                Business: business,
                QueryInput: queryInput,
                Admin: Session.User.Id
            },
            callback: (data) => {
                if (data.Facets) //Model.Semantic.Facet.deserialize(data.Facets);
                    delete data.Facets;
                callback(data);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.NotAuthenticated);
}

export function NewlyPosted(queryInput: SearchInput, callback: Action<SearchOutput>, faultCallback) {
    if (Session.User.Id > 0 && Session.User.SecurityProfile.CanProduce_Business) {
        Post$("/admin/business/profile/NewlyPosted", {
            //authorize: true,
            data: {
                Admin: Session.User.Id,
                QueryInput: queryInput
            },
            callback: (data) => {
                if (data.Facets)
                    Semantic.Facet.Deserialize(data.Facets);
                callback(data);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function ToPreview(businesses: SearchItem[], properties: string[], imageSize: ImageSize, callback: Action<BusinessPreview[]>, faultCallback) {
    if (Session.User.Id > 0) {
        var data = {
            Admin: Session.User.Id,
            Businesses: businesses
        };
        if (properties && properties.length)
            data['Properties'] = properties;
        return Post$("/admin/business/profile/ToPreview", {
            data: data,
            callback: (data) => {
                var business: BusinessPreview, admin;
                for (var i = 0, l = data.length; i < l; i++) {
                    business = new BusinessPreview(data[i], imageSize);
                    admin = business["Admin"];
                    if (admin && admin.Timestamp)
                        admin.Timestamp = Date.deserialize(admin.Timestamp);
                    data[i] = business;
                    data[i].NavToken = BusinessNavigation.ProfileView(business.Id, {
                        entityName: business.Name,
                        suppressNavigate: true
                    });
                    data[i].ProductsNavToken = BusinessNavigation.ViewProducts(business, {
                        entityName: business.Name,
                        suppressNavigate: true
                    });
                }
                callback(data);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.NotAuthenticated);
}

export function SetCategory(business: number | number[], category: number, callback: Action<boolean>, faultCallback) {
    if (Session.User.Id && (Session.User.SecurityProfile.CanProduce_Product || Session.User.SecurityProfile.CanEdit_All)) {
        var method, data = {
            Admin: Session.User.Id,
            Category: category
        };
        if (typeof business == "number") {
            method = "SetCategory";
            data["Business"] = business;
        }
        else {
            method = "SetCategory_Multi";
            data["Businesses"] = business;
        }
        Post$("/admin/business/profile/" + method, {
            authorize: true,
            data: data,
            callback: callback,
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function EditAttributes(business: number, attributes: string[], callback: Action<BusinessEntityEdit<BusinessAttributes>>, faultCallback) {
    if (Session.User.Id > 0 && business) {
        Post$("/admin/business/profile/EditAttributes", {
            authorize: true,
            data: {
                Business: business,
                Attributes: attributes,
                Admin: Session.User.Id
            },
            callback: (businessAttributes) => {
                if (businessAttributes && businessAttributes.Entity)
                    businessAttributes.Entity = new BusinessAttributes(businessAttributes.Entity);
                callback(businessAttributes);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function SaveAttributes(business: BusinessEntitySave<BusinessAttributes>, callback, faultCallback) {
    if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id || Session.User.SecurityProfile.CanEdit_All)) {
        var attributes = {
            Properties: []
        };
        for (var name in business.Entity) {
            switch (name) {
                case 'VisitorForm':
                    attributes.Properties.push({ "Key": name, "Value": business.Entity[name] });
            }
        }
        Post$("/admin/business/profile/SaveAttributes", {
            authorize: true,
            data: {
                BusinessAttributes: {
                    Id: business.Id,
                    Entity: attributes
                },
                Admin: Session.User.Id
            },
            callback: callback,
            faultCallback: faultCallback
        });
    }
}

export function EditPWAProfile(business: number, callback: Action<BusinessEntityEdit<BusinessPWAProfile>>, faultCallback) {
    if (Session.User.Id > 0 && business) {
        Post$("/admin/business/profile/EditPWAProfile", {
            authorize: true,
            data: {
                Business: business,
                Admin: Session.User.Id
            },
            callback: (businessPWAProfile) => {
                if (businessPWAProfile && businessPWAProfile.Entity)
                    businessPWAProfile.Entity = new BusinessPWAProfile(businessPWAProfile.Entity);
                callback(businessPWAProfile);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function SavePWAProfile(business: BusinessEntitySave<BusinessPWAProfile>, callback, faultCallback) {
    if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id || Session.User.SecurityProfile.CanEdit_All)) {
        var pwaProfile = <BusinessPWAProfile>Object.mixin({}, business.Entity);
        if (!pwaProfile.Icon512)
            throw new ArgumentException(ArgumentExceptionType.ValueRequired, "Icon");
        var serializeImage = (image: CachedImage) => {
            var type;
            switch (image.Type) {
                case ImageType.Jpeg:
                    type = 'jpg';
                    break;
                case ImageType.Png:
                    type = 'png';
                    break;
                case ImageType.Gif:
                    type = 'gif';
                    break;
                default:
                    throw 'Unexpected image type';
            }
            return type && {
                Content_Base64: image.Content.split(",")[1],
                Type: type
            }
        }
        if (pwaProfile.Icon512.Token)
            pwaProfile.Icon512 = ImageCache.GetOne(pwaProfile.Icon512.Token, serializeImage)
        else if (pwaProfile.Icon512)
            delete pwaProfile.Icon512;
        if (pwaProfile.Icon192 && pwaProfile.Icon192.Token)
            pwaProfile.Icon192 = ImageCache.GetOne(pwaProfile.Icon192.Token, serializeImage)
        else if (pwaProfile.Icon192)
            delete pwaProfile.Icon192;
        Post$("/admin/business/profile/SavePWAProfile", {
            authorize: true,
            data: {
                BusinessPWAProfile: {
                    Id: business.Id,
                    Entity: pwaProfile
                },
                Admin: Session.User.Id
            },
            callback: callback,
            faultCallback: faultCallback
        });
    }
}

export function EditEnrichment(business: number, callback: Action<BusinessEnrichment>, faultCallback) {
    if (Session.User.Id > 0 && business) {
        Post$("/admin/business/profile/EditEnrichment", {
            authorize: true,
            data: {
                Business: business,
                User: Session.User.Id
            },
            callback: (businessEnrichment) => {
                businessEnrichment = new BusinessEnrichment(businessEnrichment);
                callback(businessEnrichment);
            },
            faultCallback: faultCallback
        });
    }
    else
        throw new SessionException(SessionExceptionType.Unauthorized);
}

export function SaveEnrichment(businessEnrichment: BusinessEnrichment, callback, faultCallback) {
    if (Session.User.Id && businessEnrichment.Business) {
        businessEnrichment = Object.mixin({}, businessEnrichment);
        Post$("/admin/business/profile/SaveEnrichment", {
            authorize: true,
            data: {
                BusinessEnrichment: businessEnrichment,
                User: Session.User.Id
            },
            callback: callback,
            faultCallback: faultCallback
        });
    }
}

export namespace Product {
    export function Edit(business: number, product: string | number, suppressNotFound: boolean, callback: Action<BusinessEntityEdit<BusinessProduct.Profile>>, faultCallback) {
        if (Session.User.Id > 0 && (product || suppressNotFound)) { //business can be 0 (admin without a Business profile)
            var data, method;
            if (typeof product == "string") {
                data = {
                    Business: business,
                    WebUrl: product,
                    Admin: Session.User.Id
                }
                method = "Edit_Web";
            }
            else {
                data = {
                    Business: business,
                    Admin: Session.User.Id
                };
                if (product)
                    data.Product = product;
                method = "Edit";
            }
            if (suppressNotFound)
                data.SuppressNotFound = suppressNotFound;
            Post$("/admin/business/product/" + method, {
                authorize: true,
                data: data,
                callback: (data) => {
                    if (data && data.Entity) {
                        var product = new BusinessProduct.Profile(data.Entity);
                        product.Updated = Date.deserialize(<string>product.Updated);
                        product.Master.Updated = Date.deserialize(<string>product.Master.Updated);
                        data.Entity = product;
                    }
                    callback(data);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.NotAuthenticated);
    }

    export function Save(business: BusinessEntityEdit<BusinessProduct.Profile>, newImages, callback, faultCallback) {
        if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
            || (!business.Entity.Id && Session.User.SecurityProfile.CanProduce_Product)
            || (business.Entity.Id && (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id || business.Entity.CreatedBy == Session.User.Id)))) {
            var product = Object.mixin({}, business.Entity);
            product.Master = Object.mixin({}, business.Entity.Master);
            product.Images = {
                Entity: business.Entity.Images.Entity,
                Refs: business.Entity.Images.Refs.map((ir) => {
                    var imageRef: any = {
                        Token: ir.Token ? ir.Token : Guid.Empty
                    };
                    if (ir.Id)
                        imageRef.Id = ir.Id;
                    if (ir.IsOwned)
                        imageRef.IsOwned = true;
                    if (ir.IsDefault)
                        imageRef.IsDefault = true;
                    return imageRef;
                }),
                Deleted: business.Entity.Images.Deleted
            };
            if (business.Entity.Updated)
                product.Updated = Date.serialize(<Date>business.Entity.Updated);
            if (business.Entity.Master.Updated)
                product.Master.Updated = Date.serialize(<Date>business.Entity.Master.Updated);

            Post$("/process/business/product/Save_Web", {
                authorize: true,
                data: {
                    BusinessProduct: {
                        Id: business.Id,
                        CreatedBy: business.CreatedBy,
                        Entity: product
                    },
                    Images: newImages,
                    Admin: Session.User.Id
                },
                callback: (product) => {
                    product.Timestamp = Date.deserialize(product.Timestamp);
                    callback(product);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Delete(business: number, product, masterTimestamp, callback, faultCallback) {
        if (Session.User.Id > 0 && business &&
            (business == Session.User.Business.Id || product.CreatedBy == Session.User.Id || Session.User.SecurityProfile.CanReview_Staff)) {
            product.Timestamp = Date.serialize(product.Timestamp);
            delete product.CreatedBy;
            Post$('/admin/business/product/Delete', {
                authorize: true,
                data: {
                    Business: business,
                    Product: product,
                    MasterTimestamp: Date.serialize(masterTimestamp),
                    Admin: Session.User.Id,
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }
}

export namespace Affiliation {
    export function ToPreview(business: number, affiliation: string | BusinessAffiliation.Preview[], suppressNotFound: boolean, imageSize: ImageSize, callback: Action<BusinessPreview>, faultCallback) {
        if (Session.User.Id > 0) {
            var data, method;
            if (typeof affiliation == "string") {
                data = {
                    Business: business,
                    Affiliation: affiliation,
                    Admin: Session.User.Id
                };
                method = "ToPreview_Web";
            }
            if (suppressNotFound)
                data.SuppressNotFound = suppressNotFound;
            return Post$("/admin/business/affiliation/" + method, {
                authorize: true,
                data: data,
                callback: (data) => {
                    var business: BusinessPreview;
                    if (data) {
                        business = new BusinessPreview(data, imageSize);
                        data = business;
                    }
                    callback(data);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.NotAuthenticated);
    }

    export function Edit(business: number, callback: Action<BusinessEntityEdit<BusinessAffiliation.Collection>>, faultCallback) {
        if (Session.User.Id > 0 && business) {
            Post$("/admin/business/affiliation/Edit", {
                authorize: true,
                data: {
                    Business: business,
                    Admin: Session.User.Id
                },
                callback: (businessOffices) => {
                    businessOffices.Entity.Refs.forEach(office => office.Location = new Geocoder.Location(office.Location));
                    callback(businessOffices);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.NotAuthenticated);
    }

    export function Save(business: BusinessEntitySave<BusinessAffiliation.Collection>, callback, faultCallback) {
        if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
            || (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id))) {
            var affiliations = Object.mixin({}, business.Entity);
            Post$("/admin/business/affiliation/Save", {
                authorize: true,
                data: {
                    BusinessAffiliations: {
                        Id: business.Id,
                        CreatedBy: business.CreatedBy,
                        Entity: affiliations
                    },
                    Admin: Session.User.Id
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Delete(business: BusinessEntitySave<number[]>, callback: Action<boolean>, faultCallback) {
        if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
            || (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id))) {
            Post$("/admin/business/affiliation/Delete", {
                authorize: true,
                data: {
                    BusinessAffiliations: business,
                    Admin: Session.User.Id
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }
}

export namespace Office {
    export function BulkEdit(business: string | number, callback: Action<BusinessEntityEdit<OfficeCollection>>, faultCallback) {
        if (Session.User.Id > 0 && business) {
            var data, method;
            if (typeof business == "string") {
                data = {
                    Business: Session.User.Business.Id,
                    WebSite: business,
                    Admin: Session.User.Id
                }
                method = "BulkEdit_Web";
            }
            else {
                data = {
                    Business: business,
                    Admin: Session.User.Id
                };
                method = "BulkEdit";
            }
            Post$("/admin/business/office/" + method, {
                authorize: true,
                data: data,
                callback: (businessOffices) => {
                    businessOffices.Entity.Refs.forEach(office => office.Location = new Geocoder.Location(office.Location));
                    callback(businessOffices);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.NotAuthenticated);
    }

    export function BulkSave(business: BusinessEntitySave<OfficeCollection>, callback, faultCallback) {
        if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
            || (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id))) {
            var offices = Object.mixin({}, business.Entity);
            Post$("/admin/business/office/BulkSave", {
                authorize: true,
                data: {
                    BusinessOffices: {
                        Id: business.Id,
                        CreatedBy: business.CreatedBy,
                        Entity: offices
                    },
                    Admin: Session.User.Id
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Save(business: BusinessEntitySave<BusinessOffice[]>, callback, faultCallback) {
        if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
            || (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id))) {
            var offices = business.Entity.map(bo => {
                return {
                    Id: bo.Id,
                    Name: bo.Name,
                    Address: bo.Address,
                    Phone: bo.Phone,
                    Phone1: bo.Phone1,
                    Fax: bo.Fax
                };
            });
            Post$("/admin/business/office/Save", {
                authorize: true,
                data: {
                    BusinessOffices: {
                        Id: business.Id,
                        CreatedBy: business.CreatedBy,
                        Entity: offices
                    },
                    Admin: Session.User.Id
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function MergeNew(business: BusinessEntitySave<BusinessOffice>, callback: Action<BusinessOffice>, faultCallback) {
        if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
            || (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id))) {
            var office = Object.mixin({}, business.Entity);
            Post$("/admin/business/office/Merge", {
                authorize: true,
                data: {
                    BusinessOffice: {
                        Id: business.Id,
                        CreatedBy: business.CreatedBy,
                        Entity: office
                    },
                    Admin: Session.User.Id
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Delete(business: BusinessEntitySave<number[]>, callback: Action<boolean>, faultCallback) {
        if (Session.User.Id && business.Id && (business.Id == Session.User.Business.Id
            || (Session.User.SecurityProfile.CanEdit_All || business.CreatedBy == Session.User.Id))) {
            Post$("/admin/business/office/Delete", {
                authorize: true,
                data: {
                    BusinessOffice: business,
                    Admin: Session.User.Id
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }
}

export namespace Category {
    class cache extends TreeCache<CachedCategory> {
        constructor() {
            super(SessionCacheType.BusinessCategory);
            this.IsBusinessSpecific = true;
            this.ItemKey = "Id";
        }

        fetch(callback, faultCallback) {
            return Post$("/admin/business/category/Get", {
                data: {
                    User: Session.User.Id,
                    Business: Session.User.Business.Id
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }

        Serialize(items: CachedCategory[]) {
            return JSON.stringify(items.map(item => {
                return {
                    ParentId: item.ParentId,
                    Id: item.Id,
                    Name: item.Name,
                    //HasChildren: item.HasChildren
                };
            }));
        }
    };

    let Cache: cache = SessionCache.Get(SessionCacheType.BusinessCategory, (type) => {
        return new cache();
    });

    export function GetCategories(parentCategory: number, callback: Action<CachedCategory[]>) {
        Cache.GetChildren(parentCategory, callback);
    }

    export function Get(category: number, callback: Action<CachedCategory>) {
        Cache.GetItem(category, callback);
    }

    export function Exists(name: string, id: number, callback: Action<boolean>) {
        Cache.Exists(name, id, callback);
    }

    export function Create(category: Category$, callback: Action<number>, faultCallback) {
        if (category.Id == 0 && category.Name) {
            if (Session.User.Id > 0 && Session.User.Business.Id > 0) {
                Cache.Exists(category.Name, 0, (exists) => {
                    if (!exists) {
                        Post$("/admin/business/category/Save", {
                            authorize: true,
                            data: {
                                User: Session.User.Id,
                                Business: Session.User.Business.Id,
                                Category: category
                            },
                            callback: (data) => {
                                if (data.Value > 0) {
                                    data.Timestamp = Date.deserialize(data.Timestamp);
                                    //Cache.Add(<CachedCategory>{ ParentId: category.Parent, Id: data.Value, Name: category.Name });
                                    Cache.Reset();
                                }
                                callback(data.Value);
                            },
                            faultCallback: faultCallback
                        });
                    }
                    else
                        faultCallback(new DataException(DataExceptionType.DuplicateRecord));
                });
            }
            else
                throw new SessionException(SessionExceptionType.Unauthorized);
        }
        else
            throw new ArgumentException(ArgumentExceptionType.Invalid, "category");
    }

    export function Update(category: Category$, callback: Action<boolean>, faultCallback) {
        if (category.Id > 0 && category.Name) {
            if (Session.User.Id > 0 && Session.User.Business.Id > 0) {
                Cache.GetItems((categories) => {
                    var cachedCategory = Cache.GetItemInner(categories, category.Id);
                    if (cachedCategory != null) {
                        if (!Cache.Exists(category.Name, category.Id/*0 - allow for Locked change*/, categories)) {
                            Post$("/admin/business/category/Save", {
                                authorize: true,
                                data: {
                                    User: Session.User.Id,
                                    Business: Session.User.Business.Id,
                                    Category: category
                                },
                                callback: (result: ValueTimestamp) => {
                                    if (result != null && result.Value == category.Id) {
                                        /*Name is not getting reflected in the folder tree
                                        dom-repeat in treelist-items does not notify treelist-item
                                        cachedCategory.Name = category.Name;*/
                                        Cache.Reset();
                                        callback(true);
                                    }
                                    else
                                        callback(false);
                                },
                                faultCallback: faultCallback
                            });
                        }
                        else
                            faultCallback(new DataException(DataExceptionType.DuplicateRecord));
                    }
                    else
                        faultCallback(new DataException(DataExceptionType.RecordNotFound));
                });
            }
            else
                throw new SessionException(SessionExceptionType.Unauthorized);
        }
        else
            throw new ArgumentException(ArgumentExceptionType.Invalid, "category");
    }

    export function Move(categories: number[], parentCategory: number, callback: Action<boolean>, faultCallback) {
        if (Session.User.Id > 0 && Session.User.Business.Id > 0) {
            Post$("/admin/business/category/Move", {
                authorize: true,
                data: {
                    User: Session.User.Id,
                    Business: Session.User.Business.Id,
                    Categories: categories,
                    ParentCategory: parentCategory
                },
                callback: (success) => {
                    if (success)
                        Cache.Reset();
                    callback(success);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Delete(category: number | number[], removeProducts: boolean, callback: Action<boolean>, faultCallback) {
        if (Session.User.Id > 0 && Session.User.Business.Id > 0) {
            //Get(community, category, (cachedCategory) => {
            var data = {
                User: Session.User.Id,
                Business: Session.User.Business.Id
            }, method;
            if (typeof category == "number") {
                data['Category'] = category;
                method = "Delete";
            }
            else {
                data['Categories'] = category;
                method = "Delete_Multi";
            }
            //if (cachedCategory && cachedCategory.Id == category) {
            Post$("/admin/business/category/" + method, {
                authorize: true,
                data: data,
                callback: (success) => {
                    if (success) {
                        //Cache.Remove(category);
                        Cache.Reset();
                    }
                    callback(success);
                },
                faultCallback: faultCallback
            });
            //}
            //else
            //    faultCallback(new DataException(DataExceptionType.RecordNotFound));
            //});
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function GetProducts(category: number, queryInput: List.QueryInput, callback: Action<List.QueryOutput>, faultCallback) {
        if (Session.User.Id > 0 && Session.User.Business.Id > 0) {
            Post$("/admin/business/category/GetProducts", {
                authorize: true,
                data: {
                    User: Session.User.Id,
                    Business: Session.User.Business.Id,
                    Category: category,
                    QueryInput: queryInput
                },
                callback: (data) => {
                    if (data.Facets)
                        Semantic.Facet.Deserialize(data.Facets);
                    callback(data);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function AddProduct(product: number | number[], category: number, callback: Action<boolean>, faultCallback) {
        if (Session.User.Id > 0 && Session.User.Business.Id > 0) {
            var method, data = {
                User: Session.User.Id,
                Business: Session.User.Business.Id,
                Category: category
            };
            if (typeof product == "number") {
                method = "AddProduct";
                data["Product"] = product;
            }
            else {
                method = "AddProduct_Multi";
                data["Products"] = product;
            }
            Post$("/admin/business/category/" + method, {
                authorize: true,
                data: data,
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function RemoveProduct(category: number, product: number | number[], callback: Action<boolean>, faultCallback) {
        if (Session.User.Id > 0 && Session.User.Business.Id > 0) {
                var data = {
                    User: Session.User.Id,
                    Business: Session.User.Business.Id,
                    Category: category,
                }, method;
                if (typeof product == "number") {
                    data['Product'] = product;
                    method = "RemoveProduct";
                }
                else {
                    data['Products'] = product;
                    method = "RemoveProduct_Multi";
                }
                Post$("/admin/business/category/" + method, {
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

export namespace Member {
    export function Get(business: number, callback: Action<Member$.Preview[]>, faultCallback) {
        if (Session.User.Id > 0 && business) {
            return Post$("/admin/business/member/Get", {
                data: {
                    Owner: Session.User.Id,
                    Business: business
                },
                callback: (data) => {
                    if (data && data.length) {
                    var member: Member$.Preview;
                    for (var i = 0, l = data.length; i < l; i++) {
                        member = new Member$.Preview(data[i]);
                        data[i] = member;
                    }
                        }
                    callback(data);
                },
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.NotAuthenticated);
    }

    export function Add(member: Member$.AddEmail, callback: Action<boolean>, faultCallback?) {
        if (Session.User.Id && (member.Business == Session.User.Id || Session.User.SecurityProfile.CanEdit_All)) {
            return Post$("/admin/business/member/Add_Email", {
                authorize: true,
                data: {
                    Owner: Session.User.Id,
                    Member: member
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.Unauthorized);
    }

    export function Remove(business: number, member: number | number[], callback: Action<boolean>, faultCallback) {
        //https://github.com/Microsoft/TypeScript/issues/2295
        if (Session.User.Id && (business == Session.User.Id || Session.User.SecurityProfile.CanEdit_All)) {
            var data = {
                Owner: Session.User.Id,
                Business: business
            }, method;
            if (typeof member == "number") {
                data['Member'] = member;
                method = "Remove";
            }
            else {
                data['Members'] = member;
                method = "Remove_Multi";
            }
            return Post$("/admin/business/member/" + method, {
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