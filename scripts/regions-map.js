//set up SVG dimensions
const w = 800, h = 1170;

//create SVG element
const svg2 = d3.select("#regions-map")
    .attr("width", w)
    .attr("height", h);

const g2 = svg2.append("g");

//define projection
const projection2 = d3.geoMercator()
    .center([-2, 54])  //set center
    .scale(2500)       //adjust scale
    .translate([w / 2, h / 2]);

//define path generator
const path2 = d3.geoPath().projection(projection2);

//define a zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8]) //set zoom scale limits
    .on("zoom", (event) => {
        g2.attr("transform", event.transform); //apply zoom/pan transformations
    });

//apply zoom behavior to the SVG
svg2.call(zoom);

let zoomedRegion = null;

//load data and map
Promise.all([
    d3.json("./data/rgn2024.json"), //regional data for topoJSON
    d3.json("./data/orderedRegionLAMigration.json") //migration data for regions
]).then(([regionTopo, data]) => {

    //get regions data from the topoJSON file
    const regions = topojson.feature(regionTopo, regionTopo.objects.rgn);

    //convert data to an easy lookup format
    const dataMap = {};
    Object.entries(data).forEach(([region, details]) => {
        dataMap[region] = {
            ...details,
            "Net Migration": Object.fromEntries(
                Object.entries(details["Net Migration"]).map(([year, value]) => [
                    year,
                    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value
                ])
            )
        };
    });

    //determine the range dynamically from data
    const minValue = -20000; 
    const maxValue = 40000; 

    //define color scale (pink for negative, green for positive)
    const colorScale = d3.scaleDiverging([minValue, 0, maxValue], d3.interpolatePiYG);

    //function to update map based on selected year
    function updateMap(year) {
        g2.selectAll(".region")
            .data(regions.features)
            .join("path")
            .attr("class", "region")
            .attr("d", path2)
            .style("stroke", "#333")
            .style("stroke-width", "0.5px")
            .style("fill", d => {
                const regionName = d.properties.areanm;
                const value = parseFloat(dataMap[regionName]?.["Net Migration"][year] || 0);
                return colorScale(value);
            })
            .on("click", function (event, d) {
                const clickedRegion = d.properties.areanm;

                //added if else for clicking region to unzoom
                if (zoomedRegion === clickedRegion) {
                    //if the clicked region is already zoomed in, reset zoom
                    zoomedRegion = null;
                    svg2.transition()
                        .duration(750)
                        .call(zoom.transform, d3.zoomIdentity); //reset zoom
                } else {
                    //zoom into the clicked region
                    zoomedRegion = clickedRegion;
                    const [[x0, y0], [x1, y1]] = path2.bounds(d); //get bounding box of region
                    const dx = x1 - x0;
                    const dy = y1 - y0;
                    const x = (x0 + x1) / 2;
                    const y = (y0 + y1) / 2;
                    const scale = Math.min(8, 0.9 / Math.max(dx / w, dy / h));
                    const translate = [w / 2 - scale * x, h / 2 - scale * y];

                    svg2.transition()
                        .duration(750)
                        .call(
                            zoom.transform,
                            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                        );
                }
            });
    }

    //initial map rendering
    updateMap(sliderCurrentValue());

    sliderRegisterCallback(function () {
        updateMap(this.value);
    });

});