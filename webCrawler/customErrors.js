class BrowserNameError extends Error {
    constructor(message) {
      super(message);
      this.name = 'BrowserNameError';
    }
  }

module.exports = BrowserNameError;