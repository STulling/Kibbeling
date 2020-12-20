let colors = ["#00c0c7", "#5144d3", "#e8871a", "#da3490", "#9089fa", "#47e26f", "#2780eb", "#6f38b1", "#dfbf03", "#cb6f10", "#268d6c", "#9bec54"];

let recipe_url = "https://www.food.com/recipe/";

let data_file = "./data/recipes_parsed.csv";

// Recipe data
let names = [];
let ingredients = [];
let cuisines = [];
let mealtimes = [];
let cooktimes = [];

// Synonyms in data
let synonyms = {
    "dinner-party": "dinner",
    "15-minutes-or-less": "< 15min",
    "30-minutes-or-less": "< 30min",
    "60-minutes-or-less": "< 60min",
    "4-hours-or-less": "< 4h",
}

// Connections for chord diagram
let connections = [];

// Filtering criteria
let selected_cuisine;
let selected_mealtime;
let selected_cooktime;
let originalSize = {};

// Stuff for table.
let table = undefined;
let last_valid_recipes = undefined;


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

function get_random_recipes(recipes, n) {
    return get_random_from_array(Object.keys(recipes), n);
}

function string_to_array(string) {
    let array = string;
    array = array.substring(1, array.length - 1);
    array = array.split(', ');
    for (let i = 0; i < array.length; i++) {
        array[i] = desynonimize(array[i].substring(1, array[i].length - 1), synonyms)
    }
    return array
}

let top_items;
let top_ids;
let unique_ingredients;
let top_cooktimes;
let top_mealtimes;
let top_cuisines;
let pick;

function add_ingredient_from_form() {
    let text = document.getElementById("ingredientinput").value.toLowerCase();
    if (unique_ingredients.indexOf(text) !== -1) {
        if (top_items.filter(item => item[0] === text).length === 0) {
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
        top_items = top_items.filter((x) => x[0] !== ingredient);
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
    d3.csv(data_file,
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


        create_chord_diagram(svg);
    });

    let width = document.getElementById('visualization').offsetWidth;
    let height = document.getElementById('visualization').offsetHeight;

    originalSize.width = width;
    originalSize.height = height;
    let svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
}

function refreshGraph() {
    let graph = d3.select("#visualization").select("svg").select("g")

    graph.selectAll("*").remove();
    create_chord_diagram(graph)
}

function scaleGraph() {
    let width = document.getElementById('visualization').offsetWidth;
    let height = document.getElementById('visualization').offsetHeight;

    d3.select("#visualization")
        .select("svg")
        .attr("width", width)
        .attr("height", height)
        .select("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ") scale(" + Math.min(width / originalSize.width, height / originalSize.height) + ")")
}

function _showGraph(graph_type, element_id, top_elements, title, callback) {
    let width = document.getElementById(element_id).offsetWidth;
    let height = document.getElementById(element_id).offsetHeight;
    d3.select("#" + element_id)
        .attr("width", width)
        .attr("height", height)
    if (!top_elements) return
    graph_type(d3.select("#" + element_id), top_elements.map(x => x[1]), top_elements.map(x => x[0]), title, callback);
}

function showGraphs() {
    _showGraph(show_pie_chart, "cooktimeschart", top_cooktimes, '', cooktime_callback(pick));
    _showGraph(show_bar_chart, "cuisinechart", top_cuisines, 'relative % within cuisine', cuisine_callback(pick));
    _showGraph(show_bar_chart, "mealtimeschart", top_mealtimes, 'relative % within mealtimes', mealtime_callback(pick));
}

function refreshGraphs() {
    scaleGraph();
    showGraphs();
}

function create_chord_diagram(svg) {
    generate_chord_chart(svg, connections, top_ids)
    d3.select(".link").selectAll("path")
        .on("mouseover", highlightLink(svg, bg_opacity))
        .on("mouseout", highlightLink(svg, 1));

    d3.select(".ingredient").selectAll("path")
        .on("mouseover", highlightIngredient(svg, bg_opacity))
        .on("mouseout", highlightIngredient(svg, 1));

    d3.selectAll(".titles")
        .on("mouseover", highlightIngredient(svg, bg_opacity))
        .on("mouseout", highlightIngredient(svg, 1));

    d3.select(".link").selectAll("path")
        .on("click", selectLink(svg))
}

function selectLink(svg) {
    return function (mouseEvent, obj) {
        let clickedPath = svg.select(".link").selectAll("path")
            .filter(path => obj === path)
        const boolClass = "clicked"
        let opacity = bg_opacity;
        if (clickedPath.classed(boolClass)) {
            clickedPath.classed(boolClass, false)
            opacity = 1;
            svg.select(".link").selectAll("path").style("cursor", "pointer");
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
            pick = [top_ids[obj.source.index], top_ids[obj.target.index]];
            show_link("SELECTED: " + pick[0] + " and " + pick[1]);

            let _cuisines = get_cuisines_relative(pick, [], [], []);
            top_cuisines = limit(_cuisines, 10, (f, s) => s[1] - f[1], cuisine_callback(pick));

            let _mealtimes = get_mealtimes_relative(pick, [], [], []);
            top_mealtimes = limit(_mealtimes, 10, (f, s) => mealtime_to_number(f[0]) - mealtime_to_number(s[0]), mealtime_callback(pick));

            let _cooktimes = get_time_to_cook_relative(pick, [], [], []);
            top_cooktimes = limit(_cooktimes, 10, (f, s) => s[0].localeCompare(f[0]), cooktime_callback(pick));

            update_links(pick);
            showGraphs()

            svg.select(".link").selectAll("path").style("cursor", "default");
            clickedPath.style("cursor", "pointer");
        }

        let other = svg.select(".link").selectAll("path")
            .filter(path => obj !== path)


        other.transition().style("stroke-opacity", opacity).style("fill-opacity", opacity)
    }
}

function update_links(pick) {
    let valid_recipes = get_valid_recipes(pick);
    valid_recipes = filter_recipes_on_cuisine(selected_cuisine ? [selected_cuisine] : [], valid_recipes)
    valid_recipes = filter_recipes_on_cooktime(selected_cooktime ? [selected_cooktime] : [], valid_recipes)
    valid_recipes = filter_recipes_on_mealtime(selected_mealtime ? [selected_mealtime] : [], valid_recipes)

    let load_table = $("#loadTable");
    if (load_table.hasClass("hidden")) {
        load_table.removeClass();
    }
    last_valid_recipes = valid_recipes

    // We are already showing a table, update it.
    if (table !== undefined) {
        show_table()
    }
    try {
        add_links(get_random_recipes(valid_recipes, 3));
    } catch (e) {
        console.log(e);
        no_links_found();
    }
}

function toggle_table() {
    if (table !== undefined) {
        $("#table").addClass("hidden");
        table.destroy()
        table = undefined;
    } else {
        $("#table").removeClass("hidden");
        show_table();
    }
}

function show_table() {
    if (last_valid_recipes === undefined) return;

    if (table !== undefined) table.destroy()
    table = $('#recipeTable').DataTable({
        data: Object.values(last_valid_recipes).map(i => [
            (2 / ingredients[i].length * 100).toFixed(2) + "%",
            extract_name(names[i]),
            cuisines[i],
            mealtimes[i],
            cooktimes[i],
            "<a href=\"https://www.food.com/recipe/" + names[i] + "\">Link</a>"
        ]),
        columns: [
            {title: "Ingredient Relevance", type: "num-fmt"},
            {title: "Name"},
            {title: "Cuisine"},
            {title: "Type"},
            {title: "Time"},
            {title: "Link", type: "html"}
        ],
        order: [[0, "desc"]]
    });
}

function extract_name(name) {
    const split = name.split('-');
    return split.slice(0, split.length - 1).join(" ")
}

function update_charts(pick) {
    if (selected_cuisine === undefined) {
        let _cuisines = get_cuisines_relative(pick,
            selected_cooktime ? [selected_cooktime] : [],
            selected_mealtime ? [selected_mealtime] : [],
            selected_cuisine ? [selected_cuisine] : []);
        let top_cuisines = limit(_cuisines, 10, (f, s) => s[1] - f[1]);
        show_bar_chart(d3.select('#cuisinechart'), top_cuisines.map(x => x[1]), top_cuisines.map(x => x[0]), "relative % within cuisine", cuisine_callback(pick));
    }
    if (selected_mealtime === undefined) {
        let _mealtimes = get_mealtimes_relative(pick,
            selected_cooktime ? [selected_cooktime] : [],
            selected_mealtime ? [selected_mealtime] : [],
            selected_cuisine ? [selected_cuisine] : []);
        let top_mealtimes = limit(_mealtimes, 10, (f, s) => mealtime_to_number(f[0]) - mealtime_to_number(s[0]));
        show_bar_chart(d3.select('#mealtimeschart'), top_mealtimes.map(x => x[1]), top_mealtimes.map(x => x[0]), "relative % within mealtimes", mealtime_callback(pick))
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
    return function (value) {
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
        let charElements = chart.selectAll("rect");
        if (charElements.size() === 0) {
            charElements = chart.selectAll("g.arc path")
        }
        const clickedElement = charElements.filter(elem => elem === obj);
        const boolClass = "clicked";
        let opacity = 0.4;
        if (clickedElement.classed(boolClass)) {
            clickedElement.classed(boolClass, false);
            opacity = 1;
            onClick(undefined);
            charElements.style("cursor", "pointer");
            console.log("SELECTED2");
        } else {
            if (chart.selectAll(".clicked").size() > 0) {
                return
            }
            clickedElement.classed(boolClass, true)
            onClick(clickedElement.attr("value"))
            charElements.style("cursor", "default");
            clickedElement.style("cursor", "pointer");
            console.log("SELECTED");
        }
        const other = charElements.filter(elem => elem !== obj);

        other.transition().style("stroke-opacity", opacity).style("fill-opacity", opacity);
        console.log(opacity);
    };
}

function highlightIngredient(svg, opacityOther) {
    return function (mouseEvent, obj) {
        if (svg.select(".link").selectAll(".clicked").size() > 0) {
            return
        }

        svg.select(".link").selectAll("path")
            .filter(function (path) {
                return path.source.index !== obj.index && path.target.index !== obj.index;
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
                return obj !== path;
            })
            .transition()
            .style("stroke-opacity", opacityOther)
            .style("fill-opacity", opacityOther);
    };
}
