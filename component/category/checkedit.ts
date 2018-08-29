import { ViewModel } from '../../src/viewmodel'
import { Config } from '../../src/model/category'

export interface TypeItem {
    Id: number;
    Text: string;
    Selected?: boolean;
}

export abstract class CheckEdit extends ViewModel {
    abstract populate();

    protected _categoryConfig: Config;
    set CategoryConfig(categoryConfig: Config) {
        if (this._categoryConfig != categoryConfig) {
            this._categoryConfig = categoryConfig;
            this.populate();
        }
    }

    protected _selectedValue: number;
    set SelectedValue(selectedValue: number) {
        if (this._selectedValue != selectedValue) {
            this._selectedValue = selectedValue;
            this.setTypes(this._values, this._selectedValue); //Do not use this.SelectedValue getter!
        }
    }
    get SelectedValue(): number {
        return this.getTypes(this.Values); //this._selectedValue;
    }

    protected _values: TypeItem[];
    set Values(values: TypeItem[]) {
        if (this._values != values) {
            this._values = values;
            this.notifyProperty("Values", this._values);
        }
    }
    get Values(): TypeItem[] {
        return this._values;
    }

    setTypes(types: TypeItem[], state: number) {
        if (types && typeof state !== 'undefined') {
            var clone;
            if (this._values != types)
                this.Values = types;
            else
                clone = true;
            types.forEach((t, i) => {
                //Does not seem to work reliably
                this.arraySet('Values', i, (t.Id & state) > 0 ? true : false, 'Selected'); //t.Selected = (t.Id & state) > 0 ? true : false;
            });
            if (clone) //workaround
                this.Values = types.slice(); //make a copy
        }
    }
    getTypes(types: TypeItem[]): number {
        var state = 0;
        if (types) {
            types.forEach((t, iray) => {
                if (t.Selected)
                    state |= t.Id;
            });
        }
        return state;
    }
}