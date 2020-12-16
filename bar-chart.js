function show_bar_chart(svg, values, labels, onClick) {
    svg.selectAll("*").remove();

    height = svg.attr("height")
    width = svg.attr("width")

    var leftMargin = 30;
    var bottomMargin = 30;

    svg = svg.append("svg")
            .attr("height", parseInt(height) + 2 * bottomMargin)
            .attr("width", parseInt(width) + 2 * leftMargin)
        .append("g")
            .attr("transform",
              "translate(" + leftMargin + "," + 0 + ")");

    var x = d3.scaleBand()
      .range([ 0, width - leftMargin ])
      .domain(labels)
      .padding(0.2);

    svg.append("g")
      .attr("transform", "translate(0," + (height - bottomMargin) + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("text-anchor", "middle");

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, Math.max(...values)])
      .range([ height - bottomMargin, 0]);
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
        .attr("height", function(d) { return height - y(d.Value) - bottomMargin; })
        .attr("fill", "#268d6c")
        .attr("value", function (d) {
            return d.Key
        }).style("cursor", "pointer")

    svg.selectAll("rect").on("click", selectChart(svg, onClick));
}