if (window.bizsrtContentSelector) {
    if (!window.bizsrtBusinessSelector)
        window.bizsrtBusinessSelector = (function () {
            var BusinessSelector = function () {
                //this.menu_items = ["Email", "Phone", "Phone+", "Fax", "Name", "Description", "Description+", "Address", "Address+"/*, "PostalCode"*/, "Image"];
                this.menu_items = [{
                    text: "Email",
                    name: "Email"
                }, {
                    text: "Name",
                    name: "Name",
                    items: [{
                        text: "Business",
                        name: "Name"
                    }, {
                        text: "Office",
                        name: "OfficeName"
                    }]
                }, {
                    text: "Description",
                    name: "Description",
                    items: [{
                        text: "Replace Description",
                        name: "Description"
                    }, {
                        text: "Append Description",
                        name: "Description1"
                    }]
                }, {
                    text: "Address",
                    name: "Address",
                    items: [{
                        text: "Address",
                        name: "Address"
                    }, {
                        text: "Suite/Unit, PO etc",
                        name: "Address1"
                    }]
                }, {
                    text: "Phone",
                    name: "Phone",
                    items: [{
                        text: "Local Phone",
                        name: "Phone"
                    }, {
                        text: "Fax",
                        name: "Fax"
                    }, {
                        text: "Toll free Phone",
                        name: "Phone1"
                    }]
                }, {
                    text: "Image",
                    name: "Image"
                }, {
                    text: "Affiliation",
                    name: "Affiliation"
                }];
            };

            BusinessSelector.prototype = {
                Initialize: function () {
                    if (window.bizsrtContentSelector) {
                        console.log("businessSelector.js: Initializing Content Selector");
                        chrome.storage.local.get('businessMenuItems', (storeItems) => {
                            window.bizsrtContentSelector.Initialize(this.menu_items, storeItems && storeItems.businessMenuItems, (selection, selectionCallback) => {
                                var attributeValue;
                                if (selection.Attribute && selection.Element) {
                                    var selectionElement = $(selection.Element);
                                    switch (selection.Attribute) {
                                        case "Email":
                                        case "Phone":
                                        case "Phone1":
                                        case "Fax":
                                        case "Name":
                                        case "OfficeName":
                                        case "Address1":
                                        case "PostalCode":
                                            attributeValue = selection.SelectedText || selectionElement.text();
                                            selection.Text = attributeValue;
                                            this.processBusiness(attributeValue, selection, selectionCallback);
                                            break;
                                        case "Description":
                                        case "Description1":
                                            attributeValue = selection.SelectedText ? {
                                                html: '<p>' + selection.SelectedText + '</p>',
                                                text: selection.SelectedText
                                            } : {
                                                html: selectionElement.length === 1 ? selectionElement[0].outerHTML : '<p>' + selectionElement.html() + '</p>',
                                                text: selectionElement.text()
                                            }
                                            selection.Text = attributeValue.text;
                                            this.processBusiness(attributeValue, selection, selectionCallback);
                                            break;
                                        case "Address":
                                            attributeValue = selection.SelectedText || selectionElement.text();
                                            selection.Text = attributeValue;
                                            chrome.storage.local.set({
                                                businessAddress: attributeValue
                                            });
                                            this.notifyExtension(selection.Attribute);
                                            selectionCallback(selection);
                                            break;
                                        case "Image":
                                            var imgElem = selectionElement.is('img') ? selectionElement : $('img', selectionElement).first();
                                            var imgSrc = imgElem.attr('src');
                                            if (!imgSrc) {
                                                var count = 0;
                                                imgElem = selectionElement;
                                                while (imgElem.length && ++count < 5) {
                                                    imgSrc = imgElem.css('background-image');
                                                    if (imgSrc && imgSrc != 'none')
                                                        break;
                                                    imgElem = imgElem.parent();
                                                }
                                                if (imgSrc && imgSrc != 'none') {
                                                    //http://stackoverflow.com/questions/8809876/can-i-get-divs-background-image-url
                                                    imgSrc = imgSrc.replace(RegExp.Patterns.Background_Image.match, RegExp.Patterns.Background_Image.replace);
                                                }
                                                else
                                                    imgSrc = undefined;
                                            }
                                            var imgData = imgSrc ? {
                                                src: imgSrc
                                            } : null;
                                            if (imgData) {
                                                if (!(/data:image/i).test(imgData.src)) {
                                                    selection.Text = imgData.src;
                                                    /*var imgType = imgData.src.split('.').pop().toLowerCase();
                                                    if (imgType == 'png') {
                                                        imgData.type = Model.ImageType.Png;
                                                        imgData.preserveFormat = true;
                                                    }
                                                    else if (imgType == 'gif') {
                                                        imgData.type = Model.ImageType.Gif;
                                                        imgData.preserveFormat = true;
                                                    }*/
                                                    //https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
                                                    var xhr = new XMLHttpRequest();
                                                    xhr.open("GET", imgData.src, true);
                                                    xhr.responseType = "blob";
                                                    var _this = this;
                                                    xhr.onload = function () {
                                                        if (xhr.response) {
                                                            var imgType = xhr.response.type.indexOf('image/') === 0 ? xhr.response.type.substr(6) : imgData.src.split('.').pop().toLowerCase();
                                                            if (imgType == 'png' || imgType.indexOf('svg') === 0) {
                                                                imgData.type = Model.ImageType.Png;
                                                                imgData.preserveFormat = true;
                                                            }
                                                            else if (imgType == 'gif') {
                                                                imgData.type = Model.ImageType.Gif;
                                                                imgData.preserveFormat = true;
                                                            }
                                                            var fr = new FileReader();
                                                            fr.onloadend = function (e) {
                                                                imgData.src = fr.result;
                                                                _this.processImage(imgData, selection, selectionCallback);
                                                            };
                                                            fr.readAsDataURL(xhr.response);
                                                        }
                                                    };
                                                    xhr.send(null);
                                                }
                                                else
                                                    this.processImage(imgData, selection, selectionCallback);
                                            }
                                            break;
                                        case "Affiliation":
                                            //https://css-tricks.com/snippets/jquery/make-an-jquery-hasattr/
                                            var hrefElem = selectionElement.is('[href]') ? selectionElement : $('[href]', selectionElement).first();
                                            var hrefSrc = hrefElem.attr('href');
                                            if (!hrefSrc) {
                                                var count = 0;
                                                hrefElem = selectionElement;
                                                while (hrefElem.length && ++count < 5) {
                                                    hrefSrc = hrefElem.attr('href');
                                                    if (hrefSrc)
                                                        break;
                                                    hrefElem = hrefElem.parent();
                                                }
                                            }
                                            var attributeValue = (selection.SelectedText || hrefSrc || '').trim().toLowerCase(); //selectionElement.attr('href')
                                            if (attributeValue && attributeValue.indexOf('http') === 0) {
                                                selection.Text = attributeValue;
                                                this.processBusiness(attributeValue, selection, selectionCallback);
                                            }
                                            else if (attributeValue)
                                                window.bizsrtContentSelector.showSelectionReview('<span style="color: firebrick;">Not valid url: ' + attributeValue + '</span>');
                                            break;
                                    }
                                }
                            });
                        });

                        window.activeSelector = this;
                    }
                    else {
                        console.error("businessSelector.js: Content Selector is not intitialized");
                    }
                },

                processBusiness: function (value, selection, selectionCallback) {
                    chrome.storage.local.get('businessProfile', (storeItems) => {
                        if (storeItems.businessProfile) {
                            var businessProfile = JSON.parse(storeItems.businessProfile);
                            //businessProfile.Entity.HeadOffice = businessProfile.Entity.Offices.Refs[0]; //get HeadOffice(): Office { ... }
                            switch (selection.Attribute) {
                                case "Email":
                                    businessProfile.Entity[selection.Attribute] = value;
                                    break;
                                case "Name":
                                    businessProfile.Entity[selection.Attribute] = String.toTitleCase(value);
                                    break;
                                case "Description":
                                    businessProfile.Entity.RichText = value.html;
                                    businessProfile.Entity.Text = value.text;
                                    break;
                                case "Description1":
                                    if (businessProfile.Entity.RichText && businessProfile.Entity.RichText.length) {
                                        if (businessProfile.Entity.RichText.match("</p>$") && value.html.match("^<p"))
                                            businessProfile.Entity.RichText += value.html;
                                        else
                                            businessProfile.Entity.RichText += ('<br />' + value.html);
                                    }
                                    else
                                        businessProfile.Entity.RichText = value.html;
                                    if (businessProfile.Entity.Text && businessProfile.Entity.Text.length)
                                        businessProfile.Entity.Text += (' ' + value.text);
                                    else
                                        businessProfile.Entity.Text = value.text;
                                    break;
                                case "Phone":
                                case "Phone1":
                                case "Fax":
                                    if (businessProfile.Entity.EditOffice)
                                        businessProfile.Entity.EditOffice[selection.Attribute] = String.formatPhone(value);
                                    break;
                                case "OfficeName":
                                    if (businessProfile.Entity.EditOffice)
                                        businessProfile.Entity.EditOffice.Name = String.toTitleCase(value);
                                    break;
                                case "Address1":
                                case "PostalCode":
                                    if (businessProfile.Entity.EditOffice)
                                        businessProfile.Entity.EditOffice.Address[selection.Attribute] = value;
                                    break;
                                case "Affiliation":
                                    businessProfile.Entity.NewAffiliation = value;
                                    break;
                            }
                            chrome.storage.local.set({
                                businessProfile: JSON.stringify(businessProfile)
                            });
                            this.notifyExtension(selection.Attribute);
                            selectionCallback(selection);
                        }
                    });
                },

                processImage: function (imgData, selection, selectionCallback) {
                    //var imgHelper = new ImageHelper(imgData, Model.ImageEntity.Business);
                    var imgHelper = new ImageHelper(imgData, ImageSettings.WideThumbnail, { //ImageSettings.WideMedium
                        Width: 1280,
                        Height: 640
                    });
                    imgHelper.process((resized, preview) => {
                        window.bizsrtContentSelector.showSelectionReview('<img style="width: ' + preview.Width + 'px; height: ' + preview.Height + 'px; margin: 5px;" src="' + preview.Content + '"/>');
                        resized.Preview = preview;
                        chrome.storage.local.set({
                            businessImage: resized
                        });
                        this.notifyExtension(selection.Attribute);
                        selectionCallback(selection);
                    });
                },

                notifyExtension: function (name) {
                    console.log("businessSelector.js: notifyExtension(" + name + ")");
                    var attr = {};
                    attr[name] = true;
                    chrome.runtime.sendMessage({
                        url: Url.windowLocation(),
                        businessProfile: attr
                    }/*Currently handled by chrome.runtime.onMessage.addListener in contentSelector.js
                    Response callback to sendMessage doesn't get called
                    , (processedSelection) => { 
                        console.log("businessSelector.js: notifyExtension.sendMessage response (" + JSON.stringify(processedSelection) + ")");
                        window.bizsrtContentSelector.updateSelectionMenuState(processedSelection);
                    }*/);
                }
            };

            return new BusinessSelector();
        })();

    window.bizsrtBusinessSelector.Initialize(window.bizsrtContentSelector);
}
else
    console.error("businessSelector.js: Content Selector is not initialized");