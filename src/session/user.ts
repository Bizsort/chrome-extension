import { Event } from '../system'
import { IdName, PostType, ProductStats, ProductsView, SecurityProfile, ServiceProvider } from '../model'
import { Location as LocationSettings, Product as ProductSettings } from '../settings'
import { GetName } from '../service/location'
export { ServiceProvider }

//https://github.com/google/closure-compiler/issues/1189
export abstract class Profile$ {
    Id: number;
    Name: string;
    Address;
    ProductStats;
    constructor() {
        this.Id = 0;
        this.resetProductStats();
    }

    Exit() {
        this.Id = 0;
        delete this.Name;
        delete this.Address;
        this.resetProductStats();
    }

    resetProductStats() {
        this.ProductStats = new ProductStats(ProductSettings.Quota.Personal.Total, ProductSettings.Quota.Personal.Active, ProductSettings.Quota.Personal.Pending);
    }
}

export class Business extends Profile$ {
    ProductsView: ProductsView;
    Category: number;
    IsOwner: boolean;

    StatusChanged: Event<any>;

    constructor() {
        super();
        this.StatusChanged = new Event<any>(this);
    }

    Enter(business, suppressEvent?: boolean) {
        this.Id = business.Id;
        this.Name = business.Name;
        if (business.Address)
            this.Address = business.Address;
        if (business.Category)
            this.Category = business.Category;
        this.ProductsView = business.ProductsView;
        this.IsOwner = business.IsOwner;

        if (!suppressEvent)
            this.StatusChanged.Invoke(this);
    }

    Exit() {
        super.Exit();
        this.ProductsView = ProductsView.NoProducts;
        delete this.IsOwner;

        this.StatusChanged.Invoke(this);
    }

    resetProductStats() {
        this.ProductStats = new ProductStats(ProductSettings.Quota.Business.Total, ProductSettings.Quota.Business.Active, ProductSettings.Quota.Business.Pending);
    }
}

export enum SigninFlags {
    ShowTerms = 1,
    AdminLogon = 2
}

export enum SigninStatus {
    Success = 1,
    AccountLocked = 2
}

export class User extends Profile$ {
    //GuestId: number;
    Location: IdName;
    get LocationId(): number {
        return this.Location.Id;
    }
    set LocationId(locationId: number) {
        if (this.Location.Id != locationId) {
            this.Location.Id = locationId;
            this.Location.Name = '';
            GetName(locationId, (location) => {
                this.Location.Name = location.Name;
            });
        }
    }
    CategoryId: number;
    Business: Business;
    SecurityProfile: SecurityProfile;
    InviteCount: number;
    MessageCount: number;
    SuppressGuidelines: boolean;

    GotoSignin;
    AutoSignin: ServiceProvider;
    AutoSigninToken: string;

    SignedInChanged: Event<any>;

    constructor() {
        super();
        this.Business = new Business();
        this.SecurityProfile = new SecurityProfile();
        this.InviteCount = -1;
        this.MessageCount = -1;

        this.Location = { //Clone it!
            Id: LocationSettings.Country.Id,
            Name: LocationSettings.Country.Name
        };
        this.CategoryId = 0;

        this.SignedInChanged = new Event<any>(this);
    }

    Enter(user: User, suppressEvent?: boolean) {
        if (user.LocationId && this.LocationId != LocationSettings.Country.Id)
            this.LocationId = user.LocationId;
        if (user.CategoryId && !this.CategoryId)
            this.CategoryId = user.CategoryId;
        if (user.SuppressGuidelines)
            this.SuppressGuidelines = true;

        if (user.Id) {
            //this.GuestId = 0;
            this.Id = user.Id;
            this.Name = user.Name;
            if (user.Address)
                this.Address = user.Address;
            this.Business.Enter(user.Business);
            this.SecurityProfile.Initialize(user.SecurityProfile);
            this.InviteCount = user.InviteCount;
            this.MessageCount = user.MessageCount;

            if (!suppressEvent)
                this.SignedInChanged.Invoke(this);
        }
    }

    //Used by Session.Handoff
    get Clone() {
        return {
            Id: this.Id,
            Name: this.Name,
            Address: this.Address,
            ProductStats: this.ProductStats,
            Location: this.Location, //LocationId: this.LocationId,
            CategoryId: this.CategoryId,
            Business: this.Business.Id ? {
                Id: this.Business.Id,
                Name: this.Business.Name,
                Address: this.Business.Address,
                ProductsView: this.Business.ProductsView,
                Category: this.Business.Category,
                IsOwner: this.Business.IsOwner,
            } : {
                    Id: 0
                },
            SecurityProfile: this.SecurityProfile,
            InviteCount: this.InviteCount,
            MessageCount: this.MessageCount,
            SuppressGuidelines: this.SuppressGuidelines,
            //Not used in Enter, but restored from Handoff cookie
            GotoSignin: this.GotoSignin,
            AutoSignin: this.AutoSignin,
            AutoSigninToken: this.AutoSigninToken
        };
    }

    Exit() {
        super.Exit();

        this.Business.Exit();
        this.SecurityProfile.Reset();
        this.InviteCount = -1;
        this.MessageCount = -1;

        this.SignedInChanged.Invoke(this);
    }

    CanPost() {
        var type = PostType.None;
        if (this.Id > 0) {
            if (this.Business.Id > 0 && this.Business.ProductStats.CanList)
                type = type |= PostType.Business;
            if (this.ProductStats.CanList)
                type = type |= PostType.Personal;
        }
        else
            type |= PostType.NoAccount;
        return type;
    }
}