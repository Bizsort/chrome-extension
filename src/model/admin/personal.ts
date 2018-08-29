import { AccountName, AccountType, IAddress, Image, ImageEntity } from '../../model'
import { Account as BusinessAccount } from '../business'
import { Points } from '../finance'

export interface Account extends AccountName {
    Email?: string;
    SecurityCode?: string;
    SignedIn?: Date | string;
}

export interface EntityEdit<T> extends Account {
    Entity?: T
}

export interface EntitySave<T> {
    Id: number;
    Email?: string;
    SecurityCode?: string;
    Entity: T
}

export class Profile implements AccountName {
    AccountType: AccountType;
    Id: number;
    Name: string;
    Image?: Image;
    Email?: string;
    Phone: string;
    Address: IAddress;
    Business: number;
    Updated: Date | string;

    constructor(object?, imageSize?) {
        if (object) {
            Object.deserialize(this, object);
            this.Image = new Image(ImageEntity.Person, this.Image);
            if (imageSize)
                this.Image.ImageSize = imageSize;
        }
    }
}

export class RewardCollection {
    Total: number;
    Rewards: Reward[];

    constructor(object?) {
        if (object) {
            Object.deserialize(this, object);
        }
    }
}

export interface Reward {
    Id: number;
    TransactionType: string;
    TransactionDate: Date | string;
    Amount: number;
    Ref?: RewardRef_Business | RewardRef;
    Status: Points.LedgerStatus;
}

export interface RewardRef {
    Type: Points.RewardType;
}

export interface RewardRef_Business extends RewardRef {
    Business: BusinessAccount;
}