// =============================
// CREAR MAPA
// =============================
var map = L.map('map').setView([-0.18, -78.47], 13);

// =============================
// CAPAS DEL MAPA
// =============================

// Mapa normal
var mapaNormal = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
attribution: 'OpenStreetMap'
}
);

// Satélite
var mapaSatelital = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
{
attribution: 'Esri Satellite'
}
);

// Etiquetas (modo híbrido)
var etiquetas = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
opacity: 0.35
}
);

// Híbrido
var mapaHibrido = L.layerGroup([mapaSatelital, etiquetas]);

// Activar mapa inicial
mapaNormal.addTo(map);

// Selector de capas
L.control.layers({
"Mapa": mapaNormal,
"Satélite": mapaSatelital,
"Híbrido": mapaHibrido
}).addTo(map);

// =============================
// BUSCADOR
// =============================
L.Control.geocoder().addTo(map);

// =============================
// VARIABLES
// =============================
let datosViento = [];
let puntoTemporal = null;
let capaCalor = null;
let zonas = [];
let drawnItems = new L.FeatureGroup();
let areaTerreno = 0;

map.addLayer(drawnItems);

// =============================
// DIBUJAR TERRENO
// =============================
var drawControl = new L.Control.Draw({
edit: { featureGroup: drawnItems },
draw: {
polygon:true,
rectangle:true,
circle:false,
polyline:false,
marker:false
}
});

map.addControl(drawControl);

// Guardar terreno y calcular área
map.on(L.Draw.Event.CREATED, function (event) {

var layer = event.layer;
drawnItems.addLayer(layer);

if(layer.getLatLngs){

let latlngs = layer.getLatLngs()[0];
let area = L.GeometryUtil.geodesicArea(latlngs);
areaTerreno = area / 10000;

}

});

// =============================
// CLICK EN MAPA
// =============================
map.on('click', function(e){
puntoTemporal = e.latlng;
});

// =============================
// GUARDAR MEDICIÓN
// =============================
function guardarPunto(){

if(!puntoTemporal){
alert("Haz clic en el mapa primero.");
return;
}

let velocidad = parseFloat(document.getElementById("velocidad").value);
let direccion = parseFloat(document.getElementById("direccion").value);

if(isNaN(velocidad) || isNaN(direccion)){
alert("Datos incorrectos.");
return;
}

datosViento.push({
lat:puntoTemporal.lat,
lon:puntoTemporal.lng,
velocidad:velocidad,
direccion:direccion
});

L.marker(puntoTemporal).addTo(map)
.bindPopup("Velocidad: "+velocidad+" m/s<br>Dirección: "+direccion+"°");

dibujarFlecha(puntoTemporal, velocidad, direccion);
generarMapaCalor();
clasificarZonas();

}

// =============================
// FLECHAS DE VIENTO
// =============================
function dibujarFlecha(pos, velocidad, direccion){

let distancia = velocidad * 20;
let rad = direccion * Math.PI / 180;

let lat2 = pos.lat + (distancia * Math.cos(rad)) / 10000;
let lon2 = pos.lng + (distancia * Math.sin(rad)) / 10000;

L.polyline([
[pos.lat,pos.lng],
[lat2,lon2]
]).addTo(map);

}

// =============================
// MAPA DE CALOR
// =============================
function generarMapaCalor(){

if(capaCalor){
map.removeLayer(capaCalor);
}

let puntos = datosViento.map(d => [d.lat,d.lon,d.velocidad]);

capaCalor = L.heatLayer(puntos,{radius:25, blur:20}).addTo(map);

}

// =============================
// CLASIFICAR ZONAS AGRÍCOLAS
// =============================
function clasificarZonas(){

zonas.forEach(z=>map.removeLayer(z));
zonas=[];

datosViento.forEach(d=>{

let color="green";

if(d.velocidad>6) color="red";
else if(d.velocidad>3) color="orange";

let zona = L.circle([d.lat,d.lon],{
radius:50,
color:color,
fillOpacity:0.45
}).addTo(map);

zonas.push(zona);

});

}

// =============================
// ANALISIS PROFESIONAL
// =============================
function analizarDatos(){

if(datosViento.length===0){
document.getElementById("analisis").innerHTML="No hay datos registrados.";
return;
}

let suma=0;
let vmax=0;
let vmin=999;

let vx=0;
let vy=0;

datosViento.forEach(d=>{
suma+=d.velocidad;

if(d.velocidad>vmax) vmax=d.velocidad;
if(d.velocidad<vmin) vmin=d.velocidad;

vx+=d.velocidad*Math.cos(d.direccion*Math.PI/180);
vy+=d.velocidad*Math.sin(d.direccion*Math.PI/180);
});

let prom=suma/datosViento.length;
let dir=Math.atan2(vy,vx)*180/Math.PI;
if(dir<0) dir+=360;

let erosion="Baja";
if(vmax>6) erosion="Moderada";
if(vmax>9) erosion="Alta";

let terrenoTexto = areaTerreno > 0 
? areaTerreno.toFixed(2) + " hectáreas"
: "No definido (dibuje el terreno en el mapa)";

document.getElementById("analisis").innerHTML = `

<div style="font-size:16px; line-height:1.7">

<h2>Informe Técnico Agroclimático del Terreno</h2>
<hr>

<h3>Datos del Terreno</h3>
Área total del terreno: <b>${terrenoTexto}</b><br>
Número de puntos analizados: <b>${datosViento.length}</b>

<br>

<h3>Comportamiento del Viento</h3>
Velocidad promedio: <b>${prom.toFixed(2)} m/s</b><br>
Velocidad máxima registrada: <b>${vmax.toFixed(2)} m/s</b><br>
Velocidad mínima registrada: <b>${vmin.toFixed(2)} m/s</b><br>
Dirección predominante del viento: <b>${dir.toFixed(1)}°</b>

<br>

<h3>Evaluación Agroclimática</h3>
Riesgo de erosión eólica: <b>${erosion}</b><br>

El análisis indica que la dinámica del viento en el terreno
está influenciada por la topografía local, la cobertura
vegetal circundante y la distribución térmica del suelo.

<br><br>

<h3>Interpretación Técnica</h3>
Las zonas con velocidades superiores a 6 m/s pueden
experimentar mayor pérdida de humedad del suelo,
incremento de erosión superficial y reducción de
eficiencia en aplicaciones agrícolas.

<br><br>

<h3>Recomendaciones Agronómicas</h3>

• Implementar barreras rompeviento naturales.<br>
• Orientar los cultivos perpendicularmente al viento dominante.<br>
• Mantener cobertura vegetal del suelo.<br>
• Optimizar horarios de riego.<br>
• Evitar fumigación durante ráfagas fuertes.

</div>
`;
}

// =============================
// EXPORTAR IMAGEN
// =============================
function exportarImagen(){
html2canvas(document.body).then(canvas=>{
let link=document.createElement("a");
link.download="mapa_viento.png";
link.href=canvas.toDataURL();
link.click();
});
}

// =============================
// EXPORTAR PDF
// =============================
async function exportarPDF(){

const { jsPDF } = window.jspdf;

let canvas = await html2canvas(document.body);
let img = canvas.toDataURL("image/png");

let pdf = new jsPDF("landscape");
pdf.addImage(img,"PNG",10,10,270,150);
pdf.save("reporte_viento_agricola.pdf");

}

function cerrarIntro(){
document.getElementById("introModal").style.display="none";
}