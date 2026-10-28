import "dotenv/config";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import sequelize from "./config/database.js";
import Usuario from "./models/Usuario.js";
import "./models/Noticia.js";
import "./models/Alerta.js";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import noticiaRoutes from "./routes/noticiaRoutes.js";
import estadisticasRoutes from "./routes/estadisticasRoutes.js";
import alertaRoutes from "./routes/alertaRoutes.js";

if (!process.env.JWT_SECRET) {
  console.error(
    "❌ Falta JWT_SECRET en el entorno. Copiá backend/.env.example a backend/.env y completá JWT_SECRET antes de arrancar el servidor."
  );
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
// Límite alto porque las noticias pueden llevar una imagen en base64 (data: URL) en vez
// de un archivo subido aparte — el límite por defecto de Express (100kb) las cortaría.
app.use(express.json({ limit: "10mb" }));

app.get("/api/status", (req, res) => {
  res.json({ status: "online", mensaje: "API de autenticación de Defensa Civil funcionando." });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/noticias", noticiaRoutes);
app.use("/api/alerta", alertaRoutes);
// Lee la base de DefCivil (relevamientos, familias, provisiones): datos agregados, sin datos personales
app.use("/api/estadisticas", estadisticasRoutes);

// El backend también sirve el sitio (index.html, admin.html, css/, js/, img/) para que todo
// salga del mismo origen y la API quede en /api sin CORS. Solo se publican esas rutas
// explícitas: backend/ (con su .env) nunca queda expuesto.
const SITE_DIR = process.env.SITE_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const carpeta of ["css", "js", "img"]) {
  app.use("/" + carpeta, express.static(path.join(SITE_DIR, carpeta)));
}
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(SITE_DIR, "index.html")));
app.get("/admin.html", (req, res) => res.sendFile(path.join(SITE_DIR, "admin.html")));

function generarPasswordAleatoria() {
  return crypto.randomBytes(9).toString("base64url");
}

// Crea el superadmin y el admin iniciales una única vez (si todavía no existe
// ningún superadmin). Reemplaza al objeto CREDENCIALES hardcodeado que tenía
// js/admin.js: las contraseñas ya no viven en el código fuente.
async function crearUsuariosIniciales() {
  const yaExisteSuperadmin = await Usuario.findOne({ where: { rol: "superadmin" } });
  if (yaExisteSuperadmin) return;

  const seeds = [
    {
      rol: "superadmin",
      usuario: process.env.SEED_SUPERADMIN_USUARIO || "superadmin",
      password: process.env.SEED_SUPERADMIN_PASSWORD,
      nombre: "Superadministrador",
    },
    {
      rol: "admin",
      usuario: process.env.SEED_ADMIN_USUARIO || "admin",
      password: process.env.SEED_ADMIN_PASSWORD,
      nombre: "Administrador",
    },
  ];

  for (const seed of seeds) {
    const password = seed.password || generarPasswordAleatoria();
    await Usuario.create({
      nombre: seed.nombre,
      usuario: seed.usuario,
      password: await bcrypt.hash(password, 10),
      rol: seed.rol,
      activo: true,
    });

    if (!seed.password) {
      console.log(
        `🔑 Usuario "${seed.usuario}" (${seed.rol}) creado con contraseña generada: ${password}\n   Guardala ahora — no se vuelve a mostrar. Podés cambiarla luego desde el panel.`
      );
    } else {
      console.log(`✅ Usuario "${seed.usuario}" (${seed.rol}) creado.`);
    }
  }
}

async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida.");

    // alter:true para que las columnas nuevas de un modelo (como snapshotPrevio/snapshotExpira
    // en Noticia) se agreguen solas a una tabla que ya existía, sin tener que borrar la base
    // cada vez. Igual que hace DefCiv-3.0 en su propio arranque.
    await sequelize.sync({ alter: true });
    console.log("✅ Sincronización de modelos completada.");

    await crearUsuariosIniciales();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`📡 Backend de autenticación corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error crítico al iniciar el servidor:", error);
    process.exit(1);
  }
}

iniciarServidor();
