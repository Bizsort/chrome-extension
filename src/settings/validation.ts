import { ValidationContext } from '../viewmodel'
import { Dictionary, Global } from '../resource'
import { String } from '../system'

export const EmailValid = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?" //"^[_a-z0-9-]+(\\.[_a-z0-9-]+)*@[a-z0-9-]+(\\.[a-z0-9-]+)*(\\.[a-z]{2,8})$"
export function ValidateEmail(email, name, element, param, ctx: ValidationContext): any {
    if (email) {
        if (ctx.Items.LocationSettings && ctx.Items.LocationSettings.EmailValid) {
            var regEx = new RegExp(ctx.Items.LocationSettings.EmailValid, 'i');
            return regEx.test(email);
        }
        else
            return true;
    }
    else
        return false;
}

export const PhoneValid = "^\\d{3}-\\d{3}-\\d{4}$"
export function ValidatePhone(phone, name, element, param, ctx: ValidationContext): any {
    if (!String.isNullOrWhiteSpace(phone)) {
        if (ctx.Items.LocationSettings && ctx.Items.LocationSettings.PhoneValid) {
            var regEx = new RegExp(ctx.Items.LocationSettings.PhoneValid);
            if (!regEx.test(phone)) {
                var errorMessage = String.format(Global.Editor_Error_Enter_X_Valid, Dictionary.Phone);
                if (ctx.Items.LocationSettings2 && ctx.Items.LocationSettings2.HasMask("Phone"))
                    errorMessage += (" (" + String.format(Global.Editor_Error_Value_X_Not_Valid, phone) + ")");
                return errorMessage;
            }
        }
    }
    return true;
}
