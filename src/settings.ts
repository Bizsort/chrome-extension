export const Business = {
    Id: 1
};

export const Category = {
    NameLength: 50
};

export const Community = {
    Blog: 3,
    Forum: {
        MaxLength: 30
    }
};

export const Guid = {
    Empty: "00000000-0000-0000-0000-000000000000"
};

export const Image = (function () {
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
    }
})();

export const Location = {
    Country: { Id: 1, Name: "Canada", Code: "ca" }, //ISO 3166-1 country code for GeocoderComponentRestrictions
    //Country: { Id: 15, Name: "United States", Code: "us" }, //ISO 3166-1 country code for GeocoderComponentRestrictions
    Address1Threshold: 10,

    Data: {
        "Canada": {
            "Phone": {
                UserEntry: {
                    "Mask": "000-000-0000"
                },
                ValueFormat: {
                    Steps: [{
                        "Type": "RegexReplace",
                        "Match": "[^0-9]",
                        "Replace": ""
                    }, {
                        "Type": "Format18xx"
                    }, {
                        "Type": "RegexReplace",
                        "Match": "(\\d{3})(\\d{3})(\\d{4})",
                        "Replace": "$1-$2-$3"
                    }]
                }
            },
            "PostalCode": {
                UserEntry: {
                    "Mask": "L0L 0L0"
                },
                ValueFormat: {
                    Steps: [{
                        "Type": "UpperCase"
                    }, {
                        "Type": "RegexReplace",
                        "Match": "([A-Z]\\d[A-Z])( )?(\\d[A-Z]\\d)",
                        "Replace": "$1 $3"
                    }]
                }
            }
        },
        "United States": {
            "Phone": {
                UserEntry: {
                    "Mask": "000-000-0000"
                },
                ValueFormat: {
                    Steps: [{
                        "Type": "RegexReplace",
                        "Match": "[^0-9]",
                        "Replace": ""
                    }, {
                        "Type": "Drop1in18xx"
                    }, {
                        "Type": "RegexReplace",
                        "Match": "(\\d{3})(\\d{3})(\\d{4})",
                        "Replace": "$1-$2-$3"
                    }]
                }
            },
            "PostalCode": {
                UserEntry: {
                    "Mask": "00000"
                }
            }
        },
        "Australia": {
            "Phone": {
                UserEntry: {
                    "Mask": "000000000"
                }
            },
            "PostalCode": {
                UserEntry: {
                    "Mask": "0000"
                }
            }
        },
        "New Zealand": {
            "Phone": {
                UserEntry: {
                    "Mask": "000000009",
                    "Prompt": "Right-pad with a space if necessary"
                }
            },
            "PostalCode": {
                UserEntry: {
                    "Mask": "0000"
                }
            }
        },
        "United Kingdom": {
            "Phone": {
                UserEntry: {
                    "Mask": "0000000009",
                    "Prompt": "Right-pad with a space if necessary"
                }
            },
            "PostalCode": {
                UserEntry: {
                    "Mask": "aaAA 0LL",
                    "Prompt": "Left-pad first part with 1 or 2 spaces if necessary",
                    "PartSeparator": " ",
                    "Parts": [{
                        "PadToLength": 4
                    }]
                }
            }
        }
    },

    GetSettings: function (location) {
        var locationSettings = {};
        if (location && this.Data)
            this.populateSettings(location, this.Data, locationSettings);
        return locationSettings;
    },

    populateSettings: (location, locationSettings, effectiveSettings) => {
        var locations = [];
        while (location && location.Id > 0) {
            locations.splice(0, 0, location.Name);
            location = location.Parent;
        }
        var locationName;
        for (var i = 0, l = locations.length; i < l; i++) {
            locationName = locations[i];
            locationSettings = locationSettings[locationName];

            if (locationSettings)
                Location.Populate.call(effectiveSettings, locationSettings);
            else
                break;
        }

        return effectiveSettings;
    },

    Populate: function (settings) {
        if (!this.Phone)
            this.Phone = {};
        Location.populate.call(this.Phone, settings.Phone);
        if (!this.PostalCode)
            this.PostalCode = {};
        Location.populate.call(this.PostalCode, settings.PostalCode);
    },

    populate: function (settings) {
        if (settings) {
            if (settings.UserEntry) {
                if (!this.UserEntry)
                    this.UserEntry = {};
                if (settings.UserEntry.Mask) {
                    this.UserEntry.Mask = settings.UserEntry.Mask;
                }
                if (settings.UserEntry.Prompt) {
                    this.UserEntry.Prompt = settings.UserEntry.Prompt;
                }
            }
        }
    }
}

export const Personal = {
    List: {
        MaxLength: 50
    },

    Message: {
        Folder: {
            MaxLength: 30
        }
    }
};

export const Product = {
    Quota: {
        Personal: {
            Total: 101,
            Active: 11,
            Pending: 2
        },

        Business: {
            Total: 1001,
            Active: 101,
            Pending: 5
        }
    }
};

export const Session = {
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

export const Service = {
    Origin: "http://localhost:8080", //http://localhost:8080  //api.bizsort.net
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

export const WebSite = {
    Origin: {
        Host: "localhost:50000",
        ServerPath: "",
        AbsoluteUri: ""
    },
    HomePage: "/directory",
    NavToken: {
        Placement: 1, //NavigationTokenPlacement.QueryString
        Qualifier: "t", //"#!"
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
