$.noConflict();
jQuery(function($) {
  $(document).ready(function() {
    var FAV='fav',ROUTES='routes',DIRECT='directions',ARRIVALS='arrivals';
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
        } else  if(context.hasOwnProperty('routes')) {
          setScreenTo(ROUTES);
          listRoutes();
        } if(context.hasOwnProperty('rt')) {
          console.log('rt is:' + context.rt);
          listRouteDirections(context.rt);
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
      setScreenTo(DIRECT);
      var route = routes[rNumber];
      $('#route-directions').empty();
      for(var j=0;j<route.directions.length;j++) {
        $('#route-directions').append(
          '<li><a href="#rt='+route.routeNumber+'&#dir='+route.directions[j]+'">'
          +route.directions[j]+
          '</a></li>'
        );
      }
    }

    function setScreenTo(type) {
      $('#favorites').addClass('hidden');
      $('#routes').addClass('hidden');
      $('#route-directions').addClass('hidden');
      switch(type) {
        case FAV:
          $('#favorites').removeClass('hidden');
          break;
        case ROUTES:
          $('#routes').removeClass('hidden');
          break;
        case DIRECT:
          $('#route-directions').removeClass('hidden');
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

    $(window).on('hashchange', function() {
      decideScreen();
    });
  });
});
