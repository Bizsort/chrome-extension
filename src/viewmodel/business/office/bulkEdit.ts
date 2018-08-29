import { Action, Action2, ErrorOptions, IView, ReadyState, Submittable, Validateable, ValidationContext } from '../../../viewmodel'
import { View as ListView } from '../../list/view'
import { EntityEdit, OfficeCollection, Office as BusinessOffice } from '../../../model/admin/business'
import { Form as Confirm, StringFormatter } from '../../../../component/confirm/form'
import { DataException, DataExceptionType } from '../../../exception'
import { Office as BusinessOfficeService } from '../../../service/admin/business'
export { Action, BusinessOfficeService, EntityEdit, OfficeCollection, ReadyState } 

export interface IBulkEdit {
    Offices: OfficeCollection;
}

type Constructor<T> = new (...args: any[]) => T;

//https://github.com/Microsoft/TypeScript/issues/5843
//Error	TS2345	Argument of type 'typeof ListView' is not assignable to parameter of type 'Constructor<ViewModel>'.
export abstract class BulkEdit extends Submittable(ListView as Constructor<ListView>) {
    protected _deleteConfirm: Confirm;

    _businessOffices: EntityEdit<OfficeCollection>;
    set Entity(businessOffices: EntityEdit<OfficeCollection>) {
        this._businessOffices = businessOffices;
        this.notifyProperty('Business', businessOffices);
        this.notifyProperty('Offices', businessOffices.Entity);
    }
    get Business(): EntityEdit<OfficeCollection> {
        return this._businessOffices;
    }
    get Offices(): OfficeCollection {
        return this._businessOffices.Entity;
    }

    constructor(view: IView) {
        super(view);

        this._validateable = new Validateable(this, new ValidationContext()); //To support this._validateable.ErrorInfo.Clear() and .SetError('webSite', '...') in Admin.PageModel.Business.OfficeImport
    }

    Initialize() {
        super.Initialize();
        //this.ListHeader.Entity = Resource.Dictionary.office;
        this._deleteConfirm = this.getViewModel<Confirm>('deleteConfirm');
        this._deleteConfirm.MessageFormat = new StringFormatter("Do you want to delete {0} company Offices?", ["Selected"]);
        this._deleteConfirm.Confirm = () => {
            BusinessOfficeService.Delete({
                Id: this.Business.Id,
                CreatedBy: this.Business.CreatedBy,
                Entity: this.SelectedItems.map(s => this.ListView.Items[<any>s].Id)
            }, (success) => {
                if (success) {
                    this._deleteConfirm.Hide();
                    this.populateList();
                }
            }, this._deleteConfirm.Invalidate.bind(this._deleteConfirm));
        };
    }

    populateList() {
        BusinessOfficeService.BulkEdit(this.Business.Id, (businessOffices) => {
            if (businessOffices && businessOffices.Id == this.Business.Id && businessOffices.Entity) {
                this._businessOffices.Entity = businessOffices.Entity;
                this.populate(0);
            }
            else
                this.Invalidate(new DataException(DataExceptionType.RecordNotFound));
        }, this.Invalidate.bind(this));
    }

    MergeOffice(office: BusinessOffice, callback: Action2<BusinessOffice, any>, faultCallback, arg) {
        BusinessOfficeService.MergeNew({
            Id: this.Business.Id,
            CreatedBy: this.Business.CreatedBy,
            Entity: office
        }, (success) => {
            callback(success, arg);
        }, faultCallback ? (ex) => {
            faultCallback(ex, arg);
        } : null);
    }

    HandleAction(action: string) {
        switch (action) {
            case "Delete":
                if (this.SelectedItems.length)
                    this._deleteConfirm.MessageArgs["Selected"] = this.SelectedItems.length;
                this._deleteConfirm.Show();
                break;
            default:
                return super.HandleAction(action);
        }
    }
}