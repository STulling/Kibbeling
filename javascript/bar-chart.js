function show_bar_chart(svg, values, labels, title, onClick) {
    clear_element(svg);

    let height = parseInt(svg.attr("height"));
    let width = parseInt(svg.attr("width"));
    let padding = parseInt(svg.attr("padding"));

    let base = svg.append("svg")
        .attr("height", height + 2 * padding)
        .attr("width", width)

    svg = base
        .append("g")
            .attr("transform",
              "translate(" + padding + "," + 0 + ")");

    var x = d3.scaleBand()
      .range([ 0, width - padding ])
      .domain(labels)
      .padding(0.2);

    svg.append("g")
      .attr("transform", translate(0, height-padding))
      .call(d3.axisBottom(x))
      .selectAll("text")
		.attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, Math.max(...values)])
      .range([ height - padding, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    let data = labels.map(function (x, i) {
        return {Key: x, Value:values[i]}
    });

    // Bars
    svg.selectAll("mybar")
      .data(data)
      .enter()
      .append("rect")
        .attr("x", function(d) { return x(d.Key); })
        .attr("y", function(d) { return y(d.Value); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.Value) - padding; })
        .attr("fill", "#268d6c")
        .attr("value", function (d) {
            return d.Key
        }).style("cursor", "pointer")

    base.append('g')
        .append("text")
        .attr("class", "y label")
        .attr("text-anchor", "center")
        .attr("y", 0)
        .attr("x", -(height+padding)/2)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)" +
         "translate(" + -padding + ")")
        .text(title)
        .style("font-size", "12px");

    svg.selectAll("rect").on("click", selectChart(svg, onClick));
}