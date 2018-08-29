if (!window.bizsrtContentSelector) {
    console.log("contentSelector.js: Initializing Content Selector");
    window.bizsrtContentSelector = (function () {
        var SelectionMode = {
            Element: 1,
            Text: 2
        };

        var ContentSelector = function (options) {
            this.parent = document.body;
            this.selectionMode = SelectionMode.Element;
        };

        ContentSelector.prototype = {
            Initialize: function (menuItems, menuItemState, selectionCallback) {
		        this.selectionCallback = selectionCallback;
		        if (!this.$allElements) {
		            this.highlightParent();

		            this.$allElements = $("*", this.parent);

		            this.bindElementHighlight();
		            this.bindElementSelection();
		        }

		        this.selectMenu = document.querySelector('bizsrt-selector-menu');
		        if (!this.selectMenu) {
		            /*selector-menu.js
                    node = wrap(node);
		            TypeError: wrap is not a function*/
		            /*var wrap = $('#wrap');
		            if (wrap.length)
		                wrap.attr("id", "wrap1");*/

		            /*
                    http://stackoverflow.com/questions/31537463/polymer-element-in-chrome-extension-content-script
                    http://stackoverflow.com/questions/30022350/registering-a-custom-element-from-a-chrome-extension
                    */
		            var link = document.createElement('link');
		            link.setAttribute('rel', 'import');
		            link.setAttribute('href', chrome.extension.getURL('content_script/selector-menu.html'));
		            link.onload = () => {
		                if (!this.selectMenu) {
		                    this.selectMenu = document.createElement('bizsrt-selector-menu');
		                    document.body.appendChild(this.selectMenu);
		                    this.initializeMenu(menuItems, menuItemState);

		                    document.addEventListener('bizsrt-menu-item-selected', (event, item) => {
		                        item = item || event.detail; //Sometimes item doesn't get serialized
                                var itemName = (item && item.name) || event.composedPath()[0].getAttribute('name');
		                        if (itemName && this.selectMenu.selection) {
		                            this.selectionCallback({
		                                Attribute: itemName,
		                                Element: this.selectMenu.selection.element,
		                                SelectedText: this.selectMenu.selection.text
		                            }, (selection) => {
		                                if (selection) {
		                                    this.highlightSelectedElement(selection.Element);
		                                }
		                            });
		                            this.unhighlightSelectionElement();
		                        }
		                        event.preventDefault();
		                    });

		                    document.addEventListener('bizsrt-menu-closed', (event) => {
		                        this.unhighlightSelectionElement();
		                    });
		                }
		            };
		            document.head.appendChild(link);

		            var $preview = '<div id="bizsrt-selectionReview"></div>';
		            $("body").append($preview);
		        }
		        else 
		            this.initializeMenu(menuItems, menuItemState);
	        },

            initializeMenu: function(menuItems, menuItemState) {
                this.selectMenu.dispatchEvent(new CustomEvent("bizsrt-selector-menu-populate", {
                    detail: menuItems
                }));
                if (menuItemState)
                    this.updateSelectionMenuState(menuItemState);
            },

            updateSelectionMenuItem: function (selection, isSet) {
                if (this.selectMenu)
                    this.selectMenu.dispatchEvent(new CustomEvent("bizsrt-selector-menu-set", {
                        detail: {
                            name: selection,
                            isSet: isSet
                        }
                    }));
            },

            updateSelectionMenuState: function (menuItems) {
                if (!menuItems)
                    return;
                var count = 0;
                var unhighlightSelected = true;
                for (var menuItem in menuItems) {
                    switch (menuItem) {
                        case "Email":
                        case "Name":
                        case "Title":
                        case "Description":
                        case "Description1":
                        case "Phone":
                        case "Phone1":
                        case "Fax":
                        case "Address":
                        case "Address1":
                        case "PostalCode":
                        case "Image":
                            this.updateSelectionMenuItem(menuItem, menuItems[menuItem].isSet);
                            if (menuItems[menuItem].isSet)
                                unhighlightSelected = false;
                            count++;
                            break;
                        case "ProcessedSelection":
                            this.showSelectionReview(menuItems.ProcessedSelection);
                            break;
                    }
                }
                if (count && unhighlightSelected)
                    this.unhighlightSelected();
            },

	        highlightParent: function () {
	            $(this.parent).addClass("bizsrt-parent");
	        },

	        menuEvent: "contextmenu.elementSelector", //click
	        bindElementSelection: function () {
	            this.$allElements.bind(this.menuEvent, (event) => { //click
	                try{
	                    if (this.selectionMode == SelectionMode.Element) {
	                        this.highlightSelectedElement(event.currentTarget, true);
	                        this.selectMenu.selection = {
	                            element: event.currentTarget,
	                            text: this.selectedText()
	                        }
	                        /*Doesn't work
	                        this.selectMenu.show(event.currentTarget); //Doesn't work
	                        window.postMessage({ type: "bizsrt-selector-show", anchor: event.currentTarget }, "*");*/
	                        //https://developer.mozilla.org/en-US/docs/Web/API/Event
	                        //this.selectMenu.dispatchEvent(new CustomEvent("bizsrt-selector-show", { detail: event.currentTarget })); //Works
                            //https://stackoverflow.com/questions/6073505/what-is-the-difference-between-screenx-y-clientx-y-and-pagex-y
                            event.target.dispatchEvent(new CustomEvent("bizsrt-selector-menu-show", {
                                //composed: true,
                                bubbles: true,
                                detail: {
                                    left: event.pageX,
                                    top: event.pageY
                                }
	                        })); //Works
	                    }
	                }
	                catch(ex) { }
			        // Cancel all other events
			        return false;
		        });
	        },

	        bindElementHighlight: function () {
	            var _this = this;
	            this.$allElements.bind("mouseenter.elementSelector", function () {
	                if (_this.selectionMode == SelectionMode.Element) {
		                $(this).addClass("bizsrt-selectItem-hover");

		                var $el = $(this).parent();
		                setTimeout(function () {
		                    // remove highlight from parent elements
		                    while ($el.parent().length) {
		                        $el.removeClass("bizsrt-selectItem-hover");
		                        $el = $el.parent();
		                    }
		                }, 1);
		            }
			        return false;
		        }).bind("mouseleave.elementSelector", function () {
			        $(this).removeClass("bizsrt-selectItem-hover");
		        });
	        },

	        highlightSelectedElement: function (selectedElement, preview) {
	            $(selectedElement).addClass(preview ? 'bizsrt-selectItem-highlight' : 'bizsrt-selectItem-selected');
	        },

	        unhighlightSelectionElement: function () {
	            if (this.selectMenu.selection) {
	                $(this.selectMenu.selection.element).removeClass('bizsrt-selectItem-highlight');
	                delete this.selectMenu.selection;
	            }
	        },

	        showSelectionReview: function(content) {
	            $('#bizsrt-selectionReview').html(content).show().delay(5000).fadeOut();
            },

	        unhighlightSelected: function () {
	            this.unbindElementSelectionHighlight(true);
	        },

	        unbindElementSelection: function () {
	            this.$allElements.unbind(this.menuEvent);
		        // remove highlighted element classes
		        this.unbindElementSelectionHighlight();
	        },

	        unbindElementSelectionHighlight: function (exceptParent) {
		        $(".bizsrt-selectItem-selected").removeClass('bizsrt-selectItem-selected');
		        if (!exceptParent)
		            $(".bizsrt-parent").removeClass('bizsrt-parent');
	        },

	        unbindElementHighlight: function () {
		        this.$allElements.unbind("mouseenter.elementSelector")
			        .unbind("mouseleave.elementSelector");
	        },

	        unbindKeyboardSelectionMaipulatios: function () {
		        $(document).unbind("keydown.selectionManipulation");
	        },

	        selectedText: function () {
	            var text = "";
	            if (window.getSelection) {
	                text = window.getSelection().toString();
	            } else if (document.selection && document.selection.type !== "Control") {
	                text = document.selection.createRange().text;
	            }
	            return text;
	        }
        };

        return new ContentSelector();
    })();

    //https://developer.chrome.com/extensions/messaging
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        console.log("contentSelector.js: chrome.runtime.onMessage.addListener");
        if (window.bizsrtContentSelector) { //Response callback in notifyExtension don't get called
            window.bizsrtContentSelector.updateSelectionMenuState(request);
        }
    });
}
else
    console.log("contentSelector.js: Content Selector already initialized");
