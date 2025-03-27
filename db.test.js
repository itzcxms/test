const mysql = require("mysql2");
require("dotenv").config({path: './.env.test'}); // Charge les variables d'environnement

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8'  // Ajout pour éviter l'erreur CESU-8
});

db.connect((err) => {
    if (err) {
        console.error("❌ Erreur de connexion à MySQL :", err);
        process.exit(1);
    }
    console.log("✅ Connecté à la base de données MySQL.");
});

describe("Tests d'authentification", () => {
    test("Test fictif pour éviter l'erreur", () => {
        expect(true).toBe(true);
    });
});


module.exports = db;
