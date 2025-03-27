const flowWidth = 800, flowHeight = 1500;

const flowSvg = d3.select("#flowMap")
    .attr("width", flowWidth)
    .attr("height", flowHeight)
    .attr("viewBox", [0, 0, flowWidth, flowHeight]);

const flowg = flowSvg.append("g");

//define projection
const flowProjection = d3.geoMercator()
    .center([-2, 54])  //center over the UK
    .scale(2500)       //adjust scale
    .translate([flowWidth / 2, flowHeight / 2]);

const flowPath = d3.geoPath().projection(flowProjection);


function flowMapHighlightStart(regionCode) {
    document.querySelector(`#flow-map-region-${regionCode}`)?.dispatchEvent(new Event("mouseover"))
}

function flowMapHighlightEnd(regionCode) {
    document.querySelector(`#flow-map-region-${regionCode}`)?.dispatchEvent(new Event("mouseout"))
}

//load uk region topojson & migration data
Promise.all([
    d3.json("./data/rgn2024.json"), //regional data for topoJSON
    d3.json("./data/internal_migration_matrices.json") //migration data for regions
]).then(([regionTopo, migrationData]) => {

    //get regions data from the topoJSON file
    const regionCodes = migrationData[0].regions;
    //console.log(regionCodes);
    const numRegions = regionCodes.length;
    let cumulativeMatrix = Array.from({ length: numRegions }, () => Array(numRegions).fill(0));

     //aggregate all yearly matrices into cumulativeMatrix
     migrationData.forEach(({ matrix }) => {
        for (let i = 0; i < numRegions; i++) {
            for (let j = 0; j < numRegions; j++) {
                cumulativeMatrix[i][j] += matrix[i][j];
            }
        }
    });

    //console.log(cumulativeMatrix);


    //regions features
    const regions = topojson.feature(regionTopo, regionTopo.objects.rgn);
    //console.log(regions);

    //compute region centroids for flow connections
    const centroids = {};
    regions.features.forEach(d => {
      const id = d.properties.areacd;
      //console.log(id);
      centroids[id] = flowPath.centroid(d);
    });

    //console.log(centroids);

    function fade(areaCode, opacity) {
        flowg.selectAll(".flow")
            .filter(d => d.sourceCode !== areaCode)
            .transition()
            .duration(transitionDuration)
            .attr("opacity", opacity)
    }

    //draw uk regions
    flowg.selectAll(".region")
        .data(regions.features)
        .join("path")
        .attr("class", "region")
        .attr("d", flowPath)
        .attr("fill", "#e0e0e0")
        .attr("stroke", "#aaa")
        .attr("id", d => `flow-map-region-${d.properties.areacd}`)
        .on("mouseover", (event, details) => {
            if (event.isTrusted) chordDiagramHighlightStart(details.properties.areacd);
            fade(details.properties.areacd, 0.1);
        })
        .on("mouseout", (event, details) => {
            if (event.isTrusted) chordDiagramHighlightEnd(details.properties.areacd);
            fade(details.properties.areacd, 1);
        });
    //create migration flow data by going through regions
    let migrationFlows = [];
    regionCodes.forEach((sourceId, i) => {
        regionCodes.forEach((targetId, j) => {
          if (cumulativeMatrix[i][j] > 0 && centroids[sourceId] && centroids[targetId]) {
            migrationFlows.push({
              source: centroids[sourceId],
              target: centroids[targetId],
              sourceCode: sourceId,
              weight: cumulativeMatrix[i][j]
            });
          }
        });
      });
    //console.log(migrationFlows);
    
    //set a max weight based on the maximum weight of the flows
    const maxWeight = d3.max(migrationFlows, d => d.weight);

    //set curved flow paths
    const curve = d3.line()
        .curve(d3.curveBundle.beta(0.85)) //smooth curves
        .x(d => d[0])
        .y(d => d[1]);

    //group flows by destination
    //let groupedFlows = d3.group(migrationFlows, d => d.target);
    //console.log(groupedFlows);

    //draw flow lines
    flowg.selectAll(".flow")
        .data( migrationFlows) //.filter(d => d.weight > (0.05 * maxWeight))
        .join("path")
        .attr("class", "flow")
        .attr("d", d => {
          const points = [
            d.source,
            [(d.source[0] + d.target[0]) / 2, (d.source[1] + d.target[1]) / 2 - 20], //curve upward
            d.target
          ];
          return curve(points);
        })
        .attr("stroke", "green") //set flow line color to green
        .attr("stroke-opacity", 0.7) //slight transparency
        .attr("stroke-width", d => (d.weight / maxWeight) * 50) //scale line width by weight
        .attr("stroke-linecap", "round")
        .attr("opacity", 1)
        .attr("fill", "none"); //ensure no fill for the paths
});