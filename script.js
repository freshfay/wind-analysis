// INICIALIZAR MAPA
let map = L.map('map', {
    center: [0.35, -78.12], // Ecuador
    zoom: 13,
    maxZoom: 22
});

// CAPAS DEL MAPA

// Normal
let normal = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 22 }
);

// Satélite
let satelite = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    {
        maxZoom: 22,
        subdomains:['mt0','mt1','mt2','mt3']
    }
);

// Híbrido
let hibrido = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    {
        maxZoom: 22,
        subdomains:['mt0','mt1','mt2','mt3']
    }
);

// AGREGAR CAPA INICIAL
normal.addTo(map);

// CONTROL DE CAPAS
let baseMaps = {
    "Mapa normal": normal,
    "Satélite": satelite,
    "Híbrido": hibrido
};

L.control.layers(baseMaps).addTo(map);


// BUSCADOR
L.Control.geocoder().addTo(map);


// VARIABLES
let puntos = [];
let marcadores = [];
let heatPoints = [];


// CLICK EN MAPA
map.on("click", function(e){

    let lat = e.latlng.lat;
    let lng = e.latlng.lng;

    window.latSeleccionado = lat;
    window.lngSeleccionado = lng;

    alert("Punto seleccionado en el mapa");
});


// GUARDAR MEDICION
function guardarPunto(){

    let velocidad = document.getElementById("velocidad").value;
    let direccion = document.getElementById("direccion").value;

    if(!velocidad || !direccion){
        alert("Debes ingresar los datos del viento");
        return;
    }

    if(window.latSeleccionado === undefined){
        alert("Primero selecciona un punto en el mapa");
        return;
    }

    let data = {
        lat: window.latSeleccionado,
        lng: window.lngSeleccionado,
        velocidad: parseFloat(velocidad),
        direccion: parseFloat(direccion)
    };

    puntos.push(data);

    let marker = L.marker([data.lat, data.lng])
        .addTo(map)
        .bindPopup(`
        Velocidad: ${data.velocidad} m/s <br>
        Dirección: ${data.direccion}°
        `);

    marcadores.push(marker);

    heatPoints.push([data.lat, data.lng, data.velocidad]);

    actualizarMapaCalor();

    alert("Medición registrada");
}


// MAPA DE CALOR
let heatLayer;

function actualizarMapaCalor(){

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

    puntos.forEach(p => {
        suma += p.velocidad;
        if(p.velocidad > max) max = p.velocidad;
    });

    let promedio = suma / puntos.length;

    document.getElementById("analisis").innerHTML = `
    <h2>Resultados del análisis</h2>

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

    html2canvas(document.body).then(canvas => {

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

    pdf.addImage(img, "PNG", 10, 10, 280, 150);

    pdf.save("reporte_viento.pdf");
}
