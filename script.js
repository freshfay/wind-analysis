/// MAPA
var map = L.map('map').setView([-0.22, -78.51], 13);

// CAPA SATELITAL
var satelite = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom: 19
}).addTo(map);

// BUSCADOR
L.Control.geocoder().addTo(map);

// DIBUJO DE TERRENO
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
edit: { featureGroup: drawnItems }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (e) {
drawnItems.addLayer(e.layer);
});

// DATOS
let puntos = [];
let ultimoClick = null;

// CLICK EN MAPA
map.on("click", function(e){
ultimoClick = e.latlng;
});

// GUARDAR PUNTO
function guardarPunto(){

let velocidad = parseFloat(document.getElementById("velocidad").value);
let direccion = parseFloat(document.getElementById("direccion").value);

if(!ultimoClick){
alert("Selecciona un punto en el mapa");
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
.bindPopup("Velocidad: "+velocidad+" m/s<br>Dirección: "+direccion+"°");

// FLECHA DE VIENTO
dibujarViento(punto);

actualizarGrafica();
}

// DIBUJAR DIRECCIÓN DEL VIENTO
function dibujarViento(p){

let distancia = 0.002;

let lat2 = p.lat + distancia * Math.cos(p.direccion * Math.PI / 180);
let lng2 = p.lng + distancia * Math.sin(p.direccion * Math.PI / 180);

L.polyline([
[p.lat, p.lng],
[lat2, lng2]
], {
color:"cyan",
weight:3
}).addTo(map);

}

// HEATMAP
let heatLayer = L.heatLayer([], {radius:25}).addTo(map);

function actualizarHeatmap(){

let data = puntos.map(p => [p.lat, p.lng, p.velocidad]);
heatLayer.setLatLngs(data);

}

// ANALISIS TECNICO
function analizarDatos(){

if(puntos.length === 0){
document.getElementById("analisis").innerHTML =
"No hay datos aún.";
return;
}

actualizarHeatmap();

let promedio =
puntos.reduce((a,b)=>a+b.velocidad,0)/puntos.length;

let max =
Math.max(...puntos.map(p=>p.velocidad));

let min =
Math.min(...puntos.map(p=>p.velocidad));

let zona = "";

if(promedio > 5){
zona = "Zona con vientos fuertes (posible impacto en cultivos altos)";
}
else if(promedio > 3){
zona = "Zona de viento moderado adecuada para ventilación natural";
}
else{
zona = "Zona de viento bajo, condiciones estables";
}

document.getElementById("analisis").innerHTML = `
<h3>Informe técnico del viento</h3>

Promedio de velocidad: ${promedio.toFixed(2)} m/s<br>
Velocidad máxima: ${max} m/s<br>
Velocidad mínima: ${min} m/s<br><br>

Evaluación agroclimática:<br>
${zona}

<br><br>
Interpretación científica:<br>
El patrón de viento sugiere un comportamiento
microclimático del terreno que puede influir en:

• Dispersión de semillas<br>
• Evaporación del suelo<br>
• Polinización natural<br>
• Riesgo de daño en cultivos
`;

}

// GRAFICA
let grafica;

function actualizarGrafica(){

let datos = puntos.map(p=>p.velocidad);

let canvas = document.getElementById("grafica");

if(!canvas){
canvas = document.createElement("canvas");
canvas.id = "grafica";
canvas.style.marginTop = "20px";
document.getElementById("analisis").appendChild(canvas);
}

if(grafica){
grafica.destroy();
}

grafica = new Chart(canvas, {
type:"line",
data:{
labels:datos.map((_,i)=>"P"+(i+1)),
datasets:[{
label:"Velocidad del viento",
data:datos,
borderColor:"cyan",
tension:0.3
}]
},
options:{
responsive:true
}
});

}

// EXPORTAR IMAGEN
function exportarImagen(){

html2canvas(document.body).then(canvas=>{
let link = document.createElement("a");
link.download = "analisis_viento.png";
link.href = canvas.toDataURL();
link.click();
});

}

// EXPORTAR PDF
function exportarPDF(){

html2canvas(document.body).then(canvas=>{

const { jsPDF } = window.jspdf;
let pdf = new jsPDF();

pdf.addImage(canvas.toDataURL("image/png"),
"PNG",
10,
10,
190,
0);

pdf.save("reporte_viento.pdf");

});
}

// MODO PRESENTACION
let modo = false;

document.addEventListener("keydown", function(e){

if(e.key === "p"){

modo = !modo;

document.body.style.background =
modo ? "#000814" : "";

document.querySelector(".navbar").style.display =
modo ? "none" : "flex";

}

});
