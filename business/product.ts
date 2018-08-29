import { Edit, EditMode, EntityEdit, BusinessProduct, ReadyState } from '../src/viewmodel/business/product/edit'
import { IView, Page, PopulateOptions, Session } from '../src/page'
import { AccountType, Currency, ProductType } from '../src/model'
import { Status as ProductStatus } from '../src/model/product'
import { Cache as ImageCache } from '../src/service/image'
import { ErrorMessageType, ArgumentException, ArgumentExceptionType, OperationException, OperationExceptionType } from '../src/exception'
import { RTE } from '../component/richtext/rte'
import * as BusinessService from '../src/service/admin/business'
import * as Resource from '../src/resource'
import * as Url from '../src/system/url'
export { EditMode, ProductType, ReadyState }

declare global {
    var Settings: any;
}

interface IProductWebUrl {
    productWebUrl;
}

interface IBusinessProductStore {
    businessProduct;
    productMenuItems;
    productImage;
}

export class Product extends Edit {
    protected storage_keys = ['productWebUrl', 'businessProduct', 'productImage', 'productMenuItems'];

    _webUrl: string;
    get WebUrl(): string {
        return this._webUrl;
    }
    set WebUrl(webSite: string) {
        this._webUrl = webSite;
        this.notifyProperty('WebUrl', this._webUrl);
    }

    constructor(view: IView) {
        super(view, {
            rules: {
                webUrl: "required"
            },
            messages: {
                webUrl: String.format(Resource.Global.Editor_Error_Enter_X, "Web url")
            }
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log("businessProduct.js: chrome.runtime.onMessage.addListener(" + JSON.stringify(request) + ")");
            if (request.businessProduct) {
                //https://developer.chrome.com/extensions/storage
                chrome.storage.local.get(this.storage_keys, (storeItems: IBusinessProductStore) => {
                    var businessProduct = JSON.parse(storeItems.businessProduct);
                    if (businessProduct) {
                        var menuItems = storeItems.productMenuItems || {}, processedSelection,
                            notifyPropName;
                        for (var name in request.businessProduct) {
                            processedSelection = null;
                            switch (name) {
                                case "Title":
                                    this.Product.Master[name] = businessProduct.Entity.Master[name];
                                    this.notifyProperty('Product.Master.' + name, this.Product.Master[name]);
                                    Page.setMenuItem(menuItems, name);
                                    break;
                                case "Description":
                                case "Description1":
                                    if (!Settings.DisableCleansing) {
                                        processedSelection = RTE.cleanseRichText(businessProduct.Entity.Master.RichText, request.url, true);
                                        if (processedSelection)
                                            this.Product.Master.RichText = processedSelection;
                                    }
                                    if (!processedSelection)
                                        this.Product.Master.RichText = businessProduct.Entity.Master.RichText;
                                    this.notifyProperty('Product.Master.RichText', this.Product.Master.RichText);
                                    Page.setMenuItem(menuItems, name);
                                    break;
                                case "Image":
                                case "Image1":
                                    if (storeItems.productImage && storeItems.productImage.Preview) {
                                        this.setImage(this.Business, storeItems.productImage, name == "Image");
                                        Page.setMenuItem(menuItems, name);
                                    }
                                    break;
                            }
                        }
                        this.updateMenuItems(menuItems, null, processedSelection);
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
                if (this.Product.Master.Updated && typeof this.Product.Master.Updated == "string") //keep it a s JSON string to allow for repeated saving/reading to/from storage.local
                    this.Product.Master.Updated = new Date(JSON.parse(this.Product.Master.Updated));
                BusinessService.Product.Delete(this.Entity.Id, {
                    Value: this.Product.Id,
                    Timestamp: this.Product.Updated,
                    CreatedBy: this.Product.CreatedBy //Temp value for auth check
                }, this.Product.Master.Updated, (success) => {
                    if (success) {
                        this.DeleteComplete();
                        this.createNew(this.Entity);
                    }
                }, this.Invalidate.bind(this));
            }
        };
    }

    Load(webUrl) {
        if (!String.isNullOrWhiteSpace(webUrl)) {
            try
            {
                //Server will throw ArgumentException(ValueRequired, "Business") if Business record does not exist for base Url!
                BusinessService.Product.Edit(Session.User.Business.Id, webUrl, true, (businessProduct) => {
                    if (businessProduct && businessProduct.Id) {
                        if (businessProduct.Entity && businessProduct.Entity.Id) {
                            this.WebUrl = businessProduct.Entity.WebUrl;
                            this._validateable.ErrorInfo.Clear();
                            this._deleteConfirm.MessageArgs["Title"] = businessProduct.Entity.Master.Title;
                            //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                            if (businessProduct.Entity.Updated) //keep it as JSON string to allow for repeated saving/reading to/from storage.local
                                businessProduct.Entity.Updated = JSON.stringify(businessProduct.Entity.Updated);
                            if (businessProduct.Entity.Master.Updated)
                                businessProduct.Entity.Master.Updated = JSON.stringify(businessProduct.Entity.Master.Updated);
                            this.populateEntity(businessProduct, PopulateOptions.Store | PopulateOptions.Reset); //Setting populateOptions to Reset will call populateCategory and remove productImage
                            this.updateMenuItems();
                        }
                        else {
                            this.loadDraft(() => { //May Clear ErrorInfo (via createNew or async in storage.local.get)
                                this._validateable.ErrorInfo.SetError('webUrl', Resource.Exception.Data_RecordNotFound);
                            }, businessProduct);
                        }
                    }
                    else {
                        this.loadDraft(() => { //May Clear ErrorInfo (via createNew or async in storage.local.get)
                            this._validateable.ErrorInfo.SetError('webUrl', "No such Business Profile, create one first");
                            this.Invalidate(new ArgumentException(ArgumentExceptionType.ValueRequired, "Business"));
                        });
                    }
                }, this.Invalidate.bind(this));
            }
            catch (ex) {
                this.Invalidate(ex);
            }
        }
        else {
            chrome.storage.local.get('productWebUrl',(storeItems: IProductWebUrl) => {
                if (storeItems.productWebUrl) {
                    chrome.storage.local.remove('productWebUrl');
                    this.WebUrl = storeItems.productWebUrl;
                    this.Load(this.WebUrl);
                }
                else
                    this.loadDraft((businessProduct) => {
                        if (businessProduct)
                            this.WebUrl = businessProduct.WebUrl;
                    });
            });
        }
    }

    createNew(businessProduct: EntityEdit<BusinessProduct.Profile>, populateOptions?) {
        try
        {
            businessProduct = businessProduct || {
                AccountType: AccountType.Business,
                Id: 0,
                Name: '',
                Category: 0,
                ProductsView: 0
            };
            populateOptions = populateOptions ||
                (PopulateOptions.Store | PopulateOptions.Reset); //Setting populateOptions to Reset will call populateCategory and remove productImage
            businessProduct.Entity = new BusinessProduct.Profile();
            if (businessProduct.Id) {
                if (businessProduct.Category)
                    businessProduct.Entity.Master.Category = businessProduct.Category;
            }
            this._validateable.ErrorInfo.Clear();
            this._deleteConfirm.MessageArgs = {};
            this.populateEntity(businessProduct, populateOptions);
            if ((populateOptions & PopulateOptions.Reset) == 0)
                this.populateCategory(businessProduct.Entity.Master.Category);
            this.updateMenuItems();
            return businessProduct.Entity;
        }
        catch (ex) {
            this.Invalidate(ex);
        }
    }

    loadDraft(callback, business?: EntityEdit<BusinessProduct.Profile>) {
        chrome.storage.local.get(this.storage_keys,(storeItems: IBusinessProductStore) => {
            try
            {
                var businessProduct = storeItems.businessProduct && JSON.parse(storeItems.businessProduct);
                if (businessProduct && businessProduct.Entity && businessProduct.Id === (business ? business.Id : 0) && businessProduct.Entity.Id === 0) {
                    this._validateable.ErrorInfo.Clear();
                    //if (storeItems.productImage)
                    //    this.setImage(businessProduct, storeItems.productImage);
                    this.populateEntity(businessProduct);
                    this.populateCategory(businessProduct.Entity.Master.Category);
                    if (callback)
                        callback(businessProduct.Entity);
                }
                else {
                    businessProduct = this.createNew(business);
                    if (callback)
                        callback(businessProduct);
                }
            }
            catch (ex) {
                this.Invalidate(ex);
            }
        });
    }

    populateEntity(businessProduct: EntityEdit<BusinessProduct.Profile>, populateOptions: PopulateOptions = PopulateOptions.None) {
        if (businessProduct && businessProduct.Entity) {
            var product = businessProduct.Entity;
            $('#id').text(product.Id + (this.EditMode == EditMode.Edit ? ' (Edit)' : ' (New)'));
            ["Title"].forEach(function (prop) {
                if (product.Master[prop] === undefined)
                    product.Master[prop] = '';
            });

            if ((populateOptions & PopulateOptions.Store) > 0) {
                this.store(businessProduct);
                    
                if ((populateOptions & PopulateOptions.Reset) > 0) {
                    this.populateCategory(product.Master.Category);
                    chrome.storage.local.remove(['productImage']);
                }
            }
                
            this.Entity = businessProduct; //Will set _editable.Entity
        }
    }

    GetErrorMessage(error: ErrorMessageType, data) {
        switch (error) {
            case ErrorMessageType.Argument_ValueRequired:
                if (data.ParamName == 'Business')
                    return "Business record for '" + Url.getBaseUrl(this.WebUrl) + "' does not exist. You will not be able to save this product/service";

        }
        return super.GetErrorMessage(error, data);
    }

    HandleAction(action: string) {
        switch (action) {
            case "Load":
                if (this.WebUrl) {
                    this.Load(this.WebUrl);
                }
                else
                    this._validateable.ErrorInfo.SetError('webUrl', "Please enter url");
                break;
            case "CreateNew":
                this.createNew(this.Entity);
                break;
            case "SaveDraft":
                this.Product.WebUrl = this.WebUrl;
                this.Product.Master.RichText = this._richText.html;
                this.store(this.Entity);
                break;
            case "CleanseRichText":
                var pageSeparator = this.WebUrl ? this.WebUrl.lastIndexOf('/') : 0;
                var html = RTE.cleanseRichText(this._richText.html, pageSeparator > 10 ? this.WebUrl.substring(0, pageSeparator) : this.WebUrl);
                if (html) {
                    this.Product.Master.RichText = html;
                    this.populateEntity(this.Entity, PopulateOptions.Store);
                }
                break;
            case "Submit":
                this.Product.WebUrl = this.WebUrl;
                this.Submit(() => {
                    /*http://stackoverflow.com/questions/4102744/jquery-html-returns-invalid-img
                    https://github.com/GeReV/NSoup
                    https://github.com/MindTouch/SGMLReader
                    */
                    this.Product.Master.RichText = RTE.toXHtml(this._richText.html);
                    //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                    if (this.Product.Updated && typeof this.Product.Updated == "string") //keep it a s JSON string to allow for repeated saving/reading to/from storage.local
                        this.Product.Updated = new Date(JSON.parse(this.Product.Updated));
                    if (this.Product.Master.Updated && typeof this.Product.Master.Updated == "string") //keep it a s JSON string to allow for repeated saving/reading to/from storage.local
                        this.Product.Master.Updated = new Date(JSON.parse(this.Product.Master.Updated));

                    if (this.EditMode == EditMode.New) {
                        if (!this.Entity.Id) {
                            if (!Session.User.SecurityProfile.CanProduce_Product && Session.User.Business.Id)
                                this.Entity.Id = Session.User.Business.Id;
                            else
                                throw new OperationException(OperationExceptionType.Invalid);
                        }
                    }

                    //Hardcoded for now
                    if (!this.Product.Price.Currency)
                        this.Product.Price.Currency = Currency.ItemType.CAD;

                    this.Product.Status = ProductStatus.Pending;

                    BusinessService.Product.Save(this.Entity, ImageCache.Get(this.Product.Images.Refs), (product) => {
                        ImageCache.Clear();
                        if (product.Value > 0) {
                            this.SubmitComplete();
                            this.Load(this.Product.WebUrl);
                        }
                    }, this.Invalidate.bind(this));
                });
                break;
            default:
                return super.HandleAction(action);

        }
        return true;
    }

    populateCategory(category) {
        this._category.Populate(category || 0);
        this.reflectCategory(category);
        if (!this._category.Enabled)
            this._category.Enabled = true;
    }

    setImage(product, image, reset) {
        this._image.AddImage(image, reset);
        product.Images = this._image.Images;
    }

    store(businessProduct) {
        chrome.storage.local.set({
            businessProduct: JSON.stringify(businessProduct)
        });
    }

    updateMenuItems(menuItems?, supressNotify?, processedSelection?) {
        menuItems = menuItems || {
            Title: {
                isSet: false
            },
            Description: {
                isSet: false
            },
            Description1: {
                isSet: false
            },
            Image: {
                isSet: false
            }
        };
        chrome.storage.local.set({
            productMenuItems: menuItems
        });
        if (!supressNotify)
            Page.notifyContentScript(processedSelection ? Object.mixin(menuItems, {
                ProcessedSelection: processedSelection
            }) : menuItems);
    }
}