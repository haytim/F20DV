// 11 distinct colours generated with medialab tools i want hue https://medialab.github.io/iwanthue/
const colours = ["#cb55a5","#66b743","#8345ca","#b19e42","#685699","#d27131","#6999c2","#d24049","#64b088","#763535","#4b612e"]
// region codes and names
const regions = [
    {name: "Scotland", code: "S92000003"},
    {name: "North East", code: "E12000001"},
    {name: "North West", code: "E12000002"},
    {name: "Yorkshire and The Humber", code: "E12000003"},
    {name: "East Midlands", code: "E12000004"},
    {name: "West Midlands", code: "E12000005"},
    {name: "East", code: "E12000006"},
    {name: "London", code: "E12000007"},
    {name: "South East", code: "E12000008"},
    {name: "South West", code: "E12000009"},
    {name: "Wales", code: "W92000004"},
]

/**
 * get region code based on region name
 * @param {string} regionName 
 * @returns {string} region code
 */
function regionNameToCode(regionName) {
    try {
        return regions.find(d => d.name === regionName).code
    } catch {
        return null
    }
}

/**
 * get region name based on region code
 * @param {string} regionCode 
 * @returns {string} region name
 */
function regionCodeToName(regionCode) {
    try {
        return regions.find(d => d.code === regionCode).name
    } catch {
        return null
    }
}

/**
 * get colour by region name
 * @param {string} regionName
 * @returns {string} hex colour
 */
const regionScaleByName = d3.scaleOrdinal()
    .domain(regions.map(d => d.name).sort())
    .range(colours)

/**
 * get colour by region code
 * @param {string} regionCode
 * @returns {string} hex colour
 */
function regionScaleByCode(regionCode) {
    return regionScaleByName(regionCodeToName(regionCode))
}
