// Noticias y nivel de alerta del sitio público: ambos vienen del backend (sin auth),
// no hay contenido de ejemplo ni localStorage de por medio.
const API_BASE_URL = window.DC_API_BASE_URL;
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function escaparHtml(texto) {
  return String(texto == null ? "" : texto).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

document.addEventListener("DOMContentLoaded", function () {
  sincronizarNoticias();
  sincronizarAlerta();
});

function mensajeCarrusel(texto) {
  const carouselInner = document.querySelector("#newsCarousel .carousel-inner");
  carouselInner.innerHTML = '<div class="carousel-item active"><p class="text-muted text-center p-5 mb-0">' + texto + '</p></div>';
}

async function sincronizarNoticias() {
  const carouselInner = document.querySelector("#newsCarousel .carousel-inner");
  const indicadores = document.querySelector("#newsCarousel .carousel-indicators");
  if (!carouselInner || !indicadores) return;

  let noticias;
  try {
    const respuesta = await fetch(API_BASE_URL + "/noticias/publicas");
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    noticias = (await respuesta.json()).noticias || [];
  } catch (error) {
    mensajeCarrusel("No se pudieron cargar las noticias. Intente nuevamente más tarde.");
    return;
  }

  carouselInner.innerHTML = "";
  indicadores.innerHTML = "";

  if (noticias.length === 0) {
    mensajeCarrusel("No hay noticias publicadas.");
    return;
  }

  // Las noticias vienen ordenadas por fecha descendente: la primera es la más reciente.
  const actualizado = document.getElementById("news-updated");
  const fecha = new Date(noticias[0].fecha + "T00:00:00");
  if (actualizado && !isNaN(fecha)) {
    actualizado.textContent = "Última actualización: " + MESES[fecha.getMonth()] + " de " + fecha.getFullYear();
    actualizado.classList.remove("d-none");
  }

  noticias.forEach(function (noticia, index) {
    const imagen = noticia.imagen.startsWith("data:") ? noticia.imagen : "img/" + noticia.imagen;
    const item = document.createElement("div");
    item.className = "carousel-item" + (index === 0 ? " active" : "");
    item.innerHTML =
      '<div class="row align-items-center g-4 px-3">' +
      '<div class="col-md-6"><img src="' + escaparHtml(imagen) + '" alt="' + escaparHtml(noticia.titulo) + '" class="slide-image" loading="lazy" decoding="async"></div>' +
      '<div class="col-md-6">' +
      '<span class="badge badge-tag mb-2">' + escaparHtml(noticia.tag) + '</span>' +
      '<h3 class="h4">' + escaparHtml(noticia.titulo) + '</h3>' +
      '<p class="text-muted mb-0">' + escaparHtml(noticia.descripcion) + '</p>' +
      '</div></div>';
    carouselInner.appendChild(item);

    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute("data-bs-target", "#newsCarousel");
    boton.setAttribute("data-bs-slide-to", String(index));
    if (index === 0) boton.className = "active";
    indicadores.appendChild(boton);
  });
}

async function sincronizarAlerta() {
  const contenedor = document.querySelector("#alertas .alert-scale");
  if (!contenedor) return;

  let alerta;
  try {
    const respuesta = await fetch(API_BASE_URL + "/alerta");
    if (!respuesta.ok) return;
    alerta = (await respuesta.json()).alerta;
  } catch (error) {
    return;
  }
  if (!alerta) return;

  contenedor.querySelectorAll(".alert-level").forEach(function (nivel) {
    const vigente = nivel.classList.contains(alerta.nivel);
    nivel.classList.toggle("nivel-vigente", vigente);

    let etiqueta = nivel.querySelector(".etiqueta-vigente");
    if (vigente) {
      if (!etiqueta) {
        etiqueta = document.createElement("span");
        etiqueta.className = "badge bg-dark etiqueta-vigente ms-2";
        etiqueta.textContent = "Vigente";
        nivel.querySelector(".level-code").appendChild(etiqueta);
      }
      if (alerta.mensaje) {
        const parrafo = nivel.querySelector("p");
        if (parrafo) parrafo.textContent = alerta.mensaje;
      }
    } else if (etiqueta) {
      etiqueta.remove();
    }
  });
}
