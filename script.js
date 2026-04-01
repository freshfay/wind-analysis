// =============================
// CONFIGURACION DEL MAPA
// =============================

var map = L.map('map', {
maxZoom: 22,
minZoom: 3
}).setView([-0.22, -78.51], 14);

// CAPA SATELITAL REAL
var satelite = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
{
maxZoom: 22
}).addTo(map);

// BUSCADOR DE LUGARES
L.Control.geocoder().addTo(map);

// =============================
// DIBUJO Y MEDICION DE TERRENO
// =============================

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
draw:{
polygon:true,
rectangle:true,
circle:false,
marker:false,
polyline:true
},
edit:{
featureGroup: drawnItems
}
});

map.addControl(drawControl);

// CALCULO DE AREA
map.on(L.Draw.Event.CREATED, function (event) {

var layer = event.layer;
drawnItems.addLayer(layer);

if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {

var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
area = (area / 10000).toFixed(2);

layer.bindPopup("Área del terreno: " + area + " hectáreas").openPopup();
}

if(layer instanceof L.Polyline){

var distancia = 0;
var latlngs = layer.getLatLngs();

for(let i=1;i<latlngs.length;i++){
distancia += latlngs[i-1].distanceTo(latlngs[i]);
}

distancia = (distancia/1000).toFixed(2);

layer.bindPopup("Distancia: " + distancia + " km").openPopup();
}

});

// =============================
// DATOS
// =============================

let puntos = [];
let ultimoClick = null;

map.on("click", function(e){
ultimoClick = e.latlng;
});

// =============================
// REGISTRO DE MEDICIONES
// =============================

function guardarPunto(){

let velocidad = parseFloat(document.getElementById("velocidad").value);
let direccion = parseFloat(document.getElementById("direccion").value);

if(!ultimoClick){
alert("Primero selecciona un punto en el mapa");
return;
}

let punto = {
lat: ultimoClick.lat,
lng: ultimoClick.lng,
velocidad: velocidad,
direccion: direccion
};

puntos.push(punto);

// MARCADOR
L.marker([punto.lat, punto.lng])
.addTo(map)
.bindPopup(
"Velocidad: "+velocidad+" m/s<br>"+
"Dirección: "+direccion+"°"
);

// FLECHA DEL VIENTO
dibujarViento(punto);

actualizarHeatmap();
actualizarGrafica();

}

// =============================
// DIRECCION DEL VIENTO
// =============================

function dibujarViento(p){

let distancia = 0.003;

let lat2 = p.lat + distancia * Math.cos(p.direccion * Math.PI / 180);
let lng2 = p.lng + distancia * Math.sin(p.direccion * Math.PI / 180);

L.polyline([
[p.lat, p.lng],
[lat2, lng2]
],{
color:"#00eaff",
weight:3
}).addTo(map);

}

// =============================
// HEATMAP
// =============================

let heatLayer = L.heatLayer([], {
radius:30,
blur:20
}).addTo(map);

function actualizarHeatmap(){
let data = puntos.map(p => [p.lat, p.lng, p.velocidad]);
heatLayer.setLatLngs(data);
}

// =============================
// ANALISIS CIENTIFICO
// =============================

function analizarDatos(){

if(puntos.length === 0){
document.getElementById("analisis").innerHTML =
"No existen datos registrados.";
return;
}

let promedio =
puntos.reduce((a,b)=>a+b.velocidad,0)/puntos.length;

let max =
Math.max(...puntos.map(p=>p.velocidad));

let min =
Math.min(...puntos.map(p=>p.velocidad));

let variabilidad = max - min;

let interpretacion;

if(promedio > 6){
interpretacion =
"Zona con dinámica eólica intensa. Riesgo para cultivos altos y estructuras agrícolas.";
}
else if(promedio > 3){
interpretacion =
"Zona con régimen de viento moderado favorable para ventilación natural del cultivo.";
}
else{
interpretacion =
"Zona de baja circulación de aire. Posible acumulación de humedad en el suelo.";
}

document.getElementById("analisis").innerHTML = `
<h3>Informe microclimático del terreno</h3>

Velocidad promedio: ${promedio.toFixed(2)} m/s <br>
Velocidad máxima: ${max} m/s <br>
Velocidad mínima: ${min} m/s <br>
Variabilidad del viento: ${variabilidad.toFixed(2)} m/s <br><br>

Interpretación técnica:<br>
${interpretacion}

<br><br>
Análisis agroclimático:
<br>
• Impacto en evapotranspiración del suelo
<br>
• Influencia en dispersión de polen
<br>
• Posible erosión eólica
<br>
• Comportamiento microclimático del terreno
`;
}

// =============================
// GRAFICA CIENTIFICA
// =============================

let grafica;

function actualizarGrafica(){

let canvas = document.getElementById("grafica");

if(!canvas){
canvas = document.createElement("canvas");
canvas.id = "grafica";
canvas.style.marginTop = "20px";
document.getElementById("analisis").appendChild(canvas);
}

let datos = puntos.map(p=>p.velocidad);

if(grafica){
grafica.destroy();
}

grafica = new Chart(canvas,{
type:"line",
data:{
labels:datos.map((_,i)=>"P"+(i+1)),
datasets:[{
label:"Velocidad del viento",
data:datos,
borderColor:"#00eaff",
tension:0.4
}]
},
options:{
responsive:true
}
});

}

// =============================
// EXPORTACION
// =============================

function exportarImagen(){
html2canvas(document.body).then(canvas=>{
let link = document.createElement("a");
link.download = "analisis_viento.png";
link.href = canvas.toDataURL();
link.click();
});
}

function exportarPDF(){
html2canvas(document.body).then(canvas=>{
const { jsPDF } = window.jspdf;
let pdf = new jsPDF();
pdf.addImage(canvas.toDataURL("image/png"),
"PNG",10,10,190,0);
pdf.save("reporte_viento.pdf");
});
}

// =============================
// SIMULACION DE CORRIENTE DE VIENTO
// =============================

function simularFlujo(){

puntos.forEach(p=>{

let flujo = L.circle(
[p.lat, p.lng],
{
radius: 200,
color:"#00f0ff",
fillOpacity:0.05
}
).addTo(map);

setTimeout(()=>{
map.removeLayer(flujo);
},2000);

});

}

setInterval(simularFlujo,4000);
