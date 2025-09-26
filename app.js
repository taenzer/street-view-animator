(function () {
    var pano = null;
    var ui = $('#ui');

    var S = { a: null, b: null, duration: 4000, easing: 'easeInOutSine', animating: false, recording: false };

    // Aufnahme‑State
    var REC = { stream: null, rec: null, chunks: [], lastBlob: null };

    // Easing‑Funktionen (0..1 → 0..1)
    var EASING = {
        linear: function (t) {
            return t;
        },
        easeInOutSine: function (t) {
            return -(Math.cos(Math.PI * t) - 1) / 2;
        },
        easeInOutQuad: function (t) {
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        },
        easeInOutCubic: function (t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
        easeInOutQuart: function (t) {
            return t < 0.5 ? 8 * Math.pow(t, 4) : 1 - Math.pow(-2 * t + 2, 4) / 2;
        },
        easeInOutQuint: function (t) {
            return t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2;
        },
        easeInOutExpo: function (t) {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
        },
        easeInOutCirc: function (t) {
            return t < 0.5
                ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
                : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
        },
        easeFastLongTail: function easeFastLongTail(t) {
            if (t <= 0) return 0;
            if (t >= 1) return 1;
            var k = 2.8; // ↑ erhöhen (z.B. 3–6) => schnellerer Start & noch längerer, flacherer Tail
            var N = 1 - Math.exp(-k);
            return (1 - Math.exp(-k * t)) / N;
        },
    };

    window.initPano = function initPanoAt(lat, lng, opts) {
        opts = opts || {};
        var el = document.getElementById('pano');
        var sv = new google.maps.StreetViewService();
        var loc = { lat: lat, lng: lng };
        sv.getPanorama({ location: loc, radius: opts.radius || 50 }, function (data, status) {
            if (status !== 'OK' || !data || !data.location) {
                alert('Keine Street-View-Panoramen in der Nähe gefunden.');
                return;
            }
            pano = new google.maps.StreetViewPanorama(el, {
                pano: data.location.pano,
                disableDefaultUI: true,
                addressControl: false,
                linksControl: !!opts.linksControl,
                panControl: false,
                zoomControl: false,
                fullscreenControl: false,
                motionTrackingControl: false,
                imageDateControl: false,
                clickToGo: opts.clickToGo !== false,
                visible: true,
                pov: { heading: 0, pitch: 0 },
                zoom: 1,
            });
        });
    };

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    function getPOV() {
        if (!pano) return null;
        var pov = pano.getPov();
        return { heading: pov.heading, pitch: pov.pitch, zoom: pano.getZoom ? pano.getZoom() : 1 };
    }

    function setPOV(p) {
        if (!pano) return;
        if (typeof p.zoom === 'number' && pano.setZoom) pano.setZoom(p.zoom);
        pano.setPov({ heading: p.heading, pitch: p.pitch });
    }

    function wrap360(x) {
        x = x % 360;
        if (x < 0) x += 360;
        return x;
    }

    function fovToZoom(fov) {
        if (fov <= 30) return 3;
        if (fov <= 60) return 2;
        return 1;
    }

    function startAnimation(a, b, duration) {
        ui.style.display = 'none';
        setPOV(S.a);
        delay(1000).then(() => animateAB(a, b, duration));
    }

    function animateAB(a, b, duration) {
        if (!pano) return;

        S.animating = true;
        var t0 = window.performance && performance.now ? performance.now() : Date.now();
        var dH;
        (function () {
            var d = wrap360(b.heading) - wrap360(a.heading);
            if (d > 180) d -= 360;
            if (d < -180) d += 360;
            dH = d;
        })();
        var dP = b.pitch - a.pitch;
        var dZ = (b.zoom || 1) - (a.zoom || 1);
        var easeFn = EASING[S.easing] || EASING.linear;

        function frame(now) {
            var nowTs =
                typeof now === 'number' ? now : window.performance && performance.now ? performance.now() : Date.now();
            var t = Math.min(1, (nowTs - t0) / duration);
            var te = easeFn(t);
            var pov = {
                heading: wrap360(a.heading + dH * te),
                pitch: a.pitch + dP * te,
                zoom: (a.zoom || 1) + dZ * te,
            };
            setPOV(pov);
            if (t < 1 && S.animating) {
                window.requestAnimationFrame(frame);
            } else {
                S.animating = false;

                setTimeout(() => (ui.style.display = 'block'), 2000);
                if (S.recording) {
                    S.recording = false;
                    stopRecording($('#recStart'));
                }
            }
        }
        window.requestAnimationFrame(frame);
    }

    // Hilfsfunktionen für URL‑Parsing ohne Regex
    function parseFloatSafe(s) {
        var n = parseFloat(s);
        return isNaN(n) ? null : n;
    }
    function parseLatLngFromComma(s) {
        if (!s) return null;
        s = String(s).trim();
        var c = s.indexOf(',');
        if (c < 0) return null;
        var la = parseFloatSafe(s.slice(0, c));
        var ln = parseFloatSafe(s.slice(c + 1));
        if (la === null || ln === null) return null;
        if (Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
        return { lat: la, lng: ln };
    }
    function sliceUntil(str, startIndex, stops) {
        var end = str.length;
        for (var i = 0; i < stops.length; i++) {
            var p = str.indexOf(stops[i], startIndex);
            if (p >= 0 && p < end) end = p;
        }
        return str.slice(startIndex, end);
    }
    function parseNumberFrom(str, startIndex) {
        var i = startIndex;
        var allowed = '-0123456789.';
        while (i < str.length && allowed.indexOf(str.charAt(i)) !== -1) i++;
        var s = str.slice(startIndex, i);
        var v = parseFloatSafe(s);
        return { value: v, next: i };
    }

    function parseMapsUrl(input) {
        if (!input) return null;
        var href = String(input).trim();
        var url;
        try {
            url = new URL(href);
        } catch (e) {
            url = null;
        }
        var str = url ? url.href : href;

        var coords = null;
        if (url) {
            var keys = ['cbll', 'll', 'center', 'sll', 'q', 'query', 'destination', 'origin', 'viewpoint'];
            for (var k = 0; k < keys.length; k++) {
                var val = url.searchParams.get(keys[k]);
                if (!val) continue;
                if (val.toLowerCase().indexOf('loc:') === 0) val = val.slice(4);
                var p = parseLatLngFromComma(val);
                if (p) {
                    coords = p;
                    break;
                }
            }
        }
        if (!coords) {
            var at = str.indexOf('@');
            if (at >= 0) {
                var seg = sliceUntil(str, at + 1, ['?', '#', '/']);
                var parts = seg.split(',');
                if (parts.length >= 2) {
                    var la = parseFloatSafe(parts[0]);
                    var ln = parseFloatSafe(parts[1]);
                    if (la !== null && ln !== null && Math.abs(la) <= 90 && Math.abs(ln) <= 180)
                        coords = { lat: la, lng: ln };
                }
            }
        }
        if (!coords) {
            var i3 = str.indexOf('!3d');
            var i4 = str.indexOf('!4d');
            if (i3 >= 0 && i4 >= 0) {
                var v3 = parseNumberFrom(str, i3 + 3).value;
                var v4 = parseNumberFrom(str, i4 + 3).value;
                if (v3 !== null && v4 !== null) coords = { lat: v3, lng: v4 };
            }
        }
        if (!coords) return null;

        // Optional: Heading/Pitch/FOV aus Params
        var heading = null,
            pitch = null,
            zoom = null;
        if (url) {
            var h = url.searchParams.get('heading');
            if (h !== null) heading = parseFloatSafe(h);
            var p2 = url.searchParams.get('pitch');
            if (p2 !== null) pitch = parseFloatSafe(p2);
            var fov = url.searchParams.get('fov');
            if (fov !== null) {
                var fv = parseFloatSafe(fov);
                if (fv !== null) zoom = fovToZoom(fv);
            }
        }
        var res = { lat: coords.lat, lng: coords.lng };
        if (heading !== null && pitch !== null) (res.heading = heading), (res.pitch = pitch);
        if (zoom !== null) res.zoom = zoom;
        return res;
    }

    function $(sel) {
        return document.querySelector(sel);
    }

    function playAnimation() {
        if (!(S.a && S.b)) return;
        S.duration = parseInt(dur.value, 10) || 4000;
        startAnimation(S.a, S.b, S.duration);
    }

    function setupUI() {
        var btnA = $('#btnA');
        var btnB = $('#btnB');
        var play = $('#play');
        var dur = $('#dur');
        var lat = $('#lat');
        var lng = $('#lng');
        var go = $('#go');
        var chkClick = $('#clickToGo');
        var chkLinks = $('#linksCtrl');
        var ease = $('#ease');
        var url = $('#url');
        var goUrl = $('#goUrl');
        var recStart = $('#recStart');

        recStart.onclick = function () {
            S.recording = true;
            playAnimation();
            startRecording(recStart);
        };

        btnA.onclick = function () {
            if (!pano) return;
            S.a = getPOV();
            btnB.disabled = !S.a;
        };
        btnB.onclick = function () {
            if (!pano) return;
            S.b = getPOV();
            play.disabled = !(S.a && S.b);
        };
        play.onclick = playAnimation;

        go.onclick = function () {
            var la = parseFloat(lat.value),
                ln = parseFloat(lng.value);
            if (!isNaN(la) && !isNaN(ln))
                initPano(la, ln, { clickToGo: chkClick.checked, linksControl: chkLinks.checked });
        };

        goUrl.onclick = function () {
            var parsed = parseMapsUrl(url.value);
            if (!parsed) {
                alert('Konnte in der URL keine Koordinaten finden.');
                return;
            }
            var opts = { clickToGo: chkClick.checked, linksControl: chkLinks.checked };
            if (typeof parsed.heading === 'number' && typeof parsed.pitch === 'number') {
                opts.pov = { heading: parsed.heading, pitch: parsed.pitch };
            }
            if (typeof parsed.zoom === 'number') opts.zoom = parsed.zoom;
            initPano(parsed.lat, parsed.lng, opts);
        };

        chkClick.onchange = function () {
            if (pano) pano.setOptions({ clickToGo: chkClick.checked });
        };
        chkLinks.onchange = function () {
            if (pano) pano.setOptions({ linksControl: chkLinks.checked });
        };
        ease.onchange = function () {
            S.easing = ease.value;
        };
    }

    // ===== Aufnahme (WebM) & MP4‑Transcode (ffmpeg.wasm) =====
    function getCanvasStream() {
        var canvas = document.querySelector('#pano canvas');
        if (canvas && canvas.captureStream) return canvas.captureStream(60);
        // Fallback: Tab/Window aufnehmen (erfordert Benutzerfreigabe)
        return null;
    }

    function pickMimeType() {
        var types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        for (var i = 0; i < types.length; i++) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i]))
                return types[i];
        }
        return 'video/webm';
    }

    async function startRecording(btnStart) {
        if (REC.rec) return;
        REC.chunks = [];
        REC.lastBlob = null;
        var stream = getCanvasStream();
        if (!stream && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            alert(
                'Konnte Canvas-Stream nicht direkt abgreifen. Bitte wähle im folgenden Dialog den Tab/Fensterbereich aus.'
            );
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 60 }, audio: false });
            } catch (e) {
                alert('Bildschirmaufnahme abgelehnt.');
                return;
            }
        }
        if (!stream) {
            alert('Aufnahme nicht möglich.');
            return;
        }
        REC.stream = stream;
        var mime = pickMimeType();
        try {
            REC.rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
        } catch (e) {
            REC.rec = new MediaRecorder(stream);
        }
        REC.rec.ondataavailable = function (ev) {
            if (ev.data && ev.data.size) REC.chunks.push(ev.data);
        };
        REC.rec.onstop = function () {
            var blob = new Blob(REC.chunks, { type: REC.rec.mimeType || 'video/webm' });
            REC.lastBlob = blob;
            downloadBlob(blob, 'streetview-recording.webm');
            safeStopStream();
        };
        REC.rec.start(100);
        btnStart.disabled = true;
    }

    function stopRecording(btnStart) {
        if (!REC.rec) return;
        REC.rec.stop();
        btnStart.disabled = false;
    }

    function safeStopStream() {
        try {
            REC.stream.getTracks().forEach(function (t) {
                t.stop();
            });
        } catch (e) {}
    }

    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function bootWhenReady() {
        if (window.google && google.maps && google.maps.StreetViewService) {
            setupUI();
            // Default: Brandenburger Tor, Berlin
            initPano(52.516275, 13.377704, { clickToGo: true, linksControl: false });
        } else {
            setTimeout(bootWhenReady, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootWhenReady);
    } else {
        bootWhenReady();
    }
})();
