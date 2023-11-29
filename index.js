// Entry point to start the application
const App = require('./src/controllers/App');

// Create an instance of the App class
const runApp = new App();

// Start data collection and insertion into SQL
runApp.startDataCollectionInterval();
