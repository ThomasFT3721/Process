# Serveur Apache avec redirection vers des conteneurs Docker

### Sur AWS :

1. Créer une instance de Lightsail avec la dernière version de Ubuntu.
2. Ouvrir l'instance.
3. Dans l'onglet Networking, ajouter une adresse IP static. 
4. Accéder à la console du serveur
5. Passer en adminisatrteur avec la commande :
```shell
sudo su
```
6. Installer Apache2 et Docker
7. Aller dans le dossier des configurations avec la commande :
```shell
cd /etc/apache2/sites-available/
```
8. Supprimer les configurations par défaut du serveur avec les commandes :
```shell
a2dissite default-ssl.conf
a2dissite 000-default.conf
```
9. Listé avec `a2query -s`, si il reste des configurations active il faut les désactiver.
10. Créer dans le dossier `/etc/apache2/sites-available/` une configuration par exemple `mon-premier-site.com.conf` avec le contenu suivant adapté :
```apacheconf
<VirtualHost *:80>
    ServerName mon-premier-site.com
    ServerAlias www.mon-premier-site.com

    ProxyPreserveHost On
    ProxyRequests off
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/
</VirtualHost>
```
11. Créer dans le dossier `/etc/apache2/sites-available/` une configuration par exemple `mon-deuxieme-site.com.conf` avec le contenu suivant adapté :
```apacheconf
<VirtualHost *:80>
    ServerName mon-deuxieme-site.com
    ServerAlias www.mon-deuxieme-site.com

    ProxyPreserveHost On
    ProxyRequests off
    ProxyPass / http://localhost:8081/
    ProxyPassReverse / http://localhost:8081/
</VirtualHost>
```
12. Ajouter les configurations avec les commandes :
```shell
a2ensite mon-premier-site.com.conf
a2ensite mon-deuxieme-site.com.conf
```
13. Relancer le serveur avec la commande :
```shell
service apache2 restart
```

### Sur le pc :
1. Modifier le fichier hosts
```shell
#Pour Mac et Linux
nano /etc/hosts

# Pour Windows
# Ouvrir le fichier `C:\Windows\System32\drivers\etc\hosts` avec un éditeur de texte
```
2. Ajouter les lignes suivantes pour tester les redirections :
```
##
# Adresse IP static du serveur   Nom de domaine
##
13.39.214.15    mon-premier-site.com
13.39.214.15    mon-deuxieme-site.com
```
3. Tester avec `curl` le résultat :
```shell
curl mon-premier-site.com
curl mon-deuxieme-site.com
```
4. Vérifier que les résultats sont différents et qu'ils correspondent aux redirections mises en place
5. Retirer les modifications au fichier `hosts`

### Suite
Après cela, l'objectif est d'ajouter les noms de domaine à l'instance Lightsail.

### Bugs


[Retour](../README.md)