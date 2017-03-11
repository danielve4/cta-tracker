var http = require('http');
var express = require('express')
  ,router = express.Router();

var ctaBusKey = 'uExBP8b6nVp874MZXZAzW3UsT';
var ctaTrainKey = '1647d0e3c8494071aaa1555599e68284';


router.get('/bus/:rt,:dir', function(request, response) {
  var route = request.params.rt;
  var direction = request.params.dir;

  getRouteStops(route, direction, function (stops) {
    response.send(stops['bustime-response'].stops);
  });
});

router.get('/bus/:stopId', function(request, response) {
  var stopId = request.params.stopId;

  getBusPredictions(stopId, function (predictions) {
    response.send(predictions['bustime-response']);
  });
});

router.get('/train/:stopId,:mapId', function(request, response) {
  var stopId = request.params.stopId;
  var mapId = request.params.mapId;

  getTrainPredictions(stopId, mapId, function (predictions) {
    response.send(predictions['ctatt']);
  });
});


function getRouteStops(route, direction, callback) {
  var routeStopsQuery = 'http://ctabustracker.com/bustime/api/v2/getstops?key='+ctaBusKey+
    '&rt='+route+'&dir='+direction+'&format=json';
  httpget(routeStopsQuery, function (data) {
    callback(data);
  });
}

function getTrainPredictions(stopId, mapId, callback) {
  var predictionQuery = 'http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key='+ctaTrainKey +
      '&stpid='+stopId+'&mapid='+mapId+'&outputType=JSON';
  httpget(predictionQuery, function (data) {
    callback(data);
  });
}

function getBusPredictions(stopId, callback) {
  var predictionsQuery = 'http://www.ctabustracker.com/bustime/api/v2/getpredictions?key='+ctaBusKey+
    '&stpid='+stopId+'&format=json';
  httpget(predictionsQuery, function (data) {
    callback(data);
  });
}

function httpget(query, callback) {
  http.get(query, function(res) {
    var body = '';
    res.on('data', function(chunk) { //Add incoming data to body
      body += chunk;
    });
    res.on('end', function() { //Pass the data back once all is retrieved
      body = JSON.parse(body);
      callback(body);
    });
    res.on('error', function (error) {
      callback('Error: ' + error.message);
    });
  });
}

module.exports = router;
