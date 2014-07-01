HC-MobileNav
===============


jQuery plugin for converting menus to mobile navigations.

##Usage

####Call the plugin

```html
<script src="/path/to/jquery.js"></script>
<script src="/path/to/jquery.hc-mobile-nav.js"></script>
<script>
	jQuery(document).ready(function($){
		$('#main-nav').hcMobileNav({
			maxWidth: 730
		});
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

## Options

<table>
	<tr>
		<th>Property</th>
		<th>Default</th>
		<th>Type</th>
		<th>Description</th>
	</tr>
	<tr>
		<td><strong>maxWidth</strong></td>
		<td>980</td>
		<td>int</td>
		<td>Resolution on which to show the mobile menu, and hide the regular.</td>
	</tr>
	<tr>
		<td><strong>labels</strong></td>
		<td>{close: 'Close', next: 'Next'}</td>
		<td>object</td>
		<td>You can cusomize your own text for close and next links.</td>
	</tr>
</table>