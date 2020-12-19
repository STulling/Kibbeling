function combine_values_and_labels(values, labels) {
    let map = [];
    for (let i = 0; i < values.length; i++) {
        map.push({"label": labels[i], "value": values[i]});
    }
    return map
}

function max_label_width(labels){
    let res = [];
    for(let label of labels){
        res.push(get_text_width(label, 'regular 17pt arial'));
    }
    return Math.max(...res);
}

function get_text_width(text, font) {
    let canvas = get_text_width.canvas || (get_text_width.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);
    return metrics.width;
}

function calculate_radius(width, height, labels) {
    return Math.min(0.75*(width-2*max_label_width(labels)), height) / 2;
}


function show_pie_chart(element, values, labels, onClick) {
    clear_element(element);

    let data = combine_values_and_labels(values, labels);

    let width = parseInt(element.attr("width"));
    let height = parseInt(element.attr("height"));
    let radius = calculate_radius(width, height, labels);

    let svg = element.append("svg")
        .attr("height", height)
        .attr("width", width)

    let g = svg.append("g").attr("transform", translate(width/2, height/2));

    let color = d3.scaleOrdinal(colors);

    // Generate the pie
    let pie = d3.pie()
        .value(function (d) {
            return d.value
        });

    let data_ready = pie(data)

    // Generate the arcs
    let arc = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(radius * 0.8);

    let outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    //Generate groups
    let arcs = g.selectAll("arc")
        .data(data_ready)
        .enter()
        .append("g")
        .attr("class", "arc")

    svg.append('g').attr("class", "labels");
    svg.append('g').attr("class", "lines");

    let text = svg.select(".labels").selectAll("text")
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

    let polylines = svg.select(".lines").selectAll("polyline")
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
            return color(labels.indexOf(d.data.label));
        })
        .attr("d", arc)
        .attr("value", function (d) {
            return d.data.label })
        .style("cursor", "pointer");

    svg.selectAll("g.arc").on("click", selectChart(svg, onClick));
}