// VARIABLES GLOBALES PARA MANTENER LA INFORMACIÓN DEL CÁLCULO
let resumenCotizacion = {
    origen: "",
    destino: "",
    distanciaKm: 0,
    pesoKg: 0,
    neto: 0,
    iva: 0,
    peajes: 0,
    total: 0,
    servicioDetalle: ""
};

// MOSTRAR U OCULTAR EL CAMPO DE ORIGEN ADICIONAL
function toggleOrigenCustom() {
    const checkOrigen = document.getElementById('checkOtroOrigen');
    const container = document.getElementById('origenContainer');
    
    if (checkOrigen.checked) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        document.getElementById('originInput').value = '';
    }
}

// CONTROL DE MUTUA EXCLUSIÓN PARA SERVICIOS ESPECIALES
function validarServiciosEspeciales(checkboxActual) {
    const checkExtra = document.getElementById('checkExtraordinario');
    const checkNonStop = document.getElementById('checkNonStop');

    if (checkboxActual.id === 'checkExtraordinario' && checkboxActual.checked) {
        checkNonStop.checked = false;
    } else if (checkboxActual.id === 'checkNonStop' && checkboxActual.checked) {
        checkExtra.checked = false;
    }
}

// FUNCIÓN PRINCIPAL DE CÁLCULO
async function calcularFleteViAngel() {
    const btnCalcular = document.getElementById('btnCalcular');
    const resultBox = document.getElementById('resultBox');
    
    // CAPTURA DE INPUTS
    const isCustomOrigin = document.getElementById('checkOtroOrigen').checked;
    const originInput = isCustomOrigin ? document.getElementById('originInput').value.trim() : "Terminal Aduanero Pudahuel, Santiago";
    const destinationInput = document.getElementById('destinationInput').value.trim();
    const weightInput = parseFloat(document.getElementById('weightInput').value) || 0;
    
    const peajeChecked = document.getElementById('peajeCheck').checked;
    const peajeVal = peajeChecked ? (parseFloat(document.getElementById('peajeInput').value) || 0) : 0;

    // VALIDACIÓN DE DESTINO
    if (!destinationInput) {
        alert("Por favor, ingresa una ciudad o dirección de destino.");
        return;
    }

    if (isCustomOrigin && !originInput) {
        alert("Ingresaste 'Otro origen', por favor escribe la dirección de origen.");
        return;
    }

    // INDICADOR DE CARGA EN BOTÓN
    btnCalcular.disabled = true;
    btnCalcular.innerText = "CALCULANDO RUTA...";

    try {
        // GEOLOCALIZACIÓN FORZADA A CHILE (&countrycodes=cl)
        const geoOriginUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&q=${encodeURIComponent(originInput)}`;
        const geoDestUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&q=${encodeURIComponent(destinationInput)}`;

        const [resOrigin, resDest] = await Promise.all([
            fetch(geoOriginUrl).then(r => r.json()),
            fetch(geoDestUrl).then(r => r.json())
        ]);

        if (!resOrigin || resOrigin.length === 0) {
            alert("No logramos ubicar el punto de origen en Chile. Sé más específico.");
            btnCalcular.disabled = false;
            btnCalcular.innerText = "CALCULAR COSTO TOTAL";
            return;
        }

        if (!resDest || resDest.length === 0) {
            alert("No logramos ubicar el punto de destino en Chile. Prueba agregando la comuna o región.");
            btnCalcular.disabled = false;
            btnCalcular.innerText = "CALCULAR COSTO TOTAL";
            return;
        }

        const lon1 = resOrigin[0].lon;
        const lat1 = resOrigin[0].lat;
        const lon2 = resDest[0].lon;
        const lat2 = resDest[0].lat;

        // CÁLCULO DE RUTA CON OSRM
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
        const resRoute = await fetch(osrmUrl).then(r => r.json());

        if (!resRoute || !resRoute.routes || resRoute.routes.length === 0) {
            alert("No fue posible calcular la ruta terrestre.");
            btnCalcular.disabled = false;
            btnCalcular.innerText = "CALCULAR COSTO TOTAL";
            return;
        }

        const distanceMeters = resRoute.routes[0].distance;
        const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));

        // TARIFAS BASE
        const TARIFA_POR_KM = 1100;
        let subtotalKm = distanceKm * TARIFA_POR_KM;

        // EVALUACIÓN DE SERVICIOS ESPECIALES
        const isExtraChecked = document.getElementById('checkExtraordinario').checked;
        const isNonStopChecked = document.getElementById('checkNonStop').checked;

        let recargoServicio = 0;
        let servicioTexto = "Estándar";

        if (isNonStopChecked) {
            recargoServicio = subtotalKm * 0.60;
            servicioTexto = "Non-Stop 24/7 (Doble Chofer)";
        } else if (isExtraChecked) {
            recargoServicio = subtotalKm * 0.30;
            servicioTexto = "Extraordinario";
        }

        // FÓRMULA FINAL
        const totalNeto = Math.round(subtotalKm + recargoServicio);
        const totalIva = Math.round(totalNeto * 0.19);
        const totalFinal = Math.round(totalNeto + totalIva + peajeVal);

        // ACTUALIZAR INTERFAZ
        document.getElementById('resDistancia').innerText = `${distanceKm.toLocaleString('es-CL')} Km`;
        document.getElementById('resNeto').innerText = `$${totalNeto.toLocaleString('es-CL')}`;
        document.getElementById('resIva').innerText = `$${totalIva.toLocaleString('es-CL')}`;
        document.getElementById('resPeajes').innerText = `$${peajeVal.toLocaleString('es-CL')}`;
        document.getElementById('resTotal').innerText = `$${totalFinal.toLocaleString('es-CL')}`;

        // RESPALDAR DATOS PARA WHATSAPP
        resumenCotizacion = {
            origen: originInput,
            destino: destinationInput,
            distanciaKm: distanceKm,
            pesoKg: weightInput,
            neto: totalNeto,
            iva: totalIva,
            peajes: peajeVal,
            total: totalFinal,
            servicioDetalle: servicioTexto
        };

        resultBox.style.display = 'block';

    } catch (error) {
        console.error("Error en la cotización:", error);
        alert("Hubo un detalle de conexión al calcular la ruta. Inténtalo de nuevo.");
    } finally {
        btnCalcular.disabled = false;
        btnCalcular.innerText = "CALCULAR COSTO TOTAL";
    }
}

// ENVIAR RESUMEN POR WHATSAPP (SIN EMOJIS)
function enviarWhatsApp() {
    const telefonoViAngel = "569XXXXXXXX";

    let mensaje = `Hola ViAngel Logistics, quiero solicitar una cotización con los siguientes detalles:\n\n`;
    mensaje += `*Origen:* ${resumenCotizacion.origen}\n`;
    mensaje += `*Destino:* ${resumenCotizacion.destino}\n`;
    mensaje += `*Distancia:* ${resumenCotizacion.distanciaKm} Km\n`;
    mensaje += `*Carga:* ${resumenCotizacion.pesoKg} Kg\n`;
    mensaje += `*Servicio:* ${resumenCotizacion.servicioDetalle}\n\n`;
    mensaje += `*Subtotal Neto:* $${resumenCotizacion.neto.toLocaleString('es-CL')}\n`;
    mensaje += `*IVA (19%):* $${resumenCotizacion.iva.toLocaleString('es-CL')}\n`;
    mensaje += `*Peajes:* $${resumenCotizacion.peajes.toLocaleString('es-CL')}\n`;
    mensaje += `*TOTAL ESTIMADO:* $${resumenCotizacion.total.toLocaleString('es-CL')}\n\n`;
    mensaje += `Quedo atento a la confirmación de la disponibilidad.`;

    const urlWa = `https://wa.me/${telefonoViAngel}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWa, '_blank');
}
