HC-MobileNav
===============


jQuery plugin for converting menus to mobile navigations.

## Usage

#### Call the plugin

```html
<script src="/path/to/jquery.js"></script>
<script src="/path/to/hc-mobile-nav.js"></script>
<script>
  jQuery(document).ready(function($) {
    $('#main-nav').hcMobileNav({
      maxWidth: 980
    });
  });
</script>
```

#### Example HTML menu structure

```html
<nav id="main-nav">
  <ul class="menu">
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li>
      <a href="/services">Services</a>
      <ul>
        <li>
          <a href="/hosting">Hosting</a>
          <ul>
            <li><a href="/private">Private Server</a></li>
            <li><a href="/managed">Managed Hosting</a></li>
          </ul>
        </li>
        <li><a href="/domains">Domains</a></li>
        <li><a href="/websites">Websites</a></li>
      </ul>
    </li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

## Options

| Property | Default | Type | Description |
|-----------|---------|-------|-------------|
| *`maxWidth`* | 1024 | int | Resolution below which to display the mobile menu, and hide the regular. |
| *`labels`* | <pre>{<br>  close: 'Close',<br>  back: 'Back'<br>}</pre> | object | Close and back links labels. |
