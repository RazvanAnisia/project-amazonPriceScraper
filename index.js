const pupeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
require('dotenv').config();

const url =
  'https://www.amazon.co.uk/OnePlus-RAM-128-SIM-Free-Smartphone-Frosted-Silver/dp/B07XHHKMKV/ref=sr_1_1?dchild=1&keywords=oneplus+7&qid=1584605029&sr=8-1';

async function configureBrowser() {
  const browser = await pupeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  return page;
}

async function checkPrice(page) {
  await page.reload();
  let html = await page.evaluate(() => document.body.innerHTML);
  let price = $('#priceblock_ourprice', html).text();
  let intPrice = price.replace(/[^0-9.-]+/g, '');
  if (intPrice < 550) {
    sendNotification(intPrice);
  }
  console.log(intPrice);
}

async function startTracking() {
  const page = await configureBrowser();

  let job = new CronJob(
    '* * */23 * * *',
    function() {
      //runs every 23 Hours  in this config
      checkPrice(page);
    },
    null,
    true,
    null,
    null,
    true
  );
  job.start();
}

async function sendNotification(price) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });

  let textToSend = 'Price dropped to ' + price;
  let htmlText = `<a href=\"${url}\">Link</a>`;

  let info = await transporter.sendMail({
    from: '"Price Tracker" <node-bot>',
    to: process.env.TO_EMAIL,
    subject: 'Price dropped to ' + price,
    text: textToSend,
    html: htmlText
  });

  console.log('Message sent: %s', info.messageId);
}

startTracking();
