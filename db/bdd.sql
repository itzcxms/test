CREATE DATABASE ecommerce_cafe;
USE ecommerce_cafe;

-- Table des utilisateurs
CREATE TABLE utilisateurs (
                              id INT AUTO_INCREMENT PRIMARY KEY,
                              nom VARCHAR(100),
                              email VARCHAR(100) UNIQUE,
                              mot_de_passe VARCHAR(255),
                              adresse TEXT,
                              telephone VARCHAR(20),
                              role ENUM('client', 'admin') DEFAULT 'client',
                              date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories
CREATE TABLE categories (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            nom VARCHAR(100) UNIQUE
);

-- Table des produits
CREATE TABLE produits (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          nom VARCHAR(255),
                          description TEXT,
                          prix DECIMAL(10,2),
                          stock INT DEFAULT 0,
                          categorie_id INT,
                          image VARCHAR(255),
                          date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (categorie_id) REFERENCES categories(id)
);

-- Table des commandes
CREATE TABLE commandes (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           utilisateur_id INT,
                           total DECIMAL(10,2),
                           statut ENUM('en attente', 'expédiée', 'livrée', 'annulée') DEFAULT 'en attente',
                           date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Table des détails des commandes
CREATE TABLE details_commandes (
                                   id INT AUTO_INCREMENT PRIMARY KEY,
                                   commande_id INT,
                                   produit_id INT,
                                   quantite INT,
                                   prix_unitaire DECIMAL(10,2),
                                   FOREIGN KEY (commande_id) REFERENCES commandes(id),
                                   FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Table des avis clients
CREATE TABLE avis (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      utilisateur_id INT,
                      produit_id INT,
                      note INT CHECK (note BETWEEN 1 AND 5),
                      commentaire TEXT,
                      date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
                      FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Table des paiements
CREATE TABLE paiements (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           commande_id INT,
                           montant DECIMAL(10,2),
                           methode ENUM('carte', 'paypal', 'virement'),
                           statut ENUM('en attente', 'réussi', 'échoué') DEFAULT 'en attente',
                           date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (commande_id) REFERENCES commandes(id)
);

-- Table des expéditions
CREATE TABLE expeditions (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             commande_id INT,
                             adresse_livraison TEXT,
                             transporteur VARCHAR(100),
                             date_expedition TIMESTAMP NULL,
                             date_livraison_estimee DATE,
                             FOREIGN KEY (commande_id) REFERENCES commandes(id)
);

-- Table des codes promo
CREATE TABLE codes_promo (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             code VARCHAR(50) UNIQUE,
                             reduction DECIMAL(5,2),
                             date_expiration DATE
);

-- Table du stock
CREATE TABLE stock (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       produit_id INT,
                       quantite INT,
                       FOREIGN KEY (produit_id) REFERENCES produits(id)
);
