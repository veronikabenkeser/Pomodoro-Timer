var interval;
self.addEventListener('message', function(e) {
    switch (e.data) {
        case 'start-session':
            console.log("per message - started ");
            interval = setInterval(function() {
                console.log("running worker");
                self.postMessage('tick');
            }, 1000);
            break;

        case "stop-session":
            clearInterval(interval);
            console.log("per message - stopped");
            console.log("NOT running worker");
            break;
    };
}, false);
