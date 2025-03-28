// set dimensions for the graph
const packingWidth = 800;
const packingHeight = 1100;

// append an SVG container to the element with ID "packing"
const packingSvg = d3.select("#packing")
  .append("svg")
    .attr("width", packingWidth)
    .attr("height", packingHeight)
    .attr("viewBox", [0, 0, packingWidth, packingHeight]);

// load CSV data for population by region
d3.csv("/data/populationByRegion.csv").then(function(data) {

  // approximate positions for regions, loosely based on their geographic position on the UK map
  const regionClusterPositions = {
    "Scotland": [packingWidth / 2, packingHeight / 5],
    "North East": [packingWidth / 1.6, packingHeight / 3],
    "North West": [packingWidth / 2.5, packingHeight / 3],
    "Yorkshire and The Humber": [packingWidth / 1.8, packingHeight / 2.5],
    "East Midlands": [packingWidth / 1.7, packingHeight / 2.1],
    "West Midlands": [packingWidth / 2.2, packingHeight / 1.9],
    "East of England": [packingWidth / 1.5, packingHeight / 1.7],
    "London": [packingWidth / 1.6, packingHeight / 1.5],
    "South East": [packingWidth / 1.4, packingHeight / 1.4],
    "South West": [packingWidth / 2.2, packingHeight / 1.5],
    "Wales": [packingWidth / 2.8, packingHeight / 1.9]
  };


    // styling onhover tooltip data
    const Tooltip = d3.select("#packing")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip");

    // displaying data tootip for onhover
    const mouseover = function(event, d) {
      Tooltip.transition().duration(200).style("opacity", 1);
    };

    // displaying data for the given circle
    const mousemove = function(event, d) {
      Tooltip.html(`<b><u>${d.key}</u></b><br><b>Population: </b>${d.value.toLocaleString()}<br><b>Region: </b>${d.region}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    };

    // hiding data tootip when no longer hovering   
    const mouseleave = function(event, d) {
      Tooltip.transition().duration(200).style("opacity", 0);
    };

    // drag behaviour
    const drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

  // force simulation for naturally arranging the circles
  const simulation = d3.forceSimulation()
    .force("x", d3.forceX(d => d.x).strength(0.05))
    .force("y", d3.forceY(d => d.y).strength(0.05))
    .alpha(0.5)
    .alphaDecay(0.05);

  // process constant data
  let processedData = data.map(d => {
    const [x, y] = regionClusterPositions[d.region] || [packingWidth / 2, packingHeight / 2]; // determining region position for clustering
    return {
      key: d.areaName,
      value: +d[sliderCurrentValue()].replace(/,/g, ""),
      region: d.region,
      x: x,
      y: y
    };
  });

  // extracting area name, numeric population, and region info
  function updatePacking(year) {

  // process data for the selected year
  processedData = processedData.map((d, index) => {
    d.value = +data[index][year].replace(/,/g, "");
    if (d.key !== data[index].areaName) console.warn("indices dont match");
    return d;
  });  

/*
  // create a colour scale based on  regions
  const regions = Array.from(new Set(processedData.map(d => d.region))); // getting unique regions
  const colour = d3.scaleOrdinal()
    .domain(regions)
    .range(d3.schemeSet3.slice(0, regions.length)); // maps each region to a colour
    // .range(d3.quantize(d3.interpolatePiYG, regions.length)); colour scheme for piyg (may or may not use)
*/

  // assigns colours to each unique region
  const color = regionScaleByName;

  // defines circle size based on population
  const size = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.value)])
      .range([7, 55]);

  // creating circles for each data point
  const node = packingSvg
    .selectAll("circle")
    .data(processedData)
    .join("circle")
      .attr("r", d => size(d.value))
      .style("fill", d => color(d.region))  
      .style("fill-opacity", 1)
      .attr("stroke", "black")
      .style("stroke-width", 1)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .call(drag);  // enables dragging of circles

    simulation.nodes(processedData).on("tick", function() {
      node.attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

  simulation.force("collide", d3.forceCollide().radius(d => size(d.value) + 1).iterations(2));

  // event listener to deetect region selections on the region map or bubble chart
  document.addEventListener('bubbleSelected', highlightRegion);
  document.addEventListener('regionSelected', highlightRegion);

  // event handler to highlight a region matching one selected elsewhere
  function highlightRegion(e) {
      const selectedRegion = e.detail.regionName;

      // reseting highlights
      packingSvg.selectAll("circle")
          .style("stroke-width", 1)
          .style("stroke", "black")
          .style("fill-opacity", 0.5);

      // highlighting the matching region
      packingSvg.selectAll("circle")
          .filter(d => d.region === selectedRegion)
          .style("stroke", "gold")
          .style("stroke-width", 3)
          .style("fill-opacity", 1);
  }

  // removes any old legend 
  packingSvg.selectAll(".packing-legend").remove();

  // get all unique regions 
  const packingRegions = Array.from(new Set(processedData.map(d => d.region)));
  const legendCols = 4;

  // adds a group for the legend
  const packingLegendGroup = packingSvg.append("g")
    .attr("class", "packing-legend")
    .attr("transform", `translate(${(packingWidth - (185 * legendCols))}, ${packingHeight - 100})`); // adjusting legend position

  // postions each item in rows and columns
  const packingLegendItems = packingLegendGroup.selectAll(".packing-legend-item")
    .data(packingRegions)
    .enter()
    .append("g")
    .attr("class", "packing-legend-item")
    .attr("transform", (d, i) => {
      const x = (i % legendCols) * 185;
      const y = Math.floor(i / legendCols) * 30;
      return `translate(${x}, ${y})`;
    });

  // colour by region
  packingLegendItems.append("rect")
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", d => regionScaleByName(d))
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  // adding region names
  packingLegendItems.append("text")
    .attr("x", 30)
    .attr("y", 15)
    .style("font-size", "12px")
    .text(d => d);

  // function to reset circles back to the default appearance
  function resetCirclesToDefault() {
    packingSvg.selectAll("circle")
        .style("stroke", "none") // no border by default
        .style("fill-opacity", 1)
        .style("fill", d => regionScaleByName(d.region));
  }

  // selected circle functionality
  node.on("click", function(event, d) {
    const clickedCircle = d3.select(this);
    const isSelected = clickedCircle.classed("selected-circle");

    if (!isSelected) {
        // clear previous selection
        packingSvg.selectAll("circle")
            .classed("selected-circle", false)
            .style("stroke", "none")
            .style("fill-opacity", 0.5);

        // select clicked circle
        clickedCircle
            .classed("selected-circle", true)
            .style("stroke", "gold")
            .style("stroke-width", 3)
            .style("fill-opacity", 1);

        // broadcast selection event 
        const packingRegionSelectedEvent = new CustomEvent('packingRegionSelected', {
            detail: { regionName: d.region, year: sliderCurrentValue() }
        });
        document.dispatchEvent(packingRegionSelectedEvent);

    } else {
        resetCirclesToDefault(); // reset circle style

        // braodcast deselection event
        const packingRegionDeselectedEvent = new CustomEvent('packingRegionDeselected', {
            detail: { regionName: d.region, year: sliderCurrentValue() }
        });
        document.dispatchEvent(packingRegionDeselectedEvent);
    }
  });

  document.addEventListener('regionUnselected', function(e) {
    //remove highlights from all bubbles by calling resetCircles
    //console.log("UNSELECT");
    resetCirclesToDefault();

  });

}

  // dragging functionality
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.2).restart(); // activating simulation
    d.fx = d.x;
    d.fy = d.y;
  }

  // updating position of circle during drag
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0); // decreasing velocity of circle to 0 when dragging finished
    d.fx = null;
    d.fy = null;
  }

  // initialize packing with current slider value
  updatePacking(sliderCurrentValue());

  // callback to update circles on when slider value is changed
  sliderRegisterCallback(function() {
    updatePacking(this.value);
  });
});