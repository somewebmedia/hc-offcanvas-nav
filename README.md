HC Off-canvas Nav
===============

[![Version](https://img.shields.io/npm/v/hc-offcanvas-nav.svg)](https://www.npmjs.com/package/hc-offcanvas-nav) [![Downloads](https://img.shields.io/npm/dt/hc-offcanvas-nav.svg)](https://www.npmjs.com/package/hc-offcanvas-nav)

jQuery plugin for creating off-canvas multi-level navigations, using ARIA.

- [Demo](https://somewebmedia.github.io/hc-offcanvas-nav/)

### Why it is accessible
- It relies on <a href="https://www.w3.org/TR/wai-aria-practices/#dialog_modal"><abbr title="Accessible Rich Internet Application">ARIA</abbr> Design pattern for Dialogs</a>
- The tab key loops through all of the keyboard focusable items within the offcanvas navigation
- You can close it using <kbd>Esc</kbd>

## Quick start

### Install

This package can be installed with:

- [npm](https://www.npmjs.com/package/hc-offcanvas-nav): `npm install --save hc-offcanvas-nav`

Or download the [latest release](https://github.com/somewebmedia/hc-offcanvas-nav/releases).


## Usage

#### Call the plugin

```html
<link rel="stylesheet" href="/path/to/hc-offcanvas-nav.css">
<script src="/path/to/jquery.js"></script>
<script src="/path/to/hc-offcanvas-nav.js"></script>
<script>
  jQuery(document).ready(function($) {
    $('#main-nav').hcOffcanvasNav({
      maxWidth: 980
    });
  });
</script>
```

#### Example HTML menu structure

```html
<nav id="main-nav">
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li>
      <a href="#">Services</a>
      <ul>
        <li>
          <a href="#">Hosting</a>
          <ul>
            <li><a href="#">Private Server</a></li>
            <li><a href="#">Managed Hosting</a></li>
          </ul>
        </li>
        <li><a href="#">Domains</a></li>
        <li><a href="#">Websites</a></li>
      </ul>
    </li>
    <li><a href="#">Contact</a></li>
  </ul>
</nav>
```

## Options

| Property | Default | Type | Description |
|-----------|---------|-------|-------------|
| *maxWidth* | `1024` | int / bool | Resolution below which to display the mobile menu, and hide the regular. |
| *pushContent* | `false` | false / str / jQuery obj | Content element (string selector or jQuery object) that will be pushed when the navigation is open. |
| *expanded* | `false `| bool | Initialize menu in expanded mode. It won't push content. |
| *position* | `'left'` | str | Position on which the menu will open. Available options: `'left'`, `'right'`, `'top'` and `'bottom'`. |
| *levelOpen* | `'overlap'` | str | Submenu levels open effect. Available options: `'overlap'`, `'expand'`, `'none'` or `false`. |
| *levelSpacing* | `40` | int | If levels are overlaped, this is the spacing between them, if they are expanding, this is the text indent of the submenus. |
| *levelTitles* | `false` | bool | Show titles for submenus, which is the parent item text. Works only for overlaped levels. |
| *navTitle* | `null` | str | Main navigation (first level) title. |
| *navClass* | `''` | str | Custom navigation class. |
| *disableBody* | `true` | bool | Disable body scroll when navigation is open. |
| *closeOnClick* | `true` | bool | Close the navigation when links are clicked. |
| *customToggle* | `null` | str / jQuery obj | Custom navigation toggle element. |
| *insertClose* | `true` | bool / int | Insert navigation close button. You can also use an integer representing 0-based index that will be the position of the button in the list. Negative numbers are also supported. |
| *insertBack* | `true` | bool / int | Insert back buttons to submenus. You can also use an integer representing 0-based index that will be the position of the button in the list. Negative numbers are also supported. Works only for overlaped levels. |
| *levelTitleAsBack* | false | bool | Use level titles as back labels. |
| *labelClose* | `'Close'` | str | Label for the close button. |
| *labelBack* | `'Back'` | str | Label for the back buttons. |
| *rtl* | `false` | bool | Set the content direction to right-to-left. |
| *bodyInsert* | `'prepend'` | str | Choose to prepend or append navigation to body. |
| *removeOriginalNav* | `false` | bool | Remove original menu from the DOM. Don't use this if planning to update the nav! |


### Methods

Methods are used to control the plugin after initialization.

| Method | Accepts | Description |
|---------|---------|--------------|
| *settings* | str | Returns current settings, or a particular setting if you specify it. |
| *isOpen* | | Checks if the nav is open, and returns boolean. |
| *update* | obj, bool | Updates the settings with the new ones, and/or updates the internal state of the plugin making the DOM changes based on the original nav. |
| *open* | | Opens the nav. |
| *close* | | Closes the nav. |

```js
var Nav = $('#main-nav').hcOffcanvasNav({
  maxWidth: 980
});

// update the settings
Nav.update({
  maxWidth: 1024,
  navTitle: 'All pages'
});

// update the nav DOM
Nav.update(true);

// update the settings and the DOM
Nav.update({
  maxWidth: 1024,
  navTitle: 'All pages'
}, true);
```

### Events

| Event | Description |
|---------|--------------|
| *open* | Triggers each time when the nav is opened. |
| *close* | Triggers each time when the nav is closed. |
| *close.once* | Triggers only the first time the nav is closed, and than it detaches itself. |

All events return Event object, and the plugin Settings object.

```js
var Nav = $('#main-nav').hcOffcanvasNav();

// change nav open side after each close
Nav.on('close', function(event, settings) {
  Nav.update({
    side: settings.side === 'left' ? 'right' : 'left'
  });
});

// will change nav open side only once
Nav.on('close.once', function(event, settings) {
  Nav.update({
    side: settings.side === 'left' ? 'right' : 'left'
  });
});
```

### Data Attributes

| Attr | Accepts | Description |
|-------|--------|-------------|
| *data-nav-custom-content* | | Attached on the list items. Will clone item's content as is. |
| *data-nav-close* | bool | Attached on the item links. Tells the nav if it needs to be closed on click or not. |

If `closeOnClick` options is enabled for the nav, in the example below the "Add Page" link will not close it.

```html
<nav id="main-nav">
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
    <li><a data-nav-close="false" href="#">Add Page</a></li>
  </ul>
</nav>
```

## License

The code and the documentation are released under the MIT License.
