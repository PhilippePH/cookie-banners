const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// register `puppeteer-extra` plugins.
puppeteer.use(StealthPlugin()) // allows to pass all tests on SannySoft, even if not *actually* in headfull mode

async function browserObject(TBD){
    let browser = puppeteer.launch({
        headless: false, // allows to pass most tests on SannySoft, except WebDrive
        // ignoreHTTPSErrors: true, // would this be desirable? -- allows you to visit websites that aren’t hosted over a secure HTTPS protocol and ignore any HTTPS-related errors.
        args: [
            '--start-maximized'// browser takes whole screen. 
            // --proxy-server = x.x.x.x:xxxx // this can be used to specify the IP address
        ] 
    });
    return browser;
}

module.exports = {
	browserObject
};