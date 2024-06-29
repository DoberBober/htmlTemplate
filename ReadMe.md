# Install: #

- For create block: `node block %blockname% `.
- For create mixin: `node mixin %blockname% `.

<!--  -->

# Tasks: #
- default.
- `favicons` (create and inject favicons).
- `deploy` (optimize images, minify css/js, create/injects favicons, move root-files).

<!--  -->

# Folders structure: #

- dev
	- assets
	- blocks
		* _mixins
	- fonts
	- images
		* icons (SVG-icons for sprite.)
	- js
	- layouts
	- libs (will be merged into plugins.css/js)
		* notConcat (CSS/JS in this folder will not concatenated)
	- pages
	- root
		* _favicon.png_ (will be generated favicon-files)
		* _humans.txt_
		* _manifestInfo.json_ (settings for manifest)
	- styles
		* helpers
