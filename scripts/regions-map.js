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

let zoomedRegion = null;

//load data and map
Promise.all([
    d3.json("./data/rgn2024.json"), //regional data for topoJSON
    d3.json("./data/orderedRegionLAMigration.json"), //migration data for regions
    d3.json("./data/ltla2024.geojson") //local authority data for the boorders when zoomed
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
                //same logic as before just moved the zoom to region into a seperate function
                if (zoomedRegion === clickedRegion) {
                    //if the clicked region is already zoomed in, reset zoom
                    zoomedRegion = null;
                    g2.transition()
                        .duration(750)
                        .call(resetZoom); //reset zoom
                } else {
                    //zoom into the clicked region
                    zoomedRegion = clickedRegion;
                    zoomToRegion(d);
                }
            });
    }

    //zoom into a specific region
    function zoomToRegion(region) {
        const [[x0, y0], [x1, y1]] = path2.bounds(region); //get bounding box of region
        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;
        const scale = Math.min(8, 0.9 / Math.max(dx / w, dy / h));
        const translate = [w / 2 - scale * x, h / 2 - scale * y];

        g2.transition()
            .duration(750)
            .attr("transform", `translate(${translate[0]},${translate[1]}) scale(${scale})`);
    }

    //reset the zoom
    function resetZoom() {
        g2.transition()
            .duration(750)
            .attr("transform", `translate(0,0) scale(1)`);
    }

    //initial map rendering
    updateMap(sliderCurrentValue());

    sliderRegisterCallback(function () {
        updateMap(this.value);
    });

});