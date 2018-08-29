import { Guid } from '../system'

export namespace Cache {
    var images = {};

    export function Add(image) {
        var token = Guid.newGuid();
        images[token] = image;
        delete image.Preview;
        return token;
    }

    export function Get(imageRefs) {
        var newImages = [];
        for (var i = 0, l = imageRefs.length; i < l; i++) {
            var image = !(imageRefs[i].Id || Guid.isEmpty(imageRefs[i].Token)) ? images[imageRefs[i].Token] : null;
            if (image)
                newImages.push(_serialize(image, imageRefs[i].Token));
        }
        return newImages;
    }

    export function GetOne(token, serialize?) {
        var image = !Guid.isEmpty(token) ? images[token] : null;
        if (!serialize)
            serialize = _serialize;
        return serialize(image, token);
    }

    export function Clear() {
        images = {};
    }
}

function _serialize(image, token) {
    return {
        Token: token,
        Width: image.Width,
        Height: image.Height,
        Content_Base64: image.Content.split(",")[1],
        Type: image.Type
    };
}
export { _serialize as Serialize }