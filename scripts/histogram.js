const dataFile = "/data/likelihood_of_moving_by_age.json";

d3.json(dataFile).then(data => {
    const width = 960;
    const height = 500;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 60;

    const svg = d3.select("svg#histogram")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    const barGroup = svg.append("g")
        .style("fill", "steelblue");

    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(g => g.append("text")
                .attr("x", width)
                .attr("y", marginBottom - 4)
                .attr("fill", "currentColor")
                .style("font-weight", "bold")
                .attr("text-anchor", "end")
                .text("Age →"));

    const yAxisGroup = svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(g => g.append("text")
                .attr("x", -marginLeft)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text("↑ Frequency (no. of moves)"));

    function update(year) {
        const bins = d3.bin().value(d => d.age).thresholds(20)(data.count.find(d => d.year === year).ages)
    
        // Declare the x (horizontal position) scale.
        const x = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([marginLeft, width - marginRight]);
    
        // Declare the y (vertical position) scale.
        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d3.sum(d, e => e.value))])
            .range([height - marginBottom, marginTop]);
    
        // Add a rect for each bin.
        barGroup.selectAll(".bin")
            .data(bins)
            .join("rect")
            .classed("bin", true)
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .transition()
            .duration(transitionDuration)
            .attr("y", d => y(d3.sum(d, e => e.value)))
            .attr("height", d => y(0) - y(d3.sum(d, e => e.value)));
    
        // Add the x-axis and label.
        xAxisGroup.transition()
            .duration(transitionDuration)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
    
        // Add the y-axis and label, and remove the domain line.
        yAxisGroup.transition()
            .duration(transitionDuration)
            .call(d3.axisLeft(y).ticks(height / 40))
            
    }

    update(Number(sliderCurrentValue()))
    sliderRegisterCallback(function () {
        update(Number(this.value))
    })
})