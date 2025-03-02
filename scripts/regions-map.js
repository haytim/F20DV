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

// Load data and map
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
    const allValues = Object.values(data).flatMap(region => Object.values(region["Net Migration"]).map(Number)); 
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
            .attr("d", path)
            .style("stroke", "#333")
            .style("stroke-width", "0.5px")
            .style("fill", d => {
                const regionName = d.properties.areanm;
                const value = parseFloat(dataMap[regionName]?.["Net Migration"][year] || 0);
                return colorScale(value);
            });
    }

    //initial map rendering
    updateMap("2012");

    //add event listener for slider
    const slider = d3.select("#regions-yearSlider");
    const yearLabel = d3.select("#regions-yearLabel");

    slider.on("input", function () {
        const selectedYear = this.value;
        yearLabel.text(selectedYear);
        updateMap(selectedYear);
    });
});