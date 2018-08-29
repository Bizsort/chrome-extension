import { Action } from '../../../src/system'
import { ErrorMessageType, IView, Submittable, Validateable, ValidationContext, ViewModel } from '../../../src/viewmodel'
import { Account as AccountService } from '../../../src/service/master'
import * as ValidationSettings from '../../../src/settings/validation'
import * as Resource from '../../../src/resource'

export class Reset extends Submittable(ViewModel) {
    Email: string = '';

    constructor(view: IView) {
        super(view);
            
        this._validateable = new Validateable(this, new ValidationContext(null, {
            LocationSettings: {
                EmailValid: ValidationSettings.EmailValid
            }
        }), {
            rules: {
                email: "validateEmail"
            },

            messages: {
                email: String.format(Resource.Global.Editor_Error_Enter_X_Valid, Resource.Dictionary.Email)
            },

            methods: {
                validateEmail: ValidationSettings.ValidateEmail
            }
        });
    }

    ResetPassword(callback: Action<boolean>) {
        this.Submit(() => {
            AccountService.RequestPasswordReset(this.Email, null, (success) => {
                this.SubmitComplete();
                callback(success);
            }, this.Invalidate.bind(this));
        });
    }

    GetErrorMessage(error, data, options?) {
        switch (error) {
            case ErrorMessageType.Data_RecordNotFound:
                return Resource.Global.Account_Email_Error_NotFound;
            case ErrorMessageType.Operation_Invalid:
                return String.format(Resource.Global.Editor_Error_processing_request_X, "Account might be disabled or there is already an outstanding request to reset password.");
            default:
                return super.GetErrorMessage(error, data, options);
        }
    }
}