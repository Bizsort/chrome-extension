import { BusinessProfile as BusinessProfile$, Edit, EditMode, EntityEdit, ReadyState } from '../src/viewmodel/business/edit'
import { IView, Page, PopulateOptions, Session } from '../src/page'
import { AccountType, TransactionType } from '../src/model'
import { Office as OfficeModel } from '../src/model/admin/business'
import { Cache as ImageCache } from '../src/service/image'
import { SessionException, SessionExceptionType } from '../src/exception'
import { Edit as Affiliations } from '../component/business/affiliation/edit'
import { RTE } from '../component/richtext/rte'
import * as BusinessService from '../src/service/admin/business'
import * as GooglePlaces from '../src/service/googleplaces'
import * as Resource from '../src/resource'
import * as Url from '../src/system/url'
export { EditMode, ReadyState }

declare global {
    var Settings: any;
}

export interface IBusinessWebSite {
    businessWebSite;
}

interface IBusinessProfileStore {
    businessProfile;
    businessMenuItems;
    businessAddress;
    businessImage;
}

//https://github.com/Microsoft/TypeScript/issues/563
interface BusinessProfile extends BusinessProfile$ {
    EditOffice: OfficeModel;
    NewAffiliation: string;
}

export class Profile extends Edit {
    protected storage_keys = ['businessWebSite', 'businessProfile', 'businessAddress', 'businessImage', 'businessMenuItems'];

    _webSite: string;
    get WebSite(): string {
        return this._webSite;
    }
    set WebSite(webSite: string) {
        this._webSite = webSite;
        this.notifyProperty('WebSite', this._webSite);
    }

    //https://github.com/Microsoft/TypeScript/issues/338
    //http://stackoverflow.com/questions/14444360/how-can-i-access-the-superclass-value-of-a-getter-in-a-subclass
    /*get Business(): BusinessProfile {
        return <BusinessProfile>Object.getOwnPropertyDescriptor(ViewModel$.Business.Edit.prototype, 'Business').get.apply(this);
    }*/
    Business: BusinessProfile

    get EditOffice(): OfficeModel {
        return this._office && this._office.Office;
    }

    protected _affiliations: Affiliations;
    get Affiliations(): Affiliations {
        return this._affiliations;
    }

    constructor(view: IView) {
        super(view, {
            rules: {
                webSite: "required"
            },
            messages: {
                webSite: String.format(Resource.Global.Editor_Error_Enter_X, "Web site url")
            }
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log("business.js: chrome.runtime.onMessage.addListener(" + JSON.stringify(request) + ")");
            if (request.businessProfile) {
                //https://developer.chrome.com/extensions/storage
                chrome.storage.local.get(this.storage_keys, (storeItems: IBusinessProfileStore) => {
                    var businessProfile = JSON.parse(storeItems.businessProfile);
                    if (businessProfile) {
                        var menuItems = storeItems.businessMenuItems || {}, processedSelection, propName;
                        for (var name in request.businessProfile) {
                            processedSelection = null;
                            switch (name) {
                                case "Email":
                                case "Name":
                                    this.Business[name] = businessProfile.Entity[name];
                                    this.notifyProperty('Business.' + name, this.Business[name]);
                                    Page.setMenuItem(menuItems, name);
                                    break;
                                case "Description":
                                case "Description1":
                                    if (!Settings.DisableCleansing) {
                                        processedSelection = RTE.cleanseRichText(businessProfile.Entity.RichText, request.url, true);
                                        if (processedSelection)
                                            this.Business.RichText = processedSelection;
                                    }
                                    if (!processedSelection)
                                        this.Business.RichText = businessProfile.Entity.RichText;
                                    this.notifyProperty('Business.RichText', this.Business.RichText);
                                    Page.setMenuItem(menuItems, name);
                                    break;
                                case "Phone":
                                case "Phone1":
                                case "Fax":
                                    this.Business.EditOffice[name] = businessProfile.Entity.EditOffice[name];
                                    this._office.notifyProperty('Office.' + name, this.Business.EditOffice[name]);
                                    Page.setMenuItem(menuItems, name);
                                    break;
                                case "OfficeName":
                                    propName = "Name";
                                    this.Business.EditOffice[propName] = businessProfile.Entity.EditOffice[propName];
                                    this._office.notifyProperty('Office.' + propName, this.Business.EditOffice[propName]);
                                    Page.setMenuItem(menuItems, name);
                                    break;
                                case "Address1":
                                case "PostalCode":
                                    this.Business.EditOffice.Address[name] = businessProfile.Entity.EditOffice.Address[name];
                                    this._office.Location.notifyProperty(name, this.Business.EditOffice.Address[name]);
                                    Page.setMenuItem(menuItems, name);
                                    break;
                                case "Address":
                                    if (storeItems.businessAddress) {
                                        this.setAddress(this.Business, storeItems.businessAddress/*, business.Address.Address1*/); //Reset Address1 when Address is set
                                        Page.setMenuItem(menuItems, name);
                                    }
                                    break;
                                case "Image":
                                    if (storeItems.businessImage && storeItems.businessImage.Preview) {
                                        this.setImage(this.Business, storeItems.businessImage);
                                        Page.setMenuItem(menuItems, name);
                                    }
                                    break;
                                case "Affiliation":
                                    var webSite = businessProfile.Entity.NewAffiliation && Url.getBaseUrl(businessProfile.Entity.NewAffiliation);
                                    if (webSite && webSite.indexOf('http') === 0) {
                                        this._affiliations.AddAffiliation(webSite, (preview) => {
                                            if (preview) {
                                                Page.setMenuItem(menuItems, name);
                                                this.updateMenuItems(menuItems, null, '<div><img src="' + preview.Image.ImageRef + '"/><div style="padding: 10px; text-align: center;"><span style="font-size: 16px; font-weight: 400;">' + preview.Name + '</span></div></div>');
                                            }
                                            else
                                                this.updateMenuItems(menuItems, null, '<span style="color: firebrick;">No such business: ' + webSite + '</span>');
                                        });
                                    }
                                    if (this.Business.NewAffiliation)
                                        delete this.Business.NewAffiliation;
                                    Page.setMenuItem(menuItems, name);
                                    processedSelection = false;
                                    break;
                            }
                        }
                        if (processedSelection !== false)
                            this.updateMenuItems(menuItems, null, processedSelection);
                    }
                });
            }
        });
    }

    Initialize() {
        super.Initialize();
        this._office.PropertyChange.AddHandler((sender, e) => {
            if (e.name == 'Office') {
                if (e.value) {
                    this._office.Validateable.ErrorInfo.Clear();
                    this._office.Location.Validateable.ErrorInfo.Clear();
                    //this.Business might not yet be set (invoked from Load->loadDraft)
                    if (this.Business)
                        this.Business.EditOffice = e.value;
                    this.store(this.Entity);
                }
                this.notifyProperty('EditOffice', e.value);
            }
            else if (e.name == 'Office.Draft')
                this.notifyProperty('EditOffice.Draft', e.value);
        });

        this._affiliations = this.getViewModel<Affiliations>('affiliations');

        this.deleteHandler = () => {
            if (this.EditMode == EditMode.Edit) {
                //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                if (this.Business.Updated && typeof this.Business.Updated == "string") //keep it a s JSON string to allow for repeated saving/reading to/from storage.local
                    this.Business.Updated = new Date(JSON.parse(this.Business.Updated));
                BusinessService.Delete({
                    Value: this.Business.Id,
                    Timestamp: this.Business.Updated,
                    CreatedBy: this.Business.CreatedBy //Temp value for auth check
                }, (success) => {
                    if (success) {
                        this.DeleteComplete();
                        this.createNew(this.Entity);
                    }
                }, this.Invalidate.bind(this));
            }
        };
    }

    Load(webSite, reset?) {
        if (!String.isNullOrWhiteSpace(webSite)) {
            try
            {
                BusinessService.Edit(webSite, true, (businessProfile) => {
                    if (businessProfile && businessProfile.Id && businessProfile.Entity && businessProfile.Entity.Id) {
                        this.WebSite = businessProfile.Entity.WebSite;
                        this._validateable.ErrorInfo.Clear();
                        this._office.Validateable.ErrorInfo.Clear();
                        this._office.Location.Validateable.ErrorInfo.Clear();
                        this._deleteConfirm.MessageArgs["Name"] = businessProfile.Entity.Name;
                        //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                        if (businessProfile.Entity.Updated) //keep it as JSON string to allow for repeated saving/reading to/from storage.local
                            businessProfile.Entity.Updated = JSON.stringify(businessProfile.Entity.Updated);
                        if (businessProfile.SignedIn)
                            businessProfile.SignedIn = JSON.stringify(businessProfile.SignedIn);
                        this.populateEntity(businessProfile, PopulateOptions.Store | PopulateOptions.Reset); //Setting populateOptions to Reset will call populateCategory and remove businessAddress and businessImage
                        this.updateMenuItems();
                    }
                    else {
                        this.loadDraft(() => { //May Clear ErrorInfo (via createNew or async in storage.local.get)
                            this._validateable.ErrorInfo.SetError('webSite', Resource.Exception.Data_RecordNotFound);
                        }, reset);
                    }
                }, this.Invalidate.bind(this));
            }
            catch (ex) {
                this.Invalidate(ex);
            }
        }
        else {
            chrome.storage.local.get('businessWebSite',(storeItems: IBusinessWebSite) => {
                if (storeItems.businessWebSite) {
                    chrome.storage.local.remove('businessWebSite');
                    this.WebSite = Url.getBaseUrl(storeItems.businessWebSite);
                    this.Load(this.WebSite);
                }
                else
                    this.loadDraft((businessProfile) => {
                        if (businessProfile)
                            this.WebSite = businessProfile.WebSite;
                    });
            });
        }
    }

    createNew(populateOptions?) {
        try
        {
            populateOptions = populateOptions ||
                (PopulateOptions.Store | PopulateOptions.Reset); //Setting populateOptions to Reset will call populateCategory and remove businessAddress and businessImage
            var businessProfile: EntityEdit<BusinessProfile$> = {
                Id: 0,
                AccountType: AccountType.Personal,
                Entity: new BusinessProfile$()
            }
            this._validateable.ErrorInfo.Clear();
            this._office.Validateable.ErrorInfo.Clear();
            this._office.Location.Validateable.ErrorInfo.Clear();
            this._deleteConfirm.MessageArgs = {};
            this.setAddress(businessProfile.Entity, '');
            this.populateEntity(businessProfile, populateOptions);
            if ((populateOptions & PopulateOptions.Reset) == 0)
                this.populateCategory(businessProfile.Entity.Category);
            this.updateMenuItems();

            GooglePlaces.Search(Url.getDomainName(this.WebSite), (place) => {
                this.preload(place);
                this.store(this.Entity);
            }, this.Invalidate.bind(this));

            return businessProfile.Entity;
        }
        catch (ex) {
            this.Invalidate(ex);
        }
    }

    loadDraft(callback, reset?) {
        chrome.storage.local.get(this.storage_keys, (storeItems: IBusinessProfileStore) => {
            try
            {
                var businessProfile = storeItems.businessProfile && JSON.parse(storeItems.businessProfile);
                if (businessProfile && businessProfile.Entity && businessProfile.Id === 0 && businessProfile.Entity.Id === 0 && !reset) {
                    this._validateable.ErrorInfo.Clear();
                    this._office.Validateable.ErrorInfo.Clear();
                    this._office.Location.Validateable.ErrorInfo.Clear();
                    if (businessProfile.Entity.EditOffice && this._office.setOffice(businessProfile.Entity.EditOffice)) {
                        if (storeItems.businessAddress)
                            this.setAddress(businessProfile.Entity, storeItems.businessAddress, businessProfile.Entity.EditOffice.Address.Address1);
                        else if (businessProfile.Entity.EditOffice.Address.Location)
                            this._office.Location.Address = businessProfile.Entity.EditOffice.Address;
                        else
                            this._office.Location.Text = '';
                    }
                    //if (storeItems.businessImage)
                    //    this.setImage(businessProfile.Entity, storeItems.businessImage);
                    this.populateEntity(businessProfile);
                    this.populateCategory(businessProfile.Entity.Category);
                    if (callback)
                        callback(businessProfile.Entity);
                }
                else {
                    businessProfile = this.createNew();
                    if (callback)
                        callback(businessProfile);
                }
            }
            catch (ex) {
                this.Invalidate(ex);
            }
        });
    }

    populateEntity(businessProfile: EntityEdit<BusinessProfile$>, populateOptions: PopulateOptions = PopulateOptions.None) {
        if (businessProfile && businessProfile.Entity) {
            var business = businessProfile.Entity;
            $('#id').text(business.Id + (this.EditMode == EditMode.Edit ? ' (Edit)' : ' (New)'));

            if ((populateOptions & PopulateOptions.Store) > 0) {
                this.store(businessProfile);
                if ((populateOptions & PopulateOptions.Reset) > 0) {
                    this.populateCategory(business.Category);
                    chrome.storage.local.remove(['businessAddress', 'businessImage']);
                }
            }

            this.Entity = businessProfile; //Will set _editable.Entity
        }
    }

    HandleAction(action: string) {
        switch (action) {
            case "Load":
                if (this.WebSite) {
                    this.Load(this.WebSite, true);
                }
                else
                    this._validateable.ErrorInfo.SetError('webSite', "Please enter url");
                break;
            case "CreateNew":
                this.createNew(this.Entity);
                break;
            case "SaveDraft":
                this.Business.WebSite = this.WebSite;
                this.Business.RichText = this._richText.html;
                if (this._office.Location.Address) {
                    this.Business.EditOffice.Address = this._office.Location.Address;
                    if (this.Business.EditOffice.Address.Address1 != this._office.Location.Address1)
                        this.Business.EditOffice.Address.Address1 = this._office.Location.Address1;
                    var postalCode = this._office.Location.PostalCode;
                    if (postalCode && this.Business.EditOffice.Address.PostalCode != postalCode)
                        this.Business.EditOffice.Address.PostalCode = postalCode;
                }
                this.store(this.Entity);
                break;
            case "CleanseRichText":
                var html = RTE.cleanseRichText(this._richText.html, this.WebSite);
                if (html) {
                    this.Business.RichText = html;
                    this.populateEntity(this.Entity, PopulateOptions.Store);
                }
                break;
            case "Submit":
                this.Business.WebSite = this.WebSite;
                this.Submit(() => {
                    this.Entity.Email = this.Business.Email; //Required
                    this.Business.RichText = RTE.toXHtml(this._richText.html);
                    this.Business.TransactionType = this._transactionType.SelectedValue || TransactionType.Default; //Sell to Business & Consumer
                    this.Business.ServiceType = this._serviceType.Enabled ? this._serviceType.SelectedValue : 0;
                    this.Business.Industry = this._industry.Enabled && (this.Business.TransactionType & TransactionType.ItemType.Business) > 0 ? this._industry.SelectedValue : 0;

                    //http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
                    if (this.Business.Updated && typeof this.Business.Updated == "string") //keep it a s JSON string to allow for repeated saving/reading to/from storage.local
                        this.Business.Updated = new Date(JSON.parse(this.Business.Updated));

                    if (this.EditMode == EditMode.New) {
                        if (!this.Entity.Id) {
                            if (!Session.User.SecurityProfile.CanProduce_Business && !Session.User.Business.Id)
                                this.Entity.Id = Session.User.Id;
                            else if (!Session.User.SecurityProfile.CanProduce_Business)
                                throw new SessionException(SessionExceptionType.Unauthorized);
                        }
                    }

                    BusinessService.Save(this.Entity, ImageCache.Get(this.Business.Images.Refs), (business) => {
                        ImageCache.Clear();
                        if (business.Value > 0) {
                            this.SubmitComplete();
                            this.Load(this.Business.WebSite);
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
        if (!this._category.Enabled)
            this._category.Enabled = true;
    }

    store(businessProfile) {
        chrome.storage.local.set({
            businessProfile: JSON.stringify(businessProfile)
        });
    }

    updateMenuItems(menuItems?, supressNotify?, processedSelection?) {
        menuItems = menuItems || {
            Email: {
                isSet: false
            },
            Name: {
                isSet: false
            },
            Description: {
                isSet: false
            },
            Description1: {
                isSet: false
            },
            Phone: {
                isSet: false
            },
            Phone1: {
                isSet: false
            },
            Fax: {
                isSet: false
            },
            Address: {
                isSet: false
            },
            Address1: {
                isSet: false
            },
            PostalCode: {
                isSet: false
            },
            Image: {
                isSet: false
            }
        };
        chrome.storage.local.set({
            businessMenuItems: menuItems
        });
        if (!supressNotify)
            Page.notifyContentScript(processedSelection ? Object.mixin(menuItems, {
                ProcessedSelection: processedSelection
            }) : menuItems);
    }
}