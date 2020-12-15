var ingredients = [];
var cuisines = [];
var connections = [];
let mealtimes = [];
let cooktimes = [];
let names = [];

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

    g.append("circle")
        .attr("class", "remove")
        .attr("onclick", function (d) {
            return "removeIngredient(\"" + group_names[d.index] + "\")"
        })
        .attr("transform", function (d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (400 + 25) + ")";
        })
        .attr("cx", 5)
        .attr("cy", 5)
        .attr("r", 5)
        .attr("fill", "red")

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
        let intersection = intersect(_ingredients, ingredients[i]);
        if (intersection.length === _ingredients.length) {
            for (let cuisine of cuisines[i]) {
                if (cuisine) {
                    cuisine_count[cuisine] = cuisine_count[cuisine] ? cuisine_count[cuisine] + 1 / ingredients[i].length : 1 / ingredients[i].length;
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

function get_mealtimes(_ingredients) {
    let mealtimes_count = {};
    for (let i = 0; i < mealtimes.length; i++) {
        let intersection = intersect(_ingredients, ingredients[i]);
        if (intersection.length === _ingredients.length) {
            for (let mealtime of mealtimes[i]) {
                if (mealtime === "dinner-party") {
                    mealtime = "dinner";
                }
                if (mealtime) {
                    mealtimes_count[mealtime] = mealtimes_count[mealtime] ? mealtimes_count[mealtime] + 1 : 1;
                }
            }
        }
    }
    return mealtimes_count;
}

function get_mealtimes_relative(_ingredients) {
    let limited = get_mealtimes(_ingredients);
    let all = get_mealtimes([]);
    let relative = {}
    for (let mealtime in limited) {
        relative[mealtime] = limited[mealtime] / all[mealtime] * 100;
    }
    return relative;
}


function get_time_to_cook(_ingredients) {
    let cooktimes_count = {};
    for (let i = 0; i < cooktimes.length; i++) {
        let intersection = intersect(_ingredients, ingredients[i]);
        if (intersection.length === _ingredients.length) {
            for (let cooktime of cooktimes[i]) {
                if (cooktime) {
                    cooktimes_count[cooktime] = cooktimes_count[cooktime] ? cooktimes_count[cooktime] + 1 : 1;
                }
            }
        }
    }
    return cooktimes_count;
}

function get_time_to_cook_relative(_ingredients) {
    let limited = get_time_to_cook(_ingredients);
    let relative = {}
    let sum = 0;
    for (let cooktime in limited) {
        sum += limited[cooktime];
    }
    for (let cooktime in limited) {
        relative[cooktime] = limited[cooktime] / sum * 100;
    }
    return relative;
}

function get_random_from_array(arr, n) {
    let result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function get_random_recipes(_ingredients, n) {
    let valid_recipes = {}
    for (let i = 0; i < names.length; i++) {
        let intersection = intersect(_ingredients, ingredients[i]);
        if (intersection.length === _ingredients.length) {
            valid_recipes[names[i]] = 2 / ingredients[i].length;
        }
    }
    return get_random_from_array(Object.keys(valid_recipes), n);
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

function add_links(valid_recipes) {
    d3.select('#randomrecipes').selectAll('a').remove();
    d3.select('#randomrecipes').selectAll('br').remove();
    let links = []
    for (let recipe of valid_recipes) {
        links.push("https://www.food.com/recipe/" + recipe)
    }
    for (let i = 0; i < links.length; i++) {
        d3.select('#randomrecipes').append('a').attr('href', links[i]).html(valid_recipes[i]);
        d3.select('#randomrecipes').append('br');
    }
}

var top_items;
var top_ids;
var unique_ingredients;

function add_ingredient_from_form() {
    let text = document.getElementById("ingredientinput").value.toLowerCase();
    if (unique_ingredients.indexOf(text) != -1) {
        if (top_items.filter(item => item[0] == text).length == 0) {
            addIngredient(text);
        }
        else {
            alert("Ingredient is already present")
        }
    }
    else {
        alert("Invalid ingredient");
    }
}

function removeIngredient(ingredient) {
    top_items = top_items.filter((x) => x[0] != ingredient);
    top_ids = get_ids(top_items);
    connections = generate_connection_matrix(top_ids, ingredients);
    refreshGraph()
}

function addIngredient(ingredient) {
    top_items.push([ingredient, 0]);
    top_ids = get_ids(top_items);
    connections = generate_connection_matrix(top_ids, ingredients);
    refreshGraph()
}

function main() {
    d3.csv("./data/recipes_parsed.csv",
        function (data) {
            ingredients.push(string_to_array(data.ingredients));
            cuisines.push(string_to_array(data.cuisine));
            mealtimes.push(string_to_array(data.times));
            cooktimes.push(string_to_array(data["cooking time"]))
            names.push(data.name);
        }).then(function () {
        const top = 7;

        let item_counts = ingr_count_map(ingredients);
        unique_ingredients = Object.keys(item_counts);
        autocomplete(document.getElementById("ingredientinput"), unique_ingredients);

        top_items = limit(item_counts, top, (f, s) => s[1] - f[1]);
        top_ids = get_ids(top_items);
        connections = generate_connection_matrix(top_ids, ingredients);


        createGraph(svg)
    });

    var svg = d3.select("#visualization")
        .append("svg")
        .attr("width", 1000)
        .attr("height", 1000)
        .append("g")
        .attr("transform", "translate(500,500)")
}

function refreshGraph() {
    let graph = d3.select("#visualization").select("svg").select("g")
    graph.selectAll("*").remove();
    createGraph(graph)
}

function createGraph(svg) {
    generate_chord_chart(svg, connections, top_ids)
    d3.select(".link").selectAll("path")
        .on("mouseover", highlightLink(svg, 0))
        .on("mouseout", highlightLink(svg, 1));

    d3.select(".ingredient").selectAll("path")
        .on("mouseover", highlightIngredient(svg, 0))
        .on("mouseout", highlightIngredient(svg, 1));

    d3.selectAll(".titles")
        .on("mouseover", highlightIngredient(svg, 0))
        .on("mouseout", highlightIngredient(svg, 1));

    d3.select(".link").selectAll("path")
        .on("click", selectLink(svg))
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
            // We already have something selected, thus return.
            if (svg.select(".link").selectAll(".clicked").size() > 0) {
                return
            }
            clickedPath.classed(boolClass, true)
            // Selected following ingredients:
            let pick = [top_ids[obj.source.index], top_ids[obj.target.index]];
            console.log(pick)
            add_links(get_random_recipes(pick, 3));

            let cuisines = get_cuisines_relative(pick);
            let top_cuisines = limit(cuisines, 5, (f, s) => s[1] - f[1]);
            console.log(top_cuisines);

            let mealtimes = get_mealtimes_relative(pick);
            let top_mealtimes = limit(mealtimes, 5, (f, s) => s[1] - f[1]);

            let cooktimes = get_time_to_cook_relative(pick);
            let top_cooktimes = limit(cooktimes, 5, (f, s) => s[1] - f[1]);

            show_bar_chart(d3.select('#cuisinechart'), top_cuisines.map(x => x[1]), top_cuisines.map(x => x[0]))
            show_bar_chart(d3.select('#mealtimeschart'), top_mealtimes.map(x => x[1]), top_mealtimes.map(x => x[0]))
            show_pie_chart(d3.select('#cooktimeschart'), top_cooktimes.map(x => x[1]), top_cooktimes.map(x => x[0]))
        }

        var other = svg.select(".link").selectAll("path")
            .filter(path => obj != path)


        other.transition().style("stroke-opacity", opacity).style("fill-opacity", opacity)
    }
}

function selectChart(chart) {
    return function (mouseEvent, obj, onClick) {
        var charElements = chart.selectAll("rect");
        if (charElements.size() == 0) {
            charElements = chart.selectAll("g.arc path")
        }
        const clickedElement = charElements.filter(elem => elem == obj)
        const boolClass = "clicked"
        var opacity = 0.4
        if (clickedElement.classed(boolClass)) {
            clickedElement.classed(boolClass, false)
            opacity = 1;
        } else {
            if (chart.selectAll(".clicked").size() > 0) {
                return
            }
            clickedElement.classed(boolClass, true)
            onClick(clickedElement.attr("value"))
        }
        const other = charElements.filter(elem => elem != obj);


        other.transition().style("stroke-opacity", opacity).style("fill-opacity", opacity)
    };
}

function highlightIngredient(svg, opacityOther) {
    return function (mouseEvent, obj) {
        if (svg.select(".link").selectAll(".clicked").size() > 0) {
            return
        }
        svg.select(".link").selectAll("path")
            .filter(function (path) {
                return path.source.index != obj.index && path.target.index != obj.index;
            })
            .transition()
            .style("stroke-opacity", opacityOther)
            .style("fill-opacity", opacityOther);
    };
}

function highlightLink(svg, opacityOther) {
    return function (mouseEvent, obj) {
        if (svg.select(".link").selectAll(".clicked").size() > 0) {
            return
        }
        svg.select(".link").selectAll("path")
            .filter(function (path) {
                return obj != path;
            })
            .transition()
            .style("stroke-opacity", opacityOther)
            .style("fill-opacity", opacityOther);
    };
};
