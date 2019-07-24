define([
    'core/js/adapt',
    'core/js/views/componentView',
    './hotgridPopupView'
], function(Adapt, ComponentView, HotgridPopupView) {

    var HotgridView = ComponentView.extend({

        events: {
            'click .hotgrid-grid-item': 'onItemClicked'
        },

        initialize: function() {
            ComponentView.prototype.initialize.call(this);
            this.setDeviceSize();
            this.setUpViewData();
            this.setUpModelData();
            this.setUpEventListeners();
            this.checkIfResetOnRevisit();
        },

        setUpViewData: function() {
            this.popupView = null;
            this._isPopupOpen = false;

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
        },

        setUpModelData: function() {
            if (this.model.get('_canCycleThroughPagination') === undefined) {
                this.model.set('_canCycleThroughPagination', false);
            }
        },

        setUpEventListeners: function() {
            this.listenTo(Adapt, 'device:changed', this.resizeControl);

            this.listenTo(this.model.get('_children'), {
                'change:_isActive': this.onItemsActiveChange,
                'change:_isVisited': this.onItemsVisitedChange
            });
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

        checkIfResetOnRevisit: function() {
            var isResetOnRevisit = this.model.get('_isResetOnRevisit');

            // If reset is enabled set defaults
            if (isResetOnRevisit) this.model.reset(isResetOnRevisit);
        },

        postRender: function() {
            this.setUpColumns();
            this.$('.hotgrid-widget').imageready(this.setReadyStatus.bind(this));
        },

        resizeControl: function() {
            this.setDeviceSize();
            this.render();
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

        onItemsActiveChange: function(model, _isActive) {
            this.getItemElement(model).toggleClass('active', _isActive);
        },

        getItemElement: function(model) {
            var index = model.get('_index');
            return this.$('.hotgrid-grid-item').filter('[data-index="' + index + '"]');
        },

        onItemsVisitedChange: function(model, _isVisited) {
            if (!_isVisited) return;
            var $item = this.getItemElement(model);

            // Append the word 'visited' to the item's aria-label
            var visitedLabel = this.model.get('_globals')._accessibility._ariaLabels.visited + '.';
            $item.attr('aria-label', function(index, val) {
                return val + ' ' + visitedLabel;
            });

            $item.addClass('visited');
        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();

            var item = this.model.getItem($(event.currentTarget).data('index'));
            item.toggleActive(true);
            item.toggleVisited(true);

            this.openPopup();
        },

        openPopup: function() {
            if (this._isPopupOpen) return;

            this._isPopupOpen = true;

            Adapt.trigger('audio:stopAllChannels');

            this.popupView = new HotgridPopupView({
                model: this.model
            });

            Adapt.trigger('notify:popup', {
                _view: this.popupView,
                _isCancellable: true,
                _showCloseButton: false,
                _closeOnBackdrop: true,
                _classes: 'hotgrid-audio-popup'
            })

            this.listenToOnce(Adapt, {
                'popup:closed': this.onPopupClosed
            });
        },

        onPopupClosed: function() {
            this.model.getActiveItem().toggleActive();
            this._isPopupOpen = false;
        }
    });

    return HotgridView;
});
