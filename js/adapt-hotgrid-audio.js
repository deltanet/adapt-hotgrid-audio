
define(function(require) {

    var ComponentView = require("coreViews/componentView");
    var Adapt = require("coreJS/adapt");

    var HotgridAudio = ComponentView.extend({
 
        events: {
            "click .hotgrid-item-image":"onItemClicked"
        },
        
        isPopupOpen: false,
        
        preRender: function () {
            var items = this.model.get('_items');
            _.each(items, function(item) {
                if (item._graphic.srcHover && item._graphic.srcVisited) {
                    item._graphic.hasImageStates = true;
                }
            }, this);
            
            this.listenTo(Adapt, 'device:changed', this.resizeControl);

            // Listen for text change on audio extension
            this.listenTo(Adapt, "audio:changeText", this.replaceText);

            this.listenTo(Adapt, 'notify:closed', this.closeNotify, this);
            
            this.setDeviceSize();
        },

        setupNotifyListeners: function() {
            if (componentActive == true) {
                this.listenTo(Adapt, 'hotgridNotify:back', this.previousItem);
                this.listenTo(Adapt, 'hotgridNotify:next', this.nextItem);
            }
        },

        removeNotifyListeners: function() {;
            this.stopListening(Adapt, 'hotgridNotify:back', this.previousItem);
            this.stopListening(Adapt, 'hotgridNotify:next', this.nextItem);
            componentActive = false;
        },

        setDeviceSize: function() {
            if (Adapt.device.screenSize === 'large') {
                this.$el.addClass('desktop').removeClass('mobile');
                this.model.set('_isDesktop', true);
            } else {
                this.$el.addClass('mobile').removeClass('desktop');
                this.model.set('_isDesktop', false)
            }
        },

        postRender: function() {
            this.setupGrid();
            this.$('.hotgrid-widget').imageready(_.bind(function() {
                this.setReadyStatus();
            }, this));

            if (Adapt.config.get('_audio') && Adapt.config.get('_audio')._isReducedTextEnabled && this.model.get('_reducedText') && this.model.get('_reducedText')._isEnabled) {
                this.replaceText(Adapt.audio.textSize);
            }
            var componentActive = false;
            var activeItem = 0;
        },

        resizeControl: function() {
            this.setDeviceSize();
            this.render();
        },

        setupGrid: function() {
            if (this.model.get("_isDesktop")) {
                var columns = this.model.get("_columns");
                var itemWidth = 100 / columns;
                this.$(".hotgrid-grid-item").css({
                    width: itemWidth + "%"
                });
                this.setItemlayout()
            }
        },

        setItemlayout: function() {
            var columns = this.model.get("_columns");
            var itemLength = this.model.get("_items").length;
            var $items = this.$(".hotgrid-grid-item");
            var itemRemainder = itemLength % columns;
            if (itemRemainder !== 0) {
                if (itemRemainder === 1) {
                    var index = itemLength - 1;
                    var $item = $items.eq(index);
                    this.centerItem($item);
                } else {
                    var itemToAlignIndex = itemLength - itemRemainder;
                    var $item = $items.eq(itemToAlignIndex);
                    this.alignItem($item, itemRemainder);
                }
            }
        },

        centerItem: function(item) {
            item.css({
                float: "none",
                margin: "auto"
            });
        },

        alignItem: function(item, itemsToAlign) {
            var columns = this.model.get("_columns");
            var itemWidth = 100 / columns;

            if (Adapt.config.get('_defaultDirection') == 'rtl') {
                var marginRight = itemWidth / 2;
                item.css({
                    marginRight: marginRight + "%"
                });
            } else {
                var marginLeft = itemWidth / 2;
                item.css({
                    marginLeft: marginLeft + "%"
                });
            }
        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();

            var $link = $(event.currentTarget);
            var $item = $link.parent();
            var itemModel = this.model.get('_items')[$item.index()];

            this.$('.hotgrid-grid-item.active').removeClass('active');
            $item.addClass('active');

            activeItem = $item.index();

            if(!itemModel.visited) {
                $item.addClass("visited");
                itemModel.visited = true;
                // append the word 'visited.' to the link's aria-label
                var visitedLabel = this.model.get('_globals')._accessibility._ariaLabels.visited + ".";
                $link.attr('aria-label', function(index,val) {return val + " " + visitedLabel});
            }

            componentActive = true;

            this.showItemContent(itemModel);

            this.evaluateCompletion();
        },

        showItemContent: function(itemModel) {
            if(this.isPopupOpen) return;// ensure multiple clicks don't open multiple notify popups

            this.setupNotifyListeners();

            // Set popup text to default full size
            var popupObject_title = itemModel.title;
            var popupObject_body = itemModel.body;
            var interactionObject_body = "";

            // If reduced text is enabled and selected
            if (Adapt.config.get('_audio') && Adapt.config.get('_audio')._isReducedTextEnabled && this.model.get('_reducedText') && this.model.get('_reducedText')._isEnabled && Adapt.audio.textSize == 1) {
                popupObject_title = itemModel.titleReduced;
                popupObject_body = itemModel.bodyReduced;
            }

            // Check if item has no text - just show graphic
            if(popupObject_body == "") {
                interactionObject_body = "<div class='notify-container'><img class='notify-graphic fullwidth' src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/></div>";
            } else {
                // Else show text and check if item has a graphic
                if(itemModel._itemGraphic && itemModel._itemGraphic.src != "") {
                    interactionObject_body = "<div class='notify-container'><img class='notify-graphic' src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/><div class='notify-body'>" + popupObject_body + "</div></div>";
                } else {
                    interactionObject_body = "<div class='notify-container'><div class='notify-body'>" + popupObject_body + "</div></div>";
                }
            }

            // Trigger which type of notify based on the '_canCycleThroughPagination' setting
            if(this.model.get('_canCycleThroughPagination')) {
                var interactionObject = {
                    title: popupObject_title,
                    body: interactionObject_body,
                    _back:[
                        {
                            _callbackEvent: "hotgridNotify:back"
                        }
                    ],
                    _next:[
                        {
                            _callbackEvent: "hotgridNotify:next"
                        }
                    ],
                    _showIcon: false
                }
                Adapt.trigger('notify:interaction', interactionObject);
                // Delay showing the nav arrows until notify has faded in
                _.delay(_.bind(function() {
                    this.updateNotifyNav(activeItem);
                }, this), 600);

            } else {
                var popupObject = {
                    title: popupObject_title,
                    body: interactionObject_body
                }
                Adapt.trigger('notify:popup', popupObject);
            }
            

            ///// Audio /////
            if (Adapt.config.get('_audio') && Adapt.config.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled && Adapt.audio.audioClip[this.model.get('_audio')._channel].status==1) {
                // Trigger audio
                Adapt.trigger('audio:playAudio', itemModel._audio.src, this.model.get('_id'), this.model.get('_audio')._channel);
            }
            ///// End of Audio /////

            Adapt.once("notify:closed", _.bind(function() {
                //this.isPopupOpen = false;
                ///// Audio /////
                if (Adapt.config.get('_audio') && Adapt.config.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled) {
                    Adapt.trigger('audio:pauseAudio', this.model.get('_audio')._channel);
                }
                ///// End of Audio /////
                this.$('.hotgrid-grid-item.active').removeClass('active');
                //
            }, this));
        },

        getCurrentItem: function(index) {
            return this.model.get('_items')[index];
        },
        
        getVisitedItems: function() {
            return _.filter(this.model.get('_items'), function(item) {
                return item.visited;
            });
        },

        evaluateCompletion: function() {
            if (this.getVisitedItems().length == this.model.get('_items').length) {
                this.setCompletionStatus();
            }
        },

        previousItem: function (event) {
            activeItem--;
            this.updateNotifyContent(activeItem);
        },

        nextItem: function (event) {
            activeItem++;
            this.updateNotifyContent(activeItem);
        },

        updateNotifyContent: function(index) {

            this.$('.hotgrid-grid-item.active').removeClass('active');

            var notifyItems = this.$(".hotgrid-grid-inner").children();
            this.$(notifyItems[index]).addClass('active');

            var itemModel = this.model.get('_items')[index];

            if(!itemModel.visited) {
                this.$(notifyItems[index]).addClass("visited");
                itemModel.visited = true;
            }

            // Set popup text to default full size
            var popupObject_title = itemModel.title;
            var popupObject_body = itemModel.body;
            var interactionObject_body = "";

            // If reduced text is enabled and selected
            if (Adapt.config.get('_audio') && Adapt.config.get('_audio')._isReducedTextEnabled && this.model.get('_reducedText') && this.model.get('_reducedText')._isEnabled && Adapt.audio.textSize == 1) {
                popupObject_title = itemModel.titleReduced;
                popupObject_body = itemModel.bodyReduced;
            }

            // Check if item has no text - just show graphic
            if(popupObject_body == "") {
                interactionObject_body = "<div class='notify-container'><img class='notify-graphic fullwidth' src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/></div>";
            } else {
                // Else show text and check if item has a graphic
                if(itemModel._itemGraphic && itemModel._itemGraphic.src != "") {
                    interactionObject_body = "<div class='notify-container'><img class='notify-graphic' src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/><div class='notify-body'>" + popupObject_body + "</div></div>";
                } else {
                    interactionObject_body = "<div class='notify-container'><div class='notify-body'>" + popupObject_body + "</div></div>";
                }
            }

            // Update elements
            $('.notify-popup-title-inner').html(popupObject_title);
            $('.notify-popup-body-inner').html(interactionObject_body);

            ///// Audio /////
            if (Adapt.config.get('_audio') && Adapt.config.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled && Adapt.audio.audioClip[this.model.get('_audio')._channel].status==1) {
                // Trigger audio
                Adapt.trigger('audio:playAudio', itemModel._audio.src, this.model.get('_id'), this.model.get('_audio')._channel);
            }
            ///// End of Audio /////

            this.updateNotifyNav(activeItem);
            this.evaluateCompletion();

        },

        updateNotifyNav: function (index) {
            // Hide buttons
            if(index === 0) {
                $('#notify-arrow-back').css('visibility','hidden');
                $('notify-popup-arrow-l').css('visibility','hidden');
            }
            if(index === (this.model.get('_items').length)-1) {
                $('#notify-arrow-next').css('visibility','hidden');
                $('notify-popup-arrow-r').css('visibility','hidden');
            }
            // Show buttons
            if(index > 0) {
                $('#notify-arrow-back').css('visibility','visible');
                $('notify-popup-arrow-l').css('visibility','visible');
            }
            if(index < (this.model.get('_items').length)-1) {
                $('#notify-arrow-next').css('visibility','visible');
                $('notify-popup-arrow-r').css('visibility','visible');
            }
        },

        closeNotify: function() {
            this.removeNotifyListeners();
        },

        // Reduced text
        replaceText: function(value) {
            // If enabled
            if (Adapt.config.get('_audio') && Adapt.config.get('_audio')._isReducedTextEnabled && this.model.get('_reducedText') && this.model.get('_reducedText')._isEnabled) {
                // Change component title and body
                if(value == 0) {
                    this.$('.component-title-inner').html(this.model.get('displayTitle')).a11y_text();
                    this.$('.component-body-inner').html(this.model.get('body')).a11y_text();
                } else {
                    this.$('.component-title-inner').html(this.model.get('displayTitleReduced')).a11y_text();
                    this.$('.component-body-inner').html(this.model.get('bodyReduced')).a11y_text();
                }
                // Change each items title and body
                for (var i = 0; i < this.model.get('_items').length; i++) {
                    if(value == 0) {
                        this.$('.notify-popup-title-inner').eq(i).html(this.model.get('_items')[i].title);
                        this.$('.notify-popup-body-inner').eq(i).html(this.model.get('_items')[i].body).a11y_text();
                    } else {
                        this.$('.notify-popup-title-inner').eq(i).html(this.model.get('_items')[i].titleReduced);
                        this.$('.notify-popup-body-inner').eq(i).html(this.model.get('_items')[i].bodyReduced).a11y_text();
                    }
                }
            }
        }
        
    },{
        template: "hotgrid-audio"
    });
    
    Adapt.register("hotgrid-audio", HotgridAudio);
    
    return HotgridAudio;

});