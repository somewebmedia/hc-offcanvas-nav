HC-MobileNav
===============

jQuery plugin for creating mobile navigation from menu.

##Usage

####Call plugin

```html
<script src="/path/to/jquery.js"></script>
<script src="/path/to/jquery.hc-mobile-nav.js"></script>
<script>
	jQuery(document).ready(function($){
		$('#main-nav').hcMobileNav();
	});
</script>
```

####Example HTML menu structure

```html
<nav id="main-nav">
	<ul class="menu">
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