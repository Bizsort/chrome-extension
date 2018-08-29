import { FacetValueType, Attribute } from './product'

export const Uncategorized = 0;
export const AllCategories = -1;

export interface Config {
    Service: number;
    Product: number;
    Transaction: number;
    Industry: number;
    ProductAttributes?: ProductAttribute[];
}

export interface ProductAttribute {
    Name: string;
    Type: number;
    EditorType: EditorType;
    ValueType: FacetValueType;
    Requirement: Attribute.Requirement;
    Group: string;
    DefaultValue;
    ValueOptions: string[];
}

export enum MemberType {
    Business = 1,
    Product = 2,
    Class_Business = 4,
    Class_Product = 8
}

export enum EditorType {
    TextBox = 1
}