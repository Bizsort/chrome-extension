import { Array } from '../../../src/system'
import { DictionaryItem, DictionaryType, TransactionType } from '../../../src/model'
import { CheckEdit, TypeItem } from '../../category/checkedit'
import { Dictionary } from '../../../src/service/master'
export { TransactionType }

export class Edit extends CheckEdit {
    populate() {
        Dictionary.Get<DictionaryItem>(DictionaryType.TransactionType, (types) => {
            var transactionTypes: TypeItem[] = this._categoryConfig && this._categoryConfig.Transaction ? Array.mapReduce(types, (t) => {
                if ((this._categoryConfig.Transaction & t.ItemKey) > 0)
                    return {
                        Id: t.ItemKey,
                        Text: t.ItemText,
                        Selected: false
                    };
            }) : types.map((t) => {
                return {
                    Id: t.ItemKey,
                    Text: t.ItemText,
                    Selected: false
                };
            });
            if (this._selectedValue) { //Do not use this.SelectedValue getter!
                this.setTypes(transactionTypes, this._selectedValue); //Do not use this.SelectedValue getter!
            }
            else
                this.Values = transactionTypes;
        });
    }
}