import { Array } from '../../../src/system'
import { DictionaryItem, DictionaryType } from '../../../src/model'
import { CheckEdit, TypeItem } from '../../category/checkedit'
import { Dictionary } from '../../../src/service/master'

export class Edit extends CheckEdit {
    protected _enabled = false;
    set Enabled(enabled: boolean) {
        if (this._enabled != enabled) {
            this._enabled = enabled;
            this.notifyProperty("Enabled", this._enabled);
        }
    }
    get Enabled(): boolean {
        return this._enabled;
    }

    populate() {
        Dictionary.Get<DictionaryItem>(DictionaryType.Industry, (types) => {
            var industries: TypeItem[] = this._categoryConfig && this._categoryConfig.Industry ? Array.mapReduce(types, (t) => {
                if ((this._categoryConfig.Industry & t.ItemKey) > 0)
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
            //this.Enabled = industries.length ? true : false;
            if (this._selectedValue) { //Do not use this.SelectedValue getter!
                this.setTypes(industries, this._selectedValue);
                this.Enabled = true;
            }
            else
                this.Values = industries;
        });
    }
}