import { ImageCollection } from '../admin'
import { EntityId, IAddress, IdName, Image, ImageEntity, TransactionType, PWAImage as PWAImage$, ServiceSettings } from '../../model'
import { Account, Affiliation as Affiliation$, Office as Office$, Option, Profile as Profile$ } from '../business'
import { Profile as ProductProfile } from './product'

export interface EntityEdit<T> extends Account {
    Entity?: T
    Category: number;
    CreatedBy?: number;
}

export interface EntitySave<T> {
    Id: number;
    Category?: number;
    CreatedBy: number;
    Entity: T
}

export interface Office extends Office$ {
    Id: number;
    Address: IAddress;
    HeadOffice: boolean;
    Draft?: number;
}
        
export interface OfficeCollection {
    Refs: Office[];
    Deleted: number[];
}

export namespace Affiliation {
    export interface Preview extends Affiliation$.Preview {
        BusinessId: number;
    }

    export interface Ref {
        Id: number;
        Business: EntityId;
    }

    export interface Collection {
        Refs: Ref[];
        Deleted: number[];
    }
}

export interface MultiProduct {
    Id: number;
    RichText?: string;
    Text?: string;
    Updated?: Date | string;
}

export class Profile extends Profile$ {
    Category: number;
    ServiceType: number;
    TransactionType: number;
    Industry: number;
    Offices: OfficeCollection;
    Images: ImageCollection;
    Affiliations: Affiliation.Collection;
    CreatedBy: number;
    Updated: Date | string;

    constructor(object?: Profile) {
        super(object);
        if (!object) { //newRecord
            this.Id = 0;
            this.Category = 0;
            this.Offices = {
                Refs: [{
                    Id: 0,
                    Address: {
                        Location: 0
                    },
                    Phone: '',
                    HeadOffice: true
                }],
                Deleted: []
            };
            this.TransactionType = TransactionType.Default;
            this.Options = Option.Set.Deserialize({
                Value: Option.Flags.Default
            });
            this.Images = {
                Entity: ImageEntity.Business,
                Refs: [],
                Deleted: []
            };
            this.Affiliations = {
                Refs: [],
                Deleted: []
            };
        }
    }

    get HeadOffice(): Office {
        return this.Offices.Refs[0];
    }
}

export namespace Product {
    export class Profile extends ProductProfile {
        UseBusinessAddress: boolean;
        Locations;
        Options;
        Facets;
        CatalogCategory: number;
        CreatedBy: number;

        constructor(object?: Profile) {
            super(object);
            if (!object) { //newRecord
                this.UseBusinessAddress = true;

                //Locations = new Locations();
                //Options = new Model.Product.Options();
            }
        }
    }
}

export class Attributes {
    BizsortAlias: string;
    VisitorForm: string;

    constructor(object?: Attributes) {
        if (object) {
            Object.deserialize(this, object);
        }
    }
}

export class PWAImage {
    static GetImageRef(alias: string, size: PWAImage$.Size) {
        //https://github.com/PolymerElements/iron-image/pull/117
        return ServiceSettings.Origin + '/image/pwa?alias=' + alias + '&size=' + size;
    }

    constructor(public Alias: string, public Size: PWAImage$.Size, object?: PWAImage) {
        if (object)
            Object.deserialize(this, object);
    }

    Type: string;
    Token?: string;

    get ImageRef(): string {
        if (this.Alias && this.Size)
            return PWAImage.GetImageRef(this.Alias, this.Size);
        return '/images/bizsort-logo.svg';
    }
}

export class PWAProfile {
    Alias: string;
    ShortName: string;
    ThemeColor: string;
    Icon512: PWAImage;
    Icon192: PWAImage;

    constructor(object?: PWAProfile) {
        if (object) {
            Object.deserialize(this, object);
            if (this.Icon512)
                this.Icon512 = new PWAImage(this.Alias, PWAImage$.Size.Icon_512, this.Icon512);
            if (this.Icon192)
                this.Icon192 = new PWAImage(this.Alias, PWAImage$.Size.Icon_192, this.Icon192);
        }
    }
}

export class Enrichment {
    Business: number;
    WebSite?: string;
    Category: number;
    ServiceType: number;
    TransactionType: number;
    Industry: number;
    Address: IAddress;
    Phone: string;
    Phone1?: string;
    Fax?: string;
    //Offices: OfficeCollection;
    Updated: Date | string;

    constructor(object?: Attributes) {
        if (object) {
            Object.deserialize(this, object);
            if (this.WebSite && this.WebSite.substr(0, 4) != "http")
                this.WebSite = "http://" + this.WebSite;
        }
        else { //newRecord
            this.Category = 0;
            this.Address = {
                Location: 0
            };
            this.Phone = '';
            /*this.Offices = {
                Refs: [{
                    Id: 0,
                    Address: {
                        Location: 0
                    },
                    Phone: '',
                    HeadOffice: true
                }],
                Deleted: []
            };*/
            this.TransactionType = TransactionType.Default;
        }
    }
}

export interface Category extends IdName {
    Parent: number;
}

export namespace Member {
    export class Preview implements IdName {
        Id: number;
        Name: string;
        Image: Image
        Email: string;

        constructor(object?: Preview, imageSize?) {
            if (object) {
                Object.deserialize(this, object);
                this.Image = new Image(this.Image.Entity, this.Image);
                if (imageSize)
                    this.Image.ImageSize = imageSize;
            }
        }
    }

    export interface AddEmail {
        Business: number;
        Email: string;
    }
}