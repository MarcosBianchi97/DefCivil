const datosAsistencia = [
	{ departamento: "Capital", x: 21.4, y: 46.8 },
	{ departamento: "Pellegrini", x: 31.0, y: 12.6 },
	{ departamento: "Copo", x: 69.8, y: 6.2 },
	{ departamento: "General Taboada", x: 81.4, y: 60.8 },
	{ departamento: "Choya", x: 11.9, y: 64.8 },
	{ departamento: "Jiménez", x: 25.5, y: 26.4 },
	{ departamento: "Mitre", x: 69.6, y: 82.2 },
	{ departamento: "Loreto", x: 25.1, y: 61.5 },
	{ departamento: "Figueroa", x: 46.1, y: 35.0 },
	{ departamento: "Avellaneda", x: 75.7, y: 49.9 },
	{ departamento: "San Martín", x: 37.9, y: 52.8 },
	{ departamento: "Banda", x: 27.8, y: 37.3 },
	{ departamento: "Ojo de Agua", x: 33.4, y: 75.5 },
	{ departamento: "Rivadavia", x: 83.6, y: 90.4 },
	{ departamento: "Guasayán", x: 8.9, y: 48.4 },
	{ departamento: "Quebrachos", x: 52.2, y: 77.4 },
	{ departamento: "Río Hondo", x: 11.9, y: 38.2 },
	{ departamento: "Alberdi", x: 70.3, y: 18.3 },
	{ departamento: "Robles", x: 36.1, y: 46.0 },
	{ departamento: "Salavina", x: 53.3, y: 68.0 },
	{ departamento: "Juan Felipe Ibarra", x: 49.3, y: 50.9 },
	{ departamento: "Moreno", x: 78.3, y: 34.4 },
	{ departamento: "Atamisqui", x: 37.5, y: 62.9 },
	{ departamento: "Belgrano", x: 85.0, y: 71.3 },
	{ departamento: "Sarmiento", x: 56.5, y: 60.3 },
	{ departamento: "Aguirre", x: 76.1, y: 75.8 },
	{ departamento: "Silípica", x: 25.5, y: 52.9 }
];

const posicionesCompartidas = typeof window.POSICIONES_PINES === "object" ? window.POSICIONES_PINES : {};

try {
	const posicionesGuardadas = JSON.parse(localStorage.getItem("dc_posiciones_pines") || "null");
	const posicionesFinales = { ...posicionesCompartidas, ...(posicionesGuardadas || {}) };
	if (posicionesFinales) {
		datosAsistencia.forEach(function (departamento) {
			const posicion = posicionesFinales[departamento.departamento];
			if (posicion && typeof posicion.x === "number" && typeof posicion.y === "number") {
				departamento.x = posicion.x;
				departamento.y = posicion.y;
			}
		});
	}
} catch (error) {
	console.warn("No se pudieron cargar las posiciones guardadas de los pines. Se usan las posiciones compartidas por defecto.", error);
	const posicionesFinales = posicionesCompartidas;
	if (posicionesFinales) {
		datosAsistencia.forEach(function (departamento) {
			const posicion = posicionesFinales[departamento.departamento];
			if (posicion && typeof posicion.x === "number" && typeof posicion.y === "number") {
				departamento.x = posicion.x;
				departamento.y = posicion.y;
			}
		});
	}
}

function renderizarMarcadoresAsistencia() {
	const capa = document.getElementById("marcadores-asistencia");
	if (!capa) return;

	capa.innerHTML = datosAsistencia.map(function (departamento) {
		const posicion = { x: departamento.x, y: departamento.y };
		const tieneFamilias = typeof departamento.familiasAsistidas === "number";
		const descripcion = tieneFamilias ? departamento.departamento + ": " + departamento.familiasAsistidas + " familias asistidas" : departamento.departamento;
		const familias = tieneFamilias ? departamento.familiasAsistidas : "";
		return '<button type="button" class="marcador-asistencia" style="left: ' + posicion.x + '%; top: ' + posicion.y + '%" aria-label="' + escaparTextoMapa(descripcion) + '" data-departamento="' + escaparTextoMapa(departamento.departamento) + '" data-familias="' + familias + '"></button>';
	}).join("");

	const ficha = document.createElement("div");
	ficha.className = "ficha-asistencia";
	ficha.setAttribute("role", "tooltip");
	ficha.setAttribute("aria-hidden", "true");
	ficha.innerHTML = '<strong class="ficha-asistencia-titulo"></strong><span class="ficha-asistencia-dato"></span>';
	capa.appendChild(ficha);

	capa.querySelectorAll(".marcador-asistencia").forEach(function (marcador) {
		marcador.addEventListener("mouseenter", mostrarFicha);
		marcador.addEventListener("focus", mostrarFicha);
		marcador.addEventListener("mouseleave", ocultarFicha);
		marcador.addEventListener("blur", ocultarFicha);
	});

	function mostrarFicha(evento) {
		const marcador = evento.currentTarget;
		ficha.querySelector(".ficha-asistencia-titulo").textContent = marcador.dataset.departamento;
		ficha.querySelector(".ficha-asistencia-dato").textContent = marcador.dataset.familias ? marcador.dataset.familias + " familias asistidas" : "";
		ficha.style.left = marcador.style.left;
		ficha.style.top = marcador.style.top;
		ficha.classList.toggle("ficha-abajo", parseFloat(marcador.style.top) < 24);
		ficha.setAttribute("aria-hidden", "false");
	}

	function ocultarFicha() {
		ficha.setAttribute("aria-hidden", "true");
	}
}

function escaparTextoMapa(texto) {
	return texto.replace(/[&<>"']/g, function (caracter) {
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caracter];
	});
}

function normalizarNombreDepartamento(nombre) {
	return String(nombre || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

// Trae de la base las familias asistidas por departamento y vuelve a dibujar los pines
function cargarAsistenciaDesdeBase() {
	fetch("/api/estadisticas/mapa")
		.then(function (res) {
			if (!res.ok) throw new Error("No se pudo cargar el mapa");
			return res.json();
		})
		.then(function (respuesta) {
			const totales = {};
			(respuesta.data || []).forEach(function (fila) {
				totales[normalizarNombreDepartamento(fila.departamento)] = fila.familias_asistidas;
			});
			datosAsistencia.forEach(function (departamento) {
				const total = totales[normalizarNombreDepartamento(departamento.departamento)];
				if (total > 0) departamento.familiasAsistidas = total;
			});
			renderizarMarcadoresAsistencia();
		})
		.catch(function (error) {
			console.warn("No se pudieron cargar los datos del mapa desde /api/estadisticas/mapa:", error);
		});
}

document.addEventListener("DOMContentLoaded", function () {
	renderizarMarcadoresAsistencia();
	cargarAsistenciaDesdeBase();
});