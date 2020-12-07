document.addEventListener('DOMContentLoaded', function () {
    google.charts.load('current', {'packages':['table']});
    google.charts.setOnLoadCallback(drawTable);

    google.charts.load('current', {
        'packages':['geochart'],
        // Note: you will need to get a mapsApiKey for your project.
        // See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
        'mapsApiKey': 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
    });

    google.charts.setOnLoadCallback(drawGeoMap);

    google.charts.load('current', {packages: ['corechart', 'bar']});
    google.charts.setOnLoadCallback(drawConfirmed);

    google.charts.load('current', {packages: ['corechart', 'bar']});
    google.charts.setOnLoadCallback(drawDeaths);

});

async function getData() {
    // fetch data from pomber github
    let response = await fetch(
        "https://pomber.github.io/covid19/timeseries.json"
    );
    let data = await response.json();
    //console.log(data)
   
    // make arrays
    const date = [];
    const confirmed = [];
    const confirmedCasesToday = [];
    const confirmedCasesGlobalPerDay = [];
    var totalConfirmed = 0;
    const deaths = [];
    const deathsToday = [];
    const deathsGlobalPerDay = [];
    var totalDeaths = 0;
    const recovered = [];
    const recoveredUntilToday = [];
    const recoveredGlobalPerDay = [];
    var totalRecovered = 0;

    // list of all the countries (191) in the dataset
    var countryList = Object.keys(data);

    countryList.forEach(function(country, index) {
        confirmedCasesToday.push(data[country][data[country].length-1]['confirmed']);
        deathsToday.push(data[country][data[country].length-1]['deaths']);
        recoveredUntilToday.push(data[country][data[country].length-1]['recovered']);

        totalConfirmed += data[country][data[country].length-1]['confirmed'];
        totalDeaths += data[country][data[country].length-1]['deaths'];
        totalRecovered += data[country][data[country].length-1]['recovered'];
    });

    // loop to make arrays that hold all the global confirmed cases/death per day
    const conf = [];
    const death = [];
    const recov = [];
    for (var j = 1; j < data['Netherlands'].length; j++) {
        const conf = [];
        const death = [];
        const recov = [];
        countryList.forEach(function(country, index) {
            conf.push(data[country][j]['confirmed']-data[country][j-1]['confirmed']);
            death.push(data[country][j]['deaths']-data[country][j-1]['deaths']);
            recov.push(data[country][j]['recovered']-data[country][j-1]['recovered']);
        });

        var sumC = 0;
        var sumD = 0;
        var sumR = 0;
        for (var i = 0; i < conf.length; i++) {
            sumC += conf[i]
            sumD += death[i]
            sumR += recov[i]
        }
        confirmedCasesGlobalPerDay.push(sumC);
        deathsGlobalPerDay.push(sumD);
        recoveredGlobalPerDay.push(sumR);

    }
    //console.log(confirmedCasesGlobalPerDay)

    // add Global option at the beginning of the countryList array
    countryList.unshift("Global")
    confirmedCasesToday.unshift(totalConfirmed)
    deathsToday.unshift(totalDeaths)
    recoveredUntilToday.unshift(totalRecovered)

    // total cases and deaths to html
    document.getElementById('globalCases').innerHTML = numberWithCommas(totalConfirmed)
    document.getElementById('globalDeaths').innerHTML = numberWithCommas(totalDeaths)
    document.getElementById('globalRecovered').innerHTML = numberWithCommas(totalRecovered)
    document.getElementById('globalRecoveredToday').innerHTML = '+' + numberWithCommas(recoveredGlobalPerDay[recoveredGlobalPerDay.length-1])

    // add option in country select button for each country in the list
    countryList.forEach(selectCountry)
    //console.log(countryList)

    function selectCountry(country) {
        var x = document.getElementById("countrySelect");
        var option = document.createElement("option");
        option.text = country;
        x.add(option);
    }

    const newArr = [countryList, confirmedCasesToday, deathsToday, recoveredUntilToday]
    //console.log(newArr)

    return {
        data, date, confirmed, deaths, recovered, confirmedCasesToday, deathsToday, recoveredUntilToday, countryList, newArr, confirmedCasesGlobalPerDay, deathsGlobalPerDay, recoveredGlobalPerDay 
    }
};

// draws the table with all the data per country
async function drawTable() {
    // get data to use in the table
    const data = await getData();

    var dat = new google.visualization.DataTable();
    dat.addColumn('string', 'Country');
    dat.addColumn('number', 'Cases');
    dat.addColumn('number', 'Deaths');
    dat.addColumn('number', 'Recovered');
    for (var i = 0; i < data.countryList.length; i++) {
        dat.addRows([
            [data.countryList[i], data.confirmedCasesToday[i], data.deathsToday[i], data.recoveredUntilToday[i]]
        ]);
    }

    var options = {
        title: 'Confirmed Cases Per Day',
        titleTextStyle: {
            color: '#ffffff',
        },
        height: 200,
        backgroundColor: '#242627',
        cssClassNames: { 
            headerRow: 'headerRow',
            tableRow: 'tableRow',
            oddTableRow: 'oddTableRow',
            selectedTableRow: 'selectedTableRow',
            // hoverTableRow: 'hoverTableRow',
            headerCell: 'headerCell',
            tableCell: 'tableCell',
            rowNumberCell: 'rowNumberCell'
        }
    }
    
    var table = new google.visualization.Table(document.getElementById('table_div'));
    table.draw(dat, options, {showRowNumber: false, width: '100%', height: '100%'});

};

// draws the global map that highlights all the cases + deaths per country (including heat map)
async function drawGeoMap() {
    const data = await getData();

    var dat = new google.visualization.DataTable();
    dat.addColumn('string', 'Country');
    dat.addColumn('number', 'Cases');
    dat.addColumn('number', 'Deaths');
    for (var i = 0; i < data.countryList.length; i++) {
        dat.addRows([
            [data.countryList[i], data.confirmedCasesToday[i], data.deathsToday[i]]
        ]);
    }
    var options = {
        colorAxis: {minValue: 100000, maxValue: 1500000 ,colors: ['#bfe488', '#ff9595']},
        backgroundColor: 'transparent',
        fontFamily: 'Roboto Condensed',
        datalessRegionColor: '#777',   
        legend: {textStyle: {color: 'black'}},
        width: 700, 
    };
    var chart = new google.visualization.GeoChart(document.getElementById('globalMap'));
    chart.draw(dat, options);
}

// draws the confirmed cases per country graph
async function drawConfirmed() {
    const data = await getData()

    var dat = new google.visualization.DataTable();
    countryList = data.countryList.shift();

    dat.addColumn('date', 'Date');
    dat.addColumn('number', 'Confirmed Cases Per Day');
    for (var i = 0; i < data.data['Netherlands'].length-1; i++) {
        dat.addRows([
            [new Date(data.data['Netherlands'][i]['date']), data.confirmedCasesGlobalPerDay[i]]
        ])
    };

    var options = {
        title: 'Confirmed Cases Per Day',
        titleTextStyle: {
            color: '#ffffff',
        },
        legend: {position: 'none'},
        backgroundColor: '#242627',
        width: 700,
        vAxis: {
            textStyle:{color: '#ffffff'},
        },
        hAxis: {
            format: 'MMM yy',
            textStyle:{color: '#ffffff'},
        }
    }

    var chart = new google.visualization.ColumnChart(document.getElementById('countryConfirmed'));
    chart.draw(dat, options);

    document.getElementById('globalCasesToday').innerHTML = '+' + numberWithCommas(data.confirmedCasesGlobalPerDay[data.confirmedCasesGlobalPerDay.length-1])
}

// draws the deaths per country graph
async function drawDeaths() {
    const data = await getData()

    var dat = new google.visualization.DataTable();
    countryList = data.countryList.shift();

    dat.addColumn('date', 'Date');
    dat.addColumn('number', 'Deaths per Day');
    for (var i = 0; i < data.data['Netherlands'].length-1; i++) {
        dat.addRows([
            [new Date(data.data['Netherlands'][i]['date']), data.deathsGlobalPerDay[i]]
        ])
    };

    var options = {
        title: 'Deaths Per Day',
        titleTextStyle: {
            color: '#ffffff',
        },
        legend: {position: 'none'},
        backgroundColor: '#242627',
        width: 700,
        vAxis: {
            textStyle:{color: '#ffffff'},
        },
        hAxis: {
            format: 'MMM yy',
            textStyle:{color: '#ffffff'},
        }
    }

    var chart = new google.visualization.ColumnChart(document.getElementById('countryDeaths'));
    chart.draw(dat, options);

    document.getElementById('globalDeathsToday').innerHTML = '+' + numberWithCommas(data.deathsGlobalPerDay[data.deathsGlobalPerDay.length-1])
}

// formatting numbers from 1000000 to 1,000,000 for better readability
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// changes the graphs data according to the selected country
async function changeCountry() {
    //console.log('Country Changed')
    var country = document.getElementById("countrySelect").value
    //console.log(country)

    const data = await getData()

    if (country == 'Global') {
        drawConfirmed()
        drawDeaths()
    } else {
        // change cases, deaths & recovered numbers
        var totalConfirmed = 0;
        var totalDeaths = 0;
        var totalRecovered = 0;

        totalConfirmed += data.data[country][data.data[country].length-1]['confirmed'];
        totalDeaths += data.data[country][data.data[country].length-1]['deaths'];
        totalRecovered += data.data[country][data.data[country].length-1]['recovered'];

        document.getElementById('globalCases').innerHTML = numberWithCommas(totalConfirmed)
        document.getElementById('globalDeaths').innerHTML = numberWithCommas(totalDeaths)
        document.getElementById('globalRecovered').innerHTML = numberWithCommas(totalRecovered)

        changeCases = data.data[country][data.data[country].length-1]['confirmed'] - data.data[country][data.data[country].length-2]['confirmed']
        changeDeaths = data.data[country][data.data[country].length-1]['deaths'] - data.data[country][data.data[country].length-2]['deaths']
        changeRecovered = data.data[country][data.data[country].length-1]['recovered'] - data.data[country][data.data[country].length-2]['recovered']

        document.getElementById('globalCasesToday').innerHTML = '+' + numberWithCommas(changeCases)
        document.getElementById('globalDeathsToday').innerHTML = '+' + numberWithCommas(changeDeaths)
        document.getElementById('globalRecoveredToday').innerHTML = '+' + numberWithCommas(changeRecovered)

        // change confirmed graph
        var conf = new google.visualization.DataTable();
        conf.addColumn('date', 'Date');
        conf.addColumn('number', 'Confirmed per Day');
        for (var i = 1; i < data.data[country].length-1; i++) {
            conf.addRows([
                [new Date(data.data[country][i]['date']), data.data[country][i]['confirmed']-data.data[country][i-1]['confirmed']]
            ])
        };

        var options = {
            title: 'Confirmed Cases Per Day',
            titleTextStyle: {
                color: '#ffffff',
            },
            legend: {position: 'none'},
            backgroundColor: '#242627',
            width: 700,
            vAxis: {
                textStyle:{color: '#ffffff'},
            },
            hAxis: {
                format: 'MMM yy',
                textStyle:{color: '#ffffff'},
            }
        }

        var chart = new google.visualization.ColumnChart(document.getElementById('countryConfirmed'));
        chart.draw(conf, options);

        // change death graph
        var deaths = new google.visualization.DataTable();
        deaths.addColumn('date', 'Date');
        deaths.addColumn('number', 'Deaths per Day');
        for (var i = 1; i < data.data[country].length-1; i++) {
            deaths.addRows([
                [new Date(data.data[country][i]['date']), data.data[country][i]['deaths']-data.data[country][i-1]['deaths']]
            ])
        };

        var options = {
            title: 'Deaths Per Day',
            titleTextStyle: {
                color: '#ffffff',
            },
            legend: {position: 'none'},
            backgroundColor: '#242627',
            width: 700,
            vAxis: {
                textStyle:{color: '#ffffff'},
            },
            hAxis: {
                format: 'MMM yy',
                textStyle:{color: '#ffffff'},
            }
        }

        var chart = new google.visualization.ColumnChart(document.getElementById('countryDeaths'));
        chart.draw(deaths, options);

        // change differences per country
        //document.getElementById('globalRecoveredToday').innerHTML = numberWithCommas(conf[conf.length-1])
        //document.getElementById('globalRecoveredToday').innerHTML = numberWithCommas(deaths[deaths.length-1])
        //document.getElementById('globalRecoveredToday').innerHTML = numberWithCommas(data.recoveredGlobalPerDay[data.recoveredGlobalPerDay.length-1])
    }
}