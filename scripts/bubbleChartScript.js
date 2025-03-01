//giving the graph margins
var margins = {
    top: 10,
    right: 20,
    bottom:  30,
    left: 50
};

var bubbleWidth = 800 - margins.left - margins.right; //get the width of graph
var bubbleHeight = 1200 - margins.top - margins.bottom; //get height of graph

var bubbleSvg = d3.select("#bubbleChart")
    .append("svg")
    .attr("width", bubbleWidth + margins.left + margins.right)
    .attr("height", bubbleHeight + margins.top + margins.bottom)
    .append("g")
    .attr("transform", "translate("+margins.left + ","+margins.top + ")");
    
Promise.all([
    d3.csv("data/table1_housingPurchase_housePriceDeciles.csv"),
    d3.csv("data/table2_housingPurchase_incomeDeciles.csv")
]).then(function([housePriceData, incomeData]) { 
    //convert the year columns to actual numbers
    housePriceData.forEach (d => 
    {
        for(let year = 2012; year <= 2022; year++)
        {
            d[year] = +d[year];
        }
    });
    incomeData.forEach (d => 
    {
        for(let year = 2012; year <= 2022; year++)
        {
            d[year] = +d[year];
        }
    });

    let mData = []; //need to merge both datasets by countryRegionName and decile

    housePriceData.forEach(house => 
    {
        let income = incomeData.find
        (
            //match up the country region names and income deciles
            inc => inc.countryRegionName === house.countryRegionName && inc.IncomeDecile === house.HousePriceDecile
        );
        if(income)
        {
            mData.push({ //push this income data to the merged data
                region: house.countryRegionName,
                decile: house.HousePriceDecile,
                housePrice: house[2022],
                income: income[2022]
            });
        }
    });

    //define the scales for the graph
    var x = d3.scaleLinear() //x is the house price
        .domain([0, d3.max(mData, d => d.housePrice)])
        .range([0, bubbleWidth]);

    var y = d3.scaleLinear() //y is the income
        .domain([0, d3.max(mData, d => d.income)])
        .range([bubbleHeight, 0]);

    var z = d3.scaleSqrt() //house price is the bubble size
        .domain([d3.min(mData, d => d.housePrice), d3.max(mData, d => d.housePrice)])
        .range([5, 40]);

    //add x and y axes to the graph
    bubbleSvg.append("g")
        .attr("transform", "translate(0," + bubbleHeight + ")")
        .call(d3.axisBottom(x));

    bubbleSvg.append("g")
        .call(d3.axisLeft(y));

    //add the bubbles
    bubbleSvg.selectAll("circle")
        .data(mData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.housePrice))
        .attr("cy", d => y(d.income))
        .attr("r", d => z(d.housePrice))
        .style("fill", "#69b3a2")
        .style("opacity", 0.7)
        .attr("stroke", "black");

});