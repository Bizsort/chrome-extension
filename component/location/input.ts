import { ErrorMessageType, Input as Input$, IView, LocationService, Validateable } from '../../src/viewmodel/location/input'
export { IView, LocationService, Validateable }

export class Input extends Input$ {
    constructor(view: IView) {
        super(view);
        this._validateable = new Validateable(this, null, null, /*this._geoinput.Validate.bind(this._geoinput)*/(proceed) => {
            this._geoinput.Validate((valid) => {
                if (valid) {
                    //Resolve Location.Id on the server
                    this._geoinput.Resolve(false, (match, location) => {
                        proceed(match || location ? true : false);
                    });
                }
                else
                    proceed(false);
            });
        });
    }        

    Invalidate(ex) {
        var message = typeof ex === "string" ? ex : this._validateable.ViewModel.GetErrorMessage(ex.ErrorMessageType || ErrorMessageType.Unknown, ex);
        this._validateable.ErrorInfo.SetError(this._geoinput.ErrorElementName, message);
    }
}
