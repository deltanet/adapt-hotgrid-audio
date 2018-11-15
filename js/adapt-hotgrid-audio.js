
define(function(require) {

    var ComponentView = require("coreViews/componentView");
    var Adapt = require("coreJS/adapt");

    var HotgridAudio = ComponentView.extend({

        events: {
          'click .hotgrid-item-image': 'onItemClicked',
          'click .hotgrid-popup-back': 'previousItem',
          'click .hotgrid-popup-next': 'nextItem',
          'click .hotgrid-popup-close': 'closePopup'
        },

        preRender: function () {
          this.disableAnimation = Adapt.config.has('_disableAnimation') ? Adapt.config.get('_disableAnimation') : false;

            var items = this.model.get('_items');
            _.each(items, function(item) {
                if (item._graphic.srcHover && item._graphic.srcVisited) {
                    item._graphic.hasImageStates = true;
                }
            }, this);

            if (this.model.get('_showItemBorders') === false) {
              this.$el.addClass('no-borders');
            }

            if (this.model.get('_showItemTitleBackground')) {
              this.$el.addClass('item-titles');
            }

            _.bindAll(this, 'onKeyUp');

            this.listenTo(Adapt, 'device:changed', this.resizeControl);
            this.listenTo(Adapt, 'device:resize', this.resetPopup);
            this.listenTo(Adapt, "audio:changeText", this.replaceText);

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
            var activeItem = 0;

            this.isPopupOpen = false;
        },

        resizeControl: function() {
            this.setDeviceSize();
            this.setUpColumns();
        },

        setUpColumns: function() {
          var columns = this.model.get('_columns');

          // Minus 2 to take into account the padding of 1% each side
          var itemWidth = Math.floor(100 / columns) - 2;

          if (columns && Adapt.device.screenSize === 'large') {
            this.$('.hotgrid-grid-item').width(itemWidth + '%');
          } else {
            this.$('.hotgrid-grid-item').width('48%');
          }
        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();

            var $link = $(event.currentTarget);
            var $item = $link.parent();
            var itemModel = this.model.get('_items')[$item.index()];

            this.$('.hotgrid-grid-item.active').removeClass('active');
            this.$('.hotgrid-popup-item').hide();

            $item.addClass('active');

            activeItem = $item.index();

            if(!itemModel.visited) {
                $item.addClass("visited");
                itemModel.visited = true;
                // append the word 'visited.' to the link's aria-label
                var visitedLabel = this.model.get('_globals')._accessibility._ariaLabels.visited + ".";
                $link.attr('aria-label', function(index,val) {return val + " " + visitedLabel});
            }

            this.resizeElements(activeItem);

            this.$('.item-'+activeItem).show();

            this.openPopup(activeItem);
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
            this.updatePopupContent(activeItem);
        },

        nextItem: function (event) {
            activeItem++;
            this.updatePopupContent(activeItem);
        },

        resizeElements: function(activeItem) {
          var itemModel = this.model.get('_items')[activeItem];
          // Check if item has no text - show graphic fullwidth
          if(itemModel.body == "") {
            this.$('.item-'+activeItem+ ' > .hotgrid-popup-graphic').addClass('fullwidth');
          }
          // Check if item has no graphic - show text fullwidth
          if(itemModel._itemGraphic.src == "") {
            this.$('.item-'+activeItem+ ' > .hotgrid-popup-graphic').addClass('hidden');
            this.$('.item-'+activeItem+ ' > .hotgrid-popup-body').addClass('fullwidth');
          }
        },

        updatePopupContent: function(activeItem) {

            this.$('.hotgrid-grid-item.active').removeClass('active');

            var popupItems = this.$(".hotgrid-grid-inner").children();
            this.$(popupItems[activeItem]).addClass('active');

            var itemModel = this.model.get('_items')[activeItem];

            this.$('.hotgrid-popup-item').hide();

            if(!itemModel.visited) {
              this.$(popupItems[activeItem]).addClass("visited");
              itemModel.visited = true;
            }

            this.resizeElements(activeItem);

            this.$('.item-'+activeItem).show();

            ///// Audio /////
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled && Adapt.audio.audioClip[this.model.get('_audio')._channel].status==1) {
              // Reset onscreen id
              Adapt.audio.audioClip[this.model.get('_audio')._channel].onscreenID = "";
              // Trigger audio
                Adapt.trigger('audio:playAudio', itemModel._audio.src, this.model.get('_id'), this.model.get('_audio')._channel);
            }
            ///// End of Audio /////

            this.updatePopupNav(activeItem);
            this.resetPopup();
        },

        updatePopupNav: function (index) {
          // Hide all
          this.$('.hotgrid-popup-back').css('visibility','hidden');
          this.$('.hotgrid-popup-next').css('visibility','hidden');

          // Show buttons
          if(index > 0) {
            this.$('.hotgrid-popup-back').css('visibility','visible');
          }
          if(index < (this.model.get('_items').length)-1) {
            this.$('.hotgrid-popup-next').css('visibility','visible');
          }

        },

        openPopup: function(activeItem) {

          this.isPopupOpen = true;

          if (this.disableAnimation) {
            $('#shadow').removeClass("display-none");
          } else {
            $('#shadow').velocity({opacity:1},{duration:400, begin: _.bind(function() {
                $("#shadow").removeClass("display-none");
            }, this)});
          }
          $('#shadow').css("z-index","549");

          $('body').scrollDisable();

          var itemModel = this.model.get('_items')[activeItem];

          if (this.disableAnimation) {
            this.$('.hotgrid-popup').css("display", "block");
              complete.call(this);
            } else {
              this.$('.hotgrid-popup').velocity({ opacity: 0 }, {duration:0}).velocity({ opacity: 1 }, { duration:400, begin: _.bind(function() {
              this.$('.hotgrid-popup').css("display", "block");
              complete.call(this);
          }, this) });

          function complete() {
            /*ALLOWS POPUP MANAGER TO CONTROL FOCUS*/
            Adapt.trigger('popup:opened', this.$('.hotgrid-popup'));

            this.resetPopup();

            //set focus to first accessible element
            this.$('.hotgrid-popup').a11y_focus();

            if(this.model.get('_canCycleThroughPagination')) {
              _.delay(_.bind(function() {
                this.updatePopupNav(activeItem);
              }, this), 400);
            }

            ///// Audio /////
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled && Adapt.audio.audioClip[this.model.get('_audio')._channel].status==1) {
              // Reset onscreen id
              Adapt.audio.audioClip[this.model.get('_audio')._channel].onscreenID = "";
              // Trigger audio
              Adapt.trigger('audio:playAudio', itemModel._audio.src, this.model.get('_id'), this.model.get('_audio')._channel);
            }
            ///// End of Audio /////
          }

          $('#shadow').on('click', _.bind(this.closePopup, this));

          this.setupEscapeKey();
        }
      },

        closePopup: function(event) {
          event.preventDefault();

          if (this.disableAnimation) {
            $('#shadow').addClass("display-none");
          } else {
            $('#shadow').velocity({opacity:0}, {duration:400, complete:function() {
                $('#shadow').addClass("display-none");
            }});
          }
          $('#shadow').css("z-index","500");

          if (this.disableAnimation) {
              this.$('.hotgrid-popup').css("display", "none");
          } else {
              this.$('.hotgrid-popup').velocity({ opacity: 0 }, {duration:400, complete: _.bind(function() {
                  this.$('.hotgrid-popup').css("display", "none");
              }, this)});
          }

          Adapt.trigger('popup:closed',  this.$('.hotgrid-popup'));

          $('body').scrollEnable();

          ///// Audio /////
          if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled && this.model.has('_audio') && this.model.get('_audio')._isEnabled) {
              Adapt.trigger('audio:pauseAudio', this.model.get('_audio')._channel);
          }
          ///// End of Audio /////

          this.$('.hotgrid-grid-item.active').removeClass('active');

          this.$('.hotgrid-popup-back').css('visibility','hidden');
          this.$('.hotgrid-popup-next').css('visibility','hidden');

          this.evaluateCompletion();

          $('#shadow').off('click');

          this.isPopupOpen = false;

        },

        resizePopup: function() {
            var windowHeight = $(window).height();
            var popupHeight = this.$('.hotgrid-popup').outerHeight();

            if (popupHeight > windowHeight) {
              this.$('.hotgrid-popup').addClass('small');
              this.$('.hotgrid-popup').css({
                'margin-top': 0
              });
            } else {
              this.$('.hotgrid-popup').addClass('large');
              this.$('.hotgrid-popup').css({
                'margin-top': -(popupHeight/2)
              });
            }
        },

        resetPopup: function() {
          if(this.isPopupOpen) {
            this.$('.hotgrid-popup').removeClass('large');
            this.$('.hotgrid-popup').removeClass('small');
            this.resizePopup();
          }
        },

      setupEscapeKey: function() {
          var hasAccessibility = Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isActive;

          if (!hasAccessibility && this.isPopupOpen) {
              $(window).on("keyup", this.onKeyUp);
          } else {
              $(window).off("keyup", this.onKeyUp);
          }
      },

      onAccessibilityToggle: function() {
          this.setupEscapeKey();
      },

      onKeyUp: function(event) {
          if (event.which != 27) return;
          event.preventDefault();
          this.closePopup();
      },

        // Reduced text
        replaceText: function(value) {
            // If enabled
            if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._reducedTextisEnabled && this.model.get('_audio') && this.model.get('_audio')._reducedTextisEnabled) {
                // Change each items title and body

                for (var i = 0; i < this.model.get('_items').length; i++) {
                    if(value == 0) {
                        this.$('.item-'+i).find('.hotgrid-popup-title-inner').html(this.model.get('_items')[i].title);
                        this.$('.item-'+i).find('.hotgrid-popup-body-inner').html(this.model.get('_items')[i].body).a11y_text();
                    } else {
                        this.$('.item-'+i).find('.hotgrid-popup-title-inner').html(this.model.get('_items')[i].titleReduced);
                        this.$('.item-'+i).find('.hotgrid-popup-body-inner').html(this.model.get('_items')[i].bodyReduced).a11y_text();
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
