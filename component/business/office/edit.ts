import { Action } from '../../../src/system'
import { InputValidator, IView, Validateable, ValidationContext, ViewModel } from '../../../src/viewmodel'
import { Edit as Location } from '../../location/edit'
import { Profile as BusinessProfile, Office, OfficeCollection } from '../../../src/model/admin/business'
import * as ValidationSettings from '../../../src/settings/validation'
import * as Resource from '../../../src/resource'

export class Edit extends ViewModel  {
       
    constructor(view: IView) {
        super(view);
        this._validateable = new Validateable(this, new ValidationContext(null, {
            LocationSettings: {
                PhoneValid: ValidationSettings.PhoneValid
            }
        }), {
            rules: {
                phone: {
                    required: true,
                    validatePhone: true
                },
                phone1: "validatePhone",
                fax: "validatePhone"
            },

            messages: {
                phone: String.format(Resource.Global.Editor_Error_Enter_X_Valid, "Phone"),
                phone1: String.format(Resource.Global.Editor_Error_Enter_X_Valid, "Phone"),
                fax: String.format(Resource.Global.Editor_Error_Enter_X_Valid, "Fax")
            },

            methods: {
                validatePhone: ValidationSettings.ValidatePhone
            }
        }, (proceed: Action<boolean>, context: ValidationContext, validator: InputValidator) => {
            if (this.Office) {
                validator.ValidateElement('phone', this.Office.Phone, context); //Business.EditOffice
                validator.ValidateElement('phone1', this.Office.Phone1, context); //Business.EditOffice
                validator.ValidateElement('fax', this.Office.Fax, context); //Business.EditOffice
            }
            proceed(!this._validateable.ErrorInfo.HasErrors);
        });
    }

    protected _location: Location;
    get Location(): Location {
        return this._location;
    }

    Initialize() {
        this._location = this.getViewModel<Location>('location');
    }

    protected _business: BusinessProfile;
    set Business(business) {
        if (business && business.Offices) {
            if (this._business != business) {
                this._business = business;
                //Raise before View notifyProperty, so we can set properties prior to binding notification
                this.PropertyChange.Invoke(this, { name: "OfficeCount", value: this._business.Offices && this._business.Offices.Refs ? this._business.Offices.Refs.length : 0 });
                this.notifyProperty("Business", this._business);
                this.notifyProperty("Offices", this._business.Offices);
            }
        }
    }
    get Business(): BusinessProfile {
        return this._business;
    }

    get Offices(): OfficeCollection {
        return this._business && this._business.Offices;
    }

    protected _office: Office;
    set Office(office) {
        if (this._office != office) {
            this._office = office;
            this.notifyProperty("Office", this._office);
        }
    }
    get Office(): Office {
        return this._office;
    }

    setOffice(office?: Office) {
        if (office) {
            var prop = office.Draft ? 'Draft' : office.Id ? 'Id' : null;
            var officeRef = prop && this.Offices.Refs && this.Offices.Refs.find(o => o[prop] === office[prop], this.Offices.Refs); //this.Offices.Refs.findIndex
            if (officeRef) { //idx >= 0
                this.Office = officeRef; //this.Offices.Refs[idx]
            }
            else
                this.Office = office;
            return true;
        } else if (this.Offices.Refs.length == 1) {
            this.Office = this.Offices.Refs[0];
            return true;
        }
        if (this.Office)
            this.Office = null;
    }

    _enabled = true;
    set Enabled(enabled) {
        if (this._enabled != enabled) {
            this._enabled = enabled;
            this.notifyProperty("Enabled", this._enabled);
        }
    }
    get Enabled() {
        return this._enabled;
    }

    AddOffice(office: Office, reset?: boolean) {
        if (this.Enabled && office) {
            if (reset) {
                if (this.Offices.Refs.length) {
                    for (var i = 0, l = this.Offices.Refs.length; i < l; i++) {
                        if (this.Offices.Refs[i].Id)
                            this.Offices.Deleted.push(this.Offices.Refs[i].Id);
                    }
                    this.arraySplice('Offices.Refs', 0, this.Offices.Refs.length); //this.Offices.Refs.length = 0;
                }
            }

            this.arrayPush('Offices.Refs', office); //this.Offices.Refs.push(office);

            if (this.Offices.Refs.every(o => !o.HeadOffice))
                this.MakeHeadOffice(this.Offices.Refs[this.Offices.Refs.length - 1], this.Offices.Refs.length - 1);

            this.PropertyChange.Invoke(this, { name: "OfficeCount", value: this.Offices.Refs.length });
        }
    }

    SaveOffice(callback: Action<boolean>) {
        if (this.Office) {
            this._validateable.Context.Validate((valid) => {
                this.Office.Address = this._location.Address;
                callback(valid);
            });
        }
        else
            callback(false);
    }

    RemoveOffice(office: Office, index?: number) {
        if (!index)
            index = office ? this.Offices.Refs.indexOf(office) : -1;
        else if (!office && this.Offices.Refs.length > index)
            office = this.Offices.Refs[index];
        if (this.Enabled && this.Offices.Refs.length > index) {
            this.arraySplice('Offices.Refs', index, 1) //this.Offices.Refs.splice(index, 1);

            if (office.Id)
                this.Offices.Deleted.push(office.Id);
            if (office.HeadOffice && this.Offices.Refs.length)
                this.MakeHeadOffice(this.Offices.Refs[0], 0); //this.Offices.Refs[0].IsDefault = true;

            this.PropertyChange.Invoke(this, { name: "OfficeCount", value: this.Offices.Refs.length });
        }
    }

    MakeHeadOffice(office: Office, index: number) {
        if (!index)
            index = office ? this.Offices.Refs.indexOf(office) : -1;
        else if (!office && this.Offices.Refs.length > index)
            office = this.Offices.Refs[index];
        if (this.Enabled && !office.HeadOffice) {
            for (var i = 0, l = this.Offices.Refs.length; i < l; i++) {
                if (i == index)
                    this.arraySet('Offices.Refs', i, true, 'HeadOffice');
                else if (this.Offices.Refs[i].HeadOffice)
                    this.arraySet('Offices.Refs', i, false, 'HeadOffice');
            }
        }
    }
}