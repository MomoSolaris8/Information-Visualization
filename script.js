class Partei {
    constructor(name) {
        this.name = name;
        if (this.name == "CDU") {
            this.color = '#1c1c1b';
            this.id = 1;
        } else if (this.name == "CSU") {
            this.color = '#1c1c1b';
            this.id = 2;
        } else if (this.name == "LINKE") {
            this.color = '#b8216a';
            this.id = 2;
        } else if (this.name == "SPD") {
            this.color = '#cd1b01';
            this.id = 3;
        } else if (this.name == "GRÜNE") {
            this.color = '#22af00';
            this.id = 4;
        } else if (this.name == "FDP" || this.name == "FDP/DVP") {
            this.color = '#ffdc00';
            this.id = 5;
        } else if (this.name == "AFD") {
            this.color = '#009ee0';
            this.id = 6;
        } else {
            this.color = "#6a6a6a";
            this.id = null;
        }
            
    }
}

class Patent {
    constructor(id, date, state, category){
        this.id = id;
        this.date = date;
        this.state = state; 
        this.category = category
    }
}

// region UTIL
// Source: https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color [14.12.2021]
function pickTextColorBasedOnBgColor(bgColor, lightColor, darkColor) {
    var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    var r = parseInt(color.substring(0, 2), 16); // hexToR
    var g = parseInt(color.substring(2, 4), 16); // hexToG
    var b = parseInt(color.substring(4, 6), 16); // hexToB
    return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ?
        darkColor : lightColor;
}

// Source: https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex [15.12.2021]
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi/180);
  }
// endregion UTIL



// region FILTERS
// Class for the filter data
class Filter {
    constructor(id, title, active, tag) {
        this.id = id;
        this.title = title;
        this.active = active;
        this.tag = tag;
    }
}

var filterList = [];

// Add the filters
var filters = [
    new Filter("human_necessities", "Täglicher Lebensbedarf", true, "A"),
    new Filter("performing_operations", "Arbeitsverfahren, Transportieren", true, "B"),
    new Filter("chemistry", "Chemie, Metallurgie", true, "C"),
    new Filter("textiles", "Textilien, Papier", true, "D"),
    new Filter("fixed_constructions", "Bauwesen, Erdbohren, Bergbau", true, "E"),
    new Filter("mechanical_engineering", "Maschinenbau, Beleuchtung, Heizung, Waffen, Sprengen", true, "F"),
    new Filter("physics", "Physik", true, "G"),
    new Filter("electricity", "Elektrotechnik", true, "H"),
];

$(document).ready(function () {
    filters.forEach(filter => {
        // Add a list item for each given filter
        var listHtml = "<li class=\"filter-list-item\" id=\"filter-" + filter.id +"\">";
        listHtml += "<img class=\"filter-icon filter-icon-inactive\" alt=\"filter-icon\" src=\"images/ic_" + filter.id + ".svg\">";
        listHtml += "<img class=\"filter-icon filter-icon-active\" alt=\"filter-icon-active\" src=\"images/ic_" + filter.id + "_active.svg\">";
        listHtml += "<div class=\"filter-title\">" + filter.title + "</div>";
        listHtml += "</li>";
        $('#filter-list').append(listHtml);

        // Check if the filter is initially active and adjust css classes accordingly
        if (filter.active) {
            $('#filter-' + filter.id + ' > .filter-icon-inactive').addClass('filter-icon-hide');
            $('#filter-' + filter.id).addClass('filter-active');
        } else {
            $('#filter-' + filter.id + ' > .filter-icon-active').addClass('filter-icon-hide');

        }

        // Toggle the filter if it is clicked
        $('#filter-' + filter.id).click(function () {
            filter.active = !filter.active;
            if (filter.active) {
                $(this).addClass("filter-active");
                $('#filter-' + filter.id + ' > .filter-icon-inactive').addClass('filter-icon-hide');
                $('#filter-' + filter.id + ' > .filter-icon-active').removeClass('filter-icon-hide');
            } else {
                $(this).removeClass("filter-active");
                $('#filter-' + filter.id + ' > .filter-icon-inactive').removeClass('filter-icon-hide');
                $('#filter-' + filter.id + ' > .filter-icon-active').addClass('filter-icon-hide');
            }
            // Update the visualisation accordingly
            updateMaxPatentValue(getActiveFilters());
            updateMaxBarChartYValue();
            updatePatentData();
        });
    });
    // Initialize the visualisation
    updateMaxBarChartYValue();
    initBarChart();

    // Show currently selected state (initially none)
    showSelected();
    showElection();
});
// endregion FILTERS



// region MAP - Source: https://www.d3-graph-gallery.com/graph/backgroundmap_changeprojection.html [24.11.2021]
//              Source: https://www.d3-graph-gallery.com/graph/choropleth_hover_effect.html [30.11.2021]

// The svgs
const svgMap = d3.select("#map"),
    mapWidth = +svgMap.attr("width"),
    mapHeight = +svgMap.attr("height");

const svgBarChart = d3.select("#bar-chart");

// Map and projection (centered germany via trial an error)
const projection = d3.geoMercator()
    .scale(3000)
    .center([12, 52.5]);


var selectedState = null;

// Deselect state when clicked outside
$('#map-inner-container').click(function (e) {
    if (!$(e.target).hasClass('state') && !$(e.target).parents('#slidecontainer').length) {
        selectState(null);
    }
});

// Update selected state
let selectState = function (state) {
    selectedState = state;
    updateMaxBarChartYValue();
    showSelected();
    showElection();
}

// Display name and parties of the selected state
let showSelected = function() {
    const year = getSliderVal();

    $('#state-parteien').empty();
    if (selectedState == null) {
        $('#state-name').text(`Deutschland (${year})`);
        $("<li>Regierungsparteien</li>").appendTo($('#state-parteien'));
    } else {
        $('#state-name').text(`${selectedState} (${year})`);
        var selectedDate = year;
        const parteiData = getParties(selectedState, selectedDate);
        parteiData.forEach(element => {
            if(element.name != "") {
                const textColor = pickTextColorBasedOnBgColor(element.color, "#fff", "#000");
                $(`<li style="background-color:${element.color}; color:${textColor};">${element.name}</li>`).appendTo($('#state-parteien'));
            }
        });
    }
    updateBarChart();
}

// Display election results of the selected state
let showElection = function() {
    const year = getSliderVal()

    $('#stacked-bar').empty();
    $('#stacked-bar-desc').empty();
    if (selectedState == null) {
        $('#stacked-bar').html(`Klicke auf ein Bundesland, um dir die Wahlergebnisse<br>der letzten Landtagswahl (in oder vor ${year}) anzeigen zu lassen.`);
        // $('#stacked-bar').html(`Klicke auf ein Bundesland`);
    } else {
        var selectedDate = year;
        const electionData = getElectionResults(selectedState, selectedDate);
        const electionDate = getElectionYear(selectedState, selectedDate);
        const elYear = electionDate.slice(electionDate.length-4)
        const elMonth = electionDate.slice(electionDate.length-6, electionDate.length-4);
        const elDay =  electionDate.slice(0, electionDate.length-6);
        $('#stacked-bar-desc').html(`Ergebnisse der Landtagswahlen vom ${elDay}.${elMonth}.${elYear}:`);
        stackedBar('#stacked-bar', electionData);
    }
}

// get content from landtagswahlen_regierungen.txt as objects
var party_data = $.csv.toObjects(party_csv);

// get content from datbase.txt as objects
var patent_data = $.csv.toObjects(patent_csv);


// geolocations of the states (for the pie-charts)
var pie_chart_locations = $.csv.toObjects(pie_chart_locations_csv);
// offset the pie charts of small states and connect them with a line, stored here:
var line_locations = [
    [
        {
            state: 'Berlin',
            x: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Berlin').LONG,
            y: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Berlin').LAT
        },
        {
            state: 'Berlin',
            x: 13.404194,
            y: 52.502889
        }
    ],
    [
        {
            state: 'Bremen',
            x: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Bremen').LONG,
            y: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Bremen').LAT
        },
        {
            state: 'Bremen',
            x: 8.810585,
            y: 53.113753
        }
    ],
    [
        {
            state: 'Hamburg',
            x: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Hamburg').LONG,
            y: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Hamburg').LAT
        },
        {
            state: 'Hamburg',
            x: 10.028889,
            y: 53.568889
        }
    ],
    [
        {
            state: 'Saarland',
            x: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Saarland').LONG,
            y: pie_chart_locations.find(x => x.BUNDESLAND_NAME == 'Saarland').LAT
        },
        {
            state: 'Saarland',
            x: 6.878333,
            y: 49.376944
        }
    ]
];

// return the parties of the last election in the selectedState on selectedDate
function getParties(selectedState, selectedDate) {
    // Filtern nach ausgewähltem Bundesland
    var land = party_data.filter(x => x.BUNDESLAND_NAME === selectedState);
    // Filtern nach ausgewähltem Jahr
    var dates = [];
    land.forEach(x => dates.push([Number(x.DATE.slice(x.DATE.length-4)), x.DATE]));
    dates = dates.filter(x => x < selectedDate+1);
    var years = dates.map(function(x) {
        return x[0];
    });
    var year = Math.max.apply(Math, years);
    var index = years.indexOf(year);
    var date = dates[index][1];
    
    // Erstellen & Zurückgeben Liste Regierungsparteien
    var parties = [];
    parties.push(new Partei((land.find(x => x.DATE === date).Regierung_1)));
    parties.push(new Partei((land.find(x => x.DATE === date).Regierung_2)));
    parties.push(new Partei((land.find(x => x.DATE === date).Regierung_3)));
    return parties;
}

// Checks whether two HTML-elements have the same class
function hasSameClass(elem1, elem2) {
    var classes = elem1.classList;
    for (var i = 0; i < classes.length; i++) {
        if (elem2.classList.contains(classes[i])){
            return true;
        }
    }
    return false
}

var stateGeoData = null;

// Load data and boot
d3.json("./resources/states.geojson").then(function (data) {
    stateGeoData = data;
    updateMaxPatentValue(getActiveFilters());
    initPatentData();
})

// create map tooltip
const tooltipMap = d3.select("#map-inner-container")
.append("div")
.style("opacity", 0)
.attr("class", "tooltip-map tooltip")

var activeHoverState = null;
// Add hover effect
let mouseOver = function (e, data) {
    activeHoverState = this;
    d3.selectAll(".state")
        .style("opacity", function () {
            return this == activeHoverState ? 1.0 : 0.4;
        })
    d3.selectAll(".piechart")
        .style("opacity", function () {
            return hasSameClass(this, activeHoverState) ? 1.0 : 0.5;
        })

    tooltipMap.style("opacity", 1)
}

let mouseMove = function (event, data) {
    tooltipMap
        .html(`<b>${data.state}:</b><br>${data.totalPatents} Patente`)
        .style("left", (event.x - $(".tooltip-map").width() / 2) + "px")
        .style("top", (event.y + $(".tooltip-map").height() + 0) + "px")
}

let mouseLeave = function (e) {
    activeHoverState = null;
    d3.selectAll(".state")
        .style("opacity", 1.0)
    d3.selectAll(".piechart")
        .style("opacity", 1.0)

    tooltipMap.style("opacity", 0)
}

let mouseClick = function (e, data) {
    const clickedState = this;
    selectState(data.state);
}

// returns tags (A,B,C,...) of active/ selected filters  
let getActiveFilters = function (){
    activeFilterList = filters.filter(x => x["active"] === true);
    let activeFilterTags = [];
    for(let i=0; i<activeFilterList.length; i++) {
        activeFilterTags.push(activeFilterList[i].tag);
    }
    //console.log(activeFilterTags);
    //updatePatentData();
    return activeFilterTags;
}

// Rounds up the given number so that it has [places] zeros at the end
function ceilToTenth(number, places) {
    var multiplier = Math.pow(10, places);
    return Math.ceil(number / multiplier) * multiplier;
}

// calculates the highest number of patents in the seletced IPC-classes in any state at any time
function updateMaxPatentValue(activeFilters) {
    const relevantPatentData = patent_data.filter(x => activeFilters.includes(x[" IPC"]));

    var currMax = 0;

    for (yr = 1990; yr <= 2014; yr++) {
        pie_chart_locations.forEach(element => {
            const currentStatePatentData = relevantPatentData.filter(x => (x.BUNDESLAND_NAME === element.BUNDESLAND_NAME) && (x[" DATE"] === yr.toString()));
            var totalPatents = 0;
            currentStatePatentData.forEach(patent => {
                totalPatents += parseInt(patent[" AMOUNT"]);
            });
            if (currMax < totalPatents) currMax = totalPatents;
        });
    }

    maxPatent = Math.max(ceilToTenth(currMax, 2), 1);
}

const hue = 146, sat = 35, maxLight = 50, minLight = 5;
var minPatent = 0;
var maxPatent = 14500;
var legendAxis, legendData, legendTitle;

// initializes the map with the path data
function initPatentData() {
    const year = getSliderVal();
    const currentPatentData = patent_data.filter(x => x[" DATE"] === year);
    
    const activeFilters = getActiveFilters();

    const patentMapData = [];

    pie_chart_locations.forEach(element => {
        const currentStatePatantData = currentPatentData.filter(x => x.BUNDESLAND_NAME === element.BUNDESLAND_NAME);
        var totalPatents = 0;
        // matches active filters with IPC classes of database_short.csv
        for(i=0; i<currentStatePatantData.length; i++) {
             if(activeFilters.includes(currentStatePatantData[i][" IPC"])) {
                 totalPatents += parseInt(currentStatePatantData[i][" AMOUNT"]);
             }
         }

        pathData = stateGeoData.features.find(x => x.properties.GEN === element.BUNDESLAND_NAME).geometry;
        const color = hslToHex(hue, sat, maxLight - ((totalPatents / maxPatent) * (maxLight - minLight)));
        patentMapData.push({
            type: "Feature",
            state: element.BUNDESLAND_NAME,
            totalPatents: totalPatents,
            color: color,
            geometry: pathData
        });
    });

    svgMap.selectAll(".svg-container").remove();

    // region COLOR LEGEND Source: https://plnkr.co/edit/ZLCiytPahZcZK5HA1sPu?preview [02.02.2022]
    const legendWidth = 15,
        legendHeight = 400,
        legendOffsetTop = 40;

    // append a defs (for definition) element to your SVG
	var svgLegend = d3.select('#legend').append('svg')
        .attr("height", legendHeight + legendOffsetTop + 20)
        .attr("width", 200);
	var defs = svgLegend.append('defs');

	// append a linearGradient element to the defs and give it a unique id
	var linearGradient = defs.append('linearGradient')
		.attr('id', 'linear-gradient');

	// horizontal gradient
	linearGradient
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "0%")
		.attr("y2", "100%");

	// append multiple color stops by using D3's data/enter step
	linearGradient.selectAll("stop")
		.data([
			{offset: "0%", color: hslToHex(hue, sat, minLight)},
			{offset: "100%", color: hslToHex(hue, sat, maxLight)}
		])
		.enter().append("stop")
		.attr("offset", function(d) { 
			return d.offset; 
		})
		.attr("stop-color", function(d) { 
			return d.color; 
		});

	// append title
	legendTitle = svgLegend.append("text")
		.attr("class", "legendTitle")
		.attr("x", 0)
		.attr("y", 20)
        .style("font-size", "14px")
		.style("text-anchor", "left")
		.text(`Patente (max: ${maxPatent})`);

	// draw the rectangle and fill with gradient
	svgLegend.append("rect")
		.attr("x", 0)
		.attr("y", legendOffsetTop)
		.attr("width", legendWidth)
		.attr("height", legendHeight)
		.style("fill", "url(#linear-gradient)");

	//create tick marks
	legendData = d3.scaleLinear()
		.domain([maxPatent, 0])
		.range([0, legendHeight]);

	legendAxis = d3.axisRight(legendData);
	legendAxis = svgLegend
		.attr("class", "axis")
		.append("g")
		.attr("transform", `translate(${legendWidth}, ${legendOffsetTop})`)
        .style("font-family", "century-gothic,sans-serif")
        .style("font-size", "12px")
		.call(legendAxis);
    // endregion COLOR LEGEND

    // Draw the map
    svgMap.append("g")
        // .attr("class", "svg-container")
        .selectAll("path")
        .data(patentMapData)
        .join("path")
        .attr("fill", function (data) {return data.color})
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        .attr("class", function (data) { return "state " + data.state })
        .style("stroke", "#fff")
        .style("cursor", "pointer")
        .on("mouseleave", mouseLeave)
        .on("mousemove", mouseMove)
        .on("mouseover", mouseOver)
        .on("click", mouseClick)

    updatePieCharts();
}

// updates the map
function updatePatentData() {
    const year = getSliderVal();
    const currentPatentData = patent_data.filter(x => x[" DATE"] === year);
    
    const activeFilters = getActiveFilters();

    const patentMapData = [];

    pie_chart_locations.forEach(element => {
        const currentStatePatantData = currentPatentData.filter(x => x.BUNDESLAND_NAME === element.BUNDESLAND_NAME);
        var totalPatents = 0;
        // matches active filters with IPC classes of database_short.csv
        for(i=0; i<currentStatePatantData.length; i++) {
             if(activeFilters.includes(currentStatePatantData[i][" IPC"])) {
                 totalPatents += parseInt(currentStatePatantData[i][" AMOUNT"]);
             }
         }
        const color = hslToHex(hue, sat, maxLight - ((totalPatents / maxPatent) * (maxLight - minLight)));
        patentMapData.push({
            state: element.BUNDESLAND_NAME,
            totalPatents: totalPatents,
            color: color
        });
    });

    // Updating the color-legend
    legendData.domain([maxPatent, 0]);
    legendAxis.transition().duration(500).call(d3.axisRight(legendData));
    legendTitle.text(`Patente (max: ${maxPatent})`);

    svgMap.selectAll(".svg-container").remove();

    // Draw the map
    svgMap.selectAll(".state")
        .data(patentMapData)
        .attr("fill", function (data) {return data.color})

    updatePieCharts();
    updateBarChart();
}

// update the pie charts inside the states
function updatePieCharts() {
    const year = getSliderVal();
    const party_data_year = [];
    // store the party-data, the position and the pie-chart-data so d3 can use it
    pie_chart_locations.forEach(state => {
        var parties = getParties(state.BUNDESLAND_NAME, year)
        parties = parties.filter(x => x.name != '');
        segment_size = 360 / parties.length;
        var segment_start = 0;
        parties.forEach(party => {
            party_data_year.push({
                state: state.BUNDESLAND_NAME,
                party: party.name,
                color: party.color,
                long: state.LONG,
                lat: state.LAT,
                startAngle: degrees_to_radians(segment_start),
                endAngle: degrees_to_radians(segment_start + segment_size)
            });
            segment_start += segment_size;
        })
    });

    

    // Draw the lines for the offset pie charts of small states
    var line = d3.line()
        .x(function(d) { return projection([d.x, d.y])[0]; })
        .y(function(d) { return projection([d.x, d.y])[1]; })
        .curve(d3.curveBasis);
    svgMap.append("g")
        .attr("class", "svg-container")
        .selectAll("pieChartLines")
        .data(line_locations)
        .enter().append("path")
            .attr("class", d => "line piechart " + d[0].state )
            .attr("d", line)
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .style("pointer-events", "none")


    const radius = 20;
    
    // Draw the pie charts
    svgMap.append("g")
        .attr("class", "svg-container")
        .selectAll("pieCharts")
        .data(party_data_year)
        .join("path")
        .attr('transform', d => `translate(${projection([d.long, d.lat])[0]}, ${projection([d.long, d.lat])[1]})`)
        .attr('d', d3.arc()
            .innerRadius(0)
            .outerRadius(radius)
        )
        .attr("class", d => "piechart " + d.state)
        .attr('fill', d => d.color)
        .attr("stroke", "white")
        .style("stroke-width", "1px")
        .style("pointer-events", "none")
        // .style("opacity", 0.7)
}
// endregion MAP



// region SCROLLSLIDER - Source: https://codepen.io/stoi2m1/pen/QKELpj [25.11.2021]
const slide = $("#slide");
const isFirefox = (/Firefox/i.test(navigator.userAgent))
const mousewheelevt = isFirefox ? "DOMMouseScroll" : "mousewheel";

// return the value of the slider
let getSliderVal = function() {
    return $('#slide').val();
}

// detect slider change
slide.on('input', function (event) {
    var value = $(this).val();
    showSelected();
    updatePatentData();
    showElection();

    // Update the tooltips if neccessary
    if (activeHoverState != null) {
        activeHoverState.dispatchEvent(new Event('mousemove'));
    }
    if (activeBar != null) {
        // Not the cleanest solution but didn't find another way
        setTimeout(() => { activeBar.dispatchEvent(new Event('mousemove')); }, 10);
    }
    if (activeStackedBar != null) {
        // Not the cleanest solution but didn't find another way
        setTimeout(() => { activeStackedBar.dispatchEvent(new Event('mousemove')); }, 10);
    }
});

// active mouse scroll
$('#page').bind(mousewheelevt, moveSlider);

// move the slider based on scrolling
function moveSlider(e) {
    var zoomLevel = parseInt(slide.val());
    const wheelData = isFirefox ? -e.originalEvent.detail : e.originalEvent.wheelDelta;

    // detect positive or negative scrolling
    if (wheelData < 0) {
        //scroll down
        slide.val(zoomLevel - 1);
    } else {
        //scroll up
        slide.val(zoomLevel + 1);
    }

    // trigger the change event
    slide.trigger('input');

    //prevent page fom scrolling
    return false;
}
// endregion SCROLLSLIDER


var activeStackedBar = null;
var total;

// create stacked bar tooltip
const tooltipStackedBar = d3.select("#stacked-bar-container")
.append("div")
.style("opacity", 0)
.attr("class", "tooltip-stacked-bar tooltip")

// Three function that change the tooltip when user hover / move / leave a cell
const mouseoverStackedBar = function(event,d) {
    activeStackedBar = this;
    tooltipStackedBar.style("opacity", 1)
}

const mousemoveStackedBar = function(event,d) {
    tooltipStackedBar
    .html(`<b>${d.label}</b><br>${Math.floor(d.value / total * 100)}%`)
    .style("left", (event.x - $(".tooltip-stacked-bar").width() / 2) + "px")
    .style("top", (event.y + $(".tooltip-stacked-bar").height() + 0) + "px")
}

const mouseleaveStackedBar = function(d) {
    activeStackedBar = null;
    tooltipStackedBar.style("opacity", 0)
}

// region STACKED_BAR_PLOT - Source: https://bl.ocks.org/eesur/287b5700b5881e8899cc7301a5fefb94 [17.01.2022]
function stackedBar (bind, data, config) {
    config = {
      f: d3.format('.1f'),
      margin: {top: 0, right: 0, bottom: 0, left: 0},
      // width: 800,
      // height: 200,
      barHeight: 100,
      // colors: ['#1c1c1b', '#cd1b01', '#22af00', '#ffdc00', '#b8216a', '#009ee0', '#cccccc'],
      ...config
    }
    const { f, margin, barHeight } = config;
    const width = $('#stacked-bar').width();
    const height = $('#stacked-bar').height();
    const w = width - margin.left - margin.right;
    const h =  height- margin.top - margin.bottom;
    const halfBarHeight = height / 2;
  
    total = d3.sum(data, d => d.value)
    const sonstige = data.pop();
    data = data.sort((a, b) => (b.value - a.value));
    data.push(sonstige);
    const _data = groupData(data, total)
    // set up scales for horizontal placement
    const xScale = d3.scaleLinear()
    .domain([0, total])
    .range([0, width])


    // create svg in passed in div
    const selection = d3.select(bind)
    .append('svg')
    .attr('width', width)
    .attr('height', height - 6) // fix for weird bug where 6 pixels appear out of nowhere
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    selection.selectAll("g")
        .data(_data)
        .join("g")
        .on("mouseover", mouseoverStackedBar)
        .on("mousemove", mousemoveStackedBar)
        .on("mouseleave", mouseleaveStackedBar);

    // stack rect for each data value
    selection.selectAll('g')
    // .data(_data)
    .append('rect')
    .attr('class', 'rect-stacked')
    .attr('x', d => xScale(d.cumulative))
    .attr('y', 0)
    .attr('height', height)
    .attr('width', d => xScale(d.value))
    .style('fill', d => d.color)

    // Party name
    selection.selectAll("g")
    .append("text")
    .html(d => `${d.label}`)
    .style("fill", d => pickTextColorBasedOnBgColor(d.color, "#ffffff", "#000000"))
    .style("pointer-events", "none")
    .attr('x', d => xScale(d.cumulative) + xScale(d.value) / 2 - getTextWidth(d.label) / 2)
    .attr('y', height / 2 - 5)
    .style("opacity", d => (getTextWidth(d.label) < xScale(d.value)) ? 1 : 0)

    // Percentage
    selection.selectAll("g")
    .append("text")
    .html(d => `${Math.floor(d.value / total * 100)}%`)
    .style("fill", d => pickTextColorBasedOnBgColor(d.color, "#ffffff", "#000000"))
    .style("pointer-events", "none")
    .attr('x', d => xScale(d.cumulative) + xScale(d.value) / 2 - getTextWidth(`${Math.floor(d.value / total * 100)}%`) / 2)
    .attr('y', height / 2 + 15)
    .style("opacity", d => (getTextWidth(d.label) < xScale(d.value)) ? 1 : 0)

}

function getElectionYear(selectedState, selectedDate) {
    // filter data for selected Bundesland
    var land = party_data.filter(x => x.BUNDESLAND_NAME === selectedState);
    // filter data for selected Year
    var dates = [];
    land.forEach(x => dates.push([Number(x.DATE.slice(x.DATE.length-4)), x.DATE]));
    dates = dates.filter(x => x < selectedDate+1);
    var years = dates.map(function(x) {
        return x[0];
    });
    var year = Math.max.apply(Math, years);
    var index = years.indexOf(year);
    var date = dates[index][1];
    return date
}

// prepare data from landtagswahlen_regierungen.txt
function getElectionResults(selectedState, selectedDate) {
    // filter data for selected Bundesland
    var land = party_data.filter(x => x.BUNDESLAND_NAME === selectedState);
    // filter data for selected Year
    var dates = [];
    land.forEach(x => dates.push([Number(x.DATE.slice(x.DATE.length-4)), x.DATE]));
    dates = dates.filter(x => x < selectedDate+1);
    var years = dates.map(function(x) {
        return x[0];
    });
    var year = Math.max.apply(Math, years);
    var index = years.indexOf(year);
    var date = dates[index][1];

    // get election results for each party
    var election_results = [
        { label: 'CDU/CSU',
          value: +land.find(x => x.DATE === date).CDUCSU,
          color: '#1c1c1b',
          radius: 5},
        { label: 'SPD',
          value: +land.find(x => x.DATE === date).SPD,
          color: '#cd1b01',
          radius: 0},
        { label: 'GRÜNE',
          value: +land.find(x => x.DATE === date).GRÜNE,
          color: '#22af00',
          radius: 0},
        { label: 'FDP',
          value: +land.find(x => x.DATE === date).FDP,
          color: '#ffdc00',
          radius: 0},
        { label: 'LINKE',
          value: +land.find(x => x.DATE === date).LINKE,
          color: '#b8216a',
          radius: 0},
        { label: 'AFD',
          value: +land.find(x => x.DATE === date).AFD,
          color: '#009ee0',
          radius: 0},
        { label: 'SONSTIGE',
          value: +land.find(x => x.DATE === date).SONSTIGE,
          color: '#cccccc',
          radius: 5}
    ]

    return election_results;
}

function groupData (data, total) {
    // get percent values
    const percent = d3.scaleLinear()
        .domain([0, total])
        .range([0, 100]);
    
        // filter out NaN values
        // get mapping for next placements
        let cumulative = 0;
        const _data = data.map(d => {
            valueSafe = (d.value == NaN) ? 0 : d.value;
            cumulative += valueSafe
            return {
                value: valueSafe,
                // get the cumulative to prior value (start of rectangle)
                cumulative: cumulative - valueSafe,
                label: d.label,
                percent: percent(valueSafe),
                color: d.color,
                radius: d.radius
            }
        }).filter(d => ((d.value == NaN) ? 0 : d.value) > 0)
        return _data
}


// endregion STACKED_BAR_PLOT



// region BARCHART - Source: https://www.d3-graph-gallery.com/graph/barplot_button_data_hard.html [19.01.2022]

var x, y, xAxis, yAxis;
const margin = {top: 30, right: 30, bottom: 70, left: 70};

const iconSize = 30;

function isBarHeightSufficient(diagramHeight, data, width) {
    const realHeight = diagramHeight - y(data[" AMOUNT"]);
    const requiredSpace = iconSize + width / 2;
    return requiredSpace >= realHeight;
}

var activeBar = null;

// create a tooltip
const tooltip = d3.select("#chart-container")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip-bar-chart tooltip")

// Three function that change the tooltip when user hover / move / leave a cell
const mouseoverBarChart = function(event,d) {
    activeBar = this;
    tooltip.style("opacity", 1)
}

const mousemoveBarChart = function(event,d) {
    icpClassTitle = filters.find(x => x.tag === d[" IPC"]).title
    tooltip
    .html(`<b>${icpClassTitle}:</b><br>${d[" AMOUNT"]} Patente`)
    .style("left", (event.x - $(".tooltip-bar-chart").width() / 2) + "px")
    .style("top", (event.y + $(".tooltip-bar-chart").height() + 0) + "px")
}

const mouseleaveBarChart = function(d) {
    activeBar = null;
    tooltip.style("opacity", 0)
}

function initBarChart() {
    // set the dimensions and margins of the graph
    var width = $("#bar-chart").width() - margin.left - margin.right,
    height = $("#bar-chart").height() - margin.top - margin.bottom;

    // append the svg object to the body of the page
    svgBarChart
    .attr("width", width)
    .attr("height", height)
    // .append("g")
    // .attr("transform", `translate(${margin.left},${margin.top})`);

    // Initialize the X axis
    x = d3.scaleBand()
    .range([0, width])
    .padding(0.2);
    xAxis = svgBarChart.append("g")
    .style("font-size", "12px")
    .attr("transform", `translate(${margin.left},${height + margin.top})`);

    // Initialize the Y axis
    y = d3.scaleLinear()
    .range([height, 0]);
    yAxis = svgBarChart.append("g")
    .attr("class", "myYaxis")
    .style("font-family", "century-gothic,sans-serif")
    .style("font-size", "12px")
    .attr("transform", `translate(${margin.left},${margin.top})`)

    svgBarChart.append("text")
        .attr("x", -8)
        .attr("y", height / 2 + margin.top - 10)
        .attr("transform", `rotate(-90, 18, ${height / 2 + margin.top - 9.5})`)
        .style("text-anchor", "left")
        .text(`Patente`);

    svgBarChart.append("text")
        .attr("x", width / 2 + margin.left - 50)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "left")
        .text(`Patentklasse`);
}

color_test = "#ff0000";


var maxBarChartYValue = 12000; // gets updated after filter change or state selection

// Update the y-Axis limit (max patent number in all years and all classes in selected state)
function updateMaxBarChartYValue() {
    var activeFilters = getActiveFilters();

    var currentPatentData = [];
    if (selectedState == null) {
        const allPatentDataYear = patent_data;
        currentPatentData = [];
        activeFilters.forEach(filter => {
            for (yr = 1990; yr <= 2014; yr++) {
                var patentSum = 0;
                const patentDataPerClass = allPatentDataYear.filter(x => (x[" IPC"] === filter) && (x[" DATE"] === yr.toString()));
                // console.log(patentDataPerClass);
                patentDataPerClass.forEach(patent => {
                    patentSum += parseInt(patent[" AMOUNT"]);
                });
                const singlePatentData = {
                    BUNDESLAND_NAME: "all",
                    " DATE": yr.toString(),
                    " IPC": filter,
                    " AMOUNT": patentSum
                };
                currentPatentData.push(singlePatentData);
            }
        });

    } else {
        currentPatentData = patent_data.filter(x => activeFilters.includes(x[" IPC"]) && x.BUNDESLAND_NAME === selectedState);
    }
    maxBarChartYValue = d3.max(currentPatentData, data => parseInt(data[" AMOUNT"]));
    // round to the next 10-th if below 1000, else the next 100-th
    maxBarChartYValue = ceilToTenth(maxBarChartYValue, (maxBarChartYValue < 1000) ? 1 : 2)
}


// A function that create / update the plot for a given variable:
function updateBarChart() {
    const year = getSliderVal();
    var activeFilters = getActiveFilters();

    var currentPatentData = [];
    if (selectedState == null) {
        // currentPatentData = patent_data.filter(x => x[" DATE"] === year);
        const allPatentDataYear = patent_data.filter(x => x[" DATE"] === year);
        currentPatentData = [];
        activeFilters.forEach(filter => {
            const patentDataPerClass = allPatentDataYear.filter(x => x[" IPC"] === filter);
            var patentSum = 0;
            patentDataPerClass.forEach(patent => {
                patentSum += parseInt(patent[" AMOUNT"]);
            });
            var singlePatentData = {
                BUNDESLAND_NAME: "all",
                " DATE": year,
                " IPC": filter,
                " AMOUNT": patentSum
            };
            currentPatentData.push(singlePatentData);
        });

    } else {
        currentPatentData = patent_data.filter(x => x[" DATE"] === year && x.BUNDESLAND_NAME === selectedState);
    }
    
    const finalPatentData = [];
    currentPatentData.forEach(element => {
        if(activeFilters.includes(element[" IPC"])) {
            finalPatentData.push(element);
        }
    });
    
    var width = $("#bar-chart").width() - margin.left - margin.right,
    height = $("#bar-chart").height() - margin.bottom;

    // Update the X axis
    x.domain(finalPatentData.map(data => data[" IPC"]));
    xAxis.call(d3.axisBottom(x))

    // Update the Y axis
    // y.domain([0, d3.max(finalPatentData, data => parseInt(data[" AMOUNT"]))]);
    y.domain([0, maxBarChartYValue]);
    yAxis.transition().duration(500).call(d3.axisLeft(y));
    // yAxis.call(d3.axisLeft(y));

    svgBarChart.selectAll(".bars").remove();

    var bars = svgBarChart.append("g")
        .attr("class", "bars");

    bars.selectAll("g")
        .data(finalPatentData)
        .join("g")
        .on("mouseover", mouseoverBarChart)
        .on("mousemove", mousemoveBarChart)
        .on("mouseleave", mouseleaveBarChart);

    bars.selectAll("g")
        .append("rect")
        .attr("x", data => x(data[" IPC"]))
        .attr("y", data => y(data[" AMOUNT"]))
        .attr("width", x.bandwidth())
        // .attr("height", data => height - y(data[" AMOUNT"]))
        .attr("height", data => height - y(data[" AMOUNT"]))
        .attr("fill", "#009440")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    bars.selectAll("g")
        .append("image")
            .attr("xlink:href", function(data) { return `images/icons_ipc_classes/ic_ipc_${data[" IPC"]}.svg`; })
            .attr("width", iconSize)
            .attr("class", "bar-icon")
            .attr("style", function(data) {return isBarHeightSufficient(height, data, x.bandwidth()) ? "filter: invert(73%) sepia(56%) saturate(4296%) hue-rotate(140deg) brightness(96%) contrast(101%)" : ""})
            .attr("x", data => x(data[" IPC"]) + x.bandwidth() / 2 - iconSize / 2)
            .attr("y", data => !isBarHeightSufficient(height, data, x.bandwidth()) ? (y(data[" AMOUNT"]) + x.bandwidth() / 4) : (y(data[" AMOUNT"]) - x.bandwidth() / 4 - iconSize))
            .attr("transform", `translate(${margin.left},${margin.top})`);
}

function getTextWidth(textInput) {
  
    text = document.createElement("span");
    document.body.appendChild(text);

    text.style.font = "sans-serif";
    text.style.fontSize = 16 + "px";
    text.style.fontWeight = 400;
    text.style.height = 'auto';
    text.style.width = 'auto';
    text.style.position = 'absolute';
    text.innerHTML = textInput;

    width = Math.ceil(text.clientWidth);

    document.body.removeChild(text);
    return width + 2;
}

// endregion BARCHART