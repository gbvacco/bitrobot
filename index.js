const axios = require('axios').default;
const cron = require('node-cron');
const telegramChatBot = '787569456:AAHN9Dd5vy-nML9SD1hOX1xBtXPyV7okACg';
const telegramChatBotID = '-386477240';

var brazilPrice = 0;
var usaPrice = 0;
var diffPercentage = 0;

// Calc the diff price in percentage
function percentageDiff(a, b) {
    return 100 * Math.abs((a - b) / ((a + b) / 2));
}

// Get prices from API and check it and calc the diff 
function getPrice() {
    axios.get('https://bitcoin-map-price-backend.herokuapp.com/markers')
        .then(function (response) {
            const result = response.data;
            Object.values(result).forEach(function (value) {
                switch (value.country_id) {
                    case 5:
                        brazilPrice = value.avg_price;
                        break;
                    case 48:
                        usaPrice = value.avg_price;
                        break;
                    default:
                }
            });
            diffPercentage = Math.round(percentageDiff(usaPrice, brazilPrice) * 100) / 100;
            // console.log(response.data);
            console.log('PREÇO BR: ' + brazilPrice);
            console.log('PREÇO USA: ' + usaPrice);
            console.log('DIFERENÇA: ' + diffPercentage);

            if (diffPercentage >= 0.40) {
                axios.post(`https://api.telegram.org/bot${telegramChatBot}/sendMessage?chat_id=${telegramChatBotID}&text=Diferenca do bitcoin EUA/BR em porcentagem: ${diffPercentage}%`);
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .finally(function () {
            // always executed
        });
}

// Cron the task to check price for each 5 seconds
var task = cron.schedule('0-59/5 * * * * *', () => {
    getPrice();
}, {
    scheduled: false
});

// init cron task
task.start();