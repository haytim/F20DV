//set up SVG dimensions
const width = 800, height = 1170;

//create SVG element
const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

//define projection
const projection = d3.geoMercator()
    .center([-2, 54])  //center over the UK
    .scale(2500)       //adjust scale
    .translate([width / 2, height / 2]);

//define path generator
const path = d3.geoPath().projection(projection);

//load data and map
Promise.all([
    d3.json("https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/administrative/gb/lad.json"),
    d3.json("./data/internalUKmigrationTimeseries.json")
]).then(([geoData, data]) => {
    //convert data to an easy lookup format
    const dataMap = {};
    data.forEach(d => {
        //convert each value to a number + handling commas
        const convertedData = { ...d };  //copy the data to preserve original

        //iterate over the years
        Object.keys(d).forEach(key => {
            if (key !== "Area Code" && key !== "Region" && key !== "Area Name") {
                convertedData[key] = parseFloat(d[key].replace(/,/g, '')); //remove commas and convert to number
            }
        });

        dataMap[d["Area Code"]] = convertedData;
    });

    console.log(dataMap);
    console.log(geoData);

    //determine the range dynamically from data
    const allValues = data.flatMap(d => Object.values(d).slice(3).map(Number)); //extract all numeric values
    //set min and max values based on quantiles
    const minValue = d3.quantile(allValues, 0.01); 
    const maxValue = d3.quantile(allValues, 0.99); 

    //define color scale (red for negative, green for positive)
    const colorScale = d3.scaleLinear()
        .domain([minValue, 0, maxValue]) 
        .range(["red", "white", "green"]);

    //function to update map based on selected year
    function updateMap(year) {
        svg.selectAll(".region")
            .data(geoData.features)
            .join("path")
            .attr("class", "region")
            .attr("d", path)
            .style("stroke", "#333")
            .style("stroke-width", "0.5px")
            .style("fill", d => {
                const areaCode = d.properties.LAD13CD;
                if (areaCode == "E07000169") {
                    console.log("here")
                }

                const value = dataMap[areaCode] ? +dataMap[areaCode][year] || 0 : 0;
                return colorScale(value);
            });
    }

    //initial map rendering
    updateMap("2012");

    //add event listener for slider
    const slider = d3.select("#yearSlider");
    const yearLabel = d3.select("#yearLabel");

    slider.on("input", function () {
        const selectedYear = this.value;
        yearLabel.text(this.value);
        updateMap(selectedYear);
    });
});