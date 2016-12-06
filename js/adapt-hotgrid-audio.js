
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
            this.listenTo(Adapt, "audio:changeText", this.replaceText);
            this.listenTo(Adapt, 'notify:closed', this.closeNotify, this);

            this.setDeviceSize();
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
            this.setUpColumns();
            this.$('.hotgrid-widget').imageready(_.bind(function() {
                this.setReadyStatus();
            }, this));

            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {
                this.replaceText(Adapt.audio.textSize);
            }
            var componentActive = false;
            var activeItem = 0;

            // Set string of elements to show the navigation arrows
            this.interactionNav = "<div class='notify-popup-navigation'><button class='base notify-popup-arrow notify-popup-arrow-l' id='notify-arrow-back' role='button'><div class='icon icon-controls-left'></div></button><button class='base notify-popup-arrow notify-popup-arrow-r' id='notify-arrow-next' role='button'><div class='icon icon-controls-right'></div></button></div>";
        },

        resizeControl: function() {
            this.setDeviceSize();
            this.setUpColumns();
            this.setImageSize();
        },

        setUpColumns: function() {
          var columns = this.model.get('_columns');
          var itemWidth = Math.floor(98 / columns) - columns;

          if (columns && Adapt.device.screenSize === 'large') {
            this.$('.hotgrid-grid-item').css('width', itemWidth + '%');
          } else {
            this.$('.hotgrid-grid-item').css('width', '100%');
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
        },

        showItemContent: function(itemModel) {
            if(this.isPopupOpen) return;// ensure multiple clicks don't open multiple notify popups

            // Set popup text to default full size
            var popupObject_title = itemModel.title;
            var popupObject_body = itemModel.body;
            var interactionObject_body = "";

            // If reduced text is enabled and selected
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                popupObject_title = itemModel.titleReduced;
                popupObject_body = itemModel.bodyReduced;
            }

            // Check if item has no text - just show graphic
            if(popupObject_body == "") {
                interactionObject_body = "<div class='notify-container'><div class='notify-graphic fullwidth'><img src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/></div></div>";
            } else {
                // Else show text and check if item has a graphic
                if(itemModel._itemGraphic && itemModel._itemGraphic.src != "") {
                    interactionObject_body = "<div class='notify-container'><div class='notify-graphic'><img src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/></div><div class='notify-body'>" + popupObject_body + "</div></div>";
                } else {
                    interactionObject_body = "<div class='notify-container'><div class='notify-body'>" + popupObject_body + "</div></div>";
                }
            }

            // Add interactionNav to body based on the '_canCycleThroughPagination' setting
            if(this.model.get('_canCycleThroughPagination')) {
                var interactionObject = {
                    title: popupObject_title,
                    body: interactionObject_body+this.interactionNav
                }
                Adapt.trigger('notify:popup', interactionObject);
                this.setImageSize();
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
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled && Adapt.audio.audioClip[this.model.get('_audio')._channel].status==1) {
              // Reset onscreen id
              Adapt.audio.audioClip[this.model.get('_audio')._channel].onscreenID = "";
              // Trigger audio
              Adapt.trigger('audio:playAudio', itemModel._audio.src, this.model.get('_id'), this.model.get('_audio')._channel);
            }
            ///// End of Audio /////

            Adapt.once("notify:closed", _.bind(function() {
                this.isPopupOpen = false;
                ///// Audio /////
                if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled) {
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
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled && Adapt.audio.textSize == 1) {
                popupObject_title = itemModel.titleReduced;
                popupObject_body = itemModel.bodyReduced;
            }

            // Check if item has no text - just show graphic
            if(popupObject_body == "") {
                interactionObject_body = "<div class='notify-container'><div class='notify-graphic fullwidth'><img src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/></div></div>";
            } else {
                // Else show text and check if item has a graphic
                if(itemModel._itemGraphic && itemModel._itemGraphic.src != "") {
                    interactionObject_body = "<div class='notify-container'><div class='notify-graphic'><img src='" + itemModel._itemGraphic.src + "' alt='" + itemModel._itemGraphic.alt + "'/></div><div class='notify-body'>" + popupObject_body + "</div></div>";
                } else {
                    interactionObject_body = "<div class='notify-container'><div class='notify-body'>" + popupObject_body + "</div></div>";
                }
            }

            // Update elements
            $('.notify-popup-title-inner').html(popupObject_title);
            $('.notify-popup-body-inner').html(interactionObject_body+this.interactionNav);

            this.setImageSize();

            ///// Audio /////
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled && Adapt.audio.audioClip[this.model.get('_audio')._channel].status==1) {
              // Reset onscreen id
              Adapt.audio.audioClip[this.model.get('_audio')._channel].onscreenID = "";
              // Trigger audio
              Adapt.trigger('audio:playAudio', itemModel._audio.src, this.model.get('_id'), this.model.get('_audio')._channel);
            }
            ///// End of Audio /////

            this.updateNotifyNav(activeItem);

            Adapt.trigger('device:resize');
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

            // Add listerner to notify nav arrows
            $('.notify-popup-arrow-l').on('click', _.bind(this.previousItem, this));
            $('.notify-popup-arrow-r').on('click', _.bind(this.nextItem, this));
            //
        },

        setImageSize: function() {
          this.imageHeight = $('.notify-container img').height();
          $('.notify-container').css('min-height',this.imageHeight+'px');
        },

        closeNotify: function() {
            this.evaluateCompletion();

            $('.notify-popup-arrow-l').off('click');
            $('.notify-popup-arrow-r').off('click');

            componentActive = false;
        },

        // Reduced text
        replaceText: function(value) {
            // If enabled
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {
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
