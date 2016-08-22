if (typeof networkTest === 'undefined') {
    var networkTest = {};

    (function() {
        this.hostReachable = function(callback) {
            let url = '//' + window.location.hostname;
            let status;
            
            $.ajax({
                type: 'HEAD',
                cache: false,
                async: false,
                url: url
            }).done(function(data, textStatus, jqXHR) {
                status = jqXHR.status;
            }).fail(function(jqXHR, textStatus, errorThrown) {
                status = jqXHR.status;
            });
            
            if(status >= 200 && status < 300 || status === 304) {
                return callback(true);
            } else {
                return callback(false);
            }
        };
        
        this.listenToNetworkChange = function(callback) {
            window.addEventListener('online', function() {
                return callback(true);
            });
            window.addEventListener('offline', function() {
                return callback(false);
            });
        };

    }).call(networkTest);
}
