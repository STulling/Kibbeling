function ingr_count_map(ingredients_lists) {
    let map = {};
    for (let ingredients of ingredients_lists) {
        for (let ingredient of ingredients) {
            map[ingredient] = map[ingredient] ? map[ingredient] + 1 : 1;
        }
    }
    return map;
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


function get_valid_recipes(_ingredients) {
    let valid_recipes = {}
    for (let i = 0; i < names.length; i++) {
        let intersection = intersect(_ingredients, ingredients[i]);
        if (intersection.length === _ingredients.length) {
            valid_recipes[names[i]] = i;
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

function desynonimize(text, _synonyms) {
    if (text in _synonyms) {
        return _synonyms[text];
    }
    return text;
}


function mealtime_to_number(_mealtime) {
    switch (_mealtime) {
        case "breakfast":
            return 1;
        case "brunch":
            return 2;
        case "lunch":
            return 3;
        case "dinner":
            return 4;
        default:
            return -1;
    }
}