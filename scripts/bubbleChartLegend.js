
//legend for the bubble chart

//sizing
const bLegendMargins = {
    top: 80,
    right: 20,
    bottom: 20,
    left: 50
}
const bLegendWidth = 300;
const bLegendHeight = 100;

const bLegendSVG = d3.select("#bubbleChartLegend")
    .append("svg")
    .attr("width", bLegendWidth + bLegendMargins.left + bLegendMargins.right)
    .attr("height", bLegendHeight + bLegendMargins.top + bLegendMargins.bottom)
    .append("g")
    .attr("transform", `translate(${bLegendMargins.left},${bLegendMargins.top})`);

d3.csv("data/housePriceIncome.csv").then(function(data) {
    //get population data
    data.forEach(d => {
        d.population = +d.population;
    });
    const populations = data.map(d => d.population);

    const legendSize = d3.scaleLinear()
        .domain([d3.min(populations), d3.max(populations)])
        .range([5, 50]); //maybe modify bubble size

    const popData = [
        //make each number whole
        Math.round(d3.max(populations) / 1000000) * 1000000,
        Math.round(d3.mean(populations) / 1000000) * 1000000,
        Math.round(d3.min(populations) / 1000000) * 1000000
    ];

    //make the legend graph
    var xC = 20; //230
    var xLabel = 90; //380 //where to move label
    var yC = 50; //330

    //circles
    bLegendSVG.selectAll("legend")
        .data(popData)
        .enter()
        .append("circle")
            .attr("cx", xC)
            .attr("cy", function(d) {return yC - legendSize(d)}) //might be size and not legendSize?
            .attr("r", function(d) {return legendSize(d)})
            .style("fill", "gray")
            .style("opacity", 0.3)
            .attr("stroke", "black")
            .attr("stroke-width", 2)

    //segments
    bLegendSVG.selectAll("legend")
        .data(popData)
        .enter()
        .append("line")
        .attr('x1', function(d){ return xC + legendSize(d) } )
        .attr('x2', xLabel)
        .attr('y1', function(d){ return yC - legendSize(d) } )
        .attr('y2', function(d){ return yC - legendSize(d) } )
        .attr('stroke', 'black')
        .style('stroke-dasharray', ('2,2'))

    //labels
    bLegendSVG.selectAll("legend")
        .data(popData)
        .enter()
        .append("text")
          .attr('x', xLabel)
          .attr('y', function(d){ return yC - legendSize(d) } )
          .text( function(d){ return d + " people" } )
          .style("font-size", 10)
          .attr('alignment-baseline', 'middle')

    console.log(popData.map(d => ({
        cx: xC,
        cy: yC - legendSize(d),
        r: legendSize(d)
    })));
});