var ingredients = [];
var cuisines = [];
var connections = [];
let mealtimes = [];
let cooktimes = [];
let names = [];
let selected_cuisine = undefined;
let selected_mealtime = undefined;
let selected_cooktime = undefined;
let colors = ["#00c0c7", "#5144d3", "#e8871a", "#da3490", "#9089fa", "#47e26f", "#2780eb", "#6f38b1", "#dfbf03", "#cb6f10", "#268d6c", "#9bec54"]

function generate_chord_chart(svg, connections, group_names) {
    function getGradID(d) {
        return "linkGrad-" + d.source.index + "-" + d.target.index;
    }

    var width = 550, height = 550;

    var res = d3.chord()
        .padAngle(0.05)     // padding between entities (black arc)
        .sortSubgroups(d3.descending)
        (connections)

    var outerRadius = Math.min(width, height) * 0.5 - 55
    var innerRadius = outerRadius - 30

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
        .style("fill", function (d) {
            return "url(#" + getGradID(d) + ")";
        })
        .style("stroke", "none")
        .style("opacity", 0.7);


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
        .attr("dy", function(d) {
            return d.angle > Math.PI ? "0em" : "0.5em";
        })
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
                + "translate(" + (400 + 35) + ")";
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
    let keys = Object
        .keys(items)
        .map(key => [key, items[key]])

    if (comparator === undefined)
        return keys;

    return keys
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

function get_count(main, _ingredients, _cooktimes, _mealtimes, _cuisines) {
    let count = {};
    for (let i = 0; i < main.length; i++) {
        let int_ingredients = intersect(_ingredients, ingredients[i]);
        let int_cooktimes = intersect(_cooktimes, cooktimes[i]);
        let int_mealtimes = intersect(_mealtimes, mealtimes[i]);
        let int_cuisines = intersect(_cuisines, cuisines[i]);
        if (int_ingredients.length === _ingredients.length
            && (_cooktimes.length === 0 || int_cooktimes.length > 0)
            && (_mealtimes.length === 0 || int_mealtimes.length > 0)
            && (_cuisines.length === 0 || int_cuisines.length > 0)) {
            for (let entry of main[i]) {
                if (entry) {
                    count[entry] = count[entry] ? count[entry] + 1 : 1;
                }
            }
        }
    }
    return count;
}

function get_cuisines(_ingredients, _cooktimes, _mealtimes, _cuisines) {
    return get_count(cuisines, _ingredients, _cooktimes, _mealtimes, _cuisines);
}

function get_cuisines_relative(_ingredients, _cooktimes = [], _mealtimes = [], _cuisines = []) {
    let limited = get_cuisines(_ingredients, _cooktimes, _mealtimes, _cuisines);
    let all = get_cuisines([], _cooktimes, _mealtimes, _cuisines);
    let relative = {}
    for (let cuisine in limited) {
        relative[cuisine] = limited[cuisine] / all[cuisine] * 100;
    }
    return relative;
}

function get_mealtimes(_ingredients, _cooktimes, _mealtimes, _cuisines) {
    return get_count(mealtimes, _ingredients, _cooktimes, _mealtimes, _cuisines);
}

function get_mealtimes_relative(_ingredients, _cooktimes = [], _mealtimes = [], _cuisines = []) {
    let limited = get_mealtimes(_ingredients, _cooktimes, _mealtimes, _cuisines);
    let all = get_mealtimes([], _cooktimes, _mealtimes, _cuisines);
    let relative = {}
    for (let mealtime in limited) {
        relative[mealtime] = limited[mealtime] / all[mealtime] * 100;
    }
    return relative;
}


function get_time_to_cook(_ingredients, _cooktimes, _mealtimes, _cuisines) {
    return get_count(cooktimes, _ingredients, _cooktimes, _mealtimes, _cuisines);
}

function get_time_to_cook_relative(_ingredients, _cooktimes = [], _mealtimes = [], _cuisines = []) {
    let limited = get_time_to_cook(_ingredients, _cooktimes, _mealtimes, _cuisines);
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
    if (len === 0)
        throw new RangeError("getRandom: more elements taken than available");
    if (n > len)
        n = len
    while (n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function get_valid_recipes(_ingredients) {
    let valid_recipes = {}
    for (let i = 0; i < names.length; i++) {
        let intersection = intersect(_ingredients, ingredients[i]);
        if (intersection.length === _ingredients.length) {
            valid_recipes[names[i]] = 2 / ingredients[i].length;
        }
    }
    return valid_recipes;
}

function filter_recipes_on_cooktime(_time, valid_recipes) {
    return filter_x_on_y(names, cooktimes, _time, valid_recipes);
}

function filter_recipes_on_cuisine(_cuisine, valid_recipes) {
    return filter_x_on_y(names, cuisines, _cuisine, valid_recipes);
}

function filter_recipes_on_mealtime(_mealtime, valid_recipes) {
    return filter_x_on_y(names, mealtimes, _mealtime, valid_recipes);
}

function filter_x_on_y(x, y, selection, recipes) {
    let _recipes = Object.assign({}, recipes);
    for (let i = 0; i < y.length; i++) {
        let intersection = intersect(selection, y[i])
        if (intersection.length === 0 && selection.length > 0) {
            if (x[i] in _recipes) {
                delete _recipes[x[i]];
            }
        }
    }
    return _recipes;
}

function get_random_recipes(recipes, n) {
    return get_random_from_array(Object.keys(recipes), n);
}

function string_to_array(string) {
    let array = string;
    array = array.substring(1, array.length - 1);
    array = array.split(', ');
    for (let i = 0; i < array.length; i++) {
        array[i] = array[i].substring(1, array[i].length - 1)
        array[i] = array[i] === "dinner-party" ? "dinner" : array[i];
    }
    return array
}

function add_links(valid_recipes) {
    d3.select('#randomrecipes').selectAll('*').remove();
    let links = []
    for (let recipe of valid_recipes) {
        links.push("https://www.food.com/recipe/" + recipe)
    }
    for (let i = 0; i < links.length; i++) {
        d3.select('#randomrecipes').append('a').attr('href', links[i]).html(valid_recipes[i]);
        d3.select('#randomrecipes').append('br');
    }
}

function no_links_found() {
    d3.select('#randomrecipes').selectAll('*').remove();
    d3.select('#randomrecipes').append('p').html("NO RECIPES FOUND");
}

var top_items;
var top_ids;
var unique_ingredients;

function add_ingredient_from_form() {
    let text = document.getElementById("ingredientinput").value.toLowerCase();
    if (unique_ingredients.indexOf(text) != -1) {
        if (top_items.filter(item => item[0] == text).length == 0) {
            addIngredient(text);
        } else {
            alert("Ingredient is already present")
        }
    } else {
        alert("Invalid ingredient");
    }
}

function removeIngredient(ingredient) {
    if (top_items.length < 6) {
        alert("A minimum of 5 ingredients must be selected")
    } else {
        top_items = top_items.filter((x) => x[0] != ingredient);
        top_ids = get_ids(top_items);
        connections = generate_connection_matrix(top_ids, ingredients);
        refreshGraph()
    }
}

function addIngredient(ingredient) {
    if (top_items.length > 9) {
        alert("No more than 10 ingredients may be selected")
    } else {
        top_items.push([ingredient, 0]);
        top_ids = get_ids(top_items);
        connections = generate_connection_matrix(top_ids, ingredients);
        refreshGraph()
    }
}

function show_link(link) {
    d3.select("#selected").selectAll('p').remove();
    d3.select("#selected").append('p').html(link);
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
        .on("mouseover", highlightLink(svg, 0.05))
        .on("mouseout", highlightLink(svg, 1));

    d3.select(".ingredient").selectAll("path")
        .on("mouseover", highlightIngredient(svg, 0.05))
        .on("mouseout", highlightIngredient(svg, 1));

    d3.selectAll(".titles")
        .on("mouseover", highlightIngredient(svg, 0.05))
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

            selected_mealtime = undefined;
            selected_cooktime = undefined;
            selected_cuisine = undefined;

            // Selected following ingredients:
            let pick = [top_ids[obj.source.index], top_ids[obj.target.index]];
            show_link("SELECTED: " + pick[0] + " and " + pick[1]);

            update_links(pick);

            let _cuisines = get_cuisines_relative(pick, [], [], []);
            let top_cuisines = limit(_cuisines, 10, (f, s) => s[1] - f[1]);

            let _mealtimes = get_mealtimes_relative(pick, [], [], []);
            let top_mealtimes = limit(_mealtimes, 10, (f, s) => mealtime_to_number(f[0]) - mealtime_to_number(s[0]));

            let _cooktimes = get_time_to_cook_relative(pick, [], [], []);
            let top_cooktimes = limit(_cooktimes, 10, (f, s) => s[0].localeCompare(f[0]));

            show_bar_chart(d3.select('#cuisinechart'), top_cuisines.map(x => x[1]), top_cuisines.map(x => x[0]), cuisine_callback(pick));
            show_bar_chart(d3.select('#mealtimeschart'), top_mealtimes.map(x => x[1]), top_mealtimes.map(x => x[0]), mealtime_callback(pick))
            show_pie_chart(d3.select('#cooktimeschart'), top_cooktimes.map(x => x[1]), top_cooktimes.map(x => x[0]), cooktime_callback(pick))
        }

        var other = svg.select(".link").selectAll("path")
            .filter(path => obj != path)


        other.transition().style("stroke-opacity", opacity).style("fill-opacity", opacity)
    }
}

function update_links(pick) {
    let valid_recipes = get_valid_recipes(pick);
    valid_recipes = filter_recipes_on_cuisine(selected_cuisine ? [selected_cuisine] : [], valid_recipes)
    valid_recipes = filter_recipes_on_cooktime(selected_cooktime ? [selected_cooktime] : [], valid_recipes)
    valid_recipes = filter_recipes_on_mealtime(selected_mealtime ? [selected_mealtime] : [], valid_recipes)

    try {
        add_links(get_random_recipes(valid_recipes, 3));
    } catch (e) {
        no_links_found();
    }
}

function update_charts(pick) {
    if (selected_cuisine === undefined) {
        let _cuisines = get_cuisines_relative(pick,
            selected_cooktime ? [selected_cooktime] : [],
            selected_mealtime ? [selected_mealtime] : [],
            selected_cuisine ? [selected_cuisine] : []);
        let top_cuisines = limit(_cuisines, 10, (f, s) => s[1] - f[1]);
        show_bar_chart(d3.select('#cuisinechart'), top_cuisines.map(x => x[1]), top_cuisines.map(x => x[0]), cuisine_callback(pick));
    }
    if (selected_mealtime === undefined) {
        let _mealtimes = get_mealtimes_relative(pick,
            selected_cooktime ? [selected_cooktime] : [],
            selected_mealtime ? [selected_mealtime] : [],
            selected_cuisine ? [selected_cuisine] : []);
        let top_mealtimes = limit(_mealtimes, 10, (f, s) => mealtime_to_number(f[0]) - mealtime_to_number(s[0]));
        show_bar_chart(d3.select('#mealtimeschart'), top_mealtimes.map(x => x[1]), top_mealtimes.map(x => x[0]), mealtime_callback(pick))
    }
    if (selected_cooktime === undefined) {
        let _cooktimes = get_time_to_cook_relative(pick,
            selected_cooktime ? [selected_cooktime] : [],
            selected_mealtime ? [selected_mealtime] : [],
            selected_cuisine ? [selected_cuisine] : []);
        let top_cooktimes = limit(_cooktimes, 10, (f, s) => s[0].localeCompare(f[0]));
        show_pie_chart(d3.select('#cooktimeschart'), top_cooktimes.map(x => x[1]), top_cooktimes.map(x => x[0]), cooktime_callback(pick))
    }
    update_links(pick);
}

function cuisine_callback(pick) {
    return function(value){
        selected_cuisine = value;
        update_charts(pick);
    }
}

function mealtime_callback(pick) {
    return function (value) {
        selected_mealtime = value;
        update_charts(pick);
    }
}

function cooktime_callback(pick) {
    return function (value) {
        selected_cooktime = value;
        update_charts(pick);
    }
}

function selectChart(chart, onClick) {
    return function (mouseEvent, obj) {
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
            onClick(undefined);
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
}

function mealtime_to_number(_mealtime){
    switch (_mealtime) {
        case "breakfast": return 1;
        case "brunch": return 2;
        case "lunch": return 3;
        case "dinner": return 4;
        default: return -1;
    }
}