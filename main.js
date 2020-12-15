var ingredients = [];
var cuisines = [];
var connections = [];

function generate_chord_chart(svg, connections, group_names) {
    var res = d3.chord()
        .padAngle(0.05)     // padding between entities (black arc)
        .sortSubgroups(d3.descending)
        (connections)

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
        .attr("class", "link")
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
    return items.map(x => x[0])
}

function intersect(a, b) {
    return a.filter(value => b.includes(value))
}

function generate_pairs(a, b, map = x => x) {
    let pair = []
    for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < b.length; j++) {
            if (map(a[i]) !== map(b[j])) {
                pair.push([map(a[i]), map(b[j])])
            }
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

function get_cuisines(_ingredients) {
    let cuisine_count = {};
    for (let i = 0; i < cuisines.length; i++) {
        let intersection = intersect(ingredients[i], _ingredients);
        if (intersection.length === _ingredients.length) {
            for (let cuisine of cuisines[i]) {
                if (cuisine) {
                    cuisine_count[cuisine] = cuisine_count[cuisine] ? cuisine_count[cuisine] + 1 : 1;
                }
            }
        }
    }
    return cuisine_count;
}

function get_cuisines_relative(_ingredients) {
    let limited = get_cuisines(_ingredients);
    let all = get_cuisines([]);
    let relative = {}
    for (let cuisine in limited) {
        relative[cuisine] = limited[cuisine] / all[cuisine] * 100;
    }
    return relative;
}

function string_to_array(string) {
    let array = string;
    array = array.substring(1, array.length - 1);
    array = array.split(', ');
    for (let i = 0; i < array.length; i++) {
        array[i] = array[i].substring(1, array[i].length - 1)
    }
    return array
}

function main() {
    d3.csv("./data/recipes_parsed.csv",
        function (data) {
            ingredients.push(string_to_array(data.ingredients));
            cuisines.push(string_to_array(data.cuisine));
        }).then(function () {
        console.log(get_cuisines_relative(['olive oil']));
        const top = 7;

        let item_counts = ingr_count_map(ingredients);
        let top_items = limit(item_counts, top, (f, s) => s[1] - f[1]);
        let top_ids = get_ids(top_items);

        connections = generate_connection_matrix(top_ids, ingredients);

        generate_chord_chart(svg, connections, top_ids)
        d3.select(".link").selectAll("path")
            .on("mouseover", highlightLink(svg, 0))
            .on("mouseout", highlightLink(svg, 1));

        d3.select(".ingredient").selectAll("path")
            .on("mouseover", highlightIngredient(svg, 0))
            .on("mouseout", highlightIngredient(svg, 1));

        d3.select(".link").selectAll("path")
            .on("click", selectLink(svg))
    });

    var svg = d3.select("#visualization")
        .append("svg")
        .attr("width", 1000)
        .attr("height", 1000)
        .append("g")
        .attr("transform", "translate(500,500)")

    show_bar_chart(d3.select('#cuisinechart'), [75, 25],  ['EU', 'US'])
}

function selectLink(svg) {
    return function (mouseEvent, obj) {
        var clickedPath = svg.select(".link").selectAll("path")
            .filter(path => obj == path)
        const boolClass = "clicked"
        var opacity = 0;
        if (clickedPath.classed(boolClass)) {
            clickedPath.classed(boolClass, false)
            opacity = 1;
        } else {
            clickedPath.classed(boolClass, true)
        }

        var other = svg.select(".link").selectAll("path")
            .filter(path => obj != path)


        other.transition().style("stroke-opacity", opacity).style("fill-opacity", opacity)
    }
}

function highlightIngredient(svg, opacityOther) {
    return function(mouseEvent, obj) {
        if (svg.select(".link").selectAll(".clicked").size() > 0) {
            return
        }
        svg.select(".link").selectAll("path")
            .filter(function(path) {
                return path.source.index != obj.index && path.target.index != obj.index;
            })
            .transition()
            .style("stroke-opacity", opacityOther)
            .style("fill-opacity", opacityOther);
    };
}
function highlightLink(svg, opacityOther) {
    return function(mouseEvent, obj) {
        if (svg.select(".link").selectAll(".clicked").size() > 0) {
            return
        }
        svg.select(".link").selectAll("path")
            .filter(function(path) {
                return obj != path;
            })
            .transition()
            .style("stroke-opacity", opacityOther)
            .style("fill-opacity", opacityOther);
    };
};