
//tooltip for testing
const tooltip = d3.select("#tooltip").classed("tooltip", true);

//set up SVG dimensions
const w = 800, h = 1500;

//create SVG element
const svg2 = d3.select("#regions-map")
    .attr("width", w)
    .attr("height", h)
    .attr("viewBox", [0, 0, w, h]);

const g2 = svg2.append("g");

//define projection
const projection2 = d3.geoMercator()
    .center([-2, 54])  //set center
    .scale(2500)       //adjust scale
    .translate([w / 2, h / 2]);

//define path generator
const path2 = d3.geoPath().projection(projection2);

//these track zoom state, la data, industry data
let zoomedRegion = null;
let localAuthorityBorders = null;
let industryData = null;

//legend creation function
function createDivergingLegend(colorScale, title, { 
    width = 300, 
    height = 40,
    marginTop = 20,
    marginRight = 20,
    ticks = 5,
    tickFormat = d3.format(",.0f"),
  } = {}) {
    //create legend container
    const legend = svg2.append("g")
      .attr("class", "color-legend")
      .attr("transform", `translate(${w - width - marginRight},${marginTop})`);
  
    //add title
    legend.append("text")
      .attr("class", "legend-title")
      .attr("x", width / 2)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .text(title);
  
    //create gradient
    const defs = svg2.append("defs");
    const gradientId = "legend-gradient"
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%");
  
    //add gradient stops (5 stops for smooth transition)
    const [min, mid, max] = colorScale.domain();
    const stops = [
      { offset: "0%", value: min },
      { offset: "25%", value: min + (mid - min) * 0.5 },
      { offset: "50%", value: mid },
      { offset: "75%", value: mid + (max - mid) * 0.5 },
      { offset: "100%", value: max }
    ];
  
    stops.forEach(stop => {
        gradient.append("stop")
          .attr("offset", stop.offset)
          .attr("stop-color", colorScale(stop.value));
      });
  
    //add gradient bar
    legend.append("rect")
      .attr("class", "legend-gradient")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", width)
      .attr("height", 12)
      .style("fill", `url(#${gradientId})`);
  
    //create scale for axis
    const xScale = d3.scaleLinear()
      .domain([min, max])
      .range([0, width]);
  
    //add axis
    const tickValues = Array.from({length: ticks}, (_, i) => 
      min + (max - min) * (i / (ticks - 1))
    );
  
    const axis = d3.axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat(tickFormat)
      .tickSize(6);
  
    legend.append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(0,32)`)
      .call(axis);
  }

//load data and map
Promise.all([
    d3.json("./data/rgn2024.json"), //regional data for topoJSON
    d3.json("./data/orderedRegionLAMigration.json"), //migration data for regions
    d3.json("./data/ltla2024.geojson"), //local authority data for the boorders when zoomed
    d3.csv("./data/rgvAddedCondensed.csv") //csv with region industry data
]).then(([regionTopo, data, laGeoData, gvaData]) => {

    //process gross value added data
    industryData = gvaData.map(d => ({
        region: d["ITL1 region"],
        industryCode: d["SIC07"],
        industryName: d["SIC07 desc"],
        values: Object.fromEntries(
            Object.entries(d)
                .filter(([key]) => /^\d{4}$/.test(key)) //filter only years for the values using regex
                .map(([year, value]) => [year, parseFloat(value.replace(/,/g, ""))]) //parse numbers
        )
    }));

    const colorScaleLeg = d3.scaleDiverging([-200000, 0, 200000], d3.interpolatePiYG);
      
    //create the legend
    createDivergingLegend(colorScaleLeg, "Net Migration", {
        width: 250,
        ticks: 5,
        tickFormat: d => d3.format("+,.0f")(d)
    });

    //get regions data from the topoJSON file
    const regions = topojson.feature(regionTopo, regionTopo.objects.rgn);

    //local authority data
    localAuthorityBorders = laGeoData;

    //convert data to an easy lookup format
    const dataMap = {};
    Object.entries(data).forEach(([region, details]) => {
        dataMap[region] = {
            ...details,
            "Net Migration": Object.fromEntries(
                Object.entries(details["Net Migration"]).map(([year, value]) => [
                    year,
                    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value //replace strings with numbers
                ])
            ),
            //also parse Local Authorities data within the region to remove the commmmasssss
            "Local Authorities": details["Local Authorities"].map(la => {
                return {
                    ...la,
                    "Net Migration": Object.fromEntries(
                        Object.entries(la["Net Migration"]).map(([year, value]) => [
                            year,
                            typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value
                        ])
                    )
                };
            })
        };
    });

    //determine the range dynamically from data
    const minValue = -20000; 
    const maxValue = 40000; 

    //set min max for las
    const laMinValue = -927;
    const laMaxValue = 3500;

    //define color scale (pink for negative, green for positive)
    const colorScale = d3.scaleDiverging([minValue, 0, maxValue], d3.interpolatePiYG);
    const laColorScale = d3.scaleDiverging([laMinValue, 0, laMaxValue], d3.interpolatePiYG);

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
            //mouseover to show tooltip when hovering on a region
            .on("mouseover", function (event, d) {
                const regionName = d.properties.areanm;
                const value = parseFloat(dataMap[regionName]?.["Net Migration"][year] || 0);
                
                tooltip
                    .html(
                        `<strong>Region:</strong> ${regionName}<br>
                        <strong>Net Migration:</strong> ${value.toLocaleString()}`
                    )
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
                    
            })
            //mousemove to move hte tooltip when cursor moves
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            //remove tooltip when no longer on that region
            .on("mouseout", function () {
                tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            })
            //on click function to zoom into the region when clicked
            .on("click", function (event, d) {
                const clickedRegion = d.properties.areanm;
                //console.log(clickedRegion);

                //custom event when a region is clicked for bidirectional interaction with the bubble chart
                const regionSelectedEvent = new CustomEvent('regionSelected', {
                    detail: { 
                        regionName: clickedRegion,
                        year: year
                    }
                });
                document.dispatchEvent(regionSelectedEvent);
                
                //same logic as before just moved the zoom to region into a seperate function
                if (zoomedRegion === clickedRegion) {
                    //if the clicked region is already zoomed in, reset zoom
                    zoomedRegion = null;
                    g2.transition()
                        .duration(750)
                        .call(resetZoom); //reset zoom
                    hideInfoBox(); //hide the info box - currently not working I realised
                } else {
                    //zoom into the clicked region and render local authorities
                    zoomedRegion = clickedRegion;
                    zoomToRegion(d);
                    renderLocalAuthorities(d, year);
                    updateInfoBox(clickedRegion, year);
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

        //clear local authority borders when zooming out
        g2.selectAll(".local-authority").remove();
    }

    //function to render local authorities borders when a region is selected
    function renderLocalAuthorities(region, year) {
        const regionName = region.properties.areanm;
        
        //get local authority migration data and codes
        const localAuthorities = dataMap[regionName]?.["Local Authorities"] || [];
        const localAuthorityCodes = localAuthorities.map(la => la["Area Code"]);

        //filter the local authority borders using the area codes
        const filteredLAs = localAuthorityBorders.features.filter(feature =>
            localAuthorityCodes.includes(feature.properties.areacd)
        );

        //select all for local authorities
        g2.selectAll(".local-authority")
            .data(filteredLAs)
            .join("path")
            .attr("class", "local-authority")
            .attr("d", path2)
            .style("stroke", "#999")
            .style("stroke-width", "0.5px")
            .style("fill", d => {
                const laCode = d.properties.areacd;
                const laData = localAuthorities.find(la => la["Area Code"] === laCode);
                const value = parseFloat(laData?.["Net Migration"]?.[year] || 0);
                return laColorScale(value);
            })
            //set mouseover so that the tooltip can be displayed when hovering over las as well
            .on("mouseover", function (event, d) {
                const laCode = d.properties.areacd;
                const laData = localAuthorities.find(la => la["Area Code"] === laCode);
                const laName = laData?.["Area Name"] || "Unknown";
                const value = parseFloat(laData?.["Net Migration"]?.[year] || 0);
                
                tooltip
                    .style("display", "block")
                    .html(
                        `<strong>Local Authority:</strong> ${laName}<br>
                         <strong>Net Migration:</strong> ${value.toLocaleString()}`
                    )
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
            })
            //move the tooltip when the mouse moves
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            //remove tooltip when no longer on that la
            .on("mouseout", function () {
                tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            })
            .on("click", function () {
                //unzoom when clicking on an LA
                zoomedRegion = null;
                resetZoom(); //reset zoom state
            })
    }

    //update info box function that sets the elements in index html to the correct values for the industry gross value added
    function updateInfoBox(regionName, year) {
        //get all the region data and check if it exists
        const regionData = industryData
            .filter(d => d.region === regionName)
            .map(d => ({ ...d, value: d.values[year]}))
            .filter(d => d.value !== undefined)
            .sort((a, b) => b.value - a.value);

        //get infobox and title and list elements
        const infoBox = document.getElementById("info-box");
        const title = document.getElementById("region-title");
        const list = document.getElementById("industry-list");

        //set the title content with the name and year
        title.textContent = `${regionName} - ${year}`;
        list.innerHTML = "";

        //for each industry add a list element with the industry name and the value added (million pounds)
        regionData.forEach(d => {
            const listItem = document.createElement("li");
            listItem.textContent = `${d.industryName}: £${d.value.toLocaleString()}m`;
            list.appendChild(listItem);
        });

        infoBox.style.display = "block";
    }

    //function to hide the infobox
    function hideInfoBox() {
        document.getElementById("info-box").style.display = "none";
    }

    //initial map rendering
    updateMap(sliderCurrentValue());

    document.addEventListener('bubbleSelected', function(e) {
        const selectedRegion = e.detail.regionName;
        
        //find the region feature in your GeoJSON data
        const regionFeature = regions.features.find(
            feature => feature.properties.areanm === selectedRegion
        );
        
        if (regionFeature) {
            //zoom to the selected region
            zoomedRegion = selectedRegion;
            zoomToRegion(regionFeature);
            renderLocalAuthorities(regionFeature, e.detail.year || sliderCurrentValue());
            updateInfoBox(selectedRegion, e.detail.year || sliderCurrentValue());
            
            //update the slider if year is different
            if (e.detail.year && e.detail.year !== sliderCurrentValue()) {
                document.getElementById("global-slider").value = e.detail.year;
                document.querySelector("#slider-container span").textContent = e.detail.year;
            }
        }
    });
    
    //event listener to detect selections in packing chart
    document.addEventListener('packingRegionSelected', function(e) {
        const selectedRegion = e.detail.regionName;
        const selectedYear = e.detail.year;

        // matching geo features against selection in packing chart
        const regionFeature = regions.features.find(
        feature => feature.properties.areanm === selectedRegion
    );

    if (regionFeature) {
        //zooming into selected local authorities
        zoomedRegion = selectedRegion;
        zoomToRegion(regionFeature);
        renderLocalAuthorities(regionFeature, selectedYear);
        updateInfoBox(selectedRegion, selectedYear);

        //ensure slider matches year selection
        if (selectedYear && selectedYear !== sliderCurrentValue()) {
            document.getElementById("global-slider").value = selectedYear;
            document.querySelector("#slider-container span").textContent = selectedYear;
        }
    }

    //adds region selection borders
    g2.selectAll(".region")
        .style("stroke", "#333")
        .style("stroke-width", "0.5px");

    g2.selectAll(".region")
        .filter(d => d.properties.areanm === selectedRegion)
        .style("stroke", "gold")
        .style("stroke-width", "2px");
    });

    sliderRegisterCallback(function () {
        const selectedYear = this.value;
        updateMap(selectedYear);
        //if a region is zoomed in re-render the LAs for that region, now it also re-renders the industry information
        if (zoomedRegion) {
            const zoomedRegionData = regions.features.find(
                feature => feature.properties.areanm === zoomedRegion
            );
            if (zoomedRegionData) {
                renderLocalAuthorities(zoomedRegionData, selectedYear);
                const regionName = zoomedRegionData.properties.areanm;
                //console.log(regionName);
                updateInfoBox(regionName, selectedYear);
            }
        }
    });
});

//close box button click event listener to stop displaying it
document.getElementById("close-box").addEventListener("click", () => {
    document.getElementById("info-box").style.display = "none";
});


