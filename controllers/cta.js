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

router.get('/bus/follow/:vehicleId', function (request, response) {
  var vehicleId = request.params.vehicleId;
  
  followBusPredictions(vehicleId, function (predictions) {
    response.send(predictions['bustime-response']);
  })
});

router.get('/train/:mapId', function(request, response) {
  var mapId = request.params.mapId;
  var predictions = {
    'predictions':[]
  };
  var aPrediction;

  getTrainPredictions(mapId, function (pred) {
    if(pred.hasOwnProperty('ctatt') && pred.ctatt.errCd == 0) {
      var aP, predictionTime, tempTime, diff, diffMins;
      if(pred.ctatt.hasOwnProperty('eta')) {
        for(var i=0;i<pred.ctatt.eta.length;i++) {
          aPrediction = {};
          aP = pred.ctatt.eta[i];
          predictionTime = new Date(aP.prdt);
          tempTime = new Date(aP.arrT);
          diff = tempTime - predictionTime;
          diffMins = Math.round((diff/1000)/60); // minutes
          aPrediction['eta'] = diffMins;
          switch(aP.rt) {
            case 'Brn':
              aPrediction['line'] = 'Brown';
              break;
            case 'G':
              aPrediction['line'] = 'Green';
              break;
            case 'Org':
              aPrediction['line'] = 'Orange';
              break;
            case 'P':
              aPrediction['line'] = 'Purple';
              break;
            case 'Y':
              aPrediction['line'] = 'Yellow';
              break;
            default:
              aPrediction['line'] = aP.rt;
              break;
          }
          aPrediction['run'] = aP.rn;
          aPrediction['destination'] = aP.destNm;
          aPrediction['isApp'] = aP.isApp;
          aPrediction['isSch'] = aP.isSch;
          aPrediction['isDly'] = aP.isDly;
          aPrediction['trDr'] = aP.trDr;
          aPrediction['stopId'] = aP.stpId;
          predictions.predictions[i] = aPrediction;
        }
      }
      response.send(predictions);
    } else {
      response.send("There was an error");
    }
  });
});

router.get('/train/follow/:runnum', function(request, response) {
  var runNumber = request.params.runnum;
  var predictions = {
    'predictions':[]
  };
  var aPrediction;
  
  followTrainPredictions(runNumber, function (pred) {
    if(pred.hasOwnProperty('ctatt') && pred.ctatt.errCd == 0) {
      var aP, predictionTime, tempTime, diff, diffMins;
      if(pred.ctatt.hasOwnProperty('eta')) {
        for(var i=0;i<pred.ctatt.eta.length;i++) {
          aPrediction = {};
          aP = pred.ctatt.eta[i];
          predictionTime = new Date(aP.prdt);
          tempTime = new Date(aP.arrT);
          diff = tempTime - predictionTime;
          diffMins = Math.round((diff/1000)/60); // minutes
          aPrediction['eta'] = diffMins;
          aPrediction['run'] = aP.rn;
          aPrediction['stopName'] = aP.staNm;
          aPrediction['isSch'] = aP.isSch;
          aPrediction['isDly'] = aP.isDly;
          aPrediction['stopId'] = aP.staId;
          predictions.predictions[i] = aPrediction;
        }
      }
      response.send(predictions);
    } else {
      response.send("There was an error");
    }
  });
});

function getRouteStops(route, direction, callback) {
  var routeStopsQuery = 'http://ctabustracker.com/bustime/api/v2/getstops?key='+ctaBusKey+
    '&rt='+route+'&dir='+direction+'&format=json';
  httpget(routeStopsQuery, function (data) {
    callback(data);
  });
}

function getTrainPredictions(mapId, callback) {
  var predictionQuery = 'http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key='+ctaTrainKey +
      '&mapid='+mapId+'&outputType=JSON';
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

function followBusPredictions(vehicleId, callback) {
  var followBusQuery = 'http://www.ctabustracker.com/bustime/api/v2/getpredictions?key='+ctaBusKey+
    '&vid='+vehicleId+'&format=json';
  httpget(followBusQuery, function (data) {
    callback(data);
  });
}

function followTrainPredictions(runNumber, callback) {
  var followTrainQuery = 'http://lapi.transitchicago.com/api/1.0/ttfollow.aspx?key='+ctaTrainKey +
    '&runnumber='+runNumber+'&outputType=JSON';
  httpget(followTrainQuery, callback)
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
