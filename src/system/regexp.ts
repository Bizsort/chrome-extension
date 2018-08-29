declare global {
    interface RegExpConstructor {
        Patterns: IRegExpPatterns;
    }
}

interface IRegExpPatterns {
    Date_ISO: RegExp;
    Background_Image: IRegExpReplace;
}

interface IRegExpReplace {
    match: RegExp;
    replace: string;
}

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
}

declare let RegExp: RegExpConstructor;
export { RegExp as RegExp };