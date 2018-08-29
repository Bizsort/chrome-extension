import { Action, ElementType, InputValidator, IView, Validateable, ValidationContext, ValidationOptions, ViewModel } from '../../../viewmodel'
import { Deletable, Editable, EditMode, ReadyState } from '../../editable'
import { ProductType } from '../../../model'
import { EntityEdit, Product as BusinessProduct } from '../../../model/admin/business'
import { Account as BusinessAccount } from '../../../model/business'
import { MemberType } from '../../../model/category'
import { Form as Confirm, StringFormatter } from '../../../../component/confirm/form'
import { Edit as Group } from '../../../../component/group/edit'
import { Edit as Image } from '../../../../component/image/edit'
import { Edit as Type } from '../../../../component/product/type/edit'
import { Edit as ServiceType } from '../../../../component/product/servicetype/edit'
import { HTMLRichTextElement } from '../../../../component/richtext/rte'
import { Category as CategoryAdmin } from '../../../service/admin/master'
import * as CategoryService from '../../../service/category'
import * as Resource from '../../../resource'
export { BusinessProduct, EditMode, EntityEdit, ReadyState }

export class Edit extends Deletable(Editable(ViewModel)) {
    protected _category: Group;
    protected _type: Type;
    protected _serviceType: ServiceType;
    protected _image: Image;
    get Image(): Image {
        return this._image;
    }

    get EditMode(): EditMode {
        return this.Product && this.Product.Id ? EditMode.Edit : EditMode.New;
    }

    set Entity(businessProduct: EntityEdit<BusinessProduct.Profile>) {
        super.Entity = businessProduct;
        this.notifyProperty('Business', businessProduct);
        this.notifyProperty('Product', businessProduct.Entity);
        //this.notifyProperty('ProductType', businessProduct.Entity.Master.Type);
    }
    get Entity(): EntityEdit<BusinessProduct.Profile> {
        return <EntityEdit<BusinessProduct.Profile>>super.Entity;
    }
    get Business(): BusinessAccount {
        return <BusinessAccount>this.Entity;
    }
    get Product(): BusinessProduct.Profile {
        return this.Entity && this.Entity.Entity;
    }

    /*product-servicetype-edit hidden$="[[!_serviceType(model.Product.Master.Type)]]" seems to be working without notifyProperty
    get ProductType(): number {
        return this.Product.Master.Type;
    }
    set ProductType(productType: number) {
        if (this.Product.Master.Type != productType) {
            this.Product.Master.Type = productType;
            this.notifyProperty('ProductType', productType);
        }
    }*/

    constructor(view: IView, validationOptions: ValidationOptions = {}) {
        super(view);

        this._validateable = new Validateable(this, new ValidationContext(), {
            rules: Object.mixin({
                //webUrl: "required",
                title: {
                    required: true,
                    maxlength: 250
                },
                richText: "validateText" //required
            }, validationOptions.rules),

            messages: Object.mixin({
                //webUrl: String.format(Resource.Global.Editor_Error_Enter_X, "Web url"),
                title: String.format(Resource.Global.Editor_Error_Enter_X, "Title"),
                richText: String.format(Resource.Global.Editor_Error_Enter_X, "Description")
            }, validationOptions.messages),

            methods: {
                validateText: (value) => {
                    return this._richText.text && this._richText.html ? true : false;
                }
            }
        }, (proceed: Action<boolean>, context: ValidationContext, validator: InputValidator) => {
            //if (this.Product.Id || this.EditMode == EditMode.Edit)
            if (validator.Options.rules['webUrl'])
                validator.ValidateElement('webUrl', this.Product.WebUrl, context);
            validator.ValidateElement('title', this.Product.Master.Title, context);
            validator.ValidateElement('richText', null, context);

            proceed(!this._validateable.ErrorInfo.HasErrors);
        });

        this._validateable.Context.AddStep((proceed, ctx, param) => {
            var typeValid = this._type.SelectedValue ? true : false;
            if (typeValid) {
                this.Product.Master.Type = this._type.SelectedValue;
                /*if (this.Product.Master.Type == Model$.ProductType.ItemType.Service) {
                    if (!this._serviceType.SelectedValue)
                    {
                        typeValid = false;
                        this._validateable.ErrorInfo.SetError('serviceType', "Please select Type");
                    }
                    else
                        this.Product.ServiceType = this._serviceType.SelectedValue;
                }
                else if (this.Product.ServiceType)
                    this.Product.ServiceType = 0;*/
                this.Product.ServiceType = (this.Product.Master.Type === ProductType.ItemType.Service || this.Product.Master.Type === ProductType.ItemType.Product ? this._serviceType.SelectedValue || 0 : 0);
            }
            else
                this._validateable.ErrorInfo.SetError('type', "Please select Type");
                        
            proceed(typeValid, param);
        });

        this._validateable.Context.AddStep((proceed, ctx, param) => {
            this._category.Validate((categoryValid) => {
                if (!categoryValid)
                    this._validateable.ErrorInfo.SetError('category', "Please select Category");
                else
                    this.Product.Master.Category = this._category.GroupId;
                proceed(categoryValid, param);
            });
        });
    }

    CategoryConfig = {
        Service: CategoryService,
        Scope: {
            Id: 0,
            Name: Resource.Dictionary.Unlisted
        },
        MemberType: (category) => {
            return MemberType.Class_Product;
        }
    }

    _richText: HTMLRichTextElement;
    Initialize() {
        this._category = this.getViewModel<Group>('category');
        this._type = this.getViewModel<Type>('type');
        this._serviceType = this.getViewModel<ServiceType>('serviceType');
        this._image = this.getViewModel<Image>('image');
        this._deleteConfirm = this.getViewModel<Confirm>('deleteConfirm');
        this._deleteConfirm.MessageFormat = new StringFormatter(Resource.Global.Confirm_Delete_X, ["Title"]);
        this._richText = this.View.getElement(ElementType.ChildElement, 'richText');
    }

    reflectCategory(categoryId: number, faultCallback?) {
        if (categoryId) {
            CategoryAdmin.GetConfig(categoryId, (categoryConfig) => {
                this._type.CategoryConfig = categoryConfig;
                this._serviceType.CategoryConfig = categoryConfig;
            }, faultCallback);
        }
        else {
            this._type.CategoryConfig = null;
            this._serviceType.CategoryConfig = null;
        }
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