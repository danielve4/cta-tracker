$.noConflict();
jQuery(function($) {
  $(document).ready(function() {
    var HOME='home',DIRECT='directions',ARRIVALS='arrivals';
    var routes;
    $.getJSON('stops.json', function(json) {
      routes = json;
      console.log('loaded routes');
      decideScreen();
    });

    function decideScreen() {
      if(!location.hash) {
        listRoutes();
        setScreenTo(HOME);
      } else {
        var context = parseHash(location.hash);
        if(context.hasOwnProperty('rt')) {
          console.log('rt is:' + context.rt);
          listRouteDirections(context.rt);
        }
      }
    }

    function listRoutes() {
      $('#routes').empty();
      for(var i=0; i<routes.routes.length; i++) {
        $('#routes').append(
          '<li>' +
          '<a href="#rt='+routes.routes[i].routeNumber+'" class="route-number" id="'+routes.routes[i].routeNumber+'">'
          +routes.routes[i].routeNumber+ ' ' +routes.routes[i].routeName+
          '</a></li>'
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
      switch(type) {
        case HOME:
          $('#routes').removeClass('hidden');
          $('#route-directions').addClass('hidden');
          break;
        case DIRECT:
          $('#routes').addClass('hidden');
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
      return values;
    }

    function searchRoute(number) {
      var low = 0;
      var high = routes.length - 1;
      var mid;
      var tempR;
      while (low <= high) {
        mid = Math.floor((low + high) / 2);
        console.log('mid is: ' + mid + '. Comparing: ' + routes[mid].routeNumber +' and '+ number);
        tempR = routes[mid].routeNumber;
        if (tempR.toString().localeCompare(number.toString(),undefined, {numeric: true, sensitivity: 'base'}) < 0) {
          low = mid + 1;
        } else if (tempR.toString().localeCompare(number.toString(),undefined, {numeric: true, sensitivity: 'base'}) > 0) {
          high = mid - 1;
        } else {
          console.log('returning: '+ mid);
          return mid;
        }
      }
      return -1;
    }

    $(window).on('hashchange', function() {
      console.log(parseHash(location.hash));
      decideScreen();
    });
  });
});
