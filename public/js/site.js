$.noConflict();
jQuery(function($) {
  $(document).ready(function() {
    $.getJSON('stops.json', function(json) {
      for(var i=0; i<json.routes.length; i++) {
        $('#routes').append(
          '<li><a href="#">'+json.routes[i].rt+'</a></li>'
        );
      }
    });
  });
});