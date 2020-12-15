function combine_values_and_labels(values, labels) {
    let map = [];
    for (let i = 0; i < values.length; i++) {
        map.push({"label": labels[i], "value": values[i]})
    }
    return map
}

function show_pie_chart(svg, values, labels) {
    svg.selectAll("*").remove();

    var data = combine_values_and_labels(values, labels);

    var width = svg.attr("width"),
        height = svg.attr("height"),
        radius = Math.min(width, height) / 2

    svg = svg.append("svg")
        .attr("height", height)
        .attr("width", width)

    var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var color = d3.scaleOrdinal(['#4daf4a', '#377eb8', '#ff7f00', '#984ea3', '#e41a1c']);

    // Generate the pie
    var pie = d3.pie()
        .value(function (d) {
            return d.value
        });

    var data_ready = pie(data)

    // Generate the arcs
    var arc = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(radius * 0.8);

    var outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    //Generate groups
    var arcs = g.selectAll("arc")
        .data(data_ready)
        .enter()
        .append("g")
        .attr("class", "arc")

    svg.append('g').attr("class", "labels");
    svg.append('g').attr("class", "lines");

    var text = svg.select(".labels").selectAll("text")
        .data(data_ready);

    text.enter()
        .append("text")
        .text(function (d) {
            return d.data.label;
        }).attr("transform", function (d) {
        let pos = outerArc.centroid(d);
        pos[0] = width / 2 + Math.sign(outerArc.centroid(d)[0]) * radius;
        pos[1] += height / 2;
        return "translate(" + pos + ")";
    })
        .style("text-anchor", function(d) {
            if(outerArc.centroid(d)[0] > 0){
                return "start";
            }
            return "end";
        })
        .style("font-size", 17);

    var polylines = svg.select(".lines").selectAll("polyline")
        .data(data_ready)

    polylines.enter()
        .append("polyline")
        .attr("points", function (d) {
            let pos = outerArc.centroid(d);
            pos[0] = width / 2 + Math.sign(outerArc.centroid(d)[0]) * radius * 0.95;
            pos[1] += height / 2;

            let pos2 = arc.centroid(d)
            pos2[0] += width / 2;
            pos2[1] += height / 2;
            let pos3 = outerArc.centroid(d)
            pos3[0] += width / 2;
            pos3[1] += height / 2;
            return [pos2, pos3, pos]
        })
        .attr("fill", "none")
        .attr("stroke", "black");

    //Draw arc paths
    arcs.append("path")
        .attr("fill", function (d, i) {
            return color(i);
        })
        .attr("d", arc)
        .attr("value", function (d) {
            return d.data.label });

    svg.selectAll("g.arc").on("click", selectChart(svg, function(value) {
        // Use clicked value.

    }))
}