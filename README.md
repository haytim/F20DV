# UK Internal Migration Dashboard

## Repository Structure

- `index.html` - the main page html for the single page dashboard
- `data` - the various data sources used for the visualisations, including
  csv, json and geojson files
  - `scripts` - python scripts for processing data sources into friendlier formats
- `libs/d3` - contains the d3 library at version 7
- `scripts` - contains the javascript files used for creating the plots on the dashboard. there is a script for each graph, a `main.js` for shared things and the `DOMContentLoaded` event listener, and a `slider.js` for the global slider
- `styles` - contains the stylesheet for the page
