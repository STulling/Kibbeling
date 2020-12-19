function _name_to_human_readable(name){
    let components = name.split('-');
    return components.slice(0, components.length - 1).join(" ");
}

function names_to_human_readable(names){
    let res = [];
    for(let name of names){
        res.push(_name_to_human_readable(name));
    }
    return res;
}

function add_links(valid_recipes) {
    clear_element(d3.select('#randomrecipes'));
    let links = []
    for (let recipe of valid_recipes) {
        links.push(recipe_url + recipe)
    }
    let names = names_to_human_readable(valid_recipes);
    show_recommendations(d3.select('#randomrecipes'), links, names);
}

function no_links_found() {
    d3.select('#randomrecipes').selectAll('*').remove();
    d3.select('#randomrecipes').append('p').html("NO RECIPES FOUND");
}

function show_recommendations(element, links, labels) {
    for (let i = 0; i < links.length; i++) {
        element.append('div')
            .attr('class', 'recommendationbox')
            .append('a')
            .attr('class', 'recommendation')
            .attr('href', links[i])
            .html(labels[i]);
    }
}