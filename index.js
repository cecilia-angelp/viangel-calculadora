// ==========================================
// 1. BLOQUEO DE SEGURIDAD POR CLAVE
// ==========================================
(function verificarAcceso() {
    const CLAVE_CORRECTA = "fletesmi";
    let intensionClave = prompt("🔒 Acceso Restringido - ViAngel\nIngrese la contraseña para continuar:");

    if (intensionClave !== CLAVE_CORRECTA) {
        alert("❌ Contraseña incorrecta. Acceso denegado.");
        document.body.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#081729; color:white; font-family:sans-serif; text-align:center;">
                <div>
                    <h1 style="font-size:3rem; margin-bottom:10px;">🔒 Acceso Restringido</h1>
                    <p style="color:#94a3b8; font-size:1.2rem;">Debes ingresar la contraseña correcta para ver la calculadora.</p>
                </div>
            </div>
        `;
        throw new Error("Acceso no autorizado.");
    }
})();

// MODALES Y FOCO
function abrirModal(tipo) { document.getElementById('modal-' + tipo).style.display = 'flex'; }
function cerrarModal(tipo) { document.getElementById('modal-' + tipo).style.display = 'none'; }

window.onclick = function(event) {
    if (event.target === document.getElementById('modal-servicios')) cerrarModal('servicios');
    if (event.target === document.getElementById('modal-nosotros')) cerrarModal('nosotros');
}

function enfocarCalculadora() {
    const card = document.getElementById('calc-card');
    card.classList.add('calculator-focus');
    setTimeout(() => card.classList.remove('calculator-focus'), 1200);
}

function activarCajitaPeaje() {
    const isChecked = document.getElementById('tolls-check').checked;
    const inputPeaje = document.getElementById('tolls-amount');
    inputPeaje.disabled = !isChecked; 
    if (!isChecked) { inputPeaje.value = 0; } else { inputPeaje.focus(); }
}

// ==========================================
// 2. FUNCIÓN CAMBIAR ORIGEN
// ==========================================
function toggleOtroOrigen() {
    const check = document.getElementById('checkOtroOrigen');
    const inputOrigen = document.getElementById('origin-input');

    if (check.checked) {
        inputOrigen.value = "";
        inputOrigen.disabled = false;
        inputOrigen.classList.remove('input-disabled');
        inputOrigen.placeholder = "Escribe la dirección de origen...";
        inputOrigen.focus();
    } else {
        inputOrigen.value = "Osvaldo croquevielle 2207 - terminal aduanero";
        inputOrigen.disabled = true;
        inputOrigen.classList.add('input-disabled');
    }
}

// ANIMACIÓN DE NÚMEROS
function animarNumero(idElemento, valorFinal, esDinero = true) {
    const elemento = document.getElementById(idElemento);
    let valorActual = 0;
    const duracionAnimacion = 1000; 
    const intervalos = 30; 
    const incremento = valorFinal / (duracionAnimacion / intervalos);

    const timer = setInterval(() => {
        valorActual += incremento;
        if ((incremento > 0 && valorActual >= valorFinal) || (incremento < 0 && valorActual <= valorFinal) || valorFinal === 0) {
            valorActual = valorFinal;
            clearInterval(timer);
        }
        
        if(esDinero) {
            elemento.innerText = '$' + Math.round(valorActual).toLocaleString('es-CL');
        } else {
            elemento.innerText = valorActual.toFixed(1) + ' Km';
        }
    }, intervalos);
}

// ==========================================
// 3. MOTOR MATEMÁTICO REAL + EXPRÉS + GEOLOCALIZACIÓN
// ==========================================
async function calcularFleteViAngel() {
    const originInput = document.getElementById('origin-input').value;
    const destinationInput = document.getElementById('destination').value;
    const weightInput = document.getElementById('weight').value;
    const tollsInput = document.getElementById('tolls-amount').value;
    const isTollsChecked = document.getElementById('tolls-check').checked;
    const isExpressChecked = document.getElementById('express-check').checked;
    const isOtroOrigenChecked = document.getElementById('checkOtroOrigen').checked;
    const btnCalc = document.getElementById('btn-calcular');

    if (!originInput.trim()) {
        alert("Por favor, ingresa una dirección de origen.");
        return;
    }

    if (!destinationInput.trim()) {
        alert("Por favor, ingresa un destino para calcular.");
        return;
    }

    btnCalc.innerText = "CALCULANDO RUTA...";
    btnCalc.disabled = true;

    try {
        let startLon, startLat;

        // 1. ORIGEN (Fijo o Dinámico)
        if (!isOtroOrigenChecked) {
            // Coordenadas fijas Osvaldo Croquevielle 2207 (Aeropuerto / Pudahuel)
            startLat = -33.3930;
            startLon = -70.7937;
        } else {
            const geoOriginUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originInput + ", Chile")}`;
            const geoOriginRes = await fetch(geoOriginUrl);
            
            if (!geoOriginRes.ok) throw new Error("Error al consultar dirección de origen.");
            const geoOriginData = await geoOriginRes.json();

            if (!geoOriginData || geoOriginData.length === 0) {
                alert("No se encontró la dirección de ORIGEN. Intenta escribirla sin caracteres especiales.");
                return;
            }

            startLon = geoOriginData[0].lon;
            startLat = geoOriginData[0].lat;
        }

        // 2. DESTINO
        const geoDestUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationInput + ", Chile")}`;
        const geoDestRes = await fetch(geoDestUrl);

        if (!geoDestRes.ok) throw new Error("Error al consultar el servidor de mapas.");
        const geoDestData = await geoDestRes.json();

        if (!geoDestData || geoDestData.length === 0) {
            alert("No se encontró el DESTINO. Intenta escribir la comuna y dirección más clara (Ej: 'Canada 185, Providencia').");
            return;
        }

        const endLon = geoDestData[0].lon;
        const endLat = geoDestData[0].lat;

        // 3. RUTA CARRETERA (OSRM)
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
        const osrmRes = await fetch(osrmUrl);

        if (!osrmRes.ok) throw new Error("El servidor OSRM no respondió a tiempo.");
        const osrmData = await osrmRes.json();

        if (!osrmData.routes || osrmData.routes.length === 0) {
            alert("Error al trazar la ruta en carretera.");
            return;
        }

        const kilometrosReales = osrmData.routes[0].distance / 1000;

        // TARIFAS BASE
        const baseFija = 18000;
        const valorPorKm = kilometrosReales * 1100;
        const pesoKilo = (parseFloat(weightInput) || 0) * 50;

        let totalNeto = baseFija + valorPorKm + pesoKilo;

        // RECARGO EXPRÉS / EXTRAORDINARIO (+30%)
        if (isExpressChecked) {
            totalNeto = totalNeto * 1.30;
        }

        const iva = totalNeto * 0.19;
        const peajes = isTollsChecked ? (parseFloat(tollsInput) || 0) : 0; 
        const totalMasIva = totalNeto + iva + peajes;

        // CONTROL INTERNO: BENCINA Y GANANCIA
        const rendimientoN400 = 12; 
        const precioBencina95 = 1600; 
        const gastoBencinaBolsillo = ((kilometrosReales * 2) / rendimientoN400) * precioBencina95;
        const gananciaLimpiaViAngel = totalMasIva - gastoBencinaBolsillo - peajes;

        // ANIMACIONES DE RESULTADO
        animarNumero('txt-distancia', kilometrosReales, false);
        animarNumero('txt-neto', totalNeto, true);
        animarNumero('txt-iva', iva, true);
        animarNumero('txt-peajes', peajes, true);
        animarNumero('txt-total', totalMasIva, true);

 

// LINK A WHATSAPP
const clp = (val) => '$' + Math.round(val).toLocaleString('es-CL');
const expressTxt = isExpressChecked ? " [SERVICIO EXPRÉS (+30%)]" : "";

const mensaje = `Hola ViAngel Logistics! 👋
Deseo solicitar la cotización para un flete con los siguientes datos:

*Origen:* ${originInput}
*Destino:* ${destinationInput}${expressTxt}

--- *RESUMEN DE COTIZACIÓN* ---
• *Neto:* ${clp(totalNeto)}
• *IVA (19%):* ${clp(iva)}
• *Peajes:* ${clp(peajes)}

*Total a Pagar:* ${clp(totalMasIva)}`;


Quedo atento(a) a su confirmación y disponibilidad. ¡Muchas gracias!`;

        document.getElementById('whatsapp-link').href = `https://wa.me/56935371521?text=${encodeURIComponent(textoMensaje)}`;

    } catch (error) {
        console.error("Detalle del error:", error);
        alert("Ocurrió una interrupción momentánea de conexión con la API de mapas. Intenta presionar 'CALCULAR COSTO TOTAL' nuevamente.");
    } finally {
        // SIEMPRE REINICIA EL BOTÓN
        btnCalc.innerText = "CALCULAR COSTO TOTAL";
        btnCalc.disabled = false;
    }
}