import { Action, ElementType, InputValidator, IView, Validateable, ValidationContext, ViewModel } from '../../../viewmodel'
import { Deletable, Editable, EditMode, ReadyState } from '../../editable'
import { EntityEdit, MultiProduct as MultiProduct } from '../../../model/admin/business'
import { Account as BusinessAccount } from '../../../model/business'
import { Form as Confirm } from '../../../../component/confirm/form'
import { HTMLRichTextElement } from '../../../../component/richtext/rte'
import * as Resource from '../../../resource'
export { EditMode, EntityEdit, MultiProduct, ReadyState }

export class Edit extends Deletable(Editable(ViewModel)) {

    get EditMode(): EditMode {
        return this.Product && this.Product.Id ? EditMode.Edit : EditMode.New;
    }

    set Entity(businessMultiProduct: EntityEdit<MultiProduct>) {
        super.Entity = businessMultiProduct;
        this.notifyProperty('Business', businessMultiProduct);
        this.notifyProperty('Product', businessMultiProduct.Entity);
    }
    get Entity(): EntityEdit<MultiProduct> {
        return <EntityEdit<MultiProduct>>super.Entity;
    }
    get Business(): BusinessAccount {
        return <BusinessAccount>this.Entity;
    }
    get Product(): MultiProduct {
        return this.Entity && this.Entity.Entity;
    }

    constructor(view: IView) {
        super(view);

        this._validateable = new Validateable(this, new ValidationContext(), {
            rules: {
                richText: "validateText" //required
            },

            messages: {
                richText: String.format(Resource.Global.Editor_Error_Enter_X, "Description")
            },

            methods: {
                validateText: (value) => {
                    return this._richText.text && this._richText.html ? true : false;
                }
            }
        }, (proceed: Action<boolean>, context: ValidationContext, validator: InputValidator) => {
            validator.ValidateElement('richText', null, context);

            proceed(!this._validateable.ErrorInfo.HasErrors);
        });
    }

    _richText: HTMLRichTextElement;
    Initialize() {
        this._deleteConfirm = this.getViewModel<Confirm>('deleteConfirm');
        this._deleteConfirm.MessageFormat.FormatString = Resource.Business.Confirm_Delete_Multiproduct;
        this._richText = this.View.getElement(ElementType.ChildElement, 'richText');
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