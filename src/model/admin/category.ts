import { IdName, List } from '../../model'
import { Config } from '../category'
import { INodeType, NodeRef, NodeType } from '../foundation'
export { Config, List }

export interface Category extends NodeRef, INodeType {
    NodeType: NodeType;
    QualifyingParent?: IdName;
    Config: Config;
    NAICSCode: number;
    SortOrder: number;
}

export interface Category_List extends Category {
}

export interface CategoryLocationSearchInput extends List.QueryInput {
    Category: number;
    SearchSubCategories: boolean;
    Location: number;
}