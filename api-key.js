(function () {
    var STORAGE_KEY = 'GMAPS_API_KEY';
    function getParam(name) {
        var m = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
        return m ? decodeURIComponent(m[1]) : null;
    }
    function askForKey() {
        alert('Bitte gib deinen Google Maps API‑Key ein. Er wird lokal (localStorage) gespeichert.');
        var entered = prompt('Google Maps API‑Key:');
        if (!entered) return null; // Abbruch
        return entered.trim();
    }
    function ensureKey() {
        var key = getParam('apikey') || localStorage.getItem(STORAGE_KEY);
        if (!key) {
            key = askForKey();
            if (!key) {
                alert('Ohne API‑Key kann die App nicht starten. Lade die Seite neu, um es erneut zu versuchen.');
                return null;
            }
            localStorage.setItem(STORAGE_KEY, key);
        } else if (getParam('apikey')) {
            // Wenn per URL‑Param übergeben, auch speichern/überschreiben
            localStorage.setItem(STORAGE_KEY, key);
        }
        return key;
    }
    function loadMaps(key) {
        var s = document.createElement('script');
        s.async = true;
        s.defer = true;
        s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&v=quarterly';
        document.body.appendChild(s);
    }
    // Reset‑Button
    document.getElementById('resetKey').addEventListener('click', function (e) {
        localStorage.removeItem(STORAGE_KEY);
        alert('API‑Key gelöscht. Die Seite lädt jetzt neu und fragt wieder nach einem Key.');
        location.reload();
    });
    var key = ensureKey();
    if (key) loadMaps(key);
})();
