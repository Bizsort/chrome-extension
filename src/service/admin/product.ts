namespace Admin.Service.Product.Profile {
    export function FromTextFeatures(textFeatures: string, webUrl: string, multiProduct: boolean, callback, faultCallback) {
        if (Session.User.Id > 0) {
            Service$.Post("/process/product/FromTextFeatures", {
                authorize: true,
                data: {
                    User: Session.User.Id,
                    TextFeatures: textFeatures,
                    WebUrl: webUrl,
                    MultiProduct: multiProduct
                },
                callback: callback,
                faultCallback: faultCallback
            });
        }
        else
            throw new SessionException(SessionExceptionType.NotAuthenticated);
    }
} 