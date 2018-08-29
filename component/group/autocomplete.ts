import { Action } from '../../src/system'
import { IdName } from '../../src/model'
import { ViewModel } from '../../src/viewmodel'
export { IdName }

export interface IAutocompleteMaster extends ViewModel {
    Text: string;
}

export interface IAutocompletePopulate {
    (text: string, callback: (items) => void): void;
}

interface IAutocompleteInitialize {
    Master: IAutocompleteMaster;
    Populate: IAutocompletePopulate;
    ItemSelected: Action<IdName>;
}

export class Autocomplete extends ViewModel {
    ItemSelected: Action<IdName>;

    Initialize(options) {
        if (options && options.Master && options.Populate && options.ItemSelected) {
            options.Master.PropertyChange.AddHandler((sender, e) => {
                if (e.name == "Text")
                    this.Populate(e.value);
            });

            this._populate = options.Populate;
            this.ItemSelected = options.ItemSelected;
        }
    }

    protected _text;
    protected _populate: IAutocompletePopulate;
    Populate(text: string) {
        if (this._text != text && !this._disabled) {
            this._text = text;
            if (this._text) {
                this._populate(this._text, (items) => {
                    if (items && items.length && (items.length > 1 || items[0].Name != this._text))
                        this.Items = items;
                    else
                        this.Items = null;
                });
            }
            else
                this.Items = null;
        }
    }

    protected _items;
    set Items(items) {
        if (this._items != items) {
            this._items = items;
            this.notifyProperty("Items", this._items);
        }
    }
    get Items() {
        return this._items;
    }

    protected _disabled: boolean;
    set Disabled(disabled: boolean) {
        if (this._disabled != disabled) {
            this._disabled = disabled;
            this.notifyProperty("Disabled", this._disabled);
        }
        if (this._disabled)
            this.Active = false;
        else if (this._text && this._items && this._items.length)
            this.Active = true;
    }
    get Disabled(): boolean {
        return this._disabled;
    }

    protected _active: boolean;
    set Active(active: boolean) {
        if (this._disabled)
            active = false;
        if (this._active != active) {
            this._active = active;
            this.notifyProperty("Active", this._active);
        }
            
    }
    get Active(): boolean {
        return this._active;
    }
}