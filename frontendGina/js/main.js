function pagar(certId) {
  const usuarioActivo = localStorage.getItem("usuario");
  const token = localStorage.getItem("token");
  const pagoRealizado = localStorage.getItem("pago") === "true";

  if (!usuarioActivo || !token) {
    Swal.fire("Acceso denegado", "Debes iniciar sesión para pagar", "error");
    return;
  }

  if (pagoRealizado) {
    Swal.fire("Pago duplicado", "Ya has pagado esta certificación", "warning");
    return;
  }

  localStorage.setItem("pago", "true");

  Swal.fire("Pago exitoso", "Tu pago ha sido registrado correctamente", "success");
}


async function iniciarExamen(certId) {
  const usuarioActivo = localStorage.getItem("usuario");
  const token = localStorage.getItem("token");
  const pagoRealizado = localStorage.getItem("pago") === "true";

  if (!usuarioActivo || !token) {
    Swal.fire("Acceso denegado", "Debes iniciar sesión para presentar el examen", "error");
    return;
  }

  if (!pagoRealizado) {
    Swal.fire("Pago requerido", "Debes pagar antes de iniciar el examen", "warning");
    return;
  }

  try {
    const response = await fetch("http://192.168.1.81:3000/api/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      Swal.fire("Error", data.mensaje, "error");
      return;
    }

    Swal.fire("Examen iniciado", "Buena suerte, ya puedes comenzar", "success");
    localStorage.setItem("examen", JSON.stringify(data.examen));
    window.location.href = "examen.html";
    console.log("Preguntas:", data.examen);

  } catch (error) {
    Swal.fire("Error", "No se pudo conectar con el servidor", "error");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const cuenta = document.getElementById("cuenta").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("http://192.168.1.81:3000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cuenta, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          Swal.fire("Error", data.mensaje, "error");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", cuenta);
        localStorage.setItem("nombre", data.nombre);
        localStorage.setItem("pago", "false");

        Swal.fire("Bienvenido", `Hola ${data.nombre}`, "success").then(() => {
          window.location.href = "certificaciones.html";
        });
      } catch (error) {
        Swal.fire("Error", "No se pudo conectar con el servidor", "error");
      }
    });
  }

  const nombre = localStorage.getItem("nombre");
  if (nombre) {
    const nav = document.querySelector(".nav-links");
    const saludo = document.createElement("li");
    saludo.innerHTML = `<span style="color: #e0e7ff; font-weight: bold;">Hola, ${nombre}</span>`;
    nav.appendChild(saludo);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const nombre = localStorage.getItem("nombre");
  const contenedor = document.getElementById("usuarioLogueado");
    if (nombre && contenedor) {
  contenedor.innerHTML = `
    <div class="usuario-dropdown">
      <button id="usuarioBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
      <div class="dropdown-menu" id="menuCerrarSesion">
        <button id="cerrarSesionBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 3h10v18H10v-2h8V5h-8V3zm-1 8H3v2h6v3l4-4-4-4v3z"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  `;
  
  const usuarioBtn = document.getElementById("usuarioBtn");
  const menu = document.getElementById("menuCerrarSesion");
  
  usuarioBtn.addEventListener("click", () => {
    menu.classList.toggle("visible");
  });
  
  // Cerrar el menú si se hace clic fuera de él
  document.addEventListener("click", (e) => {
    if (!usuarioBtn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove("visible");
    }
  });
  
  const cerrarSesionBtn = document.getElementById("cerrarSesionBtn");
  cerrarSesionBtn.addEventListener("click", async () => {
    const nombreUsuario = localStorage.getItem("nombre") || "Usuario desconocido";

    // Enviar al servidor
    await fetch("http://192.168.1.81:3000/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre: nombreUsuario })
    });

    // Limpiar y redirigir
    localStorage.clear();
    Swal.fire("Sesión cerrada", "Vuelve pronto", "info").then(() => {
      window.location.href = "index.html";
    });
  });
  
}
  
});


document.addEventListener("DOMContentLoaded", () => {
  const contactoForm = document.getElementById("contactoForm");

  if (contactoForm) {
    contactoForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Obtener los valores del formulario
      const nombre = document.getElementById("nombre").value.trim();
      const correo = document.getElementById("correo").value.trim();
      const mensaje = document.getElementById("mensaje").value.trim();

      // Validación básica
      if (!nombre || !correo || !mensaje) {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Por favor completa todos los campos del formulario",
          confirmButtonColor: "#1e40af"
        });
        return;
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        Swal.fire({
          icon: "error",
          title: "Correo inválido",
          text: "Por favor ingresa un correo electrónico válido",
          confirmButtonColor: "#1e40af"
        });
        return;
      }

      try {
        // Enviar datos al backend
        const response = await fetch("http://192.168.1.81:3000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nombre: nombre,
            correo: correo,
            mensaje: mensaje
          })
        });

        const data = await response.json();

        if (!response.ok) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.mensaje || "Hubo un problema al enviar tu mensaje",
            confirmButtonColor: "#1e40af"
          });
          return;
        }

        // Mensaje de éxito
        Swal.fire({
          icon: "success",
          title: "¡Mensaje Enviado!",
          text: "Gracias por contactarnos. Te responderemos pronto.",
          confirmButtonColor: "#1e40af"
        });

        // Limpiar el formulario
        contactoForm.reset();

      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No se pudo conectar con el servidor. Intenta más tarde.",
          confirmButtonColor: "#1e40af"
        });
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const examenForm = document.getElementById("formExamen");
  const btnEnviar = document.getElementById("btnEnviar");
  const btnCertificado = document.getElementById("btnCertificado");
  const infoUsuario = document.getElementById("infoUsuario");

  if (examenForm && btnEnviar) {
    const token = localStorage.getItem("token");
    const nombre = localStorage.getItem("nombre");
    const usuario = localStorage.getItem("usuario");

    if (!token || !usuario) {
      Swal.fire("Acceso denegado", "Debes iniciar sesión para presentar el examen", "error").then(() => {
        window.location.href = "index.html";
      });
      return;
    }

    infoUsuario.innerText = `Usuario: ${nombre} | Fecha: ${new Date().toLocaleDateString("es-MX")}`;

   // Cargar preguntas desde localStorage
const preguntasGuardadas = JSON.parse(localStorage.getItem("examen"));

if (!preguntasGuardadas || preguntasGuardadas.length === 0) {
  Swal.fire("Error", "No hay examen cargado. Regresa y vuelve a iniciar.", "error").then(() => {
    window.location.href = "certificaciones.html";
  });
  return;
}

preguntasGuardadas.forEach((pregunta, index) => {
  const div = document.createElement("div");
  div.classList.add("pregunta");

  div.innerHTML = `
    <h3>${pregunta.numero}. ${pregunta.pregunta}</h3>
    ${pregunta.opciones.map(opcion => `
      <label>
        <input type="radio" name="pregunta${index}" value="${opcion}" required />
        ${opcion}
      </label>
    `).join("")}
  `;

  examenForm.appendChild(div);
});


    // Enviar respuestas
    btnEnviar.addEventListener("click", async () => {
      const respuestas = [];
      const preguntas = document.querySelectorAll(".pregunta");

      preguntas.forEach((div, index) => {
        const seleccionada = div.querySelector(`input[name="pregunta${index}"]:checked`);
        respuestas.push(seleccionada ? seleccionada.value : null);
      });

      try {
        const response = await fetch("http://192.168.1.81:3000/api/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ respuestas })
        });

        const data = await response.json();

        if (!response.ok) {
          Swal.fire("Error", data.mensaje || "No se pudo calificar el examen", "error");
          return;
        }

        Swal.fire("Resultado", `${data.mensaje}\nCalificación: ${data.calificacion.toFixed(2)}%`, data.aprobado ? "success" : "info");

        if (data.aprobado && btnCertificado) {
          btnCertificado.style.display = "inline-block";
        }

      } catch (error) {
        Swal.fire("Error", "No se pudo enviar el examen", "error");
      }
    });

    // Descargar certificado
    if (btnCertificado) {
      btnCertificado.addEventListener("click", () => {
        window.open("http://192.168.1.81:3000/api/pdf", "_blank");
      });
    }
  }
});

