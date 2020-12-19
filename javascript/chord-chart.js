let default_opacity = 0.7;
let bg_opacity = 0.05;

function generate_chord_chart(svg, connections, group_names) {
    function getGradID(d) {
        return "linkGrad-" + d.source.index + "-" + d.target.index;
    }

    var width = svg.select(function() { return this.parentNode; }).attr("width");
    var height = svg.select(function() { return this.parentNode; }).attr("height");

    var res = d3.chord()
        .padAngle(0.05)     // padding between entities (black arc)
        .sortSubgroups(d3.descending)
        (connections)

    var outerRadius = Math.min(width, height) * 0.5 - 55
    var innerRadius = outerRadius * 0.95

    var grads = svg.append("defs")
        .selectAll("linearGradient")
        .data(res)
        .enter()
        .append("linearGradient")
        .attr("id", getGradID)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", function (d) {
            return innerRadius * Math.cos((d.source.endAngle - d.source.startAngle) / 2 + d.source.startAngle - Math.PI / 2);
        })
        .attr("y1", function (d) {
            return innerRadius * Math.sin((d.source.endAngle - d.source.startAngle) / 2 + d.source.startAngle - Math.PI / 2);
        })
        .attr("x2", function (d) {
            return innerRadius * Math.cos((d.target.endAngle - d.target.startAngle) / 2 + d.target.startAngle - Math.PI / 2);
        })
        .attr("y2", function (d) {
            return innerRadius * Math.sin((d.target.endAngle - d.target.startAngle) / 2 + d.target.startAngle - Math.PI / 2);
        })

    // set the starting color (at 0%)

    grads.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function (d) {
            return colors[d.source.index]
        })

    //set the ending color (at 100%)
    grads.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", function (d) {
            return colors[d.target.index]
        })


    // add the groups on the inner part of the circle
    svg
        .datum(res)
        .append("g")
        .attr("class", "ingredient")
        .selectAll("g")
        .data(function (d) {
            return d.groups;
        })
        .enter()
        .append("g")
        .append("path")
        .style("fill", function (d, i) {
            return colors[i]
        })
        .style("stroke", "none")
        .attr("d", d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
        )

    // Add the links between groups
    svg
        .datum(res)
        .append("g")
        .attr("class", "link")
        .selectAll("path")
        .data(function (d) {
            return d;
        })
        .enter()
        .append("path")
        .attr("d", d3.ribbon()
            .radius(innerRadius)
        )
        .style("fill", function (d) {
            return "url(#" + getGradID(d) + ")";
        })
        .style("stroke", "none")
        .style("cursor", "pointer")
        .style("opacity", default_opacity);


    var g = svg.selectAll("g.group")
        .data(res.groups)
        .enter().append("svg:g")
        .attr("class", function (d) {
            return "group " + group_names[d.index];
        });

    g.append("svg:text")
        .each(function (d) {
            d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr("class", "titles")
        .attr("dy", function (d) {
            return d.angle > Math.PI ? "0em" : "0.6em";
        })
        .attr("text-anchor", function (d) {
            return d.angle > Math.PI ? "end" : null;
        })
        .attr("transform", function (d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (innerRadius + 55) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .attr('opacity', 1)
        .text(function (d, i) {
            return group_names[i];
        });

    g.append("circle")
        .attr("class", "remove")
        .attr("onclick", function (d) {
            return "removeIngredient(\"" + group_names[d.index] + "\")"
        })
        .attr("transform", function (d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (innerRadius + 35) + ")";
        })
        .attr("cx", 5)
        .attr("cy", 5)
        .attr("r", 5)
        .attr("fill", "red")
        .style("cursor", "pointer");
}
