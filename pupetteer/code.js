const {Builder} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');;

let options = new firefox.Options()
    .setBinary('/drivers/geckodriver');

let driver = new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();

