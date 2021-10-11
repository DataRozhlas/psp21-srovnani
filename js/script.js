let host = 'https://data.irozhlas.cz/psp21-srovnani';
if (window.location.hostname === 'localhost') {
  host = 'http://localhost/psp21-srovnani';
}

let topic = 'spolu';

const map = L.map('obce_rozdily_mapa', { scrollWheelZoom: false });
const bg = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, data <a target="_blank" href="https://www.volby.cz/">ČSÚ</a>',
  subdomains: 'abcd',
  maxZoom: 15,
});
bg.addTo(map);
map.on('click', () => map.scrollWheelZoom.enable());

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');

  div.innerHTML = makeLegend(topic);
  return div;
};

function makeLegend(topic) {
  const br = brks(topic);
  return `<i style="background:#b2182b"></i>> ${Math.round(br[3] * 1000) / 10} p.b.<br>`
    + `<i style="background:#ef8a62"></i>< ${Math.round(br[2] * 1000) / 10} p.b.<br>`
    + `<i style="background:#fddbc7"></i>< ${Math.round(br[1] * 1000) / 10} p.b.<br>`
    + `<i style="background:#67a9cf"></i>< ${Math.round(br[0] * 1000) / 10} p.b.<br>`;
}

legend.addTo(map);

L.TopoJSON = L.GeoJSON.extend({
  addData(data) {
    let geojson; let key;
    if (data.type === 'Topology') {
      // eslint-disable-next-line no-restricted-syntax
      for (key in data.objects) {
        if (data.objects.hasOwnProperty(key)) {
          geojson = topojson.feature(data, data.objects[key]);
          L.GeoJSON.prototype.addData.call(this, geojson);
        }
      }
      return this;
    }
    L.GeoJSON.prototype.addData.call(this, data);
    return this;
  },
});

L.topoJson = function (data, options) {
  return new L.TopoJSON(data, options);
};

function brks(topic) {
  if (topic === 'ucast') {
    return [-0.02, 0, 0.05, 0.07];
  }
  return [-0.25, -0.1, 0, 0.1];
}

function getCol(oid, topic) {
  const val = data[oid][topic][1] * -1;
  const br = brks(topic);
  if (val <= br[0]) { return '#0571b0'; }
  if (val <= br[1]) { return '#92c5de'; }
  if (val <= br[2]) { return '#e0f3f8'; }
  if (val <= br[3]) { return '#f4a582'; }
  if (val > br[3]) { return '#ca0020'; }
  return 'lightgray';
}

const topics = {
  cssd: 'ČSSD',
  ano: 'ANO',
  spolu: 'SPOLU',
  spd: 'SPD',
  ksc: 'KSČM',
  pirstan: 'Piráti+STAN',
};

const geojson = L.topoJson(null, {
  style(feature) {
    const oid = feature.properties.kod;
    return {
      color: 'lightgray',
      opacity: 1,
      weight: 0.5,
      fillOpacity: 0.8,
      fillColor: getCol(oid, topic),
    };
  },
  onEachFeature(feature, layer) {
    layer.on('click', (e) => {
      const d = data[e.target.feature.properties.kod];
      let wording = 'v účasti';
      if (topic !== 'ucast') {
        wording = `ve výsledku ${topics[topic]}`;
      }
      layer.bindPopup(
        `<b>${e.target.feature.properties.nazev}</b><br>změna ${wording} mezi 2017 a 2021: ${Math.round(d[topic][1] * -1000) / 10} p.b. (${d[topic][0] * -1} osob)`,
      ).openPopup();
    });
  },
});

geojson.addTo(map);

let data = null;
fetch(`${host}/js/mapa.json`)
  .then((response) => response.json())
  .then((mapdata) => {
    fetch(`${host}/js/data.json`)
      .then((res) => res.json())
      .then((da) => {
        data = da;
        const dkeys = Object.keys(data);
        mapdata.objects.xxx.geometries = mapdata.objects.xxx.geometries.filter((ob) => {
          if (dkeys.includes(String(ob.properties.kod))) {
            return true;
          }
          return false;
        });
        geojson.addData(mapdata);
        map.fitBounds(geojson.getBounds());
      });
  });

const sel = document.getElementById('topic');
if (sel !== null) {
  sel.addEventListener('change', (e) => {
    topic = e.target.value;
    reDraw(topic);
  });
}

function reDraw(topic) {
  geojson.eachLayer((layer) => {
    layer.setStyle({ fillColor: getCol(layer.feature.properties.kod, topic) });
  });
  // update legendy
  const leg = document.getElementsByClassName('info legend')[0];
  const br = brks(topic);
  leg.innerHTML = makeLegend(topic);
}

// geocoder
const form = document.getElementById('geocoder');
form.onsubmit = function submitForm(event) {
  event.preventDefault();
  const text = document.getElementById('inp-geocode').value;
  if (text === '') {
    return;
  }
  fetch(`https://api.mapy.cz/geocode?query=${text}, Česká republika`) // Mapy.cz geocoder
    .then((res) => res.text())
    .then((str) => (new window.DOMParser()).parseFromString(str, 'text/xml'))
    .then((results) => {
      const res = results.firstChild.children[0];

      if (res.children.length === 0) {
        return;
      }
      const x = parseFloat(res.children[0].attributes.x.value);
      const y = parseFloat(res.children[0].attributes.y.value);

      map.flyTo([y, x], 11);
    })
    .catch((err) => { throw err; });
};
