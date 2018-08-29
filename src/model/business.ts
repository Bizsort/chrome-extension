import { Account as Account$, AccountType, DictionaryItem, EntityId, Geocoder, IdName, Image, ImageEntity, ImageSize as ImageSize$, List, ProductsView, TransactionType } from '../model'
import { NodeRef } from './foundation'
export { AccountType, ProductsView }

export const CARD_IMAGE_HEIGHT = 120
export const CARD_WIDTH = 280
export const CARD_HEIGHT = 320

export class Account implements Account$ {
    AccountType: AccountType;
    Id: number;
    Name: string;
    Image?: Image;
    ProductsView: ProductsView;
    WebSite?: string;

    constructor(object?, imageSize?) {
        if (object) {
            Object.deserialize(this, object);
            this.Image = new Image(ImageEntity.Business, this.Image);
            if (imageSize)
                this.Image.ImageSize = imageSize;
            if (this.WebSite && this.WebSite.substr(0, 4) != "http")
                this.WebSite = "http://" + this.WebSite;
        }
    }
}

export namespace Affiliation {
    export interface Preview {
        Date;
        Pending: Boolean;
    }
}

export interface Category extends NodeRef {
}

export interface CommunityPost {
    PostedBy: Account;
    Text: string;
    Date;
}

export const ImageSize = {
    Card: <ImageSize$>{
        Width: 2 * CARD_IMAGE_HEIGHT,
        Height: CARD_IMAGE_HEIGHT
    },

    List: <ImageSize$>{
        Width: 2 * CARD_IMAGE_HEIGHT,
        Height: CARD_IMAGE_HEIGHT
    },

    ViewHead: <ImageSize$>{
        Width: 290,
        Height: 145
    }

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
        Size: 290,
        AspectRatio: 2.0,
        Orientation: ImageOrientation.Landscape
    }*/
}

export interface Office {
    Phone: string;
    Phone1?: string;
    Fax?: string;
    Name?: string;
}

export namespace Option {
    export enum Flags {
        Default = 0,
        Use_Catalog = 1,
        Publish_Email = 2
    }

    export interface Set {
        Value: number;
        Use_Catalog?: boolean;
        Publish_Email?: boolean;
    }

    export namespace Set {
        export function Deserialize(options): Set {
            if ((options.Value & Option.Flags.Use_Catalog) > 0)
                options.Use_Catalog = true;
            if ((options.Value & Option.Flags.Publish_Email) > 0)
                options.Publish_Email = true;
            delete options.Value;
            return options;
        }
    }
}

export class Preview implements IdName {
    Id: number;
    Name: string;
    Image: Image;
    Location: Geocoder.Location;
    WebSite: string;
    Phone: string;
    Text: string;
    ProductsView: ProductsView;
    Selected: boolean;
    Category: IdName;
    Distance: string;
    CommunityNotes: CommunityPost[];

    constructor(object?: Preview, imageSize?) {
        if (object) {
            Object.deserialize(this, object);
            this.Image = new Image(ImageEntity.Business, this.Image);
            if (imageSize)
                this.Image.ImageSize = imageSize
            if (this.WebSite && this.WebSite.substr(0, 4) != "http")
                this.WebSite = "http://" + this.WebSite;
            this.Location = new Geocoder.Location(this.Location);
        }
    }
}

export class Profile extends Account {
    Email: string;
    RichText: string;
    Text: string;
    Options: Option.Set;
}

export interface SearchItem extends EntityId {
    Office?: number;
}

export interface SearchItemDistance extends SearchItem {
    Distance?: number;
}

export interface SearchInput extends List.SearchInput {
    TransactionType: TransactionType.ItemType;
}

export interface SearchOutput extends List.SearchOutput {
    Series: SearchItem[];
}











