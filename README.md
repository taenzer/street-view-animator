# Google Street View Animator (Maps JS API)

Mit diesem Tool kannst du dank der Google Maps **JavaScript API**  ein Street‑View‑Panorama mit minimaler UI anzeigen und einen Kamera-Schwenk animieren. Dafür springst du zuerst an die Stelle, von der du eine Kameraanimation möchtest, legst dort Start- & End- POV fest, passt die Parameter
an, wie es dir gefällt und klickst dann auf "abspielen"!

> [!IMPORTANT] Wichtig
> Für die Verwendung dieses Tools benötigst du einen **Maps JavaScript API Key**. Eine Anleitung, wie du einen bekommst, findest du [hier](https://developers.google.com/maps/documentation/javascript/get-api-key).


## Installation
Für die Verwendung des Tools ist keine Installation von Software nötig. Du brauchst lediglich einen Webbrowser. Getestet wurde es mit Microsoft Edge, es sollte aber auch mit allen anderen Browsern funktionieren.

### Schritt für Schritt Anleitung
1. Lade dir das Repo als ZIP Datei herunter und entpacke es an beliebiger Stelle (alternativ kannst du es natürlich auch einfach clonen)
2. Öffne die `index.html` Datei mit einem Browser deiner Wahl
3. Gib in dem Dialog deinen [API Key](https://developers.google.com/maps/documentation/javascript/get-api-key) ein. Dieser wird nun lokal auf deinem Gerät, im LocalStorage deines Browsers, gespeichert, damit du ihn nicht jedes Mal eingeben musst
4. Füge unter "Location wechseln" den Google Maps Link der Stelle ein, von der du eine Animation brauchst und klicke auf *Go URL*
5. Bewege deine Kamera wie in Street-View zur Startposition und klicke auf *Start setzen*
6. Bewege nun die Kamera zur Endposition und klicke auf *Ende setzen*
7. Passe bei Bedarf die Animationsdauer sowie die Animationskurve an und klicke dann auf *Abspielen*

Die Kamera begibt sich nun zum Startpunkt, die UI wird ausgeblendet und nach ca 1 Sekunde startet die Animation. Weitere 2 Sekunden später wird das UI wieder eingeblendet und du kannst von vorne beginnen.

#### Viel Spaß ;)

> [!NOTE] Disclaimer
> Die Entwicklung dieses Tools wurde durch künstliche Intelligenz unterstützt.