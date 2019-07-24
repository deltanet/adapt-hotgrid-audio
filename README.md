# adapt-hotgrid-audio

**Hotgrid Audio** is a *presentation component* which displays a set of images in a grid layout.

When a learner selects an image, a pop-up is displayed that consists of text with an image.

## Settings Overview

The attributes listed below are used in *components.json* to configure **Hotgrid Audio**, and are properly formatted as JSON in [*example.json*](https://github.com/deltanet/adapt-hotgrid-audio/blob/master/example.json).

### Attributes

[**core model attributes**](https://github.com/adaptlearning/adapt_framework/wiki/Core-model-attributes): These are inherited by every Adapt component. [Read more](https://github.com/adaptlearning/adapt_framework/wiki/Core-model-attributes).

**_component** (string): This value must be: `hotgrid-audio`. (One word.)

**_classes** (string): CSS class name to be applied to **Hotgrid Audio**’s containing `div`. The class must be predefined in one of the Less files. Separate multiple classes with a space.

**_layout** (string): This defines the horizontal position of the component in the block. Acceptable values are `full`, `left` or `right`.  

**instruction** (string): This optional text appears above the component. It is frequently used to guide the learner’s interaction with the component.  

**_canCycleThroughPagination** (boolean): Enables the pop-ups to be cycled through endlessly using either the previous or next icon. When set to `true`, clicking "next" on the final stage will display the very first stage. When set to `false`, the final stage will display only a "previous" icon. The default is `false`.  

**_columns** (number): This value determines the number of columns within the grid. Any number of columns can be set however keep in mind the more columns there are the smaller the items will be.

**_canCycleThroughPagination** (boolean): If set to 'true', learner can cycle through items.  

**_showItemBorders** (boolean): If set to 'true', a border around the items will be shown.  

**_showItemTitleBackground** (boolean): If set to 'true', the item titles will have a background colour applied to them.  

**Hotgrid Audio** has a dynamic layout system. If you have 5 items but set the columns to 3, 3 items will be put in the first row and 2 on the second. The second row then will be automatically centered. This works with any amount of items and columns - ie that last row will always be centred for you.

**_items** (string): Multiple items may be created. Each item represents one grid item for this component and contains values for **title**, **body**, **_graphic**, **_itemGraphic** and **_audio**.

>**title** (string): This is the title text for a grid item pop-up.

>**body** (string): This is the main text for a grid item pop-up.

>**_graphic** (string): This is the image that displays for each grid item. This graphic requires three state **src** values, with additional values **alt** and **title**.

>>**src** (string): File name (including path) of the image. Path should be relative to the *src* folder (e.g., *course/en/images/c-15.png*). Three src values are set to display: default, hover and visited states - **src** (default), **srcHover** and **srcVisited** - note that if you are handling the hover and visited states via CSS you don't need to set **srcHover** and **srcVisited**

>>**alt** (string): This text becomes the image’s `alt` attribute.

>>**title** (string): This is optional text which is displayed under the grid item image.

>**_itemGraphic** (string): This is the image for a grid item pop-up. This also contains values **src** and **alt**.  

>**_audio** (object): This `_audio` attributes group stores the audio properties for the item. It contains values for **src**.  

>>**src** (string): File name (including path) of the audio for the item. Path should be relative to the *src* folder.  

### Accessibility
**Hotgrid Audio** has a label assigned using the [aria-label](https://github.com/adaptlearning/adapt_framework/wiki/Aria-Labels) attribute: **ariaRegion**. These labels are not visible elements. They are utilized by assistive technology such as screen readers. This label is included within the *example.json* and may need to be added to the _globals in *course.json*.

## Limitations

Hotgrid automatically switches to 2 columns in small and medium device mode for the best user experience.

----------------------------
**Version number:**  3.0.0  
**Framework versions:**  4+     
**Author / maintainer:**   
**Accessibility support:** WAI AA   
**RTL support:** yes  
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, IE11, Safari 11+12 for macOS+iOS, Opera  
**Authoring tool support:** yes  
