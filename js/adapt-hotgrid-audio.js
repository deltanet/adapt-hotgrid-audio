
define([
    'core/js/adapt',
    'core/js/models/itemsComponentModel',
    './hotgridView'
], function(Adapt, ItemsComponentModel, HotgridView) {

    return Adapt.register('hotgrid-audio', {
        model: ItemsComponentModel,
        view: HotgridView
    });
});
