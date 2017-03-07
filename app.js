var express = require('express');
var http = require('http');
var cta = require('./controllers/cta.js');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');

app.get('/', function(request, response) {
  response.sendFile(__dirname+'/views/index.html');
});

app.use('/cta', cta);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
