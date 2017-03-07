$.noConflict();
jQuery(function($) {
  $(document).ready(function() {
    var HOME='home',DIRECT='directions',ARRIVALS='arrivals';
    var routes;
    $.getJSON('stops.json', function(json) {
      routes = json;
      listRoutes();
      setScreenTo(HOME);
    });

    function listRoutes() {
      for(var i=0; i<routes.length; i++) {
        $('#routes').append(
          '<li><a href="#route-directions" class="route-number" id="'+i+'">'
          +routes[i].routeNumber+ ' ' +routes[i].routeName+
          '</a>' +
          '</li>'
        );
      }
    }
    
    $('#routes').on('click','.route-number',function (e) {
      console.log($(this).attr('id'));
      listRouteDirections($(this).attr('id'));
      setScreenTo(DIRECT);
      //e.preventDefault();
    });

    function listRouteDirections(rNumber) {
      var route = routes[rNumber];
      $('#route-directions').empty();
      for(var j=0;j<route.directions.length;j++) {
        $('#route-directions').append(
          '<li>'+route.directions[j]+'</li>'
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
  });
});
