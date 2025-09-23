# Google Street View Animator (Maps JS API)


Mit der Google Maps **JavaScript API** wird ein Street‑View‑Panorama mit minimaler UI angezeigt. Du kannst zwei Blickrichtungen (POVs) setzen und linear animieren (Heading: kürzester Weg). Docker‑Konfiguration zum Sofortstart liegt bei.


## Start ohne Docker (lokal)
1. `public/index.html` öffnen und `YOUR_API_KEY` durch deinen API‑Key ersetzen.
2. Eine beliebige statische Server‑Option (optional):
```bash
npx http-server public -p 8080
```
3. Im Browser http://localhost:8080 öffnen.

## Start mit Docker
#### Build (Key baked in)
```bash
docker build -t sv-keyframe-app --build-arg GOOGLE_MAPS_API_KEY=DEIN_API_KEY .
```

```bash
docker run --rm -p 8080:8080 sv-keyframe-app
```