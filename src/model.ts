import { EntityId, IdName, ILocation, ImageType, Geocoder, List, LocationRef, LocationType, ResolvedLocation, Semantic, ServiceProvider } from './model/foundation'
import { Image as ImageSettings, Service as ServiceSettings } from './settings'
import { SessionException, SessionExceptionType } from './exception'
export { EntityId, IdName, ILocation, ImageType, ImageSettings, Geocoder, List, LocationRef, LocationType, ResolvedLocation, Semantic, ServiceProvider, ServiceSettings }

export interface AccountId {
    AccountType: AccountType;
    Id: number;
}

export interface AccountName extends AccountId {
    Name?: string;
}

export interface Account extends AccountName {
    Image?: Image;
}

export enum AccountType {
    Business = 1,
    Personal = 2
}

export namespace Address {
    export enum Requirement {
        None = 0,
        Country = 1,
        City = 2,
        PostalCode = 3,
        StreetAddress = 4
    }
}

export namespace ServiceType {
    export const Any = 2147483647;
    export enum ItemType {
        Design = 1,
        Make = 2,
        Custom_Build = 4,
        Install = 8,
        Operate = 16,
        Maintain_Repair = 32,
        Measure_Test = 64,
        Supply = 128,
        Dispose = 256
    }
}

export namespace Industry {
    export const Any = 2147483647;
}

export interface BusinessType extends DictionaryItem {
}

export interface CachedImage extends RawImage {
    Type: ImageType,
    Preview: RawImage
}

export namespace Currency {
    export enum ItemType {
        CAD = 1
    }
}

export interface Currency {
    Text: string
    CountryPriceFormat: string;
    PriceFormat: string;
}

export interface DictionaryItem {
    ItemKey: number;
    ItemText: string;
}

export enum DictionaryType {
    SecurityProfile = 1,
    ServiceType = 2,
    TransactionType = 3,
    Industry = 4,
    ProductType = 5,
    ProductPriceType = 6,
    ProductAttributeType = 7,
    Currency = 8
}

export interface IAddress {
    Location: number;
    PostalCode?: string;
    Street?: number;
    StreetNumber?: string;
    Address1?: string;
    Lat?: number;
    Lng?: number;
}

export enum ImageSizeType {
    Thumbnail = 1,
    XtraSmall = 2,
    Small = 3,
    MediumSmall = 4,
    Medium = 5
}

export class Image {
    static GetImageRef(entity: ImageEntity, id: number, size: ImageSize = ImageSettings.Thumbnail) {
        //https://github.com/PolymerElements/iron-image/pull/117
        return ServiceSettings.Origin + '/image/get?entity=' + entity + '&id=' + id + '&width=' + size.Width + (size.Height ? '&height=' + size.Height : '');
    }

    constructor(public Entity: ImageEntity, object?: Image) {
        if (object)
            Object.deserialize(this, object);
    }
    MaxImageSize: ImageSizeType;
    get HasImage(): boolean {
        return this.MaxImageSize > 0 ? true : false;
    }
    ImageId: number;
    ImageSize: ImageSize;
    get ImageRef(): string {
        if (this.HasImage) {
            if (this.ImageId)
                return Image.GetImageRef(this.Entity, this.ImageId, this.ImageSize);
            else
                return '/images/bizsort-logo.svg'; //throw "ImageId is required";
        }
        else
            return Image.GetImageRef(this.Entity, 0, this.ImageSize);
    }
}

export namespace ImageCollection {
    export interface Image {
        Id: number;
        Token?: string;
        ImageRef?: string;
    }
}

export interface ImageCollection {
    Entity: ImageEntity;
    Refs: ImageCollection.Image[];
}

export enum ImageEntity {
    Business = 1,
    Product = 2,
    Service = 3,
    BusinessPromotion = 4,
    Community = 5,
    CommunityTopic = 6,
    Person = 7
}

/*export interface ImageSize {
    Size: number;
    AspectRatio: number;
    Orientation: ImageOrientation;
}*/

export class ImageSize {
    constructor(public Width: number, public Height: number) {
    }

    /*constructor(width: number, height: number) {
        if (width > height) {
            this.Size = width;
            this.AspectRatio = Math.round((width / height) * 10) / 10; //http://stackoverflow.com/questions/7342957/how-do-you-round-to-1-decimal-place-in-javascript
            this.Orientation = ImageOrientation.Landscape;
        }
        else {
            this.Size = width;
            this.AspectRatio = 1;
            this.Orientation = ImageOrientation.Any;
        }
    }*/
}

export namespace PWAImage {
    export enum Size {
        Icon_512 = 1,
        Icon_192 = 2
    }
}

export enum PendingStatus {
    EmailConfirmation = 1,
    PeerReview = 2,
    StaffReview = 4
}

export class ProductStats {
    Total: number;
    TotalQuota: number;
    Active: number;
    ActiveQuota: number;
    Pending: number;
    PendingQuota: number;
    Inactive: number;
    constructor(totalQuota: number, activeQuota: number, pendingQuota: number) {
        this.Total = 0;
        this.TotalQuota = totalQuota;
        this.Active = 0;
        this.ActiveQuota = activeQuota;
        this.Pending = 0;
        this.PendingQuota = pendingQuota;
        this.Inactive = 0;
    }
    CanList() {
        return (this.Total < this.TotalQuota && this.Active < this.ActiveQuota && this.Pending < this.PendingQuota ? true : false);
    }
    Refresh(count) {
        this.Pending = count.Pending;
        this.Active = count.Active;
        this.Inactive = count.Inactive;
        this.Total = count.Total;
    }
    Test() {
        var quota = -1;
        var quotaType;
        if (this.Total >= this.TotalQuota) {
            quota = this.TotalQuota;
            quotaType = "Total";
        }
        else if (this.Active >= this.ActiveQuota) {
            quota = this.ActiveQuota;
            quotaType = "Active";
        }
        else if (this.Pending >= this.PendingQuota) {
            quota = this.PendingQuota;
            quotaType = "Pending";
        }
        if (quota >= 0) {
            throw new SessionException(SessionExceptionType.QuotaExceeded, (ex) => {
                ex["Quota"] = quota;
                if (quotaType)
                    ex["QuotaType"] = quotaType;
            });
        }
    }
}

export namespace ProductType {
    export const Default = 16387;
    export enum ItemType {
        Product = 1,
        Service = 2,
        Job = 4,
        Other = 16384
    }
}

export interface ProductType extends DictionaryItem {
}

export enum ProductsView {
    NoProducts = 0,
    Multiproduct = 1,
    ProductList = 2,
    ProductCatalog = 3,
}

export enum PostType {
    None = 0,
    NoAccount = 1,
    Personal = 2,
    Business = 4
    //Either = 7
}

export interface RawImage {
    Width: number;
    Height: number;
    Content: string;
}

export interface ISecurityProfile {
    Type: SecurityProfile.Type;
    AutoPost: boolean;
    CanRelease_Peer: boolean;
    CanSuspend: boolean;
    CanReview_Staff: boolean;
    CanEdit_All: boolean;
    CanProduce_Business: boolean;
    CanProduce_Product: boolean;
    CanManage_OffensiveList: boolean;
    CanManage_Categories: boolean;
    CanManage_Locations: boolean;
    CanManage_BusinessImport: boolean;
    CanManage_ProductImport: boolean;
}

export class SecurityProfile implements ISecurityProfile {
    Type: SecurityProfile.Type;
    AutoPost: boolean;
    CanRelease_Peer: boolean;
    CanSuspend: boolean;
    CanReview_Staff: boolean;
    CanEdit_All: boolean;
    CanProduce_Business: boolean;
    CanProduce_Product: boolean;
    CanManage_OffensiveList: boolean;
    CanManage_Categories: boolean;
    CanManage_Locations: boolean;
    CanManage_BusinessImport: boolean;
    CanManage_ProductImport: boolean;

    constructor() {
        this.Reset();
    }

    Initialize(securityProfile: ISecurityProfile) {
        this.Type = securityProfile.Type;
        this.AutoPost = securityProfile.AutoPost;
        this.CanRelease_Peer = securityProfile.CanRelease_Peer;
        this.CanSuspend = securityProfile.CanSuspend;
        this.CanReview_Staff = securityProfile.CanReview_Staff;
        this.CanEdit_All = securityProfile.CanEdit_All;
        this.CanProduce_Business = securityProfile.CanProduce_Business;
        this.CanProduce_Product = securityProfile.CanProduce_Product;
        this.CanManage_OffensiveList = securityProfile.CanManage_OffensiveList;
        this.CanManage_Categories = securityProfile.CanManage_Categories;
        this.CanManage_Locations = securityProfile.CanManage_Locations;
        this.CanManage_BusinessImport = securityProfile.CanManage_BusinessImport;
        this.CanManage_ProductImport = securityProfile.CanManage_ProductImport;
    }

    Reset() {
        this.Type = 0;
        this.AutoPost = false;
        this.CanRelease_Peer = false;
        this.CanSuspend = false;
        this.CanReview_Staff = false;
        this.CanEdit_All = false;
        this.CanProduce_Business = false;
        this.CanProduce_Product = false;
        this.CanManage_OffensiveList = false;
        this.CanManage_Categories = false;
        this.CanManage_Locations = false;
        this.CanManage_BusinessImport = false;
        this.CanManage_ProductImport = false;
    }
}

export namespace SecurityProfile {
    export enum Type {
        Low = 1,
        Medium = 2,
        High = 3,
        Affiliate = 4,
        Staff = 5
    }
}

export namespace TransactionType {
    export const Default = 7;
    export enum ItemType {
        Business = 1,
        Consumer = 2,
        Sell = 4,
        Lease = 8,
        Buy = 128
    }
}