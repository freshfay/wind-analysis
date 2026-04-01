// INICIALIZAR MAPA
let map = L.map('map', {
    center: [0.35, -78.12],
    zoom: 14,
    maxZoom: 22
});

// CAPAS BASE

let normal = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{ maxZoom: 22 }
);

let satelite = L.tileLayer(
'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
{
maxZoom: 22,
subdomains: ['mt0','mt1','mt2','mt3']
}
);

let hibrido = L.tileLayer(
'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
{
maxZoom: 22,
subdomains: ['mt0','mt1','mt2','mt3']
}
);

normal.addTo(map);

L.control.layers({
"Mapa normal": normal,
"Satélite": satelite,
"Híbrido": hibrido
}).addTo(map);


// BUSCADOR
L.Control.geocoder().addTo(map);


// GRUPO PARA DIBUJOS
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);


// HERRAMIENTAS DE DIBUJO
let drawControl = new L.Control.Draw({
draw: {
polygon: true,
rectangle: true,
circle: false,
polyline: false,
marker: false,
circlemarker: false
},
edit: {
featureGroup: drawnItems
}
});

map.addControl(drawControl);


// CUANDO SE DIBUJA EL TERRENO
map.on(L.Draw.Event.CREATED, function (event) {

let layer = event.layer;
drawnItems.addLayer(layer);

// CALCULAR AREA
let area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
let areaHectareas = area / 10000;

layer.bindPopup(
`Área del terreno: <br>
<b>${area.toFixed(2)} m²</b><br>
<b>${areaHectareas.toFixed(2)} hectáreas</b>`
).openPopup();

});


// VARIABLES DE DATOS
let puntos = [];
let heatPoints = [];
let heatLayer;


// CLICK EN MAPA
map.on("click", function(e){
window.latSeleccionado = e.latlng.lat;
window.lngSeleccionado = e.latlng.lng;
});


// GUARDAR MEDICION
function guardarPunto(){

let velocidad = document.getElementById("velocidad").value;
let direccion = document.getElementById("direccion").value;

if(!velocidad || !direccion){
alert("Ingresa los datos del viento");
return;
}

if(window.latSeleccionado === undefined){
alert("Selecciona un punto en el mapa");
return;
}

let punto = {
lat: window.latSeleccionado,
lng: window.lngSeleccionado,
velocidad: parseFloat(velocidad),
direccion: parseFloat(direccion)
};

puntos.push(punto);

L.marker([punto.lat, punto.lng])
.addTo(map)
.bindPopup(
`Velocidad: ${punto.velocidad} m/s <br>
Dirección: ${punto.direccion}°`
);

heatPoints.push([punto.lat, punto.lng, punto.velocidad]);

actualizarHeatmap();

alert("Medición guardada");

}


// MAPA DE CALOR
function actualizarHeatmap(){

if(heatLayer){
map.removeLayer(heatLayer);
}

heatLayer = L.heatLayer(heatPoints, {
radius: 35,
blur: 25
}).addTo(map);

}


// ANALISIS
function analizarDatos(){

if(puntos.length === 0){
document.getElementById("analisis").innerHTML =
"No hay datos registrados";
return;
}

let suma = 0;
let max = 0;

puntos.forEach(p=>{
suma += p.velocidad;
if(p.velocidad > max) max = p.velocidad;
});

let promedio = suma / puntos.length;

document.getElementById("analisis").innerHTML = `
<h2>Resultados</h2>

<div class="dashboard">

<div class="metric">
<h3>${puntos.length}</h3>
<p>Puntos medidos</p>
</div>

<div class="metric">
<h3>${promedio.toFixed(2)}</h3>
<p>Velocidad promedio</p>
</div>

<div class="metric">
<h3>${max}</h3>
<p>Velocidad máxima</p>
</div>

</div>
`;

}


// EXPORTAR IMAGEN
function exportarImagen(){

html2canvas(document.body).then(canvas=>{
let link = document.createElement("a");
link.download = "mapa_viento.png";
link.href = canvas.toDataURL();
link.click();
});

}


// EXPORTAR PDF
async function exportarPDF(){

const { jsPDF } = window.jspdf;

const canvas = await html2canvas(document.body);
const img = canvas.toDataURL("image/png");

let pdf = new jsPDF("landscape");

pdf.addImage(img,"PNG",10,10,280,150);

pdf.save("reporte_viento.pdf");

}
