let host = 'https://data.irozhlas.cz/psp21-srovnani';
if (window.location.hostname === 'localhost') {
  host = 'http://localhost/psp21-srovnani';
}

const map = L.map('obce_rozdily_mapa', { scrollWheelZoom: false });
const bg = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, data <a target="_blank" href="https://www.uzis.cz/">ÚZIS k 24. 7. 2021</a>',
  subdomains: 'abcd',
  maxZoom: 15,
});

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');

  div.innerHTML = `<i style="background:#b2182b"></i>> +11 p.b.<br>`
    + `<i style="background:#ef8a62"></i>< +11 p.b.<br>`
    + `<i style="background:#fddbc7"></i>< +6 p.b.<br>`
    + `<i style="background:#67a9cf"></i>< -2,8 p.b.<br>`;

  // loop through our density intervals and generate a label with a colored square for each interval

  return div;
};

legend.addTo(map);

map.on('click', () => map.scrollWheelZoom.enable());

bg.addTo(map);

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

function getPct(p, c) {
  return Math.round((p / c) * 1000) / 10;
}

const geojson = L.topoJson(null, {
  style(feature) {
    const oid = feature.properties.kod;
    return {
      color: 'lightgray',
      opacity: 1,
      weight: 0.5,
      fillOpacity: 0.8,
      fillColor: getCol(oid, 'ucast'),
    };
  },
  onEachFeature(feature, layer) {
    layer.on('click', (e) => {
      const d = data[e.target.feature.properties.kod]
      layer.bindPopup(
        `<b>${e.target.feature.properties.nazev}</b><br>změna v účasti mezi 2017 a 2021: ${Math.round(d.ucast[1] * -1000) / 10} p.b. (${d.ucast[0] * -1} osob)`,
      ).openPopup();
    });
  },
});

geojson.addTo(map);

let data = null;

fetch(host + '/js/mapa.json')
  .then(response => response.json())
  .then(mapdata => {
    fetch(host + '/js/data.json')
      .then(res => res.json())
      .then(da => {
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
      })
  });


function getCol(oid, topic) {
  try {
    const val = data[oid][topic][1] * -1

    if (val <= -0.028) { return '#2c7bb6'; }
    if (val <= -0.025) { return '#abd9e9'; }
    if (val <= 0.06) { return '#fdae61'; }
    if (val <= 0.11) { return '#fc8d59'; }
    if (val > 0.11) { return '#d73027'; }
    return '#lightgray';
  } catch {
    return 'white'
  }

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
