import { Edit as DropdownEdit } from '../../dropdown/edit'
import { BusinessType, DictionaryItem, DictionaryType } from '../../../src/model'
import { Config as CategoryConfig } from '../../../src/model/category'
import { Dictionary } from '../../../src/service/master'

export class Edit extends DropdownEdit<BusinessType> {
    protected setValues(values: BusinessType[]) {
        this._values = values;
        this.reflectSelected();
    }

    protected _lookupValue: number;
    set LookupValue(lookupValue: number) {
        if (this._lookupValue != lookupValue) {
            this._lookupValue = lookupValue;
            if (!this._values)
                this.populate();
            else if (this._lookupValue != this.SelectedValue)
                this.reflectSelected();
        }
    }
    get LookupValue(): number {
        return this._lookupValue;
    }

    protected _categoryConfig: CategoryConfig;
    set CategoryConfig(categoryConfig: CategoryConfig) {
        if (this._categoryConfig != categoryConfig) {
            this._categoryConfig = categoryConfig;
            this.populate();
        }
    }

    populate() {
        Dictionary.Get<BusinessType>(DictionaryType.ServiceType, (types) => {
            var serviceTypes = this._categoryConfig && this._categoryConfig.Service ? Array.mapReduce(types, (t) => {
                if ((this._categoryConfig.Service & t.ItemKey) > 0)
                    return t; //{ ItemKey: t.ItemKey, ItemText: t.ItemText };
            }) : types.slice();
            if (serviceTypes.length && serviceTypes[0].ItemKey) {
                serviceTypes.splice(0, 0, {
                    ItemKey: 0,
                    ItemText: "Not Specified"
                });
            }
            this.Values = serviceTypes;
            this.reflectSelected();
        });
    }

    reflectSelected() {
        if (this.LookupValue && this.Values) {
            for (var i = 0, l = this.Values.length; i < l; i++) {
                if (this.Values[i].ItemKey == this.LookupValue) {
                    this.SelectedValue = this.LookupValue;
                    return;
                }
            }
            this.SelectedValue = 0;
        }
    }
}