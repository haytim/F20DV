// set dimensions for the graph
const packingWidth = 800;
const packingHeight = 1170;

// append an SVG container to the element with ID "packing"
const packingSvg = d3.select("#packing")
  .append("svg")
    .attr("width", packingWidth)
    .attr("height", packingHeight);

// load CSV data for population by region
d3.csv("/data/populationByRegion.csv").then(function(data) {

  let simulation; // defining global simulation for accessibility

  // extracting area name, numeric population, and region info
  function updatePacking(year) {
    // Process data for the selected year
    const processedData = data.map(d => ({
      key: d.areaName,
      value: +d[year].replace(/,/g, ""), // Convert population to number
      region: d.region
    }));

/*
  // create a color scale based on  regions
  const regions = Array.from(new Set(processedData.map(d => d.region))); // getting unique regions
  const color = d3.scaleOrdinal()
    .domain(regions)
    .range(d3.schemeSet3.slice(0, regions.length)); // maps each region to a color
    // .range(d3.quantize(d3.interpolatePiYG, regions.length)); colour scheme for piyg (may or may not use)
*/

  // assigns colours to each unique region
  const color = regionScaleByName;

  // defines circle size based on population
  const size = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.value)])
    .range([7, 55]);

  
  packingSvg.selectAll("circle").remove();

  // displaying onhover data
  const Tooltip = d3.select("#packing")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid 2px black")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("position", "absolute");

  // displaying data tootip for onhover
  const mouseover = function(event, d) {
    Tooltip.style("opacity", 1); 
  };

  // displaying data for the given circle
  const mousemove = function(event, d) {
    Tooltip.html(`<u>${d.key}</u><br>Population: ${d.value.toLocaleString()}<br>Region: ${d.region}`)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
  };

  // hiding data tootip when no longer hovering
  const mouseleave = function(event, d) {
    Tooltip.style("opacity", 0); 
  };

  // drag behaviour
  const drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

  // creating circles for each data point
  const node = packingSvg.append("g")
    .selectAll("circle")
    .data(processedData)
    .join("circle")
      .attr("r", d => size(d.value))
      .attr("cx", packingWidth / 2)
      .attr("cy", packingHeight / 2)
      .style("fill", d => color(d.region))  // Color circles by region
      .style("fill-opacity", 1)
      .attr("stroke", "black")
      .style("stroke-width", 1)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .call(drag);  // Enable dragging of circles

  if (simulation) simulation.stop(); // removing old simulation

  // force simulation for naturally arranging the circles
  simulation = d3.forceSimulation()
    .force("center", d3.forceCenter(packingWidth / 1.5, packingHeight / 2.5)) // note that I have adjusted values to 1.5 & 2.5 opposed to standard 2
    .force("charge", d3.forceManyBody().strength(0.1))
    .force("collide", d3.forceCollide().radius(d => size(d.value) + 3).iterations(1));

  simulation.nodes(processedData).on("tick", function() {
    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });
}
  // dragging functionality
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart(); // activating simulation
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
