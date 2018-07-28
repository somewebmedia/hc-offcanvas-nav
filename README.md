HC-MobileNav
===============

jQuery plugin for creating off-canvas multi-level navigations.
Check out the [demo](http://somewebmedia.com/hc-offcanvas-nav).

## Quick start

### Install

This package can be installed with:

- [npm](https://www.npmjs.com/package/hc-sticky): `npm install --save hc-offcanvas-nav`

Or download the [latest release](https://github.com/somewebmedia/hc-offcanvas-nav/releases).


## Usage

#### Call the plugin

```html
<link rel="stylesheet" href="/path/to/hc-mobile-nav.css">
<script src="/path/to/jquery.js"></script>
<script src="/path/to/hc-mobile-nav.js"></script>
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
| *`maxWidth`* | 1024 | int | Resolution below which to display the mobile menu, and hide the regular. |
| *`pushContent`* | false | false / string / element object | Content element (string selector or jQuery object) that will be pushed when the navigation is open, or false to disable this option. |
| *`side`* | 'left' | string | Side on which the menu will open. Available options: 'left' and 'right'. |
| *`levelOpen`* | 'overlap' | string | Submenu levels open effect. Available options: 'overlap', 'expand', 'none' or false. |
| *`levelSpacing`* | 40 | int | If levels are overlaped, this is the spacing between them, if they are expanding, this is the text indent of the submenus. |
| *`levelTitles`* | false | bool | Show titles for submenus, which is the parent item name. Works only for overlaped levels. |
| *`navTitle`* | null | string | Main navigation (first level) title. |
| *`navClass`* | '' | string | Custom navigation class. |
| *`disableBody`* | true | bool | Disable body scroll when navigation is open. |
| *`closeOnClick`* | true| bool | Close the navigation when one of the links are clicked. |
| *`customToggle`* | null | string / element object | Custom navigation toggle element. |
| *`insertClose`* | true | bool | Insert navigation close button. |
| *`insertBack`* | true | bool | Insert back buttons to submenus. |
| *`labelClose`* | '' | string | Label for the close button. |
| *`labelBack`* | '' | string | Label for the back buttons. |


## License

The code and the documentation are released under the MIT License.