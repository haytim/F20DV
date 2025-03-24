//giving the graph margins
const margins = {
    top: 10,
    right: 20,
    bottom:  0,
    left: 80
};

const bubbleWidth = 800 - margins.left - margins.right; //get the width of graph
const bubbleHeight = 800 - margins.top - margins.bottom; //get height of graph

const bubbleSvg = d3.select("#bubbleChart")
    .append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
    .append("g")
    .attr("transform","translate(" + margins.left + "," + margins.top + ")");

d3.csv("data/housePriceIncome.csv").then(function(data) {
    function updateBubbleChart(year)
    {

        console.log(year);
        //remove old chart
        bubbleSvg.selectAll("*").remove(); //this may be causing bug

        const fData = data.filter(d => d.year === year);

        fData.sort((a, b) => b.population - a.population); //sort population in ascending order

        //convert to numerical values from the csv
        fData.forEach(d => {
            d.avg_income = +d.avg_income;
            d.avg_housePrice = +d.avg_housePrice;
            d.population = +d.population;
            //d.year = +d.year; //get year from function
        });

        //x axis
        const x = d3.scaleLinear().domain([0,d3.max(fData, d=>d.avg_income) * 1.5]).range([0, bubbleWidth]);
        bubbleSvg.append("g").attr("transform","translate(0,"+bubbleHeight+")").call(d3.axisBottom(x));

        //y axis
        const y = d3.scaleLinear().domain([0, d3.max(fData, d=>d.avg_housePrice) * 1.7]).range([bubbleHeight, 0]);
        bubbleSvg.append("g").call(d3.axisLeft(y));

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
        const bubbleColours = d3.scaleOrdinal()
            .domain(["England", "Scotland","Wales"])
            .range(d3.schemeSet2)

        //bubble scale, z axis, making the bubbles the size of the population for each country/region
        const z = d3.scaleLinear()
            .domain([d3.min(fData, d=>d.population), d3.max(fData, d=>d.population)])
            .range([15, 60]); //maybe modify bubble size

        

        //tool tip div, hidden on load
        const ttip = d3.select('#bubbleChart')
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "black")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("color", "white")
            .style("position","absolute");

        //functions for tool tip
        const showttip = function(event, d)
        {
            //console.log(d) TESTING to see what country appears
            ttip.transition().duration(200)
            ttip
                .style("opacity",1)
                .html("Country/Region: " + d.countryRegionName)
                .style("left", (event.pageX+10) + "px")
                .style("top", (event.pageY-10) + "px");

            //make bubble lighter
            d3.select(this)
                .style("fill", d=>d3.color(bubbleColours(d.country)).brighter(1));
        }
        const movettip = function(event, d)
        {
            ttip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY-10) + "px");
        }
        const hidettip = function(event, d)
        {
            ttip.transition().duration(200).style("opacity",0);

            d3.select(this)
                .style("fill", d => bubbleColours(d.country)); //reverse colour when not hovered
        }

        //adding a legend at the bottom for different country colours
        const bubbleLegend = bubbleSvg.append("g")
            .attr("transform", "translate(0," + (bubbleHeight + 65)+")")
            .attr("class", "legend");

        const bubbleLegendCountries = bubbleLegend.selectAll("#legend")
            .data(bubbleColours.domain())
            .enter()
            .append("g")
            .attr("class","legend-country")
            .attr("transform", (d, i) => "translate (" + (i * 200) + ", 0)");

        bubbleLegendCountries.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => bubbleColours(d))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        bubbleLegendCountries.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .style("font-size", "12px")
            .text(d => d);

        bubbleSvg.append('g')
            .selectAll("circle")
            .data(fData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.avg_income)) //x axis is average income
            .attr("cy", d => y(d.avg_housePrice)) //y axis is average house price
            .attr("r", d => z(d.population)) //bubble size is population
            .style("fill", d => bubbleColours(d.country)) //add different colours for the different countries
            .style("opacity", 0.7)
            .attr("stroke", "black")
            .on("mouseover", showttip)
            .on("mousemove", movettip)
            .on("mouseleave", hidettip);
            
    }
    //init chart
    updateBubbleChart(sliderCurrentValue());

    sliderRegisterCallback(function()
    {
        updateBubbleChart(this.value);
    });
});