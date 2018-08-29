import { Service, WebSite } from '../settings'
import { Get, Post } from '../service'

export var DisableCleansing = false;
export { Service, WebSite }

chrome.storage.sync.get(['webSiteOrigin', 'serviceOrigin', 'googleApiKey', 'disableCleansing'], (storeItems) => {
    if (storeItems.webSiteOrigin)
        WebSite.Origin.Host = storeItems.webSiteOrigin;
    var serviceOrigin = storeItems.serviceOrigin || storeItems.webSiteOrigin;
    if (serviceOrigin && serviceOrigin != Service.Origin) {
        Service.Origin = serviceOrigin;
        Get.Url(serviceOrigin);
        Post.Url(serviceOrigin);
    }
    if (storeItems.googleApiKey)
        Service.Google.ApiKey = storeItems.googleApiKey;
    if (storeItems.disableCleansing)
        DisableCleansing = true;
});