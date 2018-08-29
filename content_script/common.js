(function () {
'use strict';

RegExp.Patterns = {
    //http: //stackoverflow.com/questions/206384/how-to-format-a-json-date
    //http://james.newtonking.com/archive/2009/04/12/native-json-in-ie8-firefox-3-5-plus-json-net.aspx
    //Date_ISO: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(?:([\+-])(\d{2})\:(\d{2}))?Z?$/
    Date_ISO: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d*))?Z?$/,
    //http://stackoverflow.com/questions/8809876/can-i-get-divs-background-image-url
    /*Background_Image: {
        match: /url\(|\)|"|'/g,
        replace: ""
    }*/
    Background_Image: {
        match: /url\((['"])?(.*)\1\)/,
        replace: '$2'
    }
};

//http://aknosis.com/2011/07/17/using-jquery-to-rewrite-relative-urls-to-absolute-urls-revisited
//http://stackoverflow.com/questions/7544550/javascript-regex-to-change-all-relative-urls-to-absolute
function toAbsolute(url, baseUrl) {
    if (url && baseUrl) {
        if (/^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(url))
            return url;
        else if (url.substr(0, 2) === '//') {
            return 'http:' + url;
        }
        else if (url.substr(0, 1) !== '/') {
            url = (baseUrl.pathname || '') + url;
        }
        return (baseUrl.origin || '') + url;
    }
    return url;
}
function windowLocation() {
    //http://bl.ocks.org/abernier/3070589
    var l = {
        origin: (window.location.protocol + '//' + window.location.hostname).toLowerCase(),
        hostname: window.location.hostname.toLowerCase(),
        pathname: window.location.pathname.toLowerCase().substr(0, window.location.pathname.lastIndexOf('/') + 1)
    };
    return l;
}
function getBaseUrl(url) {
    var index = url && url.indexOf("://");
    if (index > 0) {
        index = url.indexOf('/', index + 3);
        if (index > 0)
            return url.substring(0, index);
    }
    return url;
}
function getDomainName(url) {
    var index1 = url && url.indexOf("://");
    if (index1 > 0) {
        index1 += 3;
        /*if (url.indexOf('www.', index1) >= 7)
            index1 += 4;*/
        var index2 = url.indexOf('/', index1);
        return index2 > 0 ? url.substring(index1, index2) : url.substring(index1);
    }
    return url;
}


var Url = Object.freeze({
	toAbsolute: toAbsolute,
	windowLocation: windowLocation,
	getBaseUrl: getBaseUrl,
	getDomainName: getDomainName
});

var ImageType;
(function (ImageType) {
    ImageType[ImageType["Jpeg"] = 1] = "Jpeg";
    ImageType[ImageType["Png"] = 2] = "Png";
    ImageType[ImageType["Gif"] = 3] = "Gif";
})(ImageType || (ImageType = {}));
var Geocoder;
(function (Geocoder) {
    class Address {
        constructor(object) {
            if (object)
                Object.deserialize(this, object);
        }
        EqualsTo(address) {
            if (!address ||
                this.Country != address.Country ||
                //Geocoder does not seem to populate State for UK address
                (this.State != address.State && this.State && !this.County) ||
                this.County != address.County ||
                this.City != address.City ||
                this.StreetName != address.StreetName)
                return false;
            else
                return true;
        }
    }
    Geocoder.Address = Address;
    class Location {
        constructor(data) {
            if (data) {
                this.Id = data.Id;
                this.Address = new Address(data.Address);
                if (data.Text)
                    this.Text = data.Text;
                if (data.Geolocation)
                    this.Geolocation = data.Geolocation;
            }
            else
                this.Address = new Address();
        }
    }
    Geocoder.Location = Location;
})(Geocoder || (Geocoder = {}));
var List;
(function (List) {
    let Filter;
    (function (Filter) {
        class QueryInput {
            constructor(facets) {
                if (facets && facets.length > 0) {
                    facets = facets.slice(); //make a copy
                    var sorted = facets.sort((f1, f2) => {
                        return f1.Name - f2.Name;
                    });
                    this.InclFacets = this.facetFilter(sorted, false);
                    this.ExclFacets = this.facetFilter(sorted, true);
                }
                else {
                    this.InclFacets = this.facetFilter();
                    this.ExclFacets = this.facetFilter();
                }
            }
            facetFilter(facets, excluded) {
                if (facets && facets.length > 0) {
                    var fiters = facets.filter(f => (f.Exclude || false) == excluded);
                    if (fiters.length > 0) {
                        return {
                            NoFilters: fiters.length,
                            FilterNames: fiters.map(f => f.Name),
                            FilterValues: fiters.map(f => f.Value)
                        };
                    }
                }
                return {
                    NoFilters: 0
                };
            }
        }
        Filter.QueryInput = QueryInput;
    })(Filter = List.Filter || (List.Filter = {}));
})(List || (List = {}));
var LocationType;
(function (LocationType) {
    LocationType[LocationType["Unknown"] = 0] = "Unknown";
    LocationType[LocationType["Country"] = 1] = "Country";
    LocationType[LocationType["State"] = 2] = "State";
    LocationType[LocationType["County"] = 4] = "County";
    LocationType[LocationType["City"] = 8] = "City";
    LocationType[LocationType["Street"] = 16] = "Street";
    LocationType[LocationType["Area"] = 32] = "Area";
})(LocationType || (LocationType = {}));
var Node;
(function (Node) {
    function Deserialize(node, dic, options = {}) {
        var parent = node.Parent;
        if (parent && parent['$ref'])
            node.Parent = dic[parent['$ref']];
        if (node.Children) {
            dic[node['$id']] = node;
            for (var i = 0, l = node.Children.length; i < l; i++) {
                Deserialize(node.Children[i], dic, options);
            }
        }
        if (options.populate)
            options.populate(node);
        else
            ReflectLocked(node);
        if (options.navToken)
            node.NavToken = options.navToken(node);
    }
    Node.Deserialize = Deserialize;
    function DeserializeChildren(nodes, parent, options = {}) {
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (parent)
                setParent(nodes[i], parent.Id, parent);
            if (nodes[i].HasChildren) {
                if (nodes[i].Children) {
                    DeserializeChildren(nodes[i].Children, nodes[i], options);
                }
                else
                    nodes[i].Children = [{ Id: 0, Name: "...", HasChildren: false }];
            }
            if (options.populate)
                options.populate(nodes[i]);
            else
                ReflectLocked(nodes[i]);
            if (options.navToken)
                nodes[i].NavToken = options.navToken(nodes[i]);
        }
    }
    Node.DeserializeChildren = DeserializeChildren;
    function SetParent(nodes, parent) {
        var parentId = parent ? parent.Id : 0;
        for (var i = 0, l = nodes.length; i < l; i++) {
            setParent(nodes[i], parentId, parent);
        }
    }
    Node.SetParent = SetParent;
    function setParent(node, parentId, parent) {
        if (!node.ParentId)
            node.ParentId = parentId;
        else if (node.ParentId != parentId)
            throw 'Parent folder mismatch: ' + node.ParentId + '!=' + parentId;
        if (parentId && parent && !node.Parent)
            node.Parent = parent;
    }
    function IsRootFolder(node) {
        return node && node.Id == 0 ? true : false;
    }
    Node.IsRootFolder = IsRootFolder;
})(Node || (Node = {}));
var NodeType;
(function (NodeType) {
    NodeType[NodeType["Super"] = 1] = "Super";
    NodeType[NodeType["Class"] = 2] = "Class";
})(NodeType || (NodeType = {}));
function ReflectLocked(group) {
    if ((group.NodeType & NodeType.Class) == 0)
        group.Locked = true;
}
var Semantic;
(function (Semantic) {
    let Facet;
    (function (Facet) {
        function Deserialize(facets) {
            if (facets && facets.length > 0)
                for (var i = 0, l = facets.length; i < l; i++) {
                    _deserialize(facets[i]);
                }
        }
        Facet.Deserialize = Deserialize;
        function _deserialize(facet) {
            if (facet.Values && facet.Values.length > 0)
                for (var i = 0; i < facet.Values.length; i++) {
                    facet.Values[i].Name = facet;
                }
        }
    })(Facet = Semantic.Facet || (Semantic.Facet = {}));
})(Semantic || (Semantic = {}));
var ServiceProvider;
(function (ServiceProvider) {
    ServiceProvider[ServiceProvider["BizSrt"] = 1] = "BizSrt";
    ServiceProvider[ServiceProvider["Google"] = 2] = "Google";
    ServiceProvider[ServiceProvider["Facebook"] = 3] = "Facebook";
})(ServiceProvider || (ServiceProvider = {}));
var SubType;
(function (SubType) {
    SubType[SubType["None"] = 0] = "None";
    SubType[SubType["Siblings"] = 1] = "Siblings";
    SubType[SubType["Children"] = 2] = "Children";
    SubType[SubType["GrandChildren"] = 4] = "GrandChildren";
})(SubType || (SubType = {}));

const Business = {
    Id: 1
};
const Community = {
    Blog: 3,
    Forum: {
        MaxLength: 30
    }
};
const Image$1 = (function () {
    return {
        Thumbnail: {
            Width: 130,
            Height: 0
        },
        WideThumbnail: {
            Width: 180,
            Height: 120
        },
        XtraSmall: {
            Width: 150,
            Height: 0
        },
        Small: {
            Width: 240,
            Height: 0
        },
        MediumSmall: {
            Width: 320,
            Height: 0
        },
        Medium: {
            Width: 640,
            Height: 0
        },
        JpegQuality: 80,
        SizeThreshold: 85
    };
})();
const Session = {
    StorageItemName: "bizsrtSession",
    //Handling: 6, //CreateOnDemand, ReenterClosed
    HttpHeader: {
        Token: "X-AdScrl-Session",
        Key: "Authorize"
    },
    AutoSignin: {
        CookieName: "AdScrl.User.Token",
        ExpireAfter: 10
    }
};
const Service = {
    Origin: "http://localhost:8080",
    HttpHeader: {
        Fault: "X-AdScrl-Fault"
    },
    Facebook: {
        AppId: "944137705659654"
    },
    Google: {
        ClientId: "549148705671-ja1hg0pm9bh4nqntldrk66rnpfl51cmh.apps.googleusercontent.com",
        ApiKey: "AIzaSyDdI1DHuEPefTcLwmJqZA8aozrsQDOOaAw"
    }
};
const WebSite = {
    Origin: {
        Host: "localhost:50000",
        ServerPath: "",
        AbsoluteUri: ""
    },
    HomePage: "/directory",
    NavToken: {
        Placement: 1,
        Qualifier: "t",
    },
    MobileUrl: "http://localhost:50003",
    FormsUrl: "http://localhost:50002/",
    OtherWeb: "ca"
};
//TODO: *.html import
window['Settings'] = {
    'Business': Business,
    'Community': Community,
    'Service': Service,
    'Session': Session,
    'WebSite': WebSite
};

//iron-ajax.html
//export class IronRequestElement {
//    /**
//     * A reference to the XMLHttpRequest instance used to generate the
//     * network request.
//     *
//     * @type {XMLHttpRequest}
//     */
//    xhr: _XMLHttpRequest;
//    /**
//     * A reference to the parsed response body, if the `xhr` has completely
//     * resolved.
//     *
//     * @type {*}
//     * @default null
//     */
//    response: Object = null;
//    _setResponse(response: Object) {
//        this.response = response;
//    }
//    /**
//     * A reference to the status code, if the `xhr` has completely resolved.
//     */
//    status: number = 0;
//    _setStatus(status: number) {
//        this.status = status;
//    }
//    /**
//     * A reference to the status text, if the `xhr` has completely resolved.
//     */
//    statusText: string = '';
//    _setStatusText(statusText: string) {
//        this.statusText = statusText;
//    }
//    /**
//     * A promise that resolves when the `xhr` response comes back, or rejects
//     * if there is an error before the `xhr` completes.
//     *
//     * @type {Promise}
//     */
//    completes; //Object
//    /**
//     * An object that contains progress information emitted by the XHR if
//     * available.
//     *
//     * @default {}
//     */
//    progress: Object = {};
//    _setProgress(progress: Object) {
//        this.progress = progress;
//    }
//    /**
//     * Aborted will be true if an abort of the request is attempted.
//     */
//    aborted: boolean = false;
//    _setAborted(aborted: boolean) {
//        this.aborted = aborted;
//    }
//    /**
//     * Errored will be true if the browser fired an error event from the
//     * XHR object (mainly network errors).
//     */
//    errored: boolean = false;
//    _setErrored(errored: boolean) {
//        this.errored = errored;
//    }
//    /**
//     * TimedOut will be true if the XHR threw a timeout event.
//     */
//    timedOut: boolean = false;
//    _setTimedOut(timedOut: boolean) {
//        this.timedOut = timedOut;
//    }
//    resolveCompletes;
//    rejectCompletes;
//    callback: Action<any>;
//    faultCallback: Action2<IronRequestElement, any>;
//    constructor() {
//        this.xhr = <_XMLHttpRequest>new XMLHttpRequest();
//        this.completes = new Promise(function (resolve, reject) {
//            this.resolveCompletes = resolve;
//            this.rejectCompletes = reject;
//        }.bind(this));
//    }
//    /**
//     * Succeeded is true if the request succeeded. The request succeeded if it
//     * loaded without error, wasn't aborted, and the status code is ≥ 200, and
//     * < 300, or if the status code is 0.
//     *
//     * The status code 0 is accepted as a success because some schemes - e.g.
//     * file:// - don't provide status codes.
//     *
//     * @return {boolean}
//     */
//    get succeeded() {
//        if (this.errored || this.aborted || this.timedOut) {
//            return false;
//        }
//        var status = this.xhr.status || 0;
//        // Note: if we are using the file:// protocol, the status code will be 0
//        // for all outcomes (successful or otherwise).
//        return status === 0 ||
//            (status >= 200 && status < 300);
//    }
//    /**
//     * Sends an HTTP request to the server and returns the XHR object.
//     *
//     * The handling of the `body` parameter will vary based on the Content-Type
//     * header. See the docs for iron-ajax's `body` param for details.
//     *
//     * @param {{
//     *   url: string,
//     *   method: (string|undefined),
//     *   async: (boolean|undefined),
//     *   body: (ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined|Object),
//     *   headers: (Object|undefined),
//     *   handleAs: (string|undefined),
//     *   jsonPrefix: (string|undefined),
//     *   withCredentials: (boolean|undefined)}} options -
//     *     url The url to which the request is sent.
//     *     method The HTTP method to use, default is GET.
//     *     async By default, all requests are sent asynchronously. To send synchronous requests,
//     *         set to false.
//     *     body The content for the request body for POST method.
//     *     headers HTTP request headers.
//     *     handleAs The response type. Default is 'text'.
//     *     withCredentials Whether or not to send credentials on the request. Default is false.
//     *   timeout: (Number|undefined)
//     * @return {Promise}
//     */
//    send(options: RequestOptions) {
//        var xhr = this.xhr;
//        if (xhr.readyState > 0) {
//            return null;
//        }
//        xhr.addEventListener('progress', function (progress) {
//            this._setProgress({
//                lengthComputable: progress.lengthComputable,
//                loaded: progress.loaded,
//                total: progress.total
//            });
//        }.bind(this))
//        xhr.addEventListener('error', function (error) {
//            this._setErrored(true);
//            this._updateStatus();
//            this.rejectCompletes(error);
//        }.bind(this));
//        xhr.addEventListener('timeout', function (error) {
//            this._setTimedOut(true);
//            this._updateStatus();
//            this.rejectCompletes(error);
//        }.bind(this));
//        xhr.addEventListener('abort', function () {
//            this._updateStatus();
//            this.rejectCompletes(new Error('Request aborted.'));
//        }.bind(this));
//        // Called after all of the above.
//        xhr.addEventListener('loadend', function () {
//            this._updateStatus();
//            this._setResponse(this.parseResponse());
//            if (!this.succeeded) {
//                this.rejectCompletes(new Error('The request failed with status code: ' + this.xhr.status));
//                return;
//            }
//            this.resolveCompletes(this);
//        }.bind(this));
//        //this.url = options.url;
//        xhr.open(
//            options.method || 'GET',
//            options.url,
//            options.async !== false
//        );
//        var acceptType = {
//            'json': 'application/json',
//            'text': 'text/plain',
//            'html': 'text/html',
//            'xml': 'application/xml',
//            'arraybuffer': 'application/octet-stream'
//        }[options.handleAs];
//        var headers = options.headers || Object.create(null);
//        var newHeaders = Object.create(null);
//        for (var key in headers) {
//            newHeaders[key.toLowerCase()] = headers[key];
//        }
//        headers = newHeaders;
//        if (acceptType && !headers['accept']) {
//            headers['accept'] = acceptType;
//        }
//        Object.keys(headers).forEach(function (requestHeader) {
//            if (/[A-Z]/.test(requestHeader)) {
//                Polymer.Base._error('Headers must be lower case, got', requestHeader);
//            }
//            xhr.setRequestHeader(
//                requestHeader,
//                headers[requestHeader]
//            );
//        }, this);
//        if (options.async !== false) {
//            if (options.async) {
//                xhr.timeout = options.timeout;
//            }
//            var handleAs = options.handleAs;
//            // If a JSON prefix is present, the responseType must be 'text' or the
//            // browser won’t be able to parse the response.
//            if (!!options.jsonPrefix || !handleAs) {
//                handleAs = 'text';
//            }
//            // In IE, `xhr.responseType` is an empty string when the response
//            // returns. Hence, caching it as `xhr._responseType`.
//            xhr.responseType = <XMLHttpRequestResponseType>(xhr._responseType = handleAs);
//            // Cache the JSON prefix, if it exists.
//            if (!!options.jsonPrefix) {
//                xhr._jsonPrefix = options.jsonPrefix;
//            }
//        }
//        xhr.withCredentials = !!options.withCredentials;
//        var body = this._encodeBodyObject(options.body, headers['content-type']);
//        xhr.send(
//            /** @type {ArrayBuffer|ArrayBufferView|Blob|Document|FormData|
//                       null|string|undefined} */
//            (body));
//        return this.completes;
//    }
//    /**
//     * Attempts to parse the response body of the XHR. If parsing succeeds,
//     * the value returned will be deserialized based on the `responseType`
//     * set on the XHR.
//     *
//     * @return {*} The parsed response,
//     * or undefined if there was an empty response or parsing failed.
//     */
//    parseResponse () {
//        var xhr = this.xhr;
//        var responseType = xhr.responseType || xhr._responseType;
//        var preferResponseText = !this.xhr.responseType;
//        var prefixLen = (xhr._jsonPrefix && xhr._jsonPrefix.length) || 0;
//        try {
//            switch (responseType) {
//                case 'json':
//                    // If the xhr object doesn't have a natural `xhr.responseType`,
//                    // we can assume that the browser hasn't parsed the response for us,
//                    // and so parsing is our responsibility. Likewise if response is
//                    // undefined, as there's no way to encode undefined in JSON.
//                    if (preferResponseText || xhr.response === undefined) {
//                        // Try to emulate the JSON section of the response body section of
//                        // the spec: https://xhr.spec.whatwg.org/#response-body
//                        // That is to say, we try to parse as JSON, but if anything goes
//                        // wrong return null.
//                        try {
//                            return JSON.parse(xhr.responseText);
//                        } catch (_) {
//                            return null;
//                        }
//                    }
//                    return xhr.response;
//                case 'xml':
//                    return xhr.responseXML;
//                case 'blob':
//                case 'document':
//                case 'arraybuffer':
//                    return xhr.response;
//                case 'text':
//                default: {
//                    // If `prefixLen` is set, it implies the response should be parsed
//                    // as JSON once the prefix of length `prefixLen` is stripped from
//                    // it. Emulate the behavior above where null is returned on failure
//                    // to parse.
//                    if (prefixLen) {
//                        try {
//                            return JSON.parse(xhr.responseText.substring(prefixLen));
//                        } catch (_) {
//                            return null;
//                        }
//                    }
//                    return xhr.responseText;
//                }
//            }
//        } catch (e) {
//            this.rejectCompletes(new Error('Could not parse response. ' + e.message));
//        }
//    }
//    /**
//     * Aborts the request.
//     */
//    abort () {
//        this._setAborted(true);
//        this.xhr.abort();
//    }
//    /**
//     * @param {*} body The given body of the request to try and encode.
//     * @param {?string} contentType The given content type, to infer an encoding
//     *     from.
//     * @return {*} Either the encoded body as a string, if successful,
//     *     or the unaltered body object if no encoding could be inferred.
//     */
//    _encodeBodyObject (body, contentType) {
//        if (typeof body == 'string') {
//            return body;  // Already encoded.
//        }
//        var bodyObj = /** @type {Object} */ (body);
//        switch (contentType) {
//            case ('application/json'):
//                return JSON.stringify(bodyObj);
//            case ('application/x-www-form-urlencoded'):
//                return this._wwwFormUrlEncode(bodyObj);
//        }
//        return body;
//    }
//    /**
//     * @param {Object} object The object to encode as x-www-form-urlencoded.
//     * @return {string} .
//     */
//    _wwwFormUrlEncode (object) {
//        if (!object) {
//            return '';
//        }
//        var pieces = [];
//        Object.keys(object).forEach(function (key) {
//            // TODO(rictic): handle array values here, in a consistent way with
//            //   iron-ajax params.
//            pieces.push(
//                this._wwwFormUrlEncodePiece(key) + '=' +
//                this._wwwFormUrlEncodePiece(object[key]));
//        }, this);
//        return pieces.join('&');
//    }
//    /**
//     * @param {*} str A key or value to encode as x-www-form-urlencoded.
//     * @return {string} .
//     */
//    _wwwFormUrlEncodePiece (str) {
//        // Spec says to normalize newlines to \r\n and replace %20 spaces with +.
//        // jQuery does this as well, so this is likely to be widely compatible.
//        if (str === null) {
//            return '';
//        }
//        return encodeURIComponent(str.toString().replace(/\r?\n/g, '\r\n'))
//            .replace(/%20/g, '+');
//    }
//    /**
//     * Updates the status code and status text.
//     */
//    _updateStatus () {
//        this._setStatus(this.xhr.status);
//        this._setStatusText((this.xhr.statusText === undefined) ? '' : this.xhr.statusText);
//    }
//}

//https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;
            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        }
    });
}
Array.mapReduce = function (elems, callback /*, arg*/) {
    var value, i = 0, length = elems.length, ret = [];
    // Go through the array, translating each of the items to their new values
    //if (isArraylike(elems)) {
    for (; i < length; i++) {
        value = callback(elems[i], i /*, arg*/);
        if (value != null) {
            ret.push(value);
        }
    }
    // Go through every key on the object,
    //} else {
    //    for (i in elems) {
    //        value = callback(elems[i], i, arg);
    //        if (value != null) {
    //            ret.push(value);
    //        }
    //    }
    //}
    // Flatten any nested arrays
    //return concat.apply([], ret);
    return ret;
};

//http://www.west-wind.com/weblog/posts/2009/Sep/15/Making-jQuery-calls-to-WCFASMX-with-a-ServiceProxy-Client
Date.serialize = function (date) {
    var wcfDate = '/Date(' + date.valueOf() + ')/';
    return wcfDate;
};
Date.deserialize = function (jsonDate) {
    var parser = RegExp.Patterns.Date_ISO.exec(jsonDate);
    if (parser) {
        var msec = parser.length > 6 ? parser[7] || "000" : "000";
        while (msec.length < 3) {
            msec += "0";
        }
        var utcMilliseconds = Date.UTC(+parser[1], +parser[2] - 1, +parser[3], +parser[4], +parser[5], +parser[6], +msec || 0);
        return new Date(utcMilliseconds);
    }
};
Date.toString = (function () {
    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var func = function (date, prefix) {
        if (date) {
            var today = new Date();
            if (date.getFullYear() == today.getFullYear()) {
                if (date.getMonth() == today.getMonth() && date.getDate() == today.getDate()) {
                    var hours = date.getHours();
                    var ap = hours < 12 ? "AM" : "PM";
                    hours = hours % 12 || 12;
                    var minutes = date.getMinutes();
                    return (prefix ? 'at ' : '') + hours + ':' + (minutes >= 10 ? minutes : '0' + minutes) + ' ' + ap;
                }
                else
                    return (prefix ? 'on ' : '') + month[date.getMonth()] + ' ' + date.getDate();
            }
            else
                return (prefix ? 'on ' : '') + month[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear().toString().slice(2);
        }
    };
    return func;
})();

Object.isEmpty = function (obj) {
    if (obj) {
        for (var name in obj) {
            if (obj.hasOwnProperty(name))
                return false;
        }
    }
    return true;
};
Object.mixin = function (target, object1, ...objectN) {
    //jQuery.extend.apply(this, arguments);
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
    // Handle a deep copy situation
    if (typeof target === "boolean") {
        deep = target;
        // Skip the boolean and the target
        target = arguments[i] || {};
        i++;
    }
    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && typeof target !== "function") {
        target = {};
    }
    // Extend jQuery itself if only one argument is passed
    if (i === length) {
        target = this;
        i--;
    }
    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];
                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }
                // Recurse if we're merging plain objects or arrays
                if (deep && copy && (typeof copy === "object" || (copyIsArray = (copy.constructor === Array)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && src.constructor === Array ? src : [];
                    }
                    else {
                        clone = src && typeof copy === "object" ? src : {};
                    }
                    // Never move original objects, clone them
                    target[name] = Object.mixin(deep, clone, copy);
                    // Don't bring in undefined values
                }
                else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }
    // Return the modified object
    return target;
    /*var baseCtors: any[]; //String.format
    if (arguments.length > 2 && object1.constructor !== Array) {
        baseCtors = Array.prototype.slice.call(arguments, 1);
    }
    else if (object1.constructor !== Array) {
        baseCtors = [object1];
    }
    else
        baseCtors = object1;
    //https://www.typescriptlang.org/docs/handbook/mixins.html
    return Object.extend(target, baseCtors)*/
};
//https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Mixins.md
Object.extend = function (derivedCtor, baseCtors) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
};
Object.deserialize = function (target, object, props, exclude) {
    for (var prop in object) {
        if (prop == "Properties") {
            for (var p in object.Properties) {
                if (!(props && exclude && props.indexOf(p) >= 0))
                    target[p] = object.Properties[p];
            }
        }
        else if (!(props && exclude && props.indexOf(prop) >= 0))
            target[prop] = object[prop];
    }
    return target;
};

//babel-polyfill
//if (!String.prototype.endsWith) {
//    Object.defineProperty(String.prototype, 'endsWith', {
//        value: function (searchString /*, endPosition = @length */) {
//            var that = context(this, searchString, ENDS_WITH)
//                , endPosition = arguments.length > 1 ? arguments[1] : undefined
//                , len = toLength(that.length)
//                , end = endPosition === undefined ? len : Math.min(toLength(endPosition), len)
//                , search = String(searchString);
//            return $endsWith
//                ? $endsWith.call(that, search, end)
//                : that.slice(end - search.length, end) === search;
//        }
//    });
//}
//From jQuery Validation Plugin
String.format = function (format, arg0, arg1) {
    if (arguments.length === 1) {
        return format;
    }
    var args;
    if (arguments.length > 2 && arg0.constructor !== Array) {
        //http://stackoverflow.com/questions/960866/how-can-i-convert-the-arguments-object-to-an-array-in-javascript
        args = Array.prototype.slice.call(arguments, 1); //jQuery.makeArray(arguments).slice(1);
    }
    else if (arg0.constructor !== Array) {
        args = [arg0];
    }
    else
        args = arg0;
    args.forEach((arg, index) => {
        format = format.replace(new RegExp("\\{" + index + "\\}", "g"), function () {
            return arg;
        });
    });
    return format;
};
String.formatFunc = (formatString) => {
    return (...args) => {
        if (!Array.isArray(args))
            args = [formatString];
        else
            args.unshift(formatString);
        return String.format.apply(undefined, args); //String.format.apply(this, args);
    };
};
String.formatPhone = function (phone) {
    if (typeof phone == 'string' && phone.length >= 10) {
        phone = phone.replace(/[^0-9]/g, '');
        if (phone.length > 10 && phone.substring(0, 1) == '1')
            phone = phone.substring(1, 10);
        phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    return phone;
};
String.isNullOrWhiteSpace = function (value) {
    if (value) {
        var valueType = typeof value;
        if (valueType === 'undefined')
            return true;
        else if (valueType === 'string')
            return value.length == 0 || value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').length == 0 ? true : false;
        else
            throw String.format('Expected string, got {0} ({1})', valueType, value);
    }
    else
        return true;
};
String.isNullOrEmpty = function (value) {
    if (value) {
        var valueType = typeof value;
        if (valueType === 'undefined')
            return true;
        else if (valueType === 'string')
            return value.length == 0 ? true : false;
        else
            throw String.format('Expected string, got {0} ({1})', valueType, value);
    }
    else
        return true;
};
String.trim = function (value) {
    return value.trim();
};
String.pluralize = function (value, count) {
    if (value && (count || count === 0)) {
        if (value.charAt(value.length - 1) == 'y')
            return value.slice(0, value.length - 1) + 'ies';
        else if (value.charAt(value.length - 1) != 's')
            return value + 's';
    }
    return value;
};
String.capitalize = function (value) {
    if (value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    else
        return value;
};
//http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
String.toTitleCase = function (value) {
    if (value) {
        return value.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
    else
        return value;
};
//http://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
String.toDOM = function (html) {
    if (html) {
        //jQuery(html);
        if (typeof html === "string") {
            //http://stackoverflow.com/questions/15458876/check-if-a-string-is-html-or-not
            if (!/<[a-z][\s\S]*>/i.test(html))
                html = '<p>' + html + '</p>';
            var template = document.createElement('template');
            template.innerHTML = html;
            return template.content.childNodes;
        }
    }
};

Error.getMessage = function (error, data) {
    var errorMessage;
    if (data) {
        if (data.Message)
            errorMessage = data.Message;
        else
            error = data;
    }
    else if (error && error.description)
        errorMessage = error.description;
    if (!errorMessage)
        errorMessage = error.message || (typeof error == "string" && error) || (error.toString && error.toString()) || "Unknown error";
    if (errorMessage.length > 2048)
        return errorMessage.substring(0, 2048);
    else
        return errorMessage;
};
var Guid$1;
(function (Guid) {
    Guid.Empty = '00000000-0000-0000-0000-000000000000';
    function isEmpty(guid) {
        return guid && guid.length > 0 && guid.indexOf('0000') == -1 ? false : true;
    }
    Guid.isEmpty = isEmpty;
    function Deserialize(guid) {
        return guid.replace(/-/g, '');
    }
    Guid.Deserialize = Deserialize;
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    //http://guid.us/GUID/JavaScript
    function newGuid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    Guid.newGuid = newGuid;
    var s4 = function () {
        return Math.floor(((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
})(Guid$1 || (Guid$1 = {}));

//GetValue: (resource, enumeration, name) => (value) => any;
const Action = {
    Cancel: "Cancel",
    Change: "Change",
    Ok: "Okay",
    Post: "Post",
    Remove: "Remove",
    Save: "Save",
    Search: "Search",
    Send: "Send",
    Sign_in: "Sign In"
};
const Business$1 = {
    Confirm_Delete_Multiproduct: "Do you want to delete company's What We Do page?",
    Profile: "Company Profile",
    Uncategorized: "Uncategorized Companies"
};
const Community$1 = {
    Category_Topic_All: "All Category Topics",
    Confirm_Delete: "Do you want to delete {0} community?",
    Member: "Member",
    Topic: "Topic"
};
const Dictionary = {
    All_Categories: "All Categories",
    Business_directory: "Business directory",
    Blog: "Blog",
    Category: "Category",
    City: "City",
    company: "company",
    community: "community",
    Confirm_email: "Confirm email",
    Country: "Country",
    Directory: "Directory",
    Email: "Email",
    Error: "Error",
    Error_details: "Error details",
    Everywere: "Everywere",
    Location: "Location",
    Main: "Main",
    Name: "Name",
    Password: "Password",
    Postal_code: "Postal code",
    Phone: "Phone",
    Products_and_Services: "Products and Services",
    Product_directory: "Product directory",
    product: "product",
    record: "record",
    Remember_me: "Remember me",
    Search_criteria: "Search criteria",
    service: "service",
    Service_directory: "Service directory",
    Street_address: "Street address",
    Topic: "Topic",
    Unlisted: "Unlisted",
    What: "What",
    Where: "Where"
};
const Exception = {
    Operation_Invalid: "Operation is not allowed",
    Operation_InvalidInput: "Invalid or missing input parameter(s) for this operation",
    Operation_InvalidInteraction: "Actor or Addressee for this interaction is missing or invalid",
    Operation_UnexpectedState: "Operation is not valid for this state of object",
    Operation_NotSupported: "Operation is not supported",
    Operation_InternalError: "Internal server has error occured",
    Data_RecordNotFound: "Record could not be found",
    Data_DuplicateRecord: "Record already exists",
    Data_ReferentialIntegrity: "Record could not be deleted due to referential integrity constraints",
    Data_StaleRecord: "Your version of the record is not current, please refresh and try again",
    Session_Unavailable: "Server is unavailable",
    Session_NotAuthenticated: "This operation requires authentication, please sign-in",
    Session_Unauthorized: "You are not authorized to perform this operation",
    Session_QuotaExceeded: "Maximum allowed quota has been reached for you account",
    Argument_Invalid: "Invalid value for {0}",
    Argument_ValueRequired: "Value required for {0}",
    Unknown: "An unknown error was encountered, please contact technical support for more information"
};
const Global = {
    Account_Email_Error_Duplicate: "Account with email {0} already exists in our system.",
    Account_Email_Error_NotFound: "Email could not be found.",
    Account_Password_Requirement: "Password must be at least 6 characters long, contain both lower and upper letters and at least one number or special character.",
    Account_Password_Weak: "Password is too weak",
    Account_UserName_Invalid: "Name may contain letters and space(s) only",
    Bizsort: "Bizsort",
    Are_you_sure: "Are you sure?",
    Category_All: "All Categories",
    Confirm_Delete_X: "Do you want to delete {0}?",
    Country_Error_NotSupported: "{0} is not supported",
    Folder_Error_Delete: "{0} could not be deleted! If it has {1}, delete them first",
    Folder_Error_Name_Exists: "{0} with this name exists already",
    Editor_Error_Enter_X: "Please enter {0}",
    Editor_Error_Enter_X_Name: "Please enter {0} name",
    Editor_Error_Enter_X_Valid: "Please enter valid {0}",
    Editor_Error_processing_request_X: "There was an error processing your request. {0}",
    Editor_Error_Select_X: "Please select {0}",
    Editor_Error_Select_X_From_List: "Please select {0} from list",
    Editor_Error_Value_X_Not_Valid: "Value {0} does not satisfy validation criteria",
    List_Header_EmptyFormat: "There are curently no {0} to display",
    List_Header_Format: "Showing {0} - {1} of {2} {3}",
    Location_Error_X: "Please enter location including {0}",
    Page_TitleSeparator: " | ",
    Search_Header_EmptyFormat: "Your search for {1} did not return any results",
    Search_Header_Format: "Showing {0} - {1} of {2} {3} for {4}",
    SignIn_Error_AccountInactive: "Account is not active",
    SignIn_Error_AccountLocked: "Account is locked please reset your password",
    SignIn_Error_InvalidEmailPassword: "Invalid email or password",
    X_Ads: "{0} Ads"
};
const Product$1 = {
    Status_Draft: "Draft",
    Status_Pending: "Pending",
    Status_Active: "Active",
    Status_Rejected: "Rejected",
    Status_Archived: "Archived",
    Status_Deleted: "Deleted",
    Uncategorized: "Uncategorized Products"
};
//TODO: *.html import
window['Resource'] = {
    'Action': Action,
    'Business': Business$1,
    'Community': Community$1,
    'Dictionary': Dictionary,
    'Exception': Exception,
    'Global': Global,
    'Product': Product$1
};

var ErrorMessageType;
(function (ErrorMessageType) {
    ErrorMessageType[ErrorMessageType["Operation_Invalid"] = 11] = "Operation_Invalid";
    ErrorMessageType[ErrorMessageType["Operation_InvalidInput"] = 12] = "Operation_InvalidInput";
    ErrorMessageType[ErrorMessageType["Operation_InvalidInteraction"] = 13] = "Operation_InvalidInteraction";
    ErrorMessageType[ErrorMessageType["Operation_UnexpectedState"] = 14] = "Operation_UnexpectedState";
    ErrorMessageType[ErrorMessageType["Operation_NotSupported"] = 15] = "Operation_NotSupported";
    ErrorMessageType[ErrorMessageType["Operation_InternalError"] = 16] = "Operation_InternalError";
    ErrorMessageType[ErrorMessageType["Data_RecordNotFound"] = 21] = "Data_RecordNotFound";
    ErrorMessageType[ErrorMessageType["Data_DuplicateRecord"] = 22] = "Data_DuplicateRecord";
    ErrorMessageType[ErrorMessageType["Data_ReferentialIntegrity"] = 23] = "Data_ReferentialIntegrity";
    ErrorMessageType[ErrorMessageType["Data_StaleRecord"] = 24] = "Data_StaleRecord";
    ErrorMessageType[ErrorMessageType["Session_Unavailable"] = 31] = "Session_Unavailable";
    ErrorMessageType[ErrorMessageType["Session_NotAuthenticated"] = 32] = "Session_NotAuthenticated";
    ErrorMessageType[ErrorMessageType["Session_Unauthorized"] = 33] = "Session_Unauthorized";
    ErrorMessageType[ErrorMessageType["Session_QuotaExceeded"] = 34] = "Session_QuotaExceeded";
    ErrorMessageType[ErrorMessageType["Argument_Invalid"] = 41] = "Argument_Invalid";
    ErrorMessageType[ErrorMessageType["Argument_ValueRequired"] = 42] = "Argument_ValueRequired";
    ErrorMessageType[ErrorMessageType["Unknown"] = 0] = "Unknown";
})(ErrorMessageType || (ErrorMessageType = {}));
var ArgumentExceptionType;
(function (ArgumentExceptionType) {
    ArgumentExceptionType[ArgumentExceptionType["Invalid"] = 1] = "Invalid";
    ArgumentExceptionType[ArgumentExceptionType["ValueRequired"] = 2] = "ValueRequired";
})(ArgumentExceptionType || (ArgumentExceptionType = {}));
var DataExceptionType;
(function (DataExceptionType) {
    DataExceptionType[DataExceptionType["RecordNotFound"] = 1] = "RecordNotFound";
    DataExceptionType[DataExceptionType["DuplicateRecord"] = 2] = "DuplicateRecord";
    DataExceptionType[DataExceptionType["ReferentialIntegrity"] = 3] = "ReferentialIntegrity";
    DataExceptionType[DataExceptionType["StaleRecord"] = 4] = "StaleRecord";
})(DataExceptionType || (DataExceptionType = {}));
var OperationExceptionType;
(function (OperationExceptionType) {
    OperationExceptionType[OperationExceptionType["Invalid"] = 1] = "Invalid";
    OperationExceptionType[OperationExceptionType["InvalidInput"] = 2] = "InvalidInput";
    OperationExceptionType[OperationExceptionType["InvalidInteraction"] = 3] = "InvalidInteraction";
    OperationExceptionType[OperationExceptionType["UnexpectedState"] = 4] = "UnexpectedState";
    OperationExceptionType[OperationExceptionType["NotSupported"] = 5] = "NotSupported";
    OperationExceptionType[OperationExceptionType["InternalError"] = 6] = "InternalError";
})(OperationExceptionType || (OperationExceptionType = {}));
var SessionExceptionType;
(function (SessionExceptionType) {
    SessionExceptionType[SessionExceptionType["Unavailable"] = 1] = "Unavailable";
    SessionExceptionType[SessionExceptionType["NotAuthenticated"] = 2] = "NotAuthenticated";
    SessionExceptionType[SessionExceptionType["Unauthorized"] = 3] = "Unauthorized";
    SessionExceptionType[SessionExceptionType["QuotaExceeded"] = 4] = "QuotaExceeded";
})(SessionExceptionType || (SessionExceptionType = {}));

var AccountType;
(function (AccountType) {
    AccountType[AccountType["Business"] = 1] = "Business";
    AccountType[AccountType["Personal"] = 2] = "Personal";
})(AccountType || (AccountType = {}));
var Address;
(function (Address) {
    let Requirement;
    (function (Requirement) {
        Requirement[Requirement["None"] = 0] = "None";
        Requirement[Requirement["Country"] = 1] = "Country";
        Requirement[Requirement["City"] = 2] = "City";
        Requirement[Requirement["PostalCode"] = 3] = "PostalCode";
        Requirement[Requirement["StreetAddress"] = 4] = "StreetAddress";
    })(Requirement = Address.Requirement || (Address.Requirement = {}));
})(Address || (Address = {}));
var ServiceType;
(function (ServiceType) {
    ServiceType.Any = 2147483647;
    let ItemType;
    (function (ItemType) {
        ItemType[ItemType["Design"] = 1] = "Design";
        ItemType[ItemType["Make"] = 2] = "Make";
        ItemType[ItemType["Custom_Build"] = 4] = "Custom_Build";
        ItemType[ItemType["Install"] = 8] = "Install";
        ItemType[ItemType["Operate"] = 16] = "Operate";
        ItemType[ItemType["Maintain_Repair"] = 32] = "Maintain_Repair";
        ItemType[ItemType["Measure_Test"] = 64] = "Measure_Test";
        ItemType[ItemType["Supply"] = 128] = "Supply";
        ItemType[ItemType["Dispose"] = 256] = "Dispose";
    })(ItemType = ServiceType.ItemType || (ServiceType.ItemType = {}));
})(ServiceType || (ServiceType = {}));
var Industry;
(function (Industry) {
    Industry.Any = 2147483647;
})(Industry || (Industry = {}));
var Currency;
(function (Currency) {
    let ItemType;
    (function (ItemType) {
        ItemType[ItemType["CAD"] = 1] = "CAD";
    })(ItemType = Currency.ItemType || (Currency.ItemType = {}));
})(Currency || (Currency = {}));
var DictionaryType;
(function (DictionaryType) {
    DictionaryType[DictionaryType["SecurityProfile"] = 1] = "SecurityProfile";
    DictionaryType[DictionaryType["ServiceType"] = 2] = "ServiceType";
    DictionaryType[DictionaryType["TransactionType"] = 3] = "TransactionType";
    DictionaryType[DictionaryType["Industry"] = 4] = "Industry";
    DictionaryType[DictionaryType["ProductType"] = 5] = "ProductType";
    DictionaryType[DictionaryType["ProductPriceType"] = 6] = "ProductPriceType";
    DictionaryType[DictionaryType["ProductAttributeType"] = 7] = "ProductAttributeType";
    DictionaryType[DictionaryType["Currency"] = 8] = "Currency";
})(DictionaryType || (DictionaryType = {}));
var ImageSizeType;
(function (ImageSizeType) {
    ImageSizeType[ImageSizeType["Thumbnail"] = 1] = "Thumbnail";
    ImageSizeType[ImageSizeType["XtraSmall"] = 2] = "XtraSmall";
    ImageSizeType[ImageSizeType["Small"] = 3] = "Small";
    ImageSizeType[ImageSizeType["MediumSmall"] = 4] = "MediumSmall";
    ImageSizeType[ImageSizeType["Medium"] = 5] = "Medium";
})(ImageSizeType || (ImageSizeType = {}));
var ImageEntity;
(function (ImageEntity) {
    ImageEntity[ImageEntity["Business"] = 1] = "Business";
    ImageEntity[ImageEntity["Product"] = 2] = "Product";
    ImageEntity[ImageEntity["Service"] = 3] = "Service";
    ImageEntity[ImageEntity["BusinessPromotion"] = 4] = "BusinessPromotion";
    ImageEntity[ImageEntity["Community"] = 5] = "Community";
    ImageEntity[ImageEntity["CommunityTopic"] = 6] = "CommunityTopic";
    ImageEntity[ImageEntity["Person"] = 7] = "Person";
})(ImageEntity || (ImageEntity = {}));
var PWAImage;
(function (PWAImage) {
    let Size;
    (function (Size) {
        Size[Size["Icon_512"] = 1] = "Icon_512";
        Size[Size["Icon_192"] = 2] = "Icon_192";
    })(Size = PWAImage.Size || (PWAImage.Size = {}));
})(PWAImage || (PWAImage = {}));
var PendingStatus;
(function (PendingStatus) {
    PendingStatus[PendingStatus["EmailConfirmation"] = 1] = "EmailConfirmation";
    PendingStatus[PendingStatus["PeerReview"] = 2] = "PeerReview";
    PendingStatus[PendingStatus["StaffReview"] = 4] = "StaffReview";
})(PendingStatus || (PendingStatus = {}));
var ProductType;
(function (ProductType) {
    ProductType.Default = 16387;
    let ItemType;
    (function (ItemType) {
        ItemType[ItemType["Product"] = 1] = "Product";
        ItemType[ItemType["Service"] = 2] = "Service";
        ItemType[ItemType["Job"] = 4] = "Job";
        ItemType[ItemType["Other"] = 16384] = "Other";
    })(ItemType = ProductType.ItemType || (ProductType.ItemType = {}));
})(ProductType || (ProductType = {}));
var ProductsView;
(function (ProductsView) {
    ProductsView[ProductsView["NoProducts"] = 0] = "NoProducts";
    ProductsView[ProductsView["Multiproduct"] = 1] = "Multiproduct";
    ProductsView[ProductsView["ProductList"] = 2] = "ProductList";
    ProductsView[ProductsView["ProductCatalog"] = 3] = "ProductCatalog";
})(ProductsView || (ProductsView = {}));
var PostType;
(function (PostType) {
    PostType[PostType["None"] = 0] = "None";
    PostType[PostType["NoAccount"] = 1] = "NoAccount";
    PostType[PostType["Personal"] = 2] = "Personal";
    PostType[PostType["Business"] = 4] = "Business";
    //Either = 7
})(PostType || (PostType = {}));
class SecurityProfile {
    constructor() {
        this.Reset();
    }
    Initialize(securityProfile) {
        this.Type = securityProfile.Type;
        this.AutoPost = securityProfile.AutoPost;
        this.CanRelease_Peer = securityProfile.CanRelease_Peer;
        this.CanSuspend = securityProfile.CanSuspend;
        this.CanReview_Staff = securityProfile.CanReview_Staff;
        this.CanEdit_All = securityProfile.CanEdit_All;
        this.CanProduce_Business = securityProfile.CanProduce_Business;
        this.CanProduce_Product = securityProfile.CanProduce_Product;
        this.CanManage_OffensiveList = securityProfile.CanManage_OffensiveList;
        this.CanManage_Categories = securityProfile.CanManage_Categories;
        this.CanManage_Locations = securityProfile.CanManage_Locations;
        this.CanManage_BusinessImport = securityProfile.CanManage_BusinessImport;
        this.CanManage_ProductImport = securityProfile.CanManage_ProductImport;
    }
    Reset() {
        this.Type = 0;
        this.AutoPost = false;
        this.CanRelease_Peer = false;
        this.CanSuspend = false;
        this.CanReview_Staff = false;
        this.CanEdit_All = false;
        this.CanProduce_Business = false;
        this.CanProduce_Product = false;
        this.CanManage_OffensiveList = false;
        this.CanManage_Categories = false;
        this.CanManage_Locations = false;
        this.CanManage_BusinessImport = false;
        this.CanManage_ProductImport = false;
    }
}
(function (SecurityProfile) {
    let Type;
    (function (Type) {
        Type[Type["Low"] = 1] = "Low";
        Type[Type["Medium"] = 2] = "Medium";
        Type[Type["High"] = 3] = "High";
        Type[Type["Affiliate"] = 4] = "Affiliate";
        Type[Type["Staff"] = 5] = "Staff";
    })(Type = SecurityProfile.Type || (SecurityProfile.Type = {}));
})(SecurityProfile || (SecurityProfile = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType.Default = 7;
    let ItemType;
    (function (ItemType) {
        ItemType[ItemType["Business"] = 1] = "Business";
        ItemType[ItemType["Consumer"] = 2] = "Consumer";
        ItemType[ItemType["Sell"] = 4] = "Sell";
        ItemType[ItemType["Lease"] = 8] = "Lease";
        ItemType[ItemType["Buy"] = 128] = "Buy";
    })(ItemType = TransactionType.ItemType || (TransactionType.ItemType = {}));
})(TransactionType || (TransactionType = {}));

class ImageHelper {
    constructor(imgData, minSze, maxSize) {
        this.src = imgData.src;
        this.type = imgData.type || ImageType.Jpeg;
        this.preserveFormat = imgData.preserveFormat !== undefined ? imgData.preserveFormat : false;
        /*this.minSze = minSze || ImageSettings.Thumbnail;
        this.maxSize = maxSize || (this.entity == ImageEntity.Person ? ImageSettings.XtraSmall : ImageSettings.Medium);
        if (this.entity == ImageEntity.Business && !minSze) {
            this.minSze = ImageSettings.WideThumbnail;
            this.maxSize.Height = this.maxSize.Width;
            this.maxSize.Width *= 2;
        }*/
        this.minSze = minSze || Image$1.Thumbnail;
        this.maxSize = maxSize || Image$1.Medium;
    }
    process(callback) {
        //https://github.com/Microsoft/TypeScript/issues/4166 global namespace
        var image = new Image() /*document.createElement("img")*/;
        image.style.display = "none";
        image.setAttribute('crossOrigin', 'anonymous'); //img.crossOrigin = "";
        image.onload = () => {
            var resized, preview;
            var sizedImage = this.resize(image, this.maxSize, false);
            if (!sizedImage) {
                var bounds = this.getBounds(image, this.minSze);
                if (this.fitsThreshold(image, bounds, Image$1.SizeThreshold))
                    sizedImage = this.render(image, image.width, image.height);
            }
            if (sizedImage) {
                if (!(this.type == ImageType.Jpeg || this.type == ImageType.Png || this.type == ImageType.Gif)) {
                    this.type = ImageType.Jpeg;
                    if (this.preserveFormat)
                        this.preserveFormat = false;
                }
                resized = {
                    Type: this.type,
                    Width: sizedImage.width,
                    Height: sizedImage.height,
                    Content: this.getDataURL(sizedImage, this.type, Image$1.JpegQuality / 100)
                };
                sizedImage = this.resize(image, Image$1.Small, true);
                if (sizedImage) {
                    preview = {
                        Width: sizedImage.width,
                        Height: sizedImage.height,
                        Content: this.getDataURL(sizedImage, this.type)
                    };
                }
                callback(resized, preview);
            }
        };
        image.onerror = () => {
            callback(false);
        };
        image.src = this.src;
    }
    resize(image, target, preview) {
        var bounds = this.getBounds(image, target);
        if (image.width > bounds.width || image.height > bounds.height) {
            var width = image.width;
            var height = image.height;
            //Framework.Image.Resize
            var newWidth = width;
            var widthD = newWidth / 1000;
            var newHeight = height;
            var heightD = newHeight / 1000;
            while (newWidth > bounds.width || newHeight > bounds.height) {
                newWidth -= widthD;
                newHeight -= heightD;
            }
            var scaleX = 1;
            var scaleY = 1;
            if (width > newWidth)
                scaleX = newWidth / width;
            if (height > newHeight)
                scaleY = newHeight / height;
            var scale = Math.min(scaleX, scaleY);
            height = height * scale;
            width = width * scale;
        }
        else if (this.fitsThreshold(image, bounds, Image$1.SizeThreshold) || preview) {
            width = image.width;
            height = image.height;
            //return image; //Image doesn't have toDataURL method that is used to convert to Jpeg, so preview may not be accurate
        }
        else
            return;
        return this.render(image, width, height);
    }
    getBounds(image, target) {
        var maxWidth, maxHeight;
        if (target.Width > target.Height || image.width > image.height) {
            maxWidth = target.Width;
            maxHeight = target.Height || target.Width;
        }
        else {
            maxHeight = target.Width;
            maxWidth = target.Height || target.Width;
        }
        return {
            width: maxWidth,
            height: maxHeight
        };
    }
    /*getBounds (image, target) {
        var maxWidth, maxHeight;
        if (target.Orientation == ImageOrientation.Landscape || image.width > image.height) {
            maxWidth = target.Size;
            maxHeight = target.Size / target.AspectRatio;
        }
        else {
            maxHeight = target.Size;
            maxWidth = target.Size / target.AspectRatio;
        }

        return {
            width: maxWidth,
            height: maxHeight
        }
    }*/
    fitsThreshold(image, bounds, threshold) {
        return (image.width / bounds.width * 100) >= threshold || (image.height / bounds.height * 100) >= threshold ? true : false;
    }
    render(image, width, height) {
        //http://www.codeforest.net/html5-image-upload-resize-and-crop
        var renderedImage = document.createElement("canvas");
        renderedImage.style.display = "none";
        renderedImage.width = width;
        renderedImage.height = height;
        var ctx = renderedImage.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);
        return renderedImage; //ctx.getImageData(0, 0, width, height);
    }
    getDataURL(image, format, quality) {
        if (image.toDataURL) {
            return image.toDataURL(this.getFileType(format), quality);
        }
        else if (image instanceof Image)
            return image.src;
    }
    getFileType(format) {
        switch (format) {
            case ImageType.Png:
                return "image/png";
            case ImageType.Gif:
                return "image/gif";
            default:
                return "image/jpeg";
        }
    }
}

window.Url = Url;
window.Model = {
    'ImageEntity': ImageEntity,
    'ImageSizeType': ImageSizeType,
    'ImageType': ImageType
};
window.ImageHelper = ImageHelper;
window.ImageSettings = Image$1;

}());
