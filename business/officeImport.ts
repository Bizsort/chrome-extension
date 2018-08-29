import { BulkEdit, IBulkEdit, BusinessOfficeService, EntityEdit, OfficeCollection, ReadyState } from '../src/viewmodel/business/office/bulkEdit'
import { IView, Page, PopulateOptions, Session } from '../src/page'
import { IBusinessWebSite } from './profile'
import { Action, Submittable } from '../src/viewmodel'
import { AccountType, EntityId, List } from '../src/model'
import { ErrorMessageType, ArgumentException, ArgumentExceptionType, DataException, DataExceptionType, SessionException, SessionExceptionType } from '../src/exception'
import * as Url from '../src/system/url'
export { ReadyState }

interface IOfficeImportStore {
    businessOffices;
}

export class OfficeImport extends BulkEdit {
    protected storage_keys = ['businessWebSite', 'businessOffices'];

    _webSite: string;
    get WebSite(): string {
        return this._webSite;
    }
    set WebSite(webSite: string) {
        this._webSite = webSite;
        this.notifyProperty('WebSite', this._webSite);
    }

    Load(webSite) {
        if (!String.isNullOrWhiteSpace(webSite)) {
            try
            {
                BusinessOfficeService.BulkEdit(webSite, (businessOffices) => {
                    if (businessOffices && businessOffices.Id && businessOffices.Entity) {
                        if (businessOffices.WebSite)
                            this.WebSite = businessOffices.WebSite;
                        this._validateable.ErrorInfo.Clear();
                        this.populateEntity(businessOffices, PopulateOptions.Store | PopulateOptions.Reset);
                        //this.updateMenuItems();
                    }
                    else {
                        this.loadDraft(null, () => { //May Clear ErrorInfo (via createNew or async in storage.local.get)
                            this._validateable.ErrorInfo.SetError('webSite', "No such Business Profile, create one first");
                            this.Invalidate(new DataException(DataExceptionType.RecordNotFound));
                        });
                    }
                }, this.Invalidate.bind(this));
            }
            catch (ex) {
                this.Invalidate(ex);
            }
        }
        else {
            chrome.storage.local.get('businessWebSite', (storeItems: IBusinessWebSite) => {
                if (storeItems.businessWebSite) {
                    chrome.storage.local.remove('businessWebSite');
                    this.WebSite = Url.getBaseUrl(storeItems.businessWebSite);
                    this.Load(this.WebSite);
                }
                else
                    this.loadDraft(null, (business) => {
                        if (business)
                            this.WebSite = business.WebSite;
                    });
            });
        }
    }

    loadDraft(business: EntityEdit<OfficeCollection>, callback?) {
        chrome.storage.local.get(this.storage_keys, (storeItems: IOfficeImportStore) => {
            try
            {
                var businessOffices = storeItems.businessOffices && JSON.parse(storeItems.businessOffices);
                if (businessOffices && businessOffices.Entity && businessOffices.Id === (business ? business.Id : 0)/* && !businessOffices.Entity.Id*/) {
                    this._validateable.ErrorInfo.Clear();
                    this.populateEntity(businessOffices);
                    if (callback)
                        callback(businessOffices.Entity);
                }
                else if (callback)
                    callback();
            }
            catch (ex) {
                this.Invalidate(ex);
            }
        });
    }

    populateEntity(businessOffices: EntityEdit<OfficeCollection>, populateOptions: PopulateOptions = PopulateOptions.None) {
        if (businessOffices && businessOffices.Entity) {
            var offices = businessOffices.Entity;

            if ((populateOptions & PopulateOptions.Store) > 0) {
                this.store(businessOffices);
            }

            this.Entity = businessOffices;
            this.populate(0);
        }
    }

    fetchList(queryInput: List.QueryInput, callback: Action<List.QueryOutput>, faultCallback) {
        callback({ Series: this.Offices.Refs, StartIndex: 0 });
    }

    fetchPage(page: EntityId[], callback: Action<Object[]>, faultCallback: Action<any>) {
        callback(page);
    }

    HandleAction(action: string) {
        switch (action) {
            case "Load":
                if (this.WebSite) {
                    this.Load(this.WebSite);
                }
                else
                    this._validateable.ErrorInfo.SetError('webSite', "Please enter url");
                break;
            case "SaveDraft":
                this.store(this.Entity);
                break;
            case "Submit":
                this.Submit(() => {
                    if (Session.User.SecurityProfile.CanProduce_Business) {
                        if (!this.Business.Id)
                            throw new ArgumentException(ArgumentExceptionType.ValueRequired, "Business");
                    }
                    else if (this.Business.Id != Session.User.Business.Id)
                        throw new SessionException(SessionExceptionType.Unauthorized);

                    BusinessOfficeService.Save({
                        Id: this.Business.Id,
                        CreatedBy: this.Business.CreatedBy,
                        Entity: this.SelectedItems.map(o => this.ListView.Items[<any>o])
                    }, (success) => {
                        if (success) {
                            this.SubmitComplete();
                            this.populateList();
                        }
                    }, this.Invalidate.bind(this));
                });
                break;
            default:
                return super.HandleAction(action);
        }
        return true;
    }

    GetErrorMessage(error: ErrorMessageType, data) {
        switch (error) {
            case ErrorMessageType.Data_RecordNotFound:
                return "Business record for '" + Url.getBaseUrl(this.WebSite) + "' does not exist. You will not be able to save this record";

        }
        return super.GetErrorMessage(error, data);
    }

    store(businessOffices) {
        chrome.storage.local.set({
            "businessOffices": JSON.stringify(businessOffices)
        });
    }
}