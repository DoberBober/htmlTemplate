# Folders structure: #

- dev
	- assets (Images used in the project)
		* icons (SVG-icons for sprite)
	- blocks
		* _helpers
	- fonts
	- images (Placeholder images that simulate data from the backend)
	- js
		* notConcat (JS in this folder will not concatenated)
	- layouts
	- libs (will be merged into plugins.css/js)
		* notConcat (CSS/JS in this folder will not concatenated)
	- pages
	- root
		* _favicon.png_ (from this file will be generated favicon-files)
		* _humans.txt_
		* _manifestInfo.json_ (settings for manifest)
	- styles
		* helpers


# Install: #

- For create block: `node block %blockname% `.
- For create mixin: `node mixin %blockname% `.

<!--  -->

# Tasks: #
- `dev` (run server).
- `favicons` (create and inject favicons).
- `deploy` (create/injects favicons, move root-files).
