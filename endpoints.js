const express = require("express");
const db = require("./db");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { sign } = require("jsonwebtoken");
const {compare} = require("bcrypt");
const { verifyToken, authorizeRoles } = require('./middleware')

/**
 * ➤ ROUTE : Inscription d'un nouveau client
 * ➤ URL : POST /api/clients/register
 * ➤ Body attendu (JSON) :
 *   {
 *     "prenom": "Tim",
 *     "nom": "Fromentin",
 *     "email": "tim.fromentin@example.com",
 *     "mot_de_passe": "caravane",
 *     "adresse": "dans la caravane",
 *     "telephone": "0612345678",
 *     "role": "client",
 *     "date_inscription": "2025-02-06"
 *   }
 */
router.post("/clients/register", (req, res) => {
    const  { prenom, nom, email, mot_de_passe, adresse, telephone, role, date_inscription } = req.body;

    // Vérifier si l'email existe déjà
    db.query("SELECT * FROM utilisateurs WHERE email = ?", [email], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).json({message: "Erreur serveur"});
        }

        if (result.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé" });
        }

        // Hachage du mot de passe avant insertion
        bcrypt.hash(mot_de_passe, 10, (err, hash) => {
            if (err) return res.status(500).json({ message: "Erreur lors du hachage du mot de passe" });

            // Insérer le nouveau client
            db.query(
                "INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, adresse, telephone, role, date_inscription) VALUES (?, ?, ?, ?, ?, ?, ? ,?)",
                [prenom, nom, email, hash, adresse, telephone, role, date_inscription],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).json({ message: "Erreur lors de l'inscription" });
                    }

                    res.status(201).json({
                        message: "Inscription réussie",
                        client_id: result.insertId
                    });
                }
            );
        });
    });
});

/**
 * ➤ ROUTE : Connexion d'un client (Génération de JWT)
 * ➤ URL : POST /api/clients/login
 * {
 *     "email": "jean.dupont@email.com",
 *     "mot_de_passe": "hashpassword1"
 * }
 */
router.post("/clients/login", (req, res) => {
    const { email, mot_de_passe } = req.body;

    // Récupérer les infos de la bdd
    db.query("SELECT * FROM utilisateurs WHERE email = ?", [email], (err, result) => {
        console.log(result)
        if (err) return res.status(500).json({message: "❌ Erreur de la bdd"});
        if (result.length === 0) return res.status(404).json({ message: "❌ Utilisateur non trouvé" });

        const client = result[0];

        bcrypt.compare(mot_de_passe, client.mot_de_passe, (err, isMatch) => {
            if (err) return res.status(500).json({message: "❌ Erreur serveur"});
            if (!isMatch) return res.status(401).json({message:"❌ Identifiants incorrects"});

            // Encodage du JWT via la variable d'environnement JWT_SECRET
            const jwtToken = jwt.sign(
                { email, role: client.role },
                process.env.JWT_SECRET,
                {expiresIn: process.env.JWT_EXPIRES_IN}
            );

            // Stockage du JWT dans un cookie HttpOnly
            //res.cookie("jwtToken", jwtToken, { httpOnly: true, secure: true });
            //res.json(jwtToken);

            res.json({
                jwtToken,
                client : {
                    id: client.id,
                    nom: client.nom,
                    prenom: client.prenom,
                    email: client.email,
                }
            })
        })
    })
})

/**
 * ➤ ROUTE : Déconnexion d'un client (Génération de JWT)
 * ➤ URL : POST /api/clients/register
 */
router.get("/logout", (req, res) => {
    res.clearCookie("jwtToken");
    res.redirect('/');
});

/**
 * ➤ ROUTE : Récupérer tous les produits
 */
router.get("/produits", verifyToken, authorizeRoles("client"), (req, res) => {
    db.query("SELECT * FROM produits", (err, result) => {
        if (err) return res.status(500).json({ message: "❌ Erreur serveur" });
        res.json(result);
    });
});

/**
 * ➤ ROUTE : Récupérer un produit par son ID
 * ➤ URL : GET /api/produits/:id
 * ➤ Exemple d'utilisation : GET /api/produits/1
 */
router.get("/produits/:id", (req, res) => {
    const id = parseInt(req.params.id);

    db.query("SELECT * FROM produits WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({message:"❌ Erreur serveur"});
        res.json(result[0]);
    });
});


/**
 * ➤ ROUTE : Passer une commande (nécessite un JSON avec client_id et un tableau produits)
 * {
 *     "client_id" = 1,
 *     "produits" = [
 *         {id:1, qte:3}
 *     ]
 * }
 */
router.post("/order", async (req, res) => {
    const { client_id , produits } = req.body;
    let total = 0;
    let requetesTerminees = 0;

    produits.forEach((produit) => {
        db.query("SELECT prix FROM produits WHERE id = ?", [produit.id], (err, result) => {
            if (err) return res.status(500).json({message: "❌ Erreur serveur"});

            total += result[0].prix * produit.qte;
            requetesTerminees++;

            if (requetesTerminees === produits.length) {
                db.query("INSERT INTO commandes (client_id, total, statut, date_commande) VALUES (?,?,?, NOW())",
                    [client_id, total, 'En attente'],
                    (err, result) => {
                        if (err) return res.status(500).json({message:"❌ Erreur du serveur"});

                        const commande_id = result.insertId;
                        let detailsTermines = 0;

                        produits.forEach((produit) => {
                            db.query("INSERT INTO details_commandes (commande_id, produit_id, quantite) VALUES (?,?,?)",
                                [commande_id, produit.id, produit.qte],
                                (err, result) => {
                                if (err) console.error("Erreur lors de l'insertion des détails :", err);

                                detailsTermines++;

                                if (detailsTermines === produits.length) {
                                    res.json({message: "✅ Commande enregistrée avec succès", commande_id });
                                }
                            });
                        });
                    });
            }
        });
    });
});

/**
 * ➤ ROUTE : Modification du mot de passe
 * ➤ URL : PUT /api/clients/newPassword/:id
 * ➤ Body attendu (JSON) :
 * {
 *     "last_mdp": "test",
 *     "new_mdp": "test2"
 * }
 */
router.put("/clients/newPassword/:id", (req, res) => {
    const id = req.params.id;
    const { last_mdp, new_mdp } = req.body;

    db.query("SELECT mot_de_passe FROM clients WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json('Erreur serveur');

        // Comparer les mots de passe
        bcrypt.compare(last_mdp, result[0].mot_de_passe, (err, isMatch) => {
            if (err) return response.status(500).json({message:'❌ Erreur serveur'});
            if (!isMatch) return response.status(401).json({message:'❌ Pas les mêmes mdp'});

            bcrypt.hash(new_mdp, 10, (err, result) => {
                if (err) {
                    return res.status(500).json("❌ Problème Hash")

                    //db.query("UPDATE utilisateurs SET mot_de_passe = ? WHERE id")
                }
            })
        });
    });
});

/**
 * ➤ ROUTE PROTÉGÉE : Récupérer les commandes d'un client connecté
 */

module.exports = router;