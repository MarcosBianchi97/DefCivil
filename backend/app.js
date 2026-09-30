import "dotenv/config";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import sequelize from "./config/database.js";
import Usuario from "./models/Usuario.js";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";

if (!process.env.JWT_SECRET) {
  console.error(
    "❌ Falta JWT_SECRET en el entorno. Copiá backend/.env.example a backend/.env y completá JWT_SECRET antes de arrancar el servidor."
  );
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/status", (req, res) => {
  res.json({ status: "online", mensaje: "API de autenticación de Defensa Civil funcionando." });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);

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

    await sequelize.sync();
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
