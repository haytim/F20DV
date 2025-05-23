const migrationMatricesFile = "/data/internal_migration_matrices.json";

/**
 * trigger the start of highlighting a region on the chord diagram
 * @param {string} regionCode ONS region code
 */
function chordDiagramHighlightStart(regionCode) {
    document.querySelector(`#chord-group-${regionCode}`)?.dispatchEvent(new Event("mouseover"))
}

/**
 * trigger the end of highlighting a region on the chord diagram
 * @param {string} regionCode ONS region code
 */
function chordDiagramHighlightEnd(regionCode) {
    document.querySelector(`#chord-group-${regionCode}`)?.dispatchEvent(new Event("mouseout"))
}

// get data and set-up plot
d3.json(migrationMatricesFile).then(data => {
    const selector = "#chord";
    // configure size
    const width = 700; const height = width;

    // get regions. regions are all the same order for each year
    const {regions} = data[0];

    // calculate radii for diagram
    const outerRadius = Math.min(width, height) * 0.5 - 80;
    const innerRadius = outerRadius - 20;

    /**
     * get colour for a region based on its index
     * @param {number} index 
     * @returns hex colour
     */
    const colorScale = index => regionScaleByCode(regions[index]);
    /**
     * get name for a region based on its index
     * @param {number} index 
     * @returns 
     */
    const indexToName = index => regionCodeToName(regions[index]);

    // chordTranspose is used for outflow rather than inflow
    const chord = d3.chordTranspose()
        .padAngle(10 / innerRadius)
        .sortSubgroups(d3.descending);

    // arc shape generator
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // ribbon shape generator
    const ribbon = d3.ribbon()
        .radius(innerRadius);

    // set-up svg element
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .style("font-size", "10px");

    // groups for nice svg structure
    const group = svg.append("g");
    const ribbonGroup = svg.append("g");
    // contain blending to this group
    ribbonGroup.style("isolation", "isolate");

    drawChordDiagram(+sliderCurrentValue());

    function drawChordDiagram(year) {
        const {matrix} = data.find(d => d.year === year);

        const sum = d3.sum(matrix.flat());
        const tickStep = d3.tickStep(0, sum, 150);
        const majorTickStep = d3.tickStep(0, sum, 40);
        const formatValue = d3.formatPrefix(",.0", tickStep);

        const chords = chord(matrix);

        const arcs = group.selectAll(".chord-groups")
            .data(chords.groups)
            .join(
                enter => {
                    const path = enter.append("path");
                    path.append("title");
                    path.attr("id", d => `chord-group-${regions[d.index]}`)
                    return path;
                }
            )
            .classed("chord-groups", true)
            .style("fill", d => colorScale(d.index))
            .style("stroke", "white")
            .on("mouseover", (event, group) => {
                if (event.isTrusted) flowMapHighlightStart(regions[group.index]);
                fade(0.1, group)
            })
            .on("mouseout", (event, group) => {
                if (event.isTrusted) flowMapHighlightEnd(regions[group.index]);
                fade(1, group)
            })
            .transition()
            .duration(transitionDuration)
            .attr("d", arc);

        /**
         * calculate the total inflow for a region group
         * @param {*} group group generated by a d3 chord generator
         * @returns {number}
         */
        const countIn = group => {
            let a = d3.sum(chords.filter(d => d.source.index == group.index), d => d.target.value);
            let b = d3.sum(chords.filter(d => d.target.index == group.index), d => d.source.value);
            return a + b;
        };

        // toLocaleString method is used to ensure appropriate number format is displayed
        arcs.select("title")
            .text(d => `${indexToName(d.index)}\n${countIn(d).toLocaleString()} in\n${d.value.toLocaleString()} out`)

        // add a group of ticks for each region
        const tickGroups = group
            .selectAll(".tick-group")
            .data(chords.groups)
            .join("g")
            .classed("tick-group", true);

        // when a tick is updated simply remove the current text element
        // this makes it simpler to update the text
        const ticks = tickGroups.selectAll(".tick")
            .data(d => groupTicks(d, tickStep))
            .join(
                enter => {
                    const g = enter.append("g");
                    g.append("line")
                        .attr("stroke", "black")
                        .attr("x2", 6);
                    return g;
                },
                update => {
                    update.selectAll("text").remove();
                    return update;
                }
            )
            .classed("tick", true)
            
        ticks.transition()
            .duration(transitionDuration)
            .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);            
        
        // only show value on major ticks
        ticks.filter(d => d.value % majorTickStep === 0)
            .append("text")
            .attr("x", 8)
            .attr("dy", "0.3em")
            .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => formatValue(d.value));

        // replace the 0 tick with the region name
        tickGroups.select("text")
            .attr("font-weight", "bold")
            .text(d => indexToName(d.index));

        // draw ribbons/chords
        ribbonGroup.selectAll("path").data(chords)
            .join(
                enter => {
                    const path = enter.append("path");
                    path.append("title");
                    return path;
                }
            )
            .classed("ribbon", true)
            .style("mix-blend-mode", "multiply")
            .style("stroke", "white")
            .attr("fill", d => colorScale(d.target.index))
            .transition()
            .duration(transitionDuration)
            .attr("d", ribbon);
        
        // give each ribbon an annotation with the flow in each direction
        ribbonGroup.selectAll("title")
            .text(d => `${d.source.value.toLocaleString(navigator.language)} ${indexToName(d.source.index)} → ${indexToName(d.target.index)}${d.source.index !== d.target.index ? `\n${d.target.value.toLocaleString(navigator.language)} ${indexToName(d.target.index)} → ${indexToName(d.source.index)}` : ``}`);
    }

    /**
     * generate tick spacing for chord diagram groups
     * @param {*} d group generated by a d3 chord generator
     * @param {number} step step size
     */
    function groupTicks(d, step) {
        const k = (d.endAngle - d.startAngle) / d.value;
        return d3.range(0, d.value, step).map(value => {
            return {value: value, angle: value * k + d.startAngle}
        })
    }

    /**
     * fade into the opacity for every ribbon NOT in the group
     * @param {number} opacity 
     * @param {*} group group generated by a d3 chord generator
     */
    function fade(opacity, group) {
        svg.selectAll(".ribbon")
            .filter(d => d.source.index != group.index && d.target.index != group.index)
            .transition()
            .duration(transitionDuration)
            .style("opacity", opacity);
    }

    // register global slider callback
    sliderRegisterCallback(function() {
        drawChordDiagram(Number(this.value));
    });
})
