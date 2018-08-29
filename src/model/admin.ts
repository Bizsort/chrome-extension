import { ImageCollection as ImageCollection$, ImageEntity, List } from '../model'

export namespace ImageCollection {
    export interface Image extends ImageCollection$.Image {
        IsDefault: boolean;
        IsOwned: boolean;
    }
}

export interface ImageCollection
{
    Refs: ImageCollection.Image[];
    Deleted: number[];
    Entity: ImageEntity;
}

export namespace Location {
    export interface QueryInput extends List.QueryInput {
        Location: number;
    }
}

export interface ValueTimestamp {
    Value: number;
    Timestamp: Date;
}