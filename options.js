/*
    Author: @zjorge96
    Date: 2022-10-01
    Description: This project is used to scrape the options chain from marketwatch.com.
    The data is then categorized by strike price and expiration date with visualization
    via a website running on a local server.
*/

const cheerio = require('cheerio');
const axios = require('axios');

// Get the options chain from marketwatch.com
function getURL(ticker) {
    return `https://www.marketwatch.com/investing/stock/${ticker}/options`;
}

// Converts the date to a Date object
function getDate(date) {
    return new Date(date.text().split(' ').slice(1).join(' '))
}

// Calculates the remaining days till expiration
function getDaysLeft(date) {
    const expirationDate = getDate(date);
    const today = new Date();
    const difference = Math.abs(expirationDate - today);
    return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

// Calculates the return on investment
function getROI(days_left, option_price, currentPrice) {
    if (days_left == 0)
        weeks = 0
    else
        weeks = days_Left / 7;
    return 100.00 * (option_price / currentPrice) / weeks;
}

// Used to take an HTML formatted table and find the closest call and put
function convertTable(table, $, ticker, expiration, days_Left) {
    call = {};
    put = {};
    try {
        var options = [];
        table.find('tr').each((i, row) => {
            const cols = $(row).find('td');
            const rowData = [];
            cols.each((j, col) => {
                // Ignore the first column
                if (j != 0)
                    rowData.push($(col).text());
            });
            options.push(rowData);
        });

        // Loop through and find the closest call and put
        for (var i = 0; i < options.length; i++) {
            if (options[i][0].includes('Current')) {
                const strikePriceIndex = Math.floor(options[i-1].length / 2);
                const currentPrice = parseFloat(options[i].splice(1, 1)).toFixed(2);
                const callBid = parseFloat(options[i+1][0]).toFixed(2);
                const putBid = parseFloat(options[i-1][strikePriceIndex+1]).toFixed(2);
                call = {
                    "Current" : currentPrice,
                    "Strike" : parseFloat(options[i+1][strikePriceIndex]).toFixed(2),
                    "Bid" : callBid,
                    "RoI" : getROI(days_Left, callBid, currentPrice).toFixed(2)
                }
                put = {
                    "Current" : currentPrice,
                    "Strike" : parseFloat(options[i-1][strikePriceIndex]).toFixed(2),
                    "Bid" : putBid,
                    "RoI" : getROI(days_Left, putBid, currentPrice).toFixed(2)
                }
            }
        }
    } catch (error) {
        console.log(error);
    }

    return output = {
                "Ticker" : ticker,
                "Call" : call,
                "Put" : put,
                "Expiration" : getDate(expiration).toDateString(),
                "Days" : days_Left
            };
}

async function getOptionsChain(ticker) {
    option = {};
    days_left = 0;
    try {
        // Get the HTML from the URL
        const url = getURL(ticker);
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Return the number of days till expiration
        var expiration = $('#maincontent > div.region.region--primary > div > div > mw-hybrid > div.accordion__item.is-selected.j-tabPane > div.accordion__body.j-tabBody > div > div > div > table:nth-child(1) > thead.option__header > tr > th:nth-child(3) > div > span');
        days_Left = getDaysLeft(expiration);

        // Get the closest call and put off the strike price
        const table = $('#maincontent > div.region.region--primary > div > div > mw-hybrid > div.accordion__item.is-selected.j-tabPane > div.accordion__body.j-tabBody > div > div > div > table > tbody');
        option = convertTable(table, $, ticker, expiration, days_Left);

    } catch (error) {
        console.log(error);
    }
    return option
}

function getLists() { // used to get a list of all the files in the sectors folder
    const fs = require('fs');
    return new Promise((resolve, reject) => {
        fs.readdir('static/sectors', (err, files) => {
            if (err) {
                console.error(err)
                reject(err);
            }
            // Remove '.txt' from the end of the file name
            resolve(files.map((file) => file.slice(0, -4)));
        })
    })
}

// Function to open a text file and return the tickers
function getTickers(file_name) {
    const fs = require('fs');
    const readline = require('readline');
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream('static/sectors/' + file_name + '.txt');
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        var tickers = [];
        rl.on('line', (line) => {
            tickers.push(line);
        });
        rl.on('close', () => {
            resolve(tickers);
        });
    })
}

// Export the function so it can be used in other files
module.exports = { getOptionsChain, getTickers, getLists };