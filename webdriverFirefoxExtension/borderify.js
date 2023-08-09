Object.defineProperty(navigator, 'webdriver', {get: () => undefined})
console.log("Value is now: " + navigator.webdriver);
delete Object.getPrototypeOf(navigator).webdriver;
console.log("Value is now: " + navigator.webdriver);