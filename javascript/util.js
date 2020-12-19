function clear_element(element){
    element.selectAll("*").remove();
}

function matrix(m, n) {
    let result = [];
    for (let i = 0; i < n; i++) {
        result.push(new Array(m).fill(0));
    }
    return result;
}

function intersect(a, b) {
    return a.filter(value => b.includes(value))
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

function get_random_from_array(arr, n) {
    let len = arr.length,
        taken = new Array(len);
    if (len === 0)
        throw new RangeError("getRandom: more elements taken than available");
    if (n > len)
        n = len
    let result = new Array(n);
    while (n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function get_ids(items) {
    return items.map(x => x[0])
}

function translate(dx, dy){
    return "translate(" + dx + "," + dy + ")";
}