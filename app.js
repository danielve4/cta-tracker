var express = require('express');
var https = require('https');
var weather = require('./controllers/weather.js');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');

app.get('/', function(request, response) {
  response.sendFile(__dirname+'/views/index.html');
});

app.use('/weather', weather);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
