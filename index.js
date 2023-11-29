// Entry point to start the application
const App = require('./src/controllers/App');

// Create an instance of the App class
const myApp = new App();

// Start data collection and insertion into SQL
myApp.startDataCollectionInterval();
