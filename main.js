var ingredients = []
var connections = [];

function generate_chord_chart(svg, connections, group_names)
{
    var res = d3.chord()
        .padAngle(0.05)     // padding between entities (black arc)
        .sortSubgroups(d3.descending)
        (connections)

    // add the groups on the inner part of the circle
    svg
        .datum(res)
        .append("g")
        .selectAll("g")
        .data(function (d) {
            return d.groups;
        })
        .enter()
        .append("g")
        .append("path")
        .style("fill", "grey")
        .style("stroke", "black")
        .attr("d", d3.arc()
            .innerRadius(400)
            .outerRadius(420)
        )

    // Add the links between groups
    svg
        .datum(res)
        .append("g")
        .selectAll("path")
        .data(function (d) {
            return d;
        })
        .enter()
        .append("path")
        .attr("d", d3.ribbon()
            .radius(400)
        )
        .style("fill", "#69b3a2")
        .style("stroke", "black");


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
        .attr("dy", ".35em")
        .attr("class", "titles")
        .attr("text-anchor", function (d) {
            return d.angle > Math.PI ? "end" : null;
        })
        .attr("transform", function (d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (400 + 55) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .attr('opacity', 1)
        .text(function (d, i) {
            return group_names[i];
        });
}

function matrix(m, n) {
    let result = [];
    for (let i = 0; i < n; i++) {
        result.push(new Array(m).fill(0));
    }
    return result;
}

function id_to_ingr_names(json_map, ids) {
    let names = [];
    for (let id of ids) {
        names.push(json_map[id]);
    }
    return names;
}

function ingr_count_map(ingredients_lists) {
    let map = {};
    for (let ingredients of ingredients_lists) {
        for (let ingredient of ingredients) {
            map[ingredient] = map[ingredient] ? map[ingredient] + 1 : 1;
        }
    }
    return map;
}

function limit(items, top, comparator) {
    return Object
        .keys(items)
        .map(key => [key, items[key]])
        .sort(comparator)
        .slice(0, top);
}

function get_ids(items) {
    return items.map(x => parseInt(x[0]))
}

function intersect(a, b) {
    return a.filter(value => b.includes(value))
}

function generate_pairs(a, b, map = x => x) {
    let pair = []
    for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < b.length; j++) {
            pair.push([map(a[i]), map(b[j])])
        }
    }
    return pair
}

function generate_connection_matrix(ids, ingredients) {
    let connections = matrix(ids.length, ids.length);
    for (let recipe of ingredients) {
        let intersection = intersect(recipe, ids);
        if (intersection.length > 0) {
            for (let pair of generate_pairs(intersection, intersection, x => ids.indexOf(x))) {
                connections[pair[0]][pair[1]] += 1
            }
        }
    }
    return connections
}

function main() {
    d3.csv("./data/PP_recipes.csv",
        function (data) {
            ingredients.push(JSON.parse(data.ingredient_ids))
        }).then(function () {
        fetch("./data/ingr_map.json")
            .then(response => response.json())
            .then(json => {
                const top = 7;

                let item_counts = ingr_count_map(ingredients);
                let top_items = limit(item_counts, top, (f, s) => s[1] - f[1]);
                let top_ids = get_ids(top_items);
                let top_names = id_to_ingr_names(json, top_ids);

                connections = generate_connection_matrix(top_ids, ingredients);

                generate_chord_chart(svg, connections, top_names)
            })
    });

    var svg = d3.select("#visualization")
        .append("svg")
        .attr("width", 1000)
        .attr("height", 1000)
        .append("g")
        .attr("transform", "translate(500,500)")

    show_bar_chart(d3.select('#cuisinechart'), [75, 25],  ['EU', 'US'])
}