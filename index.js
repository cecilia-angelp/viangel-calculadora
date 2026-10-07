// CONTROL VISUAL DE MENÚS EN COMPUTADOR
function mostrarMenu(id) {
    if (window.innerWidth > 768) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.style.display = 'block';
    }
}

function ocultarMenu(id) {
    if (window.innerWidth > 768) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.style.display = 'none';
    }
}

// MODALES Y NAVEGACIÓN
function abrirModal(tipo) {
    const modal = document.getElementById('modal-' + tipo);
    if (modal) modal.style.display = 'flex';
}

function cerrarModal(tipo) {
    const modal = document.getElementById('modal-' + tipo);
    if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
    }
}

function enfocarCalculadora() {
    const card = document.getElementById('calc-card');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('calculator-focus');
    setTimeout(() => card.classList.remove('calculator-focus'), 1200);
}

function irAContacto() {
    const footer = document.getElementById('contacto');
    footer.scrollIntoView({ behavior: 'smooth' });
}

// COMPORTAMIENTO MÓVIL VS COMPUTADOR
function manejarClickCalculadora() {
    if (window.innerWidth <= 768) {
        abrirModal('calculadora');
    } else {
        enfocarCalculadora();
    }
}

function manejarClickContacto() {
    if (window.innerWidth <= 768) {
        abrirModal('contacto');
    } else {
        irAContacto();
    }
}

function activarCajitaPeaje() {
    const isChecked = document.getElementById('tolls-check').checked;
    const inputPeaje = document.getElementById('tolls-amount');
    inputPeaje.disabled = !isChecked; 
    if (!isChecked) { 
        inputPeaje.value = 0; 
    } else { 
        inputPeaje.focus(); 
    }
}

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

function validarServiciosEspeciales(checkboxActual) {
    const checkExtra = document.getElementById('extraordinario-check');
    const checkContinuo = document.getElementById('continuo-check');

    if (checkboxActual.id === 'extraordinario-check' && checkboxActual.checked) {
        checkContinuo.checked = false;
    } else if (checkboxActual.id === 'continuo-check' && checkboxActual.checked) {
        checkExtra.checked = false;
    }
}

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
        
        if (esDinero) {
            elemento.innerText = '$' + Math.round(valorActual).toLocaleString('es-CL');
        } else {
            elemento.innerText = valorActual.toFixed(1) + ' Km';
        }
    }, intervalos);
}

// CÁLCULO DE COSTOS CON MAPAS
async function calcularFleteViAngel() {
    const btnCalc = document.getElementById('btn-calcular');
    const originInput = document.getElementById('origin-input').value;
    const destinationInput = document.getElementById('destination').value;
    const weightInput = document.getElementById('weight').value;
    const tollsInput = document.getElementById('tolls-amount').value;
    const isTollsChecked = document.getElementById('tolls-check').checked;
    const isOtroOrigenChecked = document.getElementById('checkOtroOrigen').checked;

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

        if (!isOtroOrigenChecked) {
            startLat = -33.3930;
            startLon = -70.7937;
        } else {
            const geoOriginUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&q=${encodeURIComponent(originInput)}`;
            const geoOriginRes = await fetch(geoOriginUrl);
            if (!geoOriginRes.ok) throw new Error("Error al consultar dirección de origen.");
            const geoOriginData = await geoOriginRes.json();

            if (!geoOriginData || geoOriginData.length === 0) {
                alert("No se encontró la dirección de ORIGEN en Chile.");
                return;
            }
            startLon = geoOriginData[0].lon;
            startLat = geoOriginData[0].lat;
        }

        const geoDestUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&q=${encodeURIComponent(destinationInput)}`;
        const geoDestRes = await fetch(geoDestUrl);
        if (!geoDestRes.ok) throw new Error("Error al consultar el servidor de mapas.");
        const geoDestData = await geoDestRes.json();

        if (!geoDestData || geoDestData.length === 0) {
            alert("No se encontró el DESTINO en Chile.");
            return;
        }

        const endLon = geoDestData[0].lon;
        const endLat = geoDestData[0].lat;

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
        const osrmRes = await fetch(osrmUrl);
        if (!osrmRes.ok) throw new Error("El servidor OSRM no respondió a tiempo.");
        const osrmData = await osrmRes.json();

        if (!osrmData.routes || osrmData.routes.length === 0) {
            alert("Error al trazar la ruta en carretera.");
            return;
        }

        const kilometrosReales = osrmData.routes[0].distance / 1000;

        const baseFija = 18000;
        const valorPorKm = kilometrosReales * 1100;
        const pesoKilo = (parseFloat(weightInput) || 0) * 50;
        let costoBaseTotal = baseFija + valorPorKm + pesoKilo;

        let porcentajeRecargo = 0;
        if (document.getElementById('continuo-check').checked) {
            porcentajeRecargo = 0.60;
        } else if (document.getElementById('extraordinario-check').checked) {
            porcentajeRecargo = 0.30;
        }

        let totalNeto = costoBaseTotal * (1 + porcentajeRecargo);
        const iva = totalNeto * 0.19;
        
        let valorPeaje = parseFloat(tollsInput) || 0;
        if (valorPeaje > 150000) valorPeaje = 150000;
        const peajes = isTollsChecked ? valorPeaje : 0; 
        
        const totalMasIva = totalNeto + iva + peajes;

        animarNumero('txt-distancia', kilometrosReales, false);
        animarNumero('txt-neto', totalNeto, true);
        animarNumero('txt-iva', iva, true);
        animarNumero('txt-peajes', peajes, true);
        animarNumero('txt-total', totalMasIva, true);

    } catch (error) {
        console.error("Detalle del error:", error);
        alert("Ocurrió una interrupción con la API de mapas. Intenta presionar 'CALCULAR COSTO TOTAL' nuevamente.");
    } finally {
        btnCalc.innerText = "CALCULAR COSTO TOTAL";
        btnCalc.disabled = false;
    }
}

// ENVÍO A WHATSAPP
function enviarCotizacionWhatsApp() {
    const originInput = document.getElementById('origin-input').value;
    const destinationInput = document.getElementById('destination').value;
    const weightInput = document.getElementById('weight').value;
    const tollsInput = document.getElementById('tolls-amount').value;
    const isTollsChecked = document.getElementById('tolls-check').checked;
    const isExtraordinarioChecked = document.getElementById('extraordinario-check').checked;
    const isContinuoChecked = document.getElementById('continuo-check').checked;

    let kilometrosReales = 0;
    try {
        const txtDist = document.getElementById('txt-distancia').innerText;
        kilometrosReales = parseFloat(txtDist) || 0;
    } catch(e) {}

    if (kilometrosReales === 0 || !destinationInput.trim()) {
        alert("Por favor presiona el botón 'CALCULAR COSTO TOTAL' antes de solicitar la cotización por WhatsApp.");
        return; 
    }

    const baseFija = 18000;
    const valorPorKm = kilometrosReales * 1100;
    const pesoKilo = (parseFloat(weightInput) || 0) * 50;
    let costoBaseTotal = baseFija + valorPorKm + pesoKilo;

    let porcentajeRecargo = 0;
    let servicioTxt = "";
    if (isContinuoChecked) {
        porcentajeRecargo = 0.60;
        servicioTxt = " [SERVICIO CONTINUO 24/7 - DOBLE CHOFER (+60%)]";
    } else if (isExtraordinarioChecked) {
        porcentajeRecargo = 0.30;
        servicioTxt = " [SERVICIO EXTRAORDINARIO (+30%)]";
    }

    let totalNeto = costoBaseTotal * (1 + porcentajeRecargo);
    const iva = totalNeto * 0.19;
    
    let valorPeaje = parseFloat(tollsInput) || 0;
    if (valorPeaje > 150000) valorPeaje = 150000;
    const peajes = isTollsChecked ? valorPeaje : 0; 
    
    const totalMasIva = totalNeto + iva + peajes;
    const clp = (val) => '$' + Math.round(val).toLocaleString('es-CL');

    const textoMensaje = "Hola ViAngel Logistics,\n\n" +
                         "Solicito la cotización para un servicio de flete con los siguientes detalles:\n\n" +
                         "Origen: " + originInput + "\n" +
                         "Destino: " + destinationInput + servicioTxt + "\n\n" +
                         "--- RESUMEN DE COTIZACIÓN ---\n" +
                         "Distancia: " + kilometrosReales.toFixed(1) + " Km\n" +
                         "Neto: " + clp(totalNeto) + "\n" +
                         "IVA (19%): " + clp(iva) + "\n" +
                         "Peajes: " + clp(peajes) + "\n" +
                         "Total a Pagar: " + clp(totalMasIva) + "\n\n" +
                         "Quedo atento(a) a su confirmación. ¡Muchas gracias!";

    const urlWhatsApp = "https://wa.me/56935371521?text=" + encodeURIComponent(textoMensaje);
    window.open(urlWhatsApp, '_blank');
}
