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
          listFavorites();
        } else  if(context.hasOwnProperty('routes')) {
          setScreenTo(ROUTES);
          listRoutes();
        } else if(context.hasOwnProperty('rt') &&
                  !context.hasOwnProperty('dir')) {
          setScreenTo(DIRECT);
          listRouteDirections(context.rt);
        } else if(context.hasOwnProperty('rt') &&
                  context.hasOwnProperty('dir') &&
                  !context.hasOwnProperty('stop-id')) {
          setScreenTo(STOPS);
          getRouteStops(context.rt,context['dir']);
        } else if(context.hasOwnProperty('rt') &&
                  context.hasOwnProperty('rt-name') &&
                  context.hasOwnProperty('dir') &&
                  context.hasOwnProperty('stop-id')) {
          setScreenTo(ARRIVALS);
          getPredictions(context['rt-name'].replace(/%20/g, ' '),context['dir'],context['stop-id']);
          checkFavorite();
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

    function getRouteStops(route, direction) {
      $('#stops').empty();
      $('#stops').append(
        '<li class="list-subheader">Route '+routes[route].routeName+' - '+ direction+' -  Choose a stop</li>'
      );
      $.when($.ajax({
        type: 'GET',
        url: '/cta/'+route+','+direction
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

    function getPredictions(routeName, direction, stopId) {
      $('#arrivals').empty();
      $('#arrivals').append('<li class="list-subheader">'+routeName+' - '+ direction+'</li>');
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
      addToFavorites();
    });

    function listFavorites() {
      $('#favorites').empty();
      loadFavorites();
      var rNum, rName, direc,stopId;
      for(var p=0;p<favorites.favorites.length;p++) {
        rNum = favorites.favorites[p].routeNumber;
        rName = favorites.favorites[p].routeName;
        direc = favorites.favorites[p].direction;
        stopId = favorites.favorites[p].stopId;
        $('#favorites').append(
          '<li>' +
            '<a href="#rt='+rNum+'#rt-name='+rName+'#dir='+direc+'#stop-id='+stopId+'">' +
              '<span class="route-number">'+rNum+'</span>'+
              '<span class="route-direction">'+direc.charAt(0)+'</span>'+
              '<span class="route-name">'+rName+'</span>'+
            '</a>' +
          '</li>'
        );
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
      console.log(favoritesJSON);
      favorites =  favoritesJSON;
    }

    function addToFavorites() {
      var url = parseHash(location.hash);
      if(url.hasOwnProperty('rt') &&
        url.hasOwnProperty('rt-name') &&
        url.hasOwnProperty('dir') &&
        url.hasOwnProperty('stop-id')) {
        loadFavorites();
        var exists=false; //Check if favorite already exist in favorite list
        for(var u=0;u<favorites.favorites.length;u++) {
          if(url['dir']===favorites.favorites[u].direction &&
            url['rt-name'].replace(/%20/g, ' ')===favorites.favorites[u].routeName) {
            exists=true;
          }
        }
        if(!exists) { //Favorite does not exist
          var newFavorite = {
            'routeNumber':url['rt'],
            'direction': url['dir'],
            'routeName':url['rt-name'].replace(/%20/g, ' '),
            'stopId':url['stop-id']
          };
          favorites.favorites.push(newFavorite);
          localStorage.setItem(storageItem, JSON.stringify(favorites));
          $('#favorite-button').removeClass('no-fill');
          $('#favorite-button').addClass('fill');
        }
      }
    }
    
    function checkFavorite() {
      var url = parseHash(location.hash);
      if(url.hasOwnProperty('rt') &&
        url.hasOwnProperty('rt-name') &&
        url.hasOwnProperty('dir') &&
        url.hasOwnProperty('stop-id')) {
        loadFavorites();
        var exists = false; //Check if favorite already exist in favorite list
        for (var u = 0; u < favorites.favorites.length; u++) {
          if (url['dir'] === favorites.favorites[u].direction &&
            url['rt-name'].replace(/%20/g, ' ') === favorites.favorites[u].routeName) {
            exists = true;
          }
        }
        if(exists) {
          $('#favorite-button').removeClass('no-fill');
          $('#favorite-button').addClass('fill');
        } else {
          $('#favorite-button').removeClass('fill');
          $('#favorite-button').addClass('no-fill');
        }
      }
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
