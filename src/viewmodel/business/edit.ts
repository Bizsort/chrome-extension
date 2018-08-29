import { Action, ElementType, InputValidator, IView, Validateable, ValidationContext, ValidationOptions, ViewModel } from '../../viewmodel'
import { Deletable, Editable, EditMode, ReadyState } from '../editable'
import { Address, ImageEntity, ImageSizeType, ImageType } from '../../model'
import { Profile as BusinessProfile } from '../../model/admin/business'
import { EntityEdit } from '../../model/admin/personal'
import { MemberType } from '../../model/category'
import { Edit as ServiceType } from '../../../component/business/servicetype/edit'
import { Edit as IndustryEdit } from '../../../component/business/industry/edit'
import { Form as Confirm, StringFormatter } from '../../../component/confirm/form'
import { Edit as Group } from '../../../component/group/edit'
import { Edit as Office } from '../../../component/business/office/edit'
import { Edit as TransactionType } from '../../../component/business/transactiontype/edit'
import { Edit as Image } from '../../../component/image/edit'
import { HTMLRichTextElement } from '../../../component/richtext/rte'
import { ImageHelper, ImageSettings } from '../imagehelper'
import { Category as CategoryAdmin } from '../../service/admin/master'
import * as CategoryService from '../../service/category'
import * as GooglePlaces from '../../service/googleplaces'
import * as ValidationSettings from '../../settings/validation'
import * as Resource from '../../resource'
export { BusinessProfile, EditMode, EntityEdit, ReadyState }

export abstract class Edit extends Deletable(Editable(ViewModel)) {
    protected _office: Office;
    protected _category: Group;
    get Category(): Group {
        return this._category;
    }
    protected _serviceType: ServiceType;
    protected _transactionType: TransactionType;
    protected _industry: IndustryEdit;
    protected _image: Image;
    get Image(): Image {
        return this._image;
    }

    get EditMode(): EditMode {
        return this.Business && this.Business.Id ? EditMode.Edit : EditMode.New;
    }

    //Entity: EntityEdit<BusinessProfile>;
    set Entity(businessProfile: EntityEdit<BusinessProfile>) {
        super.Entity = businessProfile;
        this.notifyProperty('Business', businessProfile.Entity);
    }
    get Entity(): EntityEdit<BusinessProfile> {
        return <EntityEdit<BusinessProfile>>super.Entity;
    }
    get Business(): BusinessProfile {
        return this.Entity && this.Entity.Entity;
    }

    constructor(view: IView, validationOptions: ValidationOptions = {}) {
        super(view);

        this._validateable = new Validateable(this, new ValidationContext(null, {
            LocationSettings: {
                EmailValid: ValidationSettings.EmailValid
            }
        }), {
            rules: Object.mixin({
                //webSite: "required",
                email: "validateEmail",
                name: {
                    required: true,
                    maxlength: 250
                },
                richText: "validateText" //required
            }, validationOptions.rules),

            messages: Object.mixin({
                //webSite: String.format(Resource.Global.Editor_Error_Enter_X, "Web site url"),
                email: String.format(Resource.Global.Editor_Error_Enter_X_Valid, "Email"), //"Email (in lower case)"
                name: String.format(Resource.Global.Editor_Error_Enter_X, "Name"),
                richText: String.format(Resource.Global.Editor_Error_Enter_X, "Description")
            }, validationOptions.messages),

            methods: {
                validateEmail: ValidationSettings.ValidateEmail,
                validateText: (value) => {
                    return this._richText.text && this._richText.html ? true : false;
                }
            }
        }, (proceed: Action<boolean>, context: ValidationContext, validator: InputValidator) => {
            //if (this.Business.Id || this.EditMode == ViewModel.EditMode.Edit)
            if (validator.Options.rules['webSite'])
                validator.ValidateElement('webSite', this.Business.WebSite, context);
            validator.ValidateElement('email', this.Business.Email, context);
            validator.ValidateElement('name', this.Business.Name, context);
            validator.ValidateElement('richText', null, context);

            proceed(!this._validateable.ErrorInfo.HasErrors);
        });

        this._validateable.Context.AddStep((proceed, ctx, param) => {
            this._category.Validate((categoryValid) => {
                if (!categoryValid)
                    this._validateable.ErrorInfo.SetError('category', "Please select Category");
                else
                    this.Business.Category = this._category.GroupId;
                proceed(categoryValid, param);
            });
        });

        this._validateable.Context.AddStep((proceed, ctx, param) => {
            var typeValid = this._transactionType.SelectedValue ? true : false;
            if (typeValid) {
                this.Business.TransactionType = this._transactionType.SelectedValue;
            }
            else
                this._validateable.ErrorInfo.SetError('transactionType', "Please select Transaction Type");
            proceed(typeValid, param);
        });

        this._validateable.Context.AddStep((proceed, ctx, param) => {
            if (this.Business.Offices.Refs.length == 1 || this._office.Office != null) {
                this._office.SaveOffice((officeValid) => {
                    proceed(officeValid, param);
                });
            }
            else
                proceed(true, param);
        });
    }

    CategoryConfig = {
        Service: CategoryService,
        Scope: {
            Id: 0,
            Name: Resource.Dictionary.Unlisted
        },
        MemberType: (category) => {
            return MemberType.Class_Business;
        }
    }

    _richText: HTMLRichTextElement;
    Initialize() {
        super.Initialize();
        this._office = this.getViewModel<Office>('office');
        this._office.Location.Requirement = Address.Requirement.StreetAddress;
        this._category = this.getViewModel<Group>('category');
        this._serviceType = this.getViewModel<ServiceType>('serviceType');
        this._transactionType = this.getViewModel<TransactionType>('transactionType');
        this._industry = this.getViewModel<IndustryEdit>('industry');
        this._image = this.getViewModel<Image>('image');
        this._deleteConfirm = this.getViewModel<Confirm>('deleteConfirm');
        this._deleteConfirm.MessageFormat = new StringFormatter(Resource.Global.Confirm_Delete_X, ["Name"]);
        this._richText = this.View.getElement(ElementType.ChildElement, 'richText');
    }

    reflectCategory(categoryId: number, faultCallback?) {
        if (categoryId) {
            CategoryAdmin.GetConfig(categoryId, (categoryConfig) => {
                this._transactionType.CategoryConfig = categoryConfig;
                this._serviceType.CategoryConfig = categoryConfig;
                this._industry.CategoryConfig = categoryConfig;
            }, faultCallback);
        }
        else {
            this._transactionType.CategoryConfig = null;
            this._serviceType.CategoryConfig = null;
            this._industry.CategoryConfig = null;
        }
    }

    preload(webSite: string) {
        GooglePlaces.Search(webSite, (place) => {
            if (place) {
                if (place.Name) {
                    this.Business.Name = place.Name;
                    this.notifyProperty('Business.Name', this.Business.Name);
                }
                if (place.Address)
                    this.setAddress(this.Business, place.Address);
                if (place.Logo) {
                    var imgData: any = {
                        src: place.Logo
                    };
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", imgData.src, true);
                    xhr.responseType = "blob";
                    xhr.onload = () => {
                        if (xhr.response) {
                            var imgType = xhr.response.type.indexOf('image/') === 0 ? xhr.response.type.substr(6) : imgData.src.split('.').pop().toLowerCase();
                            if (imgType == 'png' || imgType.indexOf('svg') === 0) {
                                imgData.type = ImageType.Png;
                                imgData.preserveFormat = true;
                            }
                            else if (imgType == 'gif') {
                                imgData.type = ImageType.Gif;
                                imgData.preserveFormat = true;
                            }
                            var fr = new FileReader();
                            fr.onloadend = (e) => {
                                imgData.src = fr.result;
                                //var imgHelper = new ImageHelper(imgData, ImageEntity.Business);
                                var imgHelper = new ImageHelper(imgData, ImageSettings.WideThumbnail, { //ImageSettings.WideMedium
                                    Width: 1280,
                                    Height: 640
                                });
                                imgHelper.process((resized, preview) => {
                                    resized.Preview = preview;
                                    this.setImage(this.Business, resized);
                                });
                            };
                            fr.readAsDataURL(xhr.response);
                        }
                    };
                    xhr.send(null);
                }
            }
        });
    }

    setAddress(business, value, address1?) {
        if (business.EditOffice) {
            business.EditOffice.Address = {
                Location: 0
            };
            if (address1)
                business.EditOffice.Address1 = address1;
        }
        this._office.Location.Text = value;
        this._office.Location.PostalCode = '';
        this._office.Location.Address1 = address1 || '';
    }

    setImage(business, image) {
        this._image.AddImage(image, true);
        business.Images = this._image.Images;
    }

    HandleAction(action: string) {
        switch (action) {
            case "Delete":
                if (this.EditMode == EditMode.Edit)
                    this._deleteConfirm.Show();
                break;
            default:
                return super.HandleAction(action);
        }
    }
}