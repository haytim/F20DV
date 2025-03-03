const flowWidth = 800, flowHeight = 600;

const flowSvg = d3.select("#flowMap")
    .attr("width", flowWidth)
    .attr("height", flowHeight);

const flowg = flowSvg.append("g");

//define projection
const flowProjection = d3.geoMercator()
    .center([-2, 54])  //center over the UK
    .scale(2500)       //adjust scale
    .translate([width / 2, height / 2]);

const flowPath = d3.geoPath().projection(flowProjection);

//load uk region topojson & migration data
Promise.all([
    d3.json("./data/rgn2024.json"), //regional data for topoJSON
    d3.json("./data/internal_migration_matrices.json") //migration data for regions
]).then(([regionTopo, migrationData]) => {

    //get regions data from the topoJSON file
    const regions = topojson.feature(regionTopo, regionTopo.objects.rgn);

    //draw uk regions
    flowg.selectAll(".region")
        .data(regions.features)
        .join("path")
        .attr("class", "region")
        .attr("d", flowPath)
        .attr("fill", "#e0e0e0")
        .attr("stroke", "#aaa");
    
    //just use data from 2012 for now
    const yearData = migrationData.find(d => d.year === 2012);
    const regionCodes = yearData.regions;
    const matrix = yearData.matrix;

    //set region coordinates
    // let regionCoordinates = {};
    // regions.features.forEach(feature => {
    //     const code = feature.properties.code;
    //     regionCoordinates[code] = path.centroid(feature);
    // });

    const regionCoordinates = {
        "E12000001": [-2.5, 54.5], 
        "E12000002": [-1.5, 53.8], 
        "E12000003": [-1.2, 52.6],
        "E12000004": [-2.8, 52.4],
        "E12000005": [-1.8, 51.3],
        "E12000006": [-1.5, 50.8],
        "E12000007": [-2.5, 50.5],
        "E12000008": [-3.5, 52.1],
        "E12000009": [-0.5, 51.3],
        "W92000004": [-3.0, 52.3],
        "S92000003": [-4.2, 56.0]  
    };
    //console.log(regionCoordinates);


    //create migration flow data by going through regions
    let migrationFlows = [];
    for (let i = 0; i < regionCodes.length; i++) {
        for (let j = 0; j < regionCodes.length; j++) {
            if (i !== j && matrix[i][j] > 5000) {
                migrationFlows.push({
                    source: regionCodes[i],
                    target: regionCodes[j],
                    value: matrix[i][j]
                });
            }
        }
    }

    //set curved flow paths
    const curve = d3.line()
        .curve(d3.curveBundle.beta(0.85)) //smooth curves
        .x(d => d[0])
        .y(d => d[1]);

    //group flows by destination
    let groupedFlows = d3.group(migrationFlows, d => d.target);
    //console.log(groupedFlows);

    //draw flow lines
    flowg.selectAll(".flow-line")
        .data(migrationFlows)
        .enter().append("path")
        .attr("d", d => {
            const start = projection(regionCoordinates[d.source]);
            const end = projection(regionCoordinates[d.target]);
            if (!start || !end) return null;
            const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 - 50];

            return curve([start, mid, end]); //draw curve
        })
        .attr("stroke", "green")
        .attr("stroke-width", d => Math.sqrt(d.value) / 200) //scale thickness
        .attr("fill", "none")
        .attr("opacity", 0.7);
});