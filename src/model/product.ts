import { Account as Account$, AccountType, Currency, DictionaryItem, EntityId, IdName, Image, ImageSize as ImageSize$, List, PendingStatus, ProductType } from '../model'
import { SessionException, SessionExceptionType } from '../exception'
import { Date } from '../system'
import * as Resource from '../resource'

export const CARD_IMAGE_HEIGHT = 120
export const VIEW_IMAGE_WIDTH = 300
export const VIEW_IMAGE_HEIGHT = 300

export namespace Attribute {
    export enum Requirement {
        Optional = 0,
        Required = 1,
        PresetValue = 2,
        NotApplicable = 3
    }
}

export interface Currency extends DictionaryItem {
    CountryPriceFormat: string;
    PriceFormat: string;
}

export enum FacetValueType {
    Text = 1,
    _Status = 250,
    _PriceType = 251,
    _Side = 252,
    _Type = 253,
    _Category = 254,
    _AccountType = 255
}

export const ImageSize = {
    Card: <ImageSize$>{
        Width: 2 * CARD_IMAGE_HEIGHT,
        Height: CARD_IMAGE_HEIGHT    },

    List: <ImageSize$>{
        Width: 2 * CARD_IMAGE_HEIGHT,
        Height: CARD_IMAGE_HEIGHT    },

    /*Card: <ImageSize$>{
        Size: 2 * CARD_IMAGE_HEIGHT,
        AspectRatio: 2.0,
        Orientation: ImageOrientation.Landscape
    },

    List: <ImageSize$>{
        Size: CARD_IMAGE_HEIGHT,
        AspectRatio: 2.0,
        Orientation: ImageOrientation.Landscape
    },

    ViewHead: <ImageSize$>{
        Size: 480,
        AspectRatio: 2.0,
        Orientation: ImageOrientation.Landscape
    }*/
}

namespace PriceType {
    export enum ValueOptionType {
        NotApplicable = 0,
        Optional = 1,
        Required = 2
    }
}

export interface PriceType extends DictionaryItem {
    ValueOption: PriceType.ValueOptionType;
    Applicability: number;
    PriceFormat: string;
}

export interface SearchItem extends EntityId {
}

export interface SearchItemDistance extends SearchItem {
    Distance?: number;
}

export interface SearchInput extends List.SearchInput {
    AccountType?: AccountType;
    ProductType: ProductType.ItemType;
}

export interface SearchOutput extends List.SearchOutput {
    Series: SearchItem[];
}

export enum RejectReason
{
    WrongCategory = 1,
    Offensive = 2,
    Unlawful = 4,
    Scam = 8
}

export enum Type
{
    Listed = 0,
    Unlisted = 1
}

export enum Status
{
    Draft = 1,
    Pending = 2,
    Active = 3,
    Rejected = 4,
    Archived = 5,
    Deleted = 6
}

export class Profile {
    Id: number;
    Type: Type;
    RichText: string;
    Text: string;
    WebUrl: string;
    Tags;
    Status: Status;
    PendingStatus: PendingStatus;
    RejectReason: RejectReason;

    constructor(object?: Profile) {
        if (object) {
            Object.deserialize(this, object);
            if (this.WebUrl && this.WebUrl.substr(0, 4) != "http")
                this.WebUrl = "http://" + this.WebUrl;
        }
    }

    protected _statusText = Resource.GetValue(Resource.Product, Status, 'Status');
    get StatusText(): string {
        return this.Status ? this._statusText(this.Status) : '';
    }
}

export interface MasterProfile {
    Id: number;
    Title?: string;
    RichText?: string;
    Text?: string;
}

export interface PreviewOptions {
    account?: Account$,
    mainImage?: ImageSize$;
    accountImage?: ImageSize$;
}

export class Preview {
    Id: number;
    Name: string;
    Image: Image;
    ProductType: ProductType;
    WebUrl: string;
    Text: string;
    Side: string;
    Price: string;
    Date: Date | string;
    Selected: boolean;
    Account: Account$;
    Category: IdName;
    Distance: string
    Type: Type;
    Status: Status;
    PendingStatus: PendingStatus;
    RejectReason: RejectReason;
    RejectReasonText;

    constructor(object?: Preview, imageSize?) {
        if (object) {
            Object.deserialize(this, object);
            this.Image = new Image(this.Image.Entity/*ImageEntity.Product*/, this.Image);
            if (imageSize)
                this.Image.ImageSize = imageSize;
            this.Date = Date.deserialize(<string>this.Date);
            if (this.WebUrl && this.WebUrl.substr(0, 4) != "http")
                this.WebUrl = "http://" + this.WebUrl;
        }
    }

    protected _statusText = Resource.GetValue(Resource.Product, Status, 'Status');
    get StatusText(): string {
        return this.Status ? this._statusText(this.Status) : '';
    }
}

namespace Option {
    export enum PriceType
    {
        Relative = 1,
        Absolute = 2
    }

    export function ConvertPrice (price) {
        return price * 0.01;
    }

    export function GetDisplayPrice (price, type, currency) {
        if (currency) {
            price = Option.ConvertPrice(price);
            switch (type) {
                case Option.PriceType.Relative:
                    if (price > 0)
                        return String.format("(+{0})", String.format(currency.PriceFormat, price));
                    else if (price < 0)
                        return String.format("(-{0})", String.format(currency.PriceFormat, Math.abs(price)));
                    break;
                case Option.PriceType.Absolute:
                    if (price > 0)
                        return String.format(currency.PriceFormat, price);
                    break;
            }
        }
    }
}

export interface Option {
    Name: string;
    Values: OptionValue[];
}

export interface OptionValue {
    Value: string;
    Price: OptionPrice;
}

export interface OptionPrice {
    Type: Option.PriceType;
    Value: number;
    Currency: Currency;
}