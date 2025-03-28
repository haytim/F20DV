# UK Internal Migration Dashboard

## Repository Structure

- `index.html` - the main page html for the single page dashboard
- `data` - the various data sources used for the visualisations, including
  csv, json and geojson files
  - `scripts` - python scripts for processing data sources into friendlier formats
- `libs/d3` - contains the d3 library at version 7
- `scripts` - contains the javascript files used for creating the plots on the dashboard. there is a script for each graph, a `main.js` for shared things and the `DOMContentLoaded` event listener, and a `slider.js` for the global slider
- `styles` - contains the stylesheet for the page

## Running data scripts

The data scripts were written independently by multiple people and hold different assumptions.

### `moving-age-probablity` and `migration-matrices`

These expect the script to be run from the working directory `data/scripts` with the source excel files being located in `data/scripts/raw`. The needed files are documented within the scripts.

### `aggregateRegionIndusty` and `mergeRegionAndLAs`

These expect a working directory at the root of the repository.

## Datasets and their usage

### `housePriceIncome`, `table1_housingPurchase_housePriceDeciles` and `table2_housingPurchase_incomeDeciles`

Used in the bubble chart visualisation, `House Price Deciles Compared To Income Deciles And Population Per Region`.
`housePriceIncome` is derived from two tables of data, `table1_housingPurchase_housePriceDeciles` and `table2_housingPurchase_incomeDeciles`.
'Population' column of data derived from data from `populationByRegion`, by summing the population for each major UK region (e.g. England, Scotland).

### `internal_migration_matrices`

Describes the internal migration per each year from 2012 to 2022 for each region in the UK.
Used in the flow map and the chord diagram visualisations for each of the regions.

### `likelihood_of_moving_by_age`

The probability of moving per age, along with the probability of how many moves are made. 
Used in the histogram visualisation.

### `Itla2024.geojson`

Geometric data of the legal authorities throughout the UK.
Used in the regions map visualisation.

### `orderedRegionLAMigration`, `internalUKMigrationTimeseries` and `regionMigrationUK`

`orderedRegionLAMigration` was derived from both `internalUKMigrationTimeseries` files (csv, json) and `regionMigrationUK`. 
Used in the regions map visualisation.

### `populationByRegion`

The population for each region in the UK per each year from 2012 to 2022.
Used in the circular packing visualisation.

### `rgn2024`

Used as geographic data of the regions of the UK.
Used in the flow map and regions map visualisations.

### `rgvAddedCondensed` and `regionalGrossValueAddedInMillionsByIndustry`

`rgvAddedCondensed` was derived from data from `regionalGrossValueAddedInMillionsByIndustry`.
Used in the regions map visualisation.

## Visualisations

### `Bubble Chart` - `House Price Compared To Income And Population Per Region`

This bubble chart compares the average house price to average income per each region, with each bubble being the size of the population per each region.

### `Chord Diagram` and `Flow Map` - `Migration Between Regions`

These graphs both display the migration between regions- showing where people are moving from and moving to.
The flow map differs by showing the cumulative migration over the span of the time scale.
Both of these graphs interact with each other, hovering over a region in the chord diagram will highlight the migratory patterns in the flow map.

### `Circular Packing Chart` - `Population per Region`

Displays the population per region as the bubble size, and the bubbles are roughly organised into the shape of the UK.
An interactive visualisation where you are able to drag a region around, good for comparing the size of bubbles against each other to get a sense of the scale between the regions.

### `Histogram` - `Moving by Age`

This visualisation shows the frequency of moves per each age group.

### `Regions Map` - `Regions Migration Over Time`

Displays the net migration for each region of the UK. If a region is selected, this region is also highlighted in the `Bubble Chart` and `Circular Packing Chart`. This visualisation will present the regional gross value per each industry of that region within a container, if a region is selected.

### Bi-directionality

### `Chord Diagram` & `Flow Map` 
The Chord diagram is bidirectional with the Flow map in regards to region. When hovering over a region on either visualisations, the migration flow both both chart is displayed.

### `Regions Map` & `Bubble Chart` & `Circular Packing Chart`
Selecting a region on the region map will select the corresponding region on the bubble chart, as well as all the circles matching the region will be selected. This selection can also be performed from the bubble chart or circular packing chart, selecting the corresponding regions on each visualisation.
This allows for the comparison of house price, migration, and population between regions and local authorities.