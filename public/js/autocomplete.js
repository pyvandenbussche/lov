$(document).ready(function() {
        $('input.typeahead').typeahead({
          source: function (query, process) {
            $.ajax({
              url: '/api/endpointsAutoComplete',
              type: 'POST',
              dataType: 'JSON',
              data: 'q=' + query,
              success: function(data) {
                console.log(data);
                process(data);
              }
            });
          }
        });
      });