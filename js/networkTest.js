if (typeof networkTest === 'undefined') {
    var networkTest = {};

    (function() {
        /**
         * Check if the origin is still reachable
         **/
        this.hostReachable = function(callback) {
            let url = document.origin; //'//' + window.location.hostname;
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
        
        /**
         * Apply listener to browser to listen to (and ONLY to)
         * network adapter change.
         * 
         * NOTE: If for some reason the connection breaks causing
         * the origin unreachable while the network adapter remains unchanged
         * (i.e. wifi still connected or ethernet still plugged in), this
         * event will NOT trigger.
         **/
        this.listenToNetworkChange = function(callback) {
            window.addEventListener('online', function() {
                return callback(true);
            });
            window.addEventListener('offline', function() {
                return callback(false);
            });
        };
        
        
        /**
         * Update status text based on connections
         **/
        this.updateNetworkStatus = function(status) {
            if(status) {
                $(_NETWORK_STATUS_ID).html('ONLINE');
            } else {
                $(_NETWORK_STATUS_ID).html('OFFLINE');
            }
        };

    }).call(networkTest);
} else {
    console.log('[ERROR]: Naming conflict -- "networkTest" is already defined.');
}
