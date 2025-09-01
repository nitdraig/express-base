// Archivo de prueba simple para verificar las rutas usando Node.js nativo
const http = require("http");

const BASE_URL = "http://localhost:5000";

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const response = {
            status: res.statusCode,
            data: JSON.parse(body),
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAuth() {
  try {
    console.log("🧪 Probando rutas de autenticación...\n");

    // Test 1: Health check
    console.log("1. Probando health check...");
    try {
      const healthResponse = await makeRequest("GET", "/health");
      console.log("✅ Health check:", healthResponse.data);
    } catch (error) {
      console.log("❌ Error en health check:", error.message);
    }

    // Test 2: Login con datos inválidos
    console.log("\n2. Probando login con datos inválidos...");
    try {
      const loginResponse = await makeRequest("POST", "/auth/login", {
        email: "invalid-email",
        password: "123",
      });
      console.log("❌ Login inválido no fue rechazado:", loginResponse.data);
    } catch (error) {
      console.log("✅ Login inválido rechazado correctamente");
    }

    // Test 3: Login con contraseña débil
    console.log("\n3. Probando login con contraseña débil...");
    try {
      const loginResponse = await makeRequest("POST", "/auth/login", {
        email: "test@example.com",
        password: "weak",
      });
      console.log("❌ Contraseña débil no fue rechazada:", loginResponse.data);
    } catch (error) {
      console.log("✅ Contraseña débil rechazada correctamente");
    }

    // Test 4: Ruta principal
    console.log("\n4. Probando ruta principal...");
    try {
      const mainResponse = await makeRequest("GET", "/");
      console.log("✅ Ruta principal funciona");
    } catch (error) {
      console.log("❌ Error en ruta principal:", error.message);
    }

    console.log("\n🎉 Pruebas completadas!");
  } catch (error) {
    console.error("❌ Error general en las pruebas:", error.message);
  }
}

// Solo ejecutar si el archivo se ejecuta directamente
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth, makeRequest };
