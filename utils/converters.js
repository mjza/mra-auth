const toLowerCamelCase = (obj) => {
    const convertedObject = {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            convertedObject[camelCaseKey] = obj[key];
        }
    }

    return convertedObject;
};

module.exports = { toLowerCamelCase };
