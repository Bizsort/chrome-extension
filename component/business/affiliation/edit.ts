import { Action } from '../../../src/system'
import { EntityId } from '../../../src/model'
import { ViewModel } from '../../../src/viewmodel'
import { ImageSize,  Preview } from '../../../src/model/business'
import { Affiliation } from '../../../src/model/admin/business'
import * as AdminService from '../../../src/service/admin/business'
import * as UserService from '../../../src/service/business'

export class Edit extends ViewModel {

    Business: EntityId;

    _affiliations: Affiliation.Collection;
    set Affiliations(affiliations: Affiliation.Collection) {
        if (affiliations && affiliations.Refs && affiliations.Refs.length) {
            UserService.ToPreview(affiliations.Refs.map((ba) => {
                return ba.Business; //{ Id: ba.Business.Id }
            }), null, ImageSize.Card, (items) => {
                var item;
                for (var i = 0, l = affiliations.Refs.length; i < l; i++) {
                    if (items[i].Id == affiliations.Refs[i].Business.Id) {
                        item = items[i];
                    }
                    else {
                        item = null;
                        for (var j = 0, l2 = items.length; j < l2; j++) {
                            if (items[j].Id == affiliations.Refs[i].Business.Id) {
                                item = items[j];
                                break;
                            }
                        }
                    }
                    if (item)
                        affiliations.Refs[i].Business = item;
                }
                this.setAffiliations(affiliations);
            }, null);
        }
        else
            this.setAffiliations(affiliations);
    }
    setAffiliations(affiliations: Affiliation.Collection) {
        this._affiliations = affiliations;
        this.notifyProperty("Affiliations", this._affiliations);
        this.PropertyChange.Invoke(this, { name: "AffiliationCount", value: this._affiliations && this._affiliations.Refs ? this._affiliations.Refs.length : 0 });
    }

    get Affiliations(): Affiliation.Collection {
        return this._affiliations;
    }

    _enabled = false;
    set Enabled(enabled) {
        if (this._enabled != enabled) {
            this._enabled = enabled;
            this.notifyProperty("Enabled", this._enabled);
        }
    }
    get Enabled() {
        return this._enabled;
    }

    AddAffiliation(affiliation: string, callback: Action<Preview>) {
        if (this.Enabled && affiliation) {
            AdminService.Affiliation.ToPreview(this.Business.Id, affiliation, true, ImageSize.Card, (preview) => {
                if (preview) {
                    var exists = this.Affiliations.Refs.find((a) => {
                        if (a.Business.Id == preview.Id)
                            return true;
                    });
                    if (!exists) {
                        this.arrayPush('Affiliations.Refs', {
                            Id: 0,
                            Business: preview
                        }); //this.Affiliations.Refs.push(image);
                        this.PropertyChange.Invoke(this, { name: "AffiliationCount", value: this.Affiliations.Refs.length });
                    }
                }
                if (callback)
                    callback(preview);
            }, null);
        }
    }

    RemoveAffiliation(affiliation: Affiliation.Ref, index?: number) {
        if (typeof index !== 'number')
            index = affiliation ? this.Affiliations.Refs.indexOf(affiliation) : -1;
        if (index >= 0 && this.Affiliations.Refs.length > index && this.Enabled) {
            this.arraySplice('Affiliations.Refs', index, 1); //this.Affiliations.Refs.splice(index, 1);

            if (affiliation.Id)
                this.Affiliations.Deleted.push(affiliation.Id);

            this.PropertyChange.Invoke(this, { name: "AffiliationCount", value: this.Affiliations.Refs.length });
        }
    }
}