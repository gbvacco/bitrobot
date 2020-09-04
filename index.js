// IMPORTS
const axios = require('axios').default;
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const env = require('dotenv').config();

const telegramChatBot = process.env.TELEGRAM_BOT_ID;
const telegramChatBotID = process.env.TELEGRAM_CODE;
const bot = new TelegramBot(telegramChatBot, { polling: true });

let brazilPrice = 0;
let brazilExchanges = [];
let usaPrice = 0;
let usaExchanges = [];

let diffPercentage = 0;

// Calc the diff price in percentage
function percentageDiff(a, b) {
    return 100 * Math.abs((a - b) / ((a + b) / 2));
}

function round(val) {
    return Math.round(val * 100) / 100;
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
                        brazilExchanges = value.exchanges;
                        break;
                    case 48:
                        usaPrice = value.avg_price;
                        usaExchanges = value.exchanges;
                        break;
                    default:
                }
            });
            diffPercentage = round(percentageDiff(usaPrice, brazilPrice));
            // console.log(response.data);
            console.log('PREÇO BR: ' + brazilPrice);
            console.log('PREÇO USA: ' + usaPrice);
            console.log('DIFERENÇA: ' + diffPercentage);

            if (diffPercentage >= 5) {
                axios.post(`${process.env.TELEGRAM_URL}${telegramChatBot}/sendMessage?chat_id=${telegramChatBotID}&text=Diferenca do bitcoin EUA/BR em porcentagem: ${diffPercentage}%`);
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
}

function getExchanges() {
    var message = '';
    message += `Veja as cotações nas corretoras: \n \n`;
    message += 'Corretoras Brasileiras: \n';
    Object.values(brazilExchanges).forEach(function (value) {
        message += `${value.exchange_name} - COMPRA: ${value.ticker_buy} VENDA: ${value.ticker_sell} \n`;
    });
    message += '\n \n ============= \n \n';
    message += 'Corretoras Americanas: \n';
    Object.values(usaExchanges).forEach(function (value) {
        message += `${value.exchange_name} - COMPRA: ${value.ticker_buy} VENDA: ${value.ticker_sell} \n`;
    });
    return message;
}

// Answer message
bot.on('message', (msg) => {
    getPrice();
    const chatId = msg.chat.id;

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, `A diferença do bitcoin EUA/BR em porcentagem é de ${diffPercentage}%`);
    bot.sendMessage(chatId, `O preço médio no Brasil é de US$${round(brazilPrice)} e nos EUA é de US$${round(usaPrice)}`);
    bot.sendMessage(chatId, getExchanges());
});


// Cron the task to check price for each 5 seconds
var task = cron.schedule('5 * * * *', () => {
    getPrice();
}, {
    scheduled: false
});

// init cron task
task.start();
getPrice();