$.noConflict();
jQuery(function($) {
  $(document).ready(function() {
    var routes;
    $.getJSON('stops.json', function(json) {
      routes = json;
      listRoutes();
    });

    function listRoutes() {
      for(var i=0; i<routes.length; i++) {
        $('#routes').append(
          '<li><a href="#" class="route-number" id="'+i+'">'
          +routes[i].routeNumber+ ' ' +routes[i].routeName+
          '</a>' +
          '</li>'
        );
      }
    }
    
    $('#routes').on('click','.route-number',function (e) {
      console.log($(this).attr('id'));
      listRouteDirections($(this).attr('id'));
      e.preventDefault();
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
    
  });
});