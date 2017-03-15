$.noConflict();
jQuery(function($) {
  $(document).ready(function() {
    var FAV='fav',ROUTES='routes',DIRECT='directions',STOPS='stops',ARRIVALS='arrivals';
    var storageItem = 'favorites'; //Name of item in localStorage
    var favorites = [];
    var trainLines;
    var routes;
    $.getJSON('allTrainStops.json', function(json) {
      trainLines = json;
      console.log('loaded trainLines');
      $.getJSON('stops.json', function(json) {
        routes = json;
        console.log('loaded routes');
        decideScreen();
      });
    });


    function decideScreen() {
      if(!location.hash) {
        setScreenTo(FAV);
        listFavorites();
      } else {
        var context = parseHash(location.hash);
        if(context.hasOwnProperty('favorites')) {
          setScreenTo(FAV);
          listFavorites();
        } else  if(context.hasOwnProperty('routes')) {
          setScreenTo(ROUTES);
          listTrainLines();
          listRoutes();
        } else if(context.hasOwnProperty('rt')) {
          if(!context.hasOwnProperty('dir')) {
            setScreenTo(DIRECT);
            listRouteDirections(context.rt);
          }
          else if(context.hasOwnProperty('dir') &&
                  !context.hasOwnProperty('stop-id')) {
            setScreenTo(STOPS);
            getRouteStops(context.rt,context['dir']);
          }
          else if(context.hasOwnProperty('rt-name') &&
                  context.hasOwnProperty('dir') &&
                  context.hasOwnProperty('stop-id')) {
            setScreenTo(ARRIVALS);
            getBusPredictions(context['rt-name'].replace(/%20/g, ' '),context['dir'],context['stop-id']);
            checkFavorite();
          }
        } else if(context.hasOwnProperty('tl')) {
          if(!context.hasOwnProperty('dir')) {
            setScreenTo(DIRECT);
            listLineDirections(context['tl'])
          } else if(context.hasOwnProperty('dir') &&
                    !context.hasOwnProperty('stop')) {
            setScreenTo(STOPS);
            listLineStops(context['tl'], context['dir']);
          } else if(context.hasOwnProperty('dir') &&
                    context.hasOwnProperty('stop')) {
            setScreenTo(ARRIVALS);
            getTrainPredictions(context['tl'],context['dir'],context['stop']);
            checkFavorite();
          }
        }
      }
    }

    function listTrainLines() {
      $('#routes').empty();
      var line;
      for(var i=0; i<trainLines.trainLines.length; i++) {
        line = trainLines.trainLines[i];
        $('#routes').append(
          '<li>' +
            '<a href="#tl='+i+'">'+
              '<span class="line-color '+line.lineName.substring(0,3)+'"></span>'+
              '<span class="route-name">' +line.lineName+ ' Line</span></a>'+
          '</li>'
        );
      }
    }

    function listRoutes() {
      var route;
      for(var i=0; i<routes.routes.length; i++) {
        route = routes.routes[i];
        $('#routes').append(
          '<li>' +
            '<a href="#rt='+route.routeNumber+'"id="'+route.routeNumber+'">' +
              '<span class="route-number">'+route.routeNumber+ '</span>' +
              '<span class="route-name">' +route.routeName+ '</span>' +
            '</a>' +
          '</li>'
        );
      }
    }

    function listLineDirections(lineIndex) {
      var line = trainLines.trainLines[lineIndex];
      $('#route-directions').empty();
      $('#route-directions').append('<li class="list-subheader">'+line.lineName+' Line - Choose a direction</li>');
      for(var i=0;i<line.directions.length;i++) {
        $('#route-directions').append(
          '<li><a href="#tl='+lineIndex+'#dir='+i+'">'
          +'To '+line.directions[i].direction+
          '</a></li>'
        );
      }
    }

    function listRouteDirections(rNumber) {
      var route = routes[rNumber];
      $('#route-directions').empty();
      $('#route-directions').append('<li class="list-subheader">Route '+rNumber+' - Choose a direction</li>');
      for(var j=0;j<route.directions.length;j++) {
        $('#route-directions').append(
          '<li><a href="#rt='+rNumber+'#dir='+route.directions[j]+'">'
          +route.directions[j]+
          '</a></li>'
        );
      }
    }

    function listLineStops(lineIndex, directionIndex) {
      var line = trainLines.trainLines[lineIndex];
      var direction = line.directions[directionIndex];
      var aStop;
      $('#stops').empty();
      $('#stops').append(
        '<li class="list-subheader">'+line.lineName+' Line - '+ direction.direction+' -  Choose a stop</li>'
      );
      for(var i=0;i<trainLines.stops.length;i++) {
        aStop = trainLines.stops[i];
        if(aStop[line.lineName] && aStop.trDr == direction.trainDirection) {
          $('#stops').append(
            '<li><a href="#tl='+lineIndex+'#dir='+directionIndex+'#stop='+i+'">'
            +aStop.stationName+
            '</a></li>'
          );
        }
      }
    }

    function getRouteStops(route, direction) {
      $('#stops').empty();
      $('#stops').append(
        '<li class="list-subheader">Route '+routes[route].routeName+' - '+ direction+' -  Choose a stop</li>'
      );
      $.when($.ajax({
        type: 'GET',
        url: '/cta/bus/'+route+','+direction
      })).then(function(data) {
        listRouteStops(data, route, direction);
      }, function () {
        console.log('Error');
      });
    }

    function listRouteStops(stops, route, direction) {
      for(var m=0;m<stops.length;m++) {
        $('#stops').append(
          '<li><a href="#rt='+route+'#rt-name='+stops[m].stpnm+'#dir='+direction+'#stop-id='+stops[m].stpid+'">'
          +stops[m].stpnm+
          '</a></li>'
        );
      }
    }

    function getTrainPredictions(lineIndex, directionIndex, stopIndex) {
      var line = trainLines.trainLines[lineIndex];
      var direction = line.directions[directionIndex];
      var stop = trainLines.stops[stopIndex];
      var mapId = stop.mapId;
      var stopId = stop.stopId;
      var trDr = direction.trainDirection;
      $('#arrivals').empty();
      $('#arrivals').append('<li class="list-subheader">'+stop.stationName+' - '+stop.direction+' Bound</li>');
      $.when($.ajax({
        type: 'GET',
        url: '/cta/train/'+mapId
      })).then(function(data) {
        listTrainPrediction(data, trDr, stopId);
        console.log(data);
      }, function () {
        console.log('Error');
      });
    }

    function getBusPredictions(routeName, direction, stopId) {
      $('#arrivals').empty();
      $('#arrivals').append('<li class="list-subheader">'+routeName+' - '+ direction+'</li>');
      $.when($.ajax({
        type: 'GET',
        url: '/cta/bus/'+stopId
      })).then(function(data) {
        listPredictions(data);
      }, function () {
        console.log('Error');
      });
    }

    function listTrainPrediction(predictions, trDr, stopId) {
      if(predictions.hasOwnProperty('predictions')) {
        var count = 0;
        for (var i = 0; i < predictions.predictions.length; i++) {
          if (predictions.predictions[i].stopId == stopId || predictions.predictions[i].trDr == trDr) {
            count++;
            $('#arrivals').append(
              '<li class="prediction">' +
              '<span class="line-color ' + predictions.predictions[i].line.substring(0, 3) + '"></span>' +
              '<span class="destination">To ' + predictions.predictions[i].destination + '</span>' +
              '<span class="arrival-time">' + predictions.predictions[i].eta + 'm</span>' +
              '</li>'
            );
          }
        }
        if(count == 0) {
          $('#arrivals').append(
            '<li class="prediction">' +
              '<span>No arrival times</span>'+
            '</li>'
          );
        }
      }
    }

    function listPredictions(predictions) {
      console.log(predictions);
      var min;
      if(predictions.hasOwnProperty('prd')) {
        for(var n=0;n<predictions.prd.length;n++) {
          min=(isNaN(predictions.prd[n].prdctdn) ? '':'m');
          $('#arrivals').append(
            '<li class="prediction">'+
            '<span class="route-number">'+predictions.prd[n].rt+'</span>'+
            '<span class="destination">To '+predictions.prd[n].des+'</span>'+
            '<span class="arrival-time">'+predictions.prd[n].prdctdn+min+'</span>'+
            '</li>'
          );
        }
      } else if(predictions.hasOwnProperty('error')) {
        $('#arrivals').append(
          '<li class="prediction">'+predictions.error[0].msg+'</li>'
        );
      }
    }
    
    $('#favorite-button').on('click', function (e) {
      console.log('Favorite');
      toggleFavorite();
    });

    function listFavorites() {
      $('#favorites').empty();
      loadFavorites();
      var route, routeName, direction, stopI, fav;
      for(var p=0;p<favorites.favorites.length;p++) {
        fav = favorites.favorites[p];
        if(favorites.favorites[p].hasOwnProperty('train')) {
          $('#favorites').append(
            '<li>' +
              '<a href="#tl='+fav.trainLine+'#dir='+fav.direction+'#stop='+fav.stop+'">' +
                '<span class="line-color '+trainLines.trainLines[fav.trainLine].lineName.substring(0,3)+'"></span>'+
                '<span class="route-direction">'+trainLines.stops[fav.stop].direction.charAt(0)+'</span>'+
                '<span class="route-name">'+trainLines.stops[fav.stop].stationName+'</span>'+
              '</a>' +
            '</li>'
          );
        } else if(!favorites.favorites[p].hasOwnProperty('train')) {
          route = favorites.favorites[p].routeNumber;
          routeName = favorites.favorites[p].routeName;
          direction = favorites.favorites[p].direction;
          stopI = favorites.favorites[p].stopId;
          $('#favorites').append(
            '<li>' +
            '<a href="#rt='+route+'#rt-name='+routeName+'#dir='+direction+'#stop-id='+stopI+'">' +
            '<span class="route-number">'+route+'</span>'+
            '<span class="route-direction">'+direction.charAt(0)+'</span>'+
            '<span class="route-name">'+routeName+'</span>'+
            '</a>' +
            '</li>'
          );
        }
      }
    }

    function loadFavorites() {
      var favoritesJSON;
      favorites = localStorage.getItem(storageItem);
      try {
        favoritesJSON = JSON.parse(favorites);
        if (favoritesJSON && typeof favoritesJSON === "object") {
          favorites =  favoritesJSON;
        } else {
          favoritesJSON = {
            'favorites': []
          };
        }
      }
      catch (e) {
        favoritesJSON = {
          'favorites': []
        };
      }
      favorites =  favoritesJSON;
      console.log(favorites);
    }

    function toggleFavorite() {
      if($('#favorite-button').hasClass('fill')) {
        deleteFavorite();
      } else if($('#favorite-button').hasClass('no-fill')) {
        addToFavorites();
      }
    }

    function addToFavorites() {
      var exists = isFavorite();
      if(exists <= 0) { //Favorite does not exist
        var url = parseHash(location.hash);
        var newFavorite;
        if(url.hasOwnProperty('stop-id') && url.hasOwnProperty('rt') &&
          url.hasOwnProperty('rt-name') && url.hasOwnProperty('dir')) {
          newFavorite = {
            'routeNumber': url['rt'],
            'direction': url['dir'],
            'routeName': url['rt-name'].replace(/%20/g, ' '),
            'stopId': url['stop-id']
          };
        } else if(url.hasOwnProperty('tl') && url.hasOwnProperty('stop') && url.hasOwnProperty('dir')) {
          newFavorite = {
            'train': true,
            'trainLine': url['tl'],
            'stop': url['stop'],
            'direction': url['dir']
          };
        }
        favorites.favorites.push(newFavorite);
        localStorage.setItem(storageItem, JSON.stringify(favorites));
        $('#favorite-button').removeClass('no-fill');
        $('#favorite-button').addClass('fill');
      }
    }
    
    function deleteFavorite() {
      var index = isFavorite();
      if(index >= 0) {
        favorites.favorites.splice(index, 1);
        localStorage.setItem(storageItem, JSON.stringify(favorites));
        $('#favorite-button').removeClass('fill');
        $('#favorite-button').addClass('no-fill');
      }
    }
    
    function checkFavorite() {
      var exists = isFavorite();
      if(exists >= 0) {
        $('#favorite-button').removeClass('no-fill');
        $('#favorite-button').addClass('fill');
      } else {
        $('#favorite-button').removeClass('fill');
        $('#favorite-button').addClass('no-fill');
      }
    }

    function isFavorite() {
      var url = parseHash(location.hash);
      var stop;
      var u;
      loadFavorites();
      if(url.hasOwnProperty('stop-id') && url.hasOwnProperty('rt') &&
        url.hasOwnProperty('rt-name') && url.hasOwnProperty('dir')) {
        for (u = 0; u < favorites.favorites.length; u++) {
          if (!favorites.favorites[u].hasOwnProperty('train') &&
            url['stop-id'] === favorites.favorites[u].stopId &&
            url['dir'] === favorites.favorites[u].direction &&
            url['rt'] === favorites.favorites[u].routeNumber &&
            url['rt-name'].replace(/%20/g, ' ') === favorites.favorites[u].routeName) {
            return u;
          }
        }
      } else if(url.hasOwnProperty('tl') && url.hasOwnProperty('stop') && url.hasOwnProperty('dir')) {
        for (u = 0; u < favorites.favorites.length; u++) {
          if (favorites.favorites[u].hasOwnProperty('train') &&
            url['tl'] === favorites.favorites[u].trainLine &&
            url['stop'] === favorites.favorites[u].stop &&
            url['dir'] === favorites.favorites[u].direction) {
            return u;
          }
        }
      }

      return -1;
    }

    function setScreenTo(type) {
      $('#favorites').addClass('hidden');
      $('#routes').addClass('hidden');
      $('#route-directions').addClass('hidden');
      $('#stops').addClass('hidden');
      $('#arrivals').addClass('hidden');
      $('#app-bar-fav').addClass('hidden');
      switch(type) {
        case FAV:
          $('#favorites').removeClass('hidden');
          $('#favorites-nav').addClass('active');
          $('#routes-nav').removeClass('active');
          break;
        case ROUTES:
          $('#routes').removeClass('hidden');
          $('#routes-nav').addClass('active');
          $('#favorites-nav').removeClass('active');
          break;
        case DIRECT:
          $('#route-directions').removeClass('hidden');
          break;
        case STOPS:
          $('#stops').removeClass('hidden');
          console.log('Stops');
          break;
        case ARRIVALS:
          $('#arrivals').removeClass('hidden');
          $('#app-bar-fav').removeClass('hidden');
          break;
        default:
          console.log('Invalid Screen Type');
          break;
      }
    }

    function parseHash(url) {
      var params = (url.substr(1)).split('#');
      var pair;
      var values = {};
      for(var k=0;k<params.length;k++){
        pair = params[k].split('=');
        values[pair[0]] = pair[1];
      }
      console.log(values);
      return values;
    }

    $(window).on('hashchange', function() {
      decideScreen();
    });
  });
});
