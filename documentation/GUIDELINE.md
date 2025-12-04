Global :
Faire en sortir si possible que tout soit traduisible en n'importe quelle langue (traduis pas hein on le fera, mais si on peut avoir un truc comme ca c’est gucci : 

/src/i18m/locals/
 - de.json
 - en.json
 -fr.json

Page Login :

Connecter le bouton "Créer un compte" et le bouton "Mot de passe oublié" à l’URL (ouvrir un navigateur / nouvel onglet) :  https://amokk.fr/auth

Utiliser la route /login pour tenter un login avec les champs email et mdp :
Ajouter une erreur “format invalide” avant de tenter un call à /login si le champ email n’est pas un email correctement formaté.
Ajouter deux erreurs pour les deux cas 400 (tu peux essayer de gérer “missing email or password” avant de call l’API)
Ajouter deux erreurs pour gérer les deux cas de retours 401.
Ajouter une erreur pour gérer le code 403
Ajouter une erreur pour gérer le code 500
Tester hors connexion en coupant ton wifi pour voir l’erreur que ca donne et la gérer
Ajouter une erreur “Aucun abonnement détecté. Cliquez ici (https://amokk.fr/#pricing) pour choisir un abonnement” en cas de 200 & plan_id < 3
Stocker les champs du body de retour et rediriger vers /dashboard en cas de 200 et plan_id >= 3






Page Dashboard:
Pour toutes les valeurs à récupérer depuis l’API du client python, il faudrait que tu fasses des calls réguliers à la route /get_local_data pour les refresh toutes les 5 secondes.
 Header :
Afficher la fenêtre “Progresse avec Amokk” automatiquement à la première connexion (un booléen qui indique si c’est la première connexion de l’user sera renvoyé par /get_local_data).
Remplacer le 42 dans “42 parties coachées restantes” par la valeur de remaining_games.
Créer un affichage spécial pour le cas remaining_games == 0 (qui incite à cliquer sur “Améliorer le plan”
 Body :
Envoyer une requête à /coach_toggle à chaque fois que le toggle “Statut du coach” est cliqué en spécifiant le nouvel état du bouton (on/off)

 Fenêtre “Configuration” :
Envoyer une requête à /assistant_toggle à chaque fois que le toggle “Statut du coach” est cliqué en spécifiant le nouvel état du bouton (on/off)
Envoyer une requête à /update_ptt_key à chaque fois que le champ “Raccourci Push-To-Talk” est modifié
Envoyer une requête à /coach_toggle à chaque fois que le toggle “Coach Proactif” est cliqué en spécifiant le nouvel état du bouton (on/off)
Envoyer une requête à /update_volume à chaque fois que le slider de volume est modifié
Associer un mp3 au bouton “Tester le volume”

“Tutoriel de Démarrage Rapide”
Modifier le design de la section pour faire passer la suite d’étapes des pastilles A B C et D à un chapelet sans numéro comme ca (en bleu un peu joli quoi) : 

“Un problème ?”
Changer le(s) wording(s) suivant(s) :
“Vérifiez que AMOKK est défini sur Actif” -> “Assurez vous qu’AMOKK est actif dans l’onglet “Configuration”
Connecter le bouton “Nous Contacter” à l’envoi d’un mail à contact@amokk.fr





DOC API locale (http://localhost:8000)
/get_local_data (GET): Récupération des données à rafraîchir régulièrement
params : Aucun

Code
Body Content
200
{“remaining_games”: remaining_games, “first_launch” : true, “game_timer” : game_timer}


/coach_toggle (PUT): Update du toggle du coach proactif
params : {“active”: true}

Code
Body Content
200
“Updated coach toggle to true successfully”


/assistant_toggle (PUT): Récupération des données à rafraîchir régulièrement
params : {“active”: false}

Code
Body Content
200
“Updated assistant toggle to false successfully”


/update_ptt_key (PUT): Récupération des données à rafraîchir régulièrement
params : {“ptt_key”: “v”}

Code
Body Content
200
“Updated push-to-talk key (v) successfully”


/update_volume (PUT): Récupération des données à rafraîchir régulièrement
params : {“volume”: 100}

Code
Body Content
200
“Updated volume level to 100 successfully”







DOC API AWS (https://api.amokk.fr)

/login (POST): Connexion à un compte utilisateur
params : email (text), password (text)

Code
Body Content
400
“Missing email or password”
400
"Email or password is too long"
401
"Invalid credentials"
401
"Login error: Another account is currently connected with the same IP."
403
"Email has not been verified yet."
200
{"token": token, "remaining_games": remaining_games, "plan_id": plan_id}
500
"Login error: Internal Server Error"



/logout (POST): Déconnexion d’un compte utilisateur
params : “Bearer {JWT}” in the "Authorization" header’s field

Code
Body Content
401
“Missing or invalid Authorization header”
401
"Invalid or revoked token"
401
"Token expired"
401
"Invalid token"
200
“Logout successful”
500
"Logout error: Internal Server Error"



