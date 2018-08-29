import { ImageCollection } from '../admin'
import { IAddress, ImageEntity } from '../../model'
import { MasterProfile as MasterProfile$, Profile as Profile$ } from '../product'

export interface MasterProfile extends MasterProfile$ {
    Category: number;
    Type?: number;
    Updated?: Date | string;
}

export class Profile extends Profile$ {
    Master: MasterProfile;
    TransactionType: number;
    ServiceType: number;
    Address: IAddress;
    Images: ImageCollection;
    Price: Price;
    Attributes;
    Updated: Date | string;

    get IsMasterOwned() {
        return this.Master.Id == this.Id ? true : false;
    }

    constructor(object?: Profile) {
        super(object);
        if (!object) { //newRecord
            this.Id = 0;
            this.Master = {
                Id: 0,
                Category: 0
            };
            this.Address = {
                Location: 0
            };
            this.Images = {
                Entity: ImageEntity.Business,
                Refs: [],
                Deleted: []
            };
            this.Price = {
                Type: 0
            }
            //this.Attributes = new Admin.Model.Product.Attributes();
        }
    }
}

interface Price {
    Type: number;
    Value?: number;
    Currency?: number;
}