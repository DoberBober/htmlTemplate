# Folders structure:

- dev
    - assets (Images used in the project)
        - icons (SVG-icons for sprite)
    - blocks
        - \_helpers
    - fonts
    - images (Placeholder images that simulate data from the backend)
    - js
        - notConcat (JS in this folder will not concatenated)
    - layouts
    - libs (will be merged into plugins.css/js)
        - notConcat (CSS/JS in this folder will not concatenated)
    - pages
    - root
        - _humans.txt_
    - styles
        - helpers

# Install:

- Required Node.js: `>=20.10.0`.
- For create block: `node block %blockname% `.
- For create mixin: `node mixin %blockname% `.
- Dev server: `npm run dev`.
- Production build: `npm run build`.
- Preview production build: `npm run preview`.
