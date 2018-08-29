import { Edit, EditMode, EntityEdit, MultiProduct as MultiProduct$, ReadyState } from '../src/viewmodel/business/multiProduct/edit'
import { IView, Page, PopulateOptions, Session } from '../src/page'
import { IBusinessWebSite } from './profile'
import { AccountType, ProductsView } from '../src/model'
import { RTE } from '../component/richtext/rte'
import { ErrorMessageType, ArgumentException, ArgumentExceptionType, DataException, DataExceptionType, SessionException, SessionExceptionType } from '../src/exception'
import * as BusinessService from '../src/service/admin/business'
import * as Resource from '../src/resource'
import * as Url from '../src/system/url'
export { EditMode, ReadyState }

declare global {
    var Settings: any;
}

interface IMultiProductStore {
    multiProduct;
    multiProductTextFeatures;
    multiProductMenuItems;
}

export class MultiProduct extends Edit {
    protected storage_keys = ['businessWebSite', 'multiProduct', 'multiProductTextFeatures', 'multiProductMenuItems'];

    _webSite: string;
    get WebSite(): string {
        return this._webSite;
    }
    set WebSite(webSite: string) {
        this._webSite = webSite;
        this.notifyProperty('WebSite', this._webSite);
    }

    constructor(view: IView) {
        super(view);

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log("multiProduct.js: chrome.runtime.onMessage.addListener(" + JSON.stringify(request) + ")");
            /*Doesn't seem to work
            if (request.productWebUrl)
            {
                $('#webSite').val(request.productWebUrl);
                Page.Load(request.productWebUrl);
            }
            else*/ if (request.multiProduct) {
                //https://developer.chrome.com/extensions/storage
                chrome.storage.local.get(this.storage_keys, (storeItems: IMultiProductStore) => {
                    var multiProduct = JSON.parse(storeItems.multiProduct);
                    if (multiProduct) {
                        var menuItems = storeItems.multiProductMenuItems || {},
                            populate = (populateOptions) => {
                                if (!Settings.DisableCleansing) {
                                    var processedSelection = RTE.cleanseRichText(multiProduct.Entity.RichText, request.url, true);
                                    if (processedSelection) {
                                        multiProduct.Entity.RichText = processedSelection;
                                        populateOptions = PopulateOptions.Store;
                                    }
                                }
                                Page.setMenuItem(menuItems, name);
                                this.updateMenuItems(menuItems, null, processedSelection);
                                this.populateEntity(multiProduct, populateOptions);
                            };
                        for (var name in request.multiProduct) {
                            switch (name) {
                                case "Description":
                                case "Description1":
                                    populate(PopulateOptions.None);
                                    break;
                                /*case "NameTextList":
                                    if (storeItems.multiProductTextFeatures) {
                                        this.parseTextFeatures(multiProduct.Entity, storeItems.multiProductTextFeatures, request.url, (richText) => {
                                            multiProduct.Entity.RichText = richText;
                                            populate(PopulateOptions.Store);
                                        });
                                    }
                                    break;*/
                            }
                        }
                    }
                });
            }
        });
    }

    Initialize() {
        super.Initialize();

        this.deleteHandler = () => {
            if (this.EditMode == EditMode.Edit) {
                //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                if (this.Product.Updated && typeof this.Product.Updated == "string") //keep it a s JSON string to allow for repeated saving/reading to/from storage.local
                    this.Product.Updated = new Date(JSON.parse(this.Product.Updated));
                BusinessService.DeleteMultiProduct(this.Business.Id, {
                    Value: this.Product.Id,
                    Timestamp: this.Product.Updated
                }, (success) => {
                    if (success) {
                        this.DeleteComplete();
                        this.createNew(this.Entity);
                    }
                }, this.Invalidate.bind(this));
            }
        };
    }

    Load(webSite, productId?: number) {
        if (!String.isNullOrWhiteSpace(webSite)) {
            try
            {
                BusinessService.EditMultiProduct(webSite, productId || 0, true, (businessMultiProduct) => {
                    if (businessMultiProduct && businessMultiProduct.Id) {
                        if (businessMultiProduct.WebSite)
                            this.WebSite = businessMultiProduct.WebSite;
                        if (businessMultiProduct.Entity && businessMultiProduct.Entity.Id) {
                            this._validateable.ErrorInfo.Clear();
                            //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                            if (businessMultiProduct.Entity.Updated) //keep it as JSON string to allow for repeated saving/reading to/from storage.local
                                businessMultiProduct.Entity.Updated = JSON.stringify(businessMultiProduct.Entity.Updated);
                            this.populateEntity(businessMultiProduct, PopulateOptions.Store | PopulateOptions.Reset);
                            this.updateMenuItems();
                        }
                        else
                            this.loadDraft(() => { //May Clear ErrorInfo (via createNew or async in storage.local.get)
                                this._validateable.ErrorInfo.SetError('webSite', Resource.Exception.Data_RecordNotFound);
                            }, businessMultiProduct);
                    }
                    else {
                        this.loadDraft(() => { //May Clear ErrorInfo (via createNew or async in storage.local.get)
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
                    this.loadDraft((business) => {
                        if (business)
                            this.WebSite = business.WebSite;
                    });
            });
        }
    }

    createNew(businessMultiProduct: EntityEdit<MultiProduct$>, populateOptions?) {
        try
        {
            businessMultiProduct = businessMultiProduct || {
                AccountType: AccountType.Business,
                Id: 0,
                Name: '',
                Category: 0,
                ProductsView: 0
            };
            populateOptions = populateOptions ||
                (PopulateOptions.Store | PopulateOptions.Reset);
            businessMultiProduct.Entity = {
                Id: 0
            };
            this._validateable.ErrorInfo.Clear();
            this.populateEntity(businessMultiProduct, populateOptions);
            this.updateMenuItems();
            return businessMultiProduct.Entity;
        }
        catch (ex) {
            this.Invalidate(ex);
        }
    }

    loadDraft(callback, business?: EntityEdit<MultiProduct$>) {
        chrome.storage.local.get(this.storage_keys, (storeItems: IMultiProductStore) => {
            try
            {
                var businessMultiProduct = storeItems.multiProduct && JSON.parse(storeItems.multiProduct);
                if (businessMultiProduct && businessMultiProduct.Entity && businessMultiProduct.Id === (business ? business.Id : 0) && businessMultiProduct.Entity.Id === 0) {
                    this._validateable.ErrorInfo.Clear();
                    this.populateEntity(businessMultiProduct);
                    if (callback)
                        callback(businessMultiProduct.Entity);
                }
                else {
                    businessMultiProduct = this.createNew(business);
                    if (callback)
                        callback(businessMultiProduct);
                }
            }
            catch (ex) {
                this.Invalidate(ex);
            }
        });
    }

    populateEntity(businessMultiProduct: EntityEdit<MultiProduct$>, populateOptions: PopulateOptions = PopulateOptions.None) {
        if (businessMultiProduct && businessMultiProduct.Entity) {
            var product = businessMultiProduct.Entity;
            $('#id').text(product.Id + (this.EditMode == EditMode.Edit ? ' (Edit)' : ' (New)'));

            if ((populateOptions & PopulateOptions.Store) > 0) {
                this.store(businessMultiProduct);
            }

            this.Entity = businessMultiProduct; //Will set _editable.Entity
        }
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
                this.Product.RichText = this._richText.html;
                this.store(this.Entity);
                break;
            case "CleanseRichText":
                var html = RTE.cleanseRichText(this._richText.html, this.WebSite);
                if (html) {
                    this.Product.RichText = html;
                    this.populateEntity(this.Entity, PopulateOptions.Store);
                }
                break;
            case "Submit":
                this.Submit(() => {
                    /*http://stackoverflow.com/questions/4102744/jquery-html-returns-invalid-img
                    https://github.com/GeReV/NSoup
                    https://github.com/MindTouch/SGMLReader
                    */
                    this.Product.RichText = RTE.toXHtml(this._richText.html);
                    //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                    if (this.Product.Updated && typeof this.Product.Updated == "string") //keep it a s JSON string to allow for repeated saving/reading to/from storage.local
                        this.Product.Updated = new Date(JSON.parse(this.Product.Updated));

                    if (this.EditMode == EditMode.New) {
                        if (Session.User.SecurityProfile.CanProduce_Product) {
                            if (!this.Business.Id)
                                throw new ArgumentException(ArgumentExceptionType.ValueRequired, "Business");
                        }
                        else if (this.Business.Id != Session.User.Business.Id)
                            throw new SessionException(SessionExceptionType.Unauthorized);
                    }
                    else if (!(Session.User.SecurityProfile.CanEdit_All /*|| this.Product.CreatedBy == Session.User.Id*/)) {
                        if (this.Business.Id != Session.User.Business.Id)
                            throw new SessionException(SessionExceptionType.Unauthorized);
                    }

                    BusinessService.SaveMultiProduct(this.Entity, (product) => {
                        if (product.Value > 0) {
                            this.SubmitComplete();
                            this.Load(this.WebSite, product.Value);
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

    /*parseTextFeatures(product, descriptionTextFeatures, url, callback) {
        this.ReadyState = ReadyState.Submitting;
        try {
            Admin.Service.Product.Profile.FromTextFeatures(JSON.stringify(descriptionTextFeatures), url.origin, true, (p) => {
                this.ReadyState = ReadyState.Ready;
                if (callback)
                    callback(p.Description);
            }, this.Invalidate.bind(this));
        }
        catch (ex) {
            this.Invalidate(ex);
        }
    }*/

    store(businessMultiProduct) {
        chrome.storage.local.set({
            multiProduct: JSON.stringify(businessMultiProduct)
        });
    }

    updateMenuItems(menuItems?, supressNotify?, processedSelection?) {
        menuItems = menuItems || {
            Description: {
                isSet: false
            },
            Description1: {
                isSet: false
            }
        };
        chrome.storage.local.set({
            multiProductMenuItems: menuItems
        });
        if (!supressNotify)
            Page.notifyContentScript(processedSelection ? Object.mixin(menuItems, {
                ProcessedSelection: processedSelection
            }) : menuItems);
    }
}