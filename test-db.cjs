const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://dfc_db_user:Y9SZGzJN877KNo2q96zeKlErO2BRHoeW@dpg-d9bp3a6q1p3s73bgkrjg-a.oregon-postgres.render.com/dfc_db',
  ssl: {
    rejectUnauthorized: false
  }
});

async function consultar() {
  try {
    await client.connect();
    console.log("¡Conectado a Render con éxito!\n");
    
    const resultado = await client.query('SELECT * FROM relevadores LIMIT 10;');
    console.table(resultado.rows);
    
  } catch (err) {
    console.error("Error al consultar:", err);
  } finally {
    await client.end();
  }
}

consultar();