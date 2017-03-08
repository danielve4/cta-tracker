$.noConflict();
jQuery(function($) {
  $(document).ready(function() {
    var FAV='fav',ROUTES='routes',DIRECT='directions',STOPS='stops',ARRIVALS='arrivals';
    var storageItem = 'favorites'; //Name of item in localStorage
    var favorites;
    var routes;
    $.getJSON('stops.json', function(json) {
      routes = json;
      console.log('loaded routes');
      decideScreen();
    });

    function decideScreen() {
      if(!location.hash) {
        setScreenTo(FAV);
      } else {
        var context = parseHash(location.hash);
        if(context.hasOwnProperty('favorites')) {
          setScreenTo(FAV);
          loadFavorites();
        } else  if(context.hasOwnProperty('routes')) {
          setScreenTo(ROUTES);
          listRoutes();
        } else if(context.hasOwnProperty('rt') && !context.hasOwnProperty('#dir')) {
          setScreenTo(DIRECT);
          console.log('rt is:' + context.rt);
          listRouteDirections(context.rt);
        } else if(context.hasOwnProperty('rt') && context.hasOwnProperty('#dir')) {
          setScreenTo(STOPS);
          getRouteStops(context.rt,context['#dir']);
        } else if(context.hasOwnProperty('stop-id')) {
          setScreenTo(ARRIVALS);
          getPredictions(context['stop-id'])
        }
      }
    }

    function listRoutes() {
      $('#routes').empty();
      var route;
      for(var i=0; i<routes.routes.length; i++) {
        route = routes.routes[i];
        $('#routes').append(
          '<li>' +
            '<a href="#rt='+route.routeNumber+'"id="'+route.routeNumber+'">' +
              '<span class="route-number">'+route.routeNumber+ '</span> ' +
              '<span class="route-name">' +route.routeName+ '</span>' +
            '</a>' +
          '</li>'
        );
      }
    }
    
    $('#routes').on('click','.route-number',function (e) {
      console.log($(this).attr('id'));
      listRouteDirections($(this).attr('id'));
    });

    function listRouteDirections(rNumber) {
      var route = routes[rNumber];
      $('#route-directions').empty();
      for(var j=0;j<route.directions.length;j++) {
        $('#route-directions').append(
          '<li><a href="#rt='+rNumber+'&#dir='+route.directions[j]+'">'
          +route.directions[j]+
          '</a></li>'
        );
      }
    }

    function getRouteStops(route, direction) {
      $('#stops').empty();
      $.when($.ajax({
        type: 'GET',
        url: '/cta/'+route+','+direction
      })).then(function(data) {
        listRouteStops(data);
      }, function () {
        console.log('Error');
      });
    }

    function listRouteStops(stops) {
      for(var m=0;m<stops.length;m++) {
        $('#stops').append(
          '<li><a href="#stop-id='+stops[m].stpid+'">'
          +stops[m].stpnm+
          '</a></li>'
        );
      }
    }

    function getPredictions(stopId) {
      $('#arrivals').empty();
      $.when($.ajax({
        type: 'GET',
        url: '/cta/'+stopId
      })).then(function(data) {
        listPredictions(data);
      }, function () {
        console.log('Error');
      });
    }

    function listPredictions(predictions) {
      console.log(predictions);
      for(var n=0;n<predictions.prd.length;n++) {
        $('#arrivals').append(
          '<li>'+
          '<span class="route-number">'+predictions.prd[n].rt+'</span>'+
          '<span class="destination">To '+predictions.prd[n].des+'</span>'+
          '<span class="arrival-time">'+predictions.prd[n].prdctdn+'m</span>'+
          '</li>'
        );
      }
    }

    function setScreenTo(type) {
      $('#favorites').addClass('hidden');
      $('#routes').addClass('hidden');
      $('#route-directions').addClass('hidden');
      $('#stops').addClass('hidden');
      $('#arrivals').addClass('hidden');
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
          break;
        default:
          console.log('Invalid Screen Type');
          break;
      }
    }

    function parseHash(url) {
      var params = (url.substr(1)).split('&');
      var pair;
      var values = {};
      for(var k=0;k<params.length;k++){
        pair = params[k].split('=');
        values[pair[0]] = pair[1];
      }
      console.log(values);
      return values;
    }

    function loadFavorites() {
      var favoritesJSON;
      favorites = localStorage.getItem(storageItem);
      try {
        favoritesJSON = JSON.parse(favorites);
        if (favoritesJSON && typeof favoritesJSON === "object") {
          favorites =  favoritesJSON;
        }
      }
      catch (e) {}
      favoritesJSON = {
        'favorites': []
      };
      favorites =  favoritesJSON;
    }

    function addToFavorites(location) {
      loadFavorites();
      var exists=false; //Check if favorite already exist in favorite list
      for(var u=0;u<favorites.favorites.length;u++) {
        if(location===favorites.favorites[u]) {
          exists=true;
        }
      }
      if(!exists) { //Favorite does not exist
        favorites.favorites.push(location);
        localStorage.setItem(storageItem, JSON.stringify(favorites));
      }
    }

    $(window).on('hashchange', function() {
      decideScreen();
    });
  });
});
