document.body.style.border = "5px solid red";
// delete Object.getPrototypeOf(navigator).webdriver;
Object.defineProperty(navigator, 'webdriver', {get: () => undefined})
console.log(navigator.webdriver);