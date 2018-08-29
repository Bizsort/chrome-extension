if (window.bizsrtContentSelector) {
    if (!window.bizsrtMultiProductSelector)
        window.bizsrtMultiProductSelector = (function () {

            var MultiProductSelector = function () {
                this.menu_items = [{
                    text: "Description",
                    name: "Description",
                    items: [{
                        text: "Replace (text)",
                        name: "Description"
                    }, {
                        text: "Append (text)",
                        name: "Description1"
                    }/*, {
                        text: "Name-Text list",
                        name: "NameTextList"
                    }*/]
                }];
            };

            MultiProductSelector.prototype = {
                Initialize: function () {
                    if (window.bizsrtContentSelector) {
                        console.log("multiProductSelector.js: Initializing Content Selector");
                        chrome.storage.local.get('multiProductMenuItems', (storeItems) => {
                            window.bizsrtContentSelector.Initialize(this.menu_items, storeItems && storeItems.multiProductMenuItems, (selection, selectionCallback) => {
                                var attributeValue;
                                if (selection.Attribute && selection.Element) {
                                    var selectionElement = $(selection.Element);
                                    switch (selection.Attribute) {
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
                                            this.processDescription(attributeValue, selection, selectionCallback);
                                            break;
                                        /*case "NameTextList":
                                            var descriptionTextFeatures = {
                                                title: document.title,
                                                //http://stackoverflow.com/questions/883977/display-json-as-html
                                                //http://stackoverflow.com/questions/14195530/how-to-display-raw-json-data-on-a-html-page
                                                features: RTE.parseTextFeatures(attributeValue, selection)
                                            };
                                            this.processDescription(descriptionTextFeatures, selection, selectionCallback);
                                            break;*/
                                    }
                                }
                            });
                        });

                        window.activeSelector = this;
                    }
                    else {
                        console.error("multiProductSelector.js: Content Selector is not intitialized");
                    }
                },

                processDescription: function (value, selection, selectionCallback) {
                    if (selection.Attribute !== "NameTextList") {
                        chrome.storage.local.get('multiProduct', (storeItems) => {
                            if (storeItems.multiProduct) {
                                var multiProduct = JSON.parse(storeItems.multiProduct);
                                switch (selection.Attribute) {
                                    case "Description":
                                        multiProduct.Entity.RichText = value.html;
                                        //multiProduct.Entity.Text = value.text;
                                        break;
                                    case "Description1":
                                        if (multiProduct.Entity.RichText && multiProduct.Entity.RichText.length) {
                                            if (multiProduct.Entity.RichText.match("</p>$") && value.html.match("^<p"))
                                                multiProduct.Entity.RichText += value.html;
                                            else
                                                multiProduct.Entity.RichText += ('<br />' + value.html);
                                        }
                                        else
                                            multiProduct.Entity.RichText = value.html;
                                        /*if (multiProduct.Entity.Text && multiProduct.Entity.Text.length)
                                            multiProduct.Entity.Text += (' ' + value.text);
                                        else
                                            multiProduct.Entity.Text = value.text;*/
                                        break;
                                }
                                chrome.storage.local.set({
                                    multiProduct: JSON.stringify(multiProduct)
                                });
                                this.notifyExtension(selection.Attribute);
                                selectionCallback(selection);
                            }
                        });
                    }
                    else { //Parse extracted features on the server
                        chrome.storage.local.set({
                            multiProductTextFeatures: value
                        });
                        this.notifyExtension(selection.Attribute);
                        selectionCallback(selection);
                    }
                },

                notifyExtension: function (name) {
                    console.log("multiProductSelector.js: notifyExtension(" + name + ")");
                    var attr = {};
                    attr[name] = true;
                    chrome.runtime.sendMessage({
                        url: Url.windowLocation(),
                        multiProduct: attr
                    }/*Currently handled by chrome.runtime.onMessage.addListener in contentSelector.js
                    Response callback to sendMessage doesn't get called
                    , (processedSelection) => {
                        console.log("multiProductSelector.js: notifyExtension.sendMessage response (" + JSON.stringify(processedSelection) + ")");
                        window.bizsrtContentSelector.updateSelectionMenuState(processedSelection);
                    }*/);
                }
            };

            return new MultiProductSelector();
        })();

    window.bizsrtMultiProductSelector.Initialize(window.bizsrtContentSelector);
}
else
    console.error("multiProductSelector.js: Content Selector is not initialized");