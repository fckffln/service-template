export default function clone(item) {
    if (!item) {
        return item;
    }
    const types: any = [Number, String, Boolean];
    let result;
    types.forEach(function (type) {
        if (item instanceof type) {
            result = type(item);
        }
    });

    if (typeof result == 'undefined') {
        if (Object.prototype.toString.call(item) === '[object Array]') {
            result = [];
            item.forEach(function (child, index, array) {
                result[index] = clone(child);
            });
        } else if (typeof item == 'object') {
            if (item.nodeType && typeof item.cloneNode == 'function') {
                result = item.cloneNode(true);
            } else if (!item.prototype) {
                if (item instanceof Date) {
                    result = new Date(item);
                } else {
                    result = {};
                    for (const i in item) {
                        result[i] = clone(item[i]);
                    }
                }
            } else {
                if (item.constructor) {
                    result = new item.constructor();
                } else {
                    result = item;
                }
            }
        } else {
            result = item;
        }
    }
    if (typeof result === 'symbol' || typeof result === 'function') return result;
    return JSON.parse(JSON.stringify(result));
}
