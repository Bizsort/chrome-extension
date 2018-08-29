import { Action } from '../../src/system'
import { Geocoder as Geocoder$, IInput, Input as Input$ } from '../../src/viewmodel/location/input'
import { IView, Validateable, ViewModel } from '../../src/viewmodel'
import { Address, Geocoder as GeocoderModel, LocationType, ResolvedLocation } from '../../src/model'
import { PopulateWithPath } from '../../src/service/location'
import { Stringify } from '../../src/service/geocoder'
export { Address }

export namespace Geocoder {
    //Foundation.Controls.Location.Edit
    export class Edit extends Geocoder$.Input {
        constructor(protected _master: IEdit) {
            super(_master);
        }

        FromGeocoder(geocoded, resolveCreate?) {
            if (!Object.isEmpty(geocoded) && geocoded.Address) {
                if (geocoded.Address.Address1)
                    this._master.Address1 = geocoded.Address.Address1;
                else if (this._master.Address1)
                    geocoded.Address.Address1 = this._master.Address1;

                if (geocoded.Address.PostalCode)
                    this._master.PostalCode = geocoded.Address.PostalCode;
                else if (this._master.PostalCode)
                    geocoded.Address.PostalCode = this._master.PostalCode;
            }
            super.FromGeocoder(geocoded, resolveCreate);
        }
    }
}

export interface IEdit extends IInput {
    Address1: string;
    PostalCode: string;
}

//Foundation.Controls.Location.Edit
//Geolocation only(no placeMode switching): so don't extend Input
export class Edit extends ViewModel implements IEdit {
    //mixins
    protected _geoedit: Geocoder.Edit;
    public _validateable: Validateable;
    get Validateable(): Validateable {
        return this._validateable;
    }

    constructor(view: IView) {
        super(view);
        this._geoedit = new Geocoder.Edit(this);
        this._geoedit.Resolved.AddHandler((sender, e) => {
            this._resolved(e, this._geoedit.Geocoded);
        });
        this._validateable = new Validateable(this, null, null, (proceed) => {
            this._geoedit.Validate((valid) => {
                if (valid) {
                    var address1 = this.Address1;
                    if (address1) {
                        this._geoedit.Geocoded.Address.Address1 = address1;
                        if (this._address && this._address.Address1 != address1)
                            this._address.Address1 = address1;
                    }
                    var postalCode = this.PostalCode;
                    if (postalCode) {
                        this._geoedit.Geocoded.Address.PostalCode = postalCode;
                        if (this._address && this._address.PostalCode != postalCode)
                            this._address.PostalCode = postalCode;
                    }

                    //Resolve Location.Id on the server
                    this.Resolve(true, (match) => {
                        if ((!match || !this._address) && this.Requirement != Address.Requirement.None) {
                            this._validateable.ErrorInfo.SetError(this._geoedit.ErrorElementName, "Unable to resolve this location");
                            proceed(false);
                        }
                        else
                            proceed(true);
                    });
                }
                else
                    proceed(false);
            }, this.Address1);
        });
    }

    InitAutocomplete(inputElement, types?) {
        this._geoedit.InitAutocomplete(inputElement, types);
    }

    _text: string = '';
    get Text(): string {
        return this._text;
    }
    set Text(text: string) {
        if (this._text != text) {
            this._text = text;
            this.notifyProperty('Text', this._text);
            this.Reset();
        }
    }

    Reset() {
        this._geoedit.Geocoded = null;
        this.Address = null;
    }

    get Geolocation(): GeocoderModel.Geolocation {
        return this._geoedit.Geovalidated;
    }
    get Requirement(): Address.Requirement {
        return this._geoedit.Requirement;
    }
    set Requirement(requirement: Address.Requirement) {
        this._geoedit.Requirement = requirement;
    }

    _address1: string = '';
    get Address1(): string {
        return this._address1;
    }
    set Address1(address1: string) {
        if (this._address1 != address1) {
            this._address1 = address1;
            this.notifyProperty('Address1', this._address1);
        }
    }

    _postalCode: string
    get PostalCode(): string {
        return this._postalCode;
    }
    set PostalCode(postalCode: string) {
        if (this._postalCode != postalCode) {
            this._postalCode = postalCode;
            this.notifyProperty('PostalCode', this._postalCode);
        }
    }

    _address;
    get Address() {
        return this._address;
    }
    set Address(address) {
        if (address && address.Location) {
            PopulateWithPath(address.Location, address.Street || undefined,(location_) => {
                this.populate(address, location_);
            },(ex) => {
                    this._validateable.ErrorInfo.SetError(this._geoedit.ErrorElementName, this._validateable.ViewModel.GetErrorMessage(ex.ErrorMessageType, ex));
                });
        }
        else {
            if (this._address)
                delete this._address;
        }
    }

    populate(address, location_) {
        this._address = address;
        var geocoded = new GeocoderModel.Location();
        geocoded.Address = new GeocoderModel.Address();
        while (location_) {
            switch (location_.Type) {
                case LocationType.Country:
                    geocoded.Address.Country = location_.Name;
                    break;
                case LocationType.State:
                    geocoded.Address.State = location_.Name;
                    break;
                case LocationType.County:
                    geocoded.Address.County = location_.Name;
                    break;
                case LocationType.City:
                    geocoded.Address.City = location_.Name;
                    break;
                case LocationType.Street:
                    geocoded.Address.StreetName = location_.Name;
                    if (address.StreetNumber)
                        geocoded.Address.StreetNumber = address.StreetNumber
                    break;
            }
            location_ = location_.Parent;
        }
        if (address.PostalCode)
            geocoded.Address.PostalCode = address.PostalCode
        if (address.Address1)
            geocoded.Address.Address1 = address.Address1

        if (address.Lat != 0 && address.Lng != 0) {
            geocoded.Geolocation = {
                Lat: address.Lat,
                Lng: address.Lng
            }
        }

        var text = Stringify(geocoded.Address, {
            Country: true,
            Address1: this.Address1 ? false : true
        });
        if (text) {
            this.Text = text; //will reset Geocoded

            this._geoedit.Geocoded = geocoded;
            //this._geoedit.Geovalidated = geocoded.Geolocation;
            //Resolve to raise event with location country
            this.Resolve(false, null);

            if (geocoded.Address.Address1)
                this.Address1 = geocoded.Address.Address1;
            if (geocoded.Address.PostalCode)
                this.PostalCode = geocoded.Address.PostalCode;
        }
    }

    //Account.Create
    //User.Data.Master.Location.Resolve
    /*Resolve(callback?, raiseChanged?, suppressCreate?) {
        var geocoded = this._geoedit.Geocoded;
        if (geocoded && geocoded.Address && geocoded.Address.Country) {
            var match = geocoded.Address.EqualsTo(this._georesolved);
            if (!this._address || !match || raiseChanged) {
                if(!match)
                    this.Address = null;
                var city:any = { Country: geocoded.Address.Country };
                //State and County may not get populated (London, UK)
                if (geocoded.Address.State) {
                    city.State = geocoded.Address.State;
                    //if (geocoded.Address.City)
                    //    city.Name = geocoded.Address.City;
                }
                if (geocoded.Address.County)
                    city.County = geocoded.Address.County;
                if (geocoded.Address.City)
                    city.Name = geocoded.Address.City;
                Resolve(city, geocoded.Address.StreetName, suppressCreate ? false : true, (location_) => {
                    if (location_ && location_.Id > 0) {
                        var address:any = {};
                        if (location_.Type == LocationType.Street) {
                            address.Location = location_.Parent.Id;
                            address.Street = location_.Id;
                            if (geocoded.Address.StreetNumber)
                                address.StreetNumber = geocoded.Address.StreetNumber;
                        }
                        else
                            address.Location = location_.Id;
                        if (geocoded.Address.PostalCode)
                            address.PostalCode = geocoded.Address.PostalCode;
                        if (geocoded.Address.StreetNumber)
                            address.StreetNumber = geocoded.Address.StreetNumber;
                        if (geocoded.Address.Address1)
                            address.Address1 = geocoded.Address.Address1;
                        if (geocoded.Geolocation) {
                            address.Lat = geocoded.Geolocation.Lat;
                            address.Lng = geocoded.Geolocation.Lng;
                        }
                        if (!match || !this._address)
                            this._address = address;
                        if (!match || !this._georesolved)
                            this._georesolved = geocoded.Address;
                        if (this.Changed) {
                            //Use RequireCounty at State level - not currenly needed
                            var country = location_.County;
                            if (country) {
                                this.Changed(country);
                            }
                        }
                    }
                    if (callback)
                        callback(true);
                }, (ex) => {
                        this._validateable.ErrorInfo.SetError(this._geoedit.ErrorElementName, this._validateable.ViewModel.GetErrorMessage(ex.ErrorMessageType, ex));
                        if (callback)
                            callback();
                    });
                return;
            }
            else if (this._address) {
                if (this._address.PostalCode != geocoded.Address.PostalCode)
                    this._address.PostalCode = geocoded.Address.PostalCode;
                if (this._address.StreetNumber != geocoded.Address.StreetNumber)
                    this._address.StreetNumber = geocoded.Address.StreetNumber;
                if (this._address.Address1 != geocoded.Address.Address1)
                    this._address.Address1 = geocoded.Address.Address1;
                if (geocoded.Geolocation) {
                    if ((this._address.Lat != geocoded.Geolocation.Lat || this._address.Lng != geocoded.Geolocation.Lng)) {
                        this._address.Lat = geocoded.Geolocation.Lat;
                        this._address.Lng = geocoded.Geolocation.Lng;
                    }
                }
                else {
                    if (this._address.Lat != 0)
                        delete this._address.Lat;
                    if (this._address.Lng != 0)
                        delete this._address.Lng;
                }
            }
        }
        else
            this.Address = null;
        if (callback)
            callback(this._address ? true : false);
    }*/

    Resolve(allowCreate: boolean, callback?: Action<boolean>) {
        var geocoded = this._geoedit.Geocoded;
        if (geocoded && geocoded.Address && geocoded.Address.Country) {
            this._geoedit.Resolve(allowCreate, (match, location_) => {
                if (this._address && match === true) {
                    if (this._address.PostalCode != geocoded.Address.PostalCode)
                        this._address.PostalCode = geocoded.Address.PostalCode;
                    if (this._address.StreetNumber != geocoded.Address.StreetNumber)
                        this._address.StreetNumber = geocoded.Address.StreetNumber;
                    if (this._address.Address1 != geocoded.Address.Address1)
                        this._address.Address1 = geocoded.Address.Address1;
                    if (geocoded.Geolocation) {
                        if ((this._address.Lat != geocoded.Geolocation.Lat || this._address.Lng != geocoded.Geolocation.Lng)) {
                            this._address.Lat = geocoded.Geolocation.Lat;
                            this._address.Lng = geocoded.Geolocation.Lng;
                        }
                    }
                    else {
                        if (this._address.Lat != 0)
                            delete this._address.Lat;
                        if (this._address.Lng != 0)
                            delete this._address.Lng;
                    }
                }
                else if (!location_ || !location_.Id)
                    this.Address = null;
                if (callback)
                    callback(this._address ? true : false);
            });
            return;
        }
        else
            this.Address = null;
        if (callback)
            callback(this._address ? true : false);
    }

    protected _resolved(location: ResolvedLocation, geocoded: GeocoderModel.Location) {
        if (location && location.Id > 0 && geocoded && geocoded.Address && geocoded.Address.Country) {
            var address: any = {};
            if (location.Type == LocationType.Street) {
                address.Location = location.Parent.Id;
                address.Street = location.Id;
                if (geocoded.Address.StreetNumber)
                    address.StreetNumber = geocoded.Address.StreetNumber;
            }
            else
                address.Location = location.Id;
            if (geocoded.Address.PostalCode)
                address.PostalCode = geocoded.Address.PostalCode;
            if (geocoded.Address.StreetNumber)
                address.StreetNumber = geocoded.Address.StreetNumber;
            if (geocoded.Address.Address1)
                address.Address1 = geocoded.Address.Address1;
            if (geocoded.Geolocation) {
                address.Lat = geocoded.Geolocation.Lat;
                address.Lng = geocoded.Geolocation.Lng;
            }

            this._address = address;
        }
    }
}