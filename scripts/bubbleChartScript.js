//giving the graph margins
var margins = {
    top: 10,
    right: 20,
    bottom:  0,
    left: 80
};

var bubbleWidth = 800 - margins.left - margins.right; //get the width of graph
var bubbleHeight = 800 - margins.top - margins.bottom; //get height of graph

var bubbleSvg = d3.select("#bubbleChart")
    .append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
    .append("g")
    .attr("transform","translate(" + margins.left + "," + margins.top + ")");

d3.csv("data/housePriceIncome_Test.csv").then(function(data) {
    //TESTING- get 2022
    data = data.filter(d => d.year === "2022");

    //convert to numerical values from the csv
    data.forEach(d => {
        d.avg_income = +d.avg_income;
        d.avg_housePrice = +d.avg_housePrice;
    });

    //x axis
    var x = d3.scaleLinear()
        .domain([0,d3.max(data, d=>d.avg_income)])
        .range([0, bubbleWidth])

    bubbleSvg.append("g")
        .attr("transform","translate(0,"+bubbleHeight+")")
        .call(d3.axisBottom(x))

    //y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d=>d.avg_housePrice)])
        .range([bubbleHeight, 0]);

    bubbleSvg.append("g")
        .call(d3.axisLeft(y));

    //x axis label
    bubbleSvg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", bubbleWidth / 2) //place in middle of chart
        .attr("y", bubbleHeight + 40)
        .style("font-size", "14px")
        .text("Average Income (GDP)");

    //y axis label
    bubbleSvg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") //rotated 90 to fit along the y axis
        .attr("x", -bubbleHeight / 2) //place in middle of chart
        .attr("y", -60)
        .style("font-size", "14px")
        .text("Average House Price (GDP)");

    //scale for bubble colour
    var bubbleColours = d3.scaleOrdinal()
        .domain(["England", "Scotland","Northern Ireland","Wales"])
        .range(d3.schemeSet2)

    //bubble scale, z axis, making the bubbles the size of the avg house price for now
    var z = d3.scaleLinear()
        .domain([d3.min(data, d=>d.avg_housePrice), d3.max(data, d=>d.avg_housePrice)])
        .range([15, 70]); //maybe modify bubble size

    //tool tip div, hidden on load
    var ttip = d3.select('#bubbleChart')
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white")
        .style("position","absolute");

    //functions for tool tip
    var showttip = function(event, d)
    {
        //console.log(d) TESTING to see what country appears
        ttip.transition().duration(200)
        ttip
            .style("opacity",1)
            .html("Country/Region: " + d.countryRegionName)
            .style("left", (event.pageX+10) + "px")
            .style("top", (event.pageY-10) + "px");
    }
    var movettip = function(event, d)
    {
        ttip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY-10) + "px");
    }
    var hidettip = function(event, d)
    {
        ttip.transition().duration(200).style("opacity",0);
    }

    bubbleSvg.append('g')
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.avg_income)) //x axis is average income
        .attr("cy", d => y(d.avg_housePrice)) //y axis is average house price
        .attr("r", d => z(d.avg_housePrice)) //bubble size is currently avg house price
        .style("fill", d => bubbleColours(d.country)) //add different colours for the different countries
        .style("opacity", 0.7)
        .attr("stroke", "black")
        .on("mouseover", showttip)
        .on("mousemove", movettip)
        .on("mouseleave", hidettip);
});