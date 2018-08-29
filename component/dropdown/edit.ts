import { ViewModel } from '../../src/viewmodel'

export abstract class Edit<T> extends ViewModel {
    protected _values: T[];
    set Values(values: T[]) {
        if (this._values != values) {
            this.setValues(values);
            this.notifyProperty("Values", this._values);
        }
    }
    get Values(): T[] {
        return this._values;
    }
    protected setValues(values: T[]) {
        this._values = values;
    }

    protected _selectedValue: number;
    set SelectedValue(selectedValue: number) {
        if (this._selectedValue != selectedValue) {
            this._selectedValue = selectedValue;
            this.notifyProperty("SelectedValue", this._selectedValue);
        }
    }
    get SelectedValue(): number {
        return this._selectedValue;
    }
}