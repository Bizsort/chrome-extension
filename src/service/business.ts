import { ImageSize } from '../model'
import { Preview, SearchItem } from '../model/business'
import { Action, Get as Get$ } from '../service'


export function ToPreview(businesses: SearchItem[], properties: string[], imageSize: ImageSize, callback: Action<Preview[]>, faultCallback) {
    return Get$("/business/profile/ToPreview?businesses=" + JSON.stringify(businesses) + (properties ? "&properties=" + JSON.stringify(properties) : ''), {
        callback: (data) => {
            var business: Preview;
            for (var i = 0, l = data.length; i < l; i++) {
                business = new Preview(data[i], imageSize);
                data[i] = business;
            }
            callback(data);
        },
        faultCallback: faultCallback
    });
}