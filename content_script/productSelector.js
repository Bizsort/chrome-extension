if (window.bizsrtContentSelector) {
    if (!window.bizsrtProductSelector)
        window.bizsrtProductSelector = (function () {
            var ProductSelector = function () {
                //this.menu_items = ["Title", "Description", "Description+", "Image"];
                this.menu_items = [{
                    text: "Title",
                    name: "Title"
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
                    text: "Image",
                    name: "Image",
                    items: [{
                        text: "Replace Image",
                        name: "Image"
                    }, {
                        text: "Add Image",
                        name: "Image1"
                    }]
                }];
            };

            ProductSelector.prototype = {
                Initialize: function () {
                    if (window.bizsrtContentSelector) {
                        console.log("productSelector.js: Initializing Content Selector");
                        chrome.storage.local.get('productMenuItems', (storeItems) => {
                            window.bizsrtContentSelector.Initialize(this.menu_items, storeItems && storeItems.productMenuItems, (selection, selectionCallback) => {
                                var attributeValue;
                                if (selection.Attribute && selection.Element) {
                                    var selectionElement = $(selection.Element);
                                    switch (selection.Attribute) {
                                        case "Title":
                                            attributeValue = selection.SelectedText || selectionElement.text();
                                            selection.Text = attributeValue;
                                            this.processProduct(attributeValue, selection, selectionCallback);
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
                                            this.processProduct(attributeValue, selection, selectionCallback);
                                            break;
                                        case "Image":
                                        case "Image1":
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
                                    }
                                }
                            });
                        });

                        window.activeSelector = this;
                    }
                    else {
                        console.error("productSelector.js: Content Selector is not intitialized");
                    }
                },

                processProduct: function (value, selection, selectionCallback) {
                    chrome.storage.local.get('businessProduct', (storeItems) => {
                        if (storeItems.businessProduct) {
                            var businessProduct = JSON.parse(storeItems.businessProduct);
                            switch (selection.Attribute) {
                                case "Title":
                                    businessProduct.Entity.Master[selection.Attribute] = String.toTitleCase(value);
                                    break;
                                case "Description":
                                    businessProduct.Entity.Master.RichText = value.html;
                                    businessProduct.Entity.Master.Text = value.text;
                                    break;
                                case "Description1":
                                    if (businessProduct.Entity.Master.RichText && businessProduct.Entity.Master.RichText.length) {
                                        if (businessProduct.Entity.Master.RichText.match("</p>$") && value.html.match("^<p"))
                                            businessProduct.Entity.Master.RichText += value.html;
                                        else
                                            businessProduct.Entity.Master.RichText += ('<br />' + value.html);
                                    }
                                    else
                                        businessProduct.Entity.Master.RichText = value.html;
                                    if (businessProduct.Entity.Master.Text && businessProduct.Entity.Master.Text.length)
                                        businessProduct.Entity.Master.Text += (' ' + value.text);
                                    else
                                        businessProduct.Entity.Master.Text = value.text;
                                    break;
                            }
                            chrome.storage.local.set({
                                businessProduct: JSON.stringify(businessProduct)
                            });
                            this.notifyExtension(selection.Attribute);
                            selectionCallback(selection);
                        }
                    });
                },

                processImage: function (imgData, selection, selectionCallback) {
                    var imgHelper = new ImageHelper(imgData); //, Model.ImageEntity.Product
                    imgHelper.process((resized, preview) => {
                        window.bizsrtContentSelector.showSelectionReview('<img style="width: ' + preview.Width + 'px; height: ' + preview.Height + 'px; margin: 5px;" src="' + preview.Content + '"/>');
                        resized.Preview = preview;
                        chrome.storage.local.set({
                            productImage: resized
                        });
                        this.notifyExtension(selection.Attribute);
                        selectionCallback(selection);
                    });
                },

                notifyExtension: function (name) {
                    console.log("productSelector.js: notifyExtension(" + name + ")");
                    var attr = {};
                    attr[name] = true;
                    chrome.runtime.sendMessage({
                        url: Url.windowLocation(),
                        businessProduct: attr
                    }/*Currently handled by chrome.runtime.onMessage.addListener in contentSelector.js
                    Response callback to sendMessage doesn't get called
                    , (processedSelection) => {
                        console.log("productSelector.js: notifyExtension.sendMessage response (" + JSON.stringify(processedSelection) + ")");
                        window.bizsrtContentSelector.updateSelectionMenuState(processedSelection);
                    }*/);
                }
            };

            return new ProductSelector();
        })();

    window.bizsrtProductSelector.Initialize(window.bizsrtContentSelector);
}
else
    console.error("productSelector.js: Content Selector is not initialized");