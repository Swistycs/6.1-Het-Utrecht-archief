# Ontmoet de Oudegracht

Interactieve webapplicatie + CMS voor de tentoonstelling **‘Ontmoet de Oudegracht’** van Het Utrechts Archief (maart 2027).
De film uit 1929 (vanaf een varende boot, van de Gaardbrug tot de Bezembrug) speelt naast een kaart die live meeloopt met de vaarroute. Bij punten langs de gracht verschijnen verhalen en bronnen uit het archief.

Gemaakt door **De Werfwebbers**: Levi Bhargava & Sem Stil.

## Mappen

```
docs/            debriefing, technisch ontwerp, plan van aanpak, offerte, planning
docker/          Dockerfile voor de lokale PHP-server
src/
├── config/      config.php (niet in Git) + config.example.php
├── database/    schema.sql, seed.sql, create-admin.php
├── includes/    gedeelde PHP-code (db, auth, csrf, validate, upload, cms_layout)
└── public/      webroot
    ├── index.html   de webapplicatie
    ├── css/ js/     stijl en ES-modules (app, player, map, points, idle, cms)
    ├── api/         content.php (JSON, alleen lezen)
    ├── cms/         beheeromgeving (login, points, point-edit, route, settings, users)
    ├── assets/      logo, video, geluiden
    └── uploads/     uploads uit het CMS (geen PHP-uitvoer)
```

## Lokaal draaien (Docker)

```bash
cp src/config/config.example.php src/config/config.php   # eenmalig
docker compose up -d --build
```

- Webapplicatie: http://localhost:8088
- API: http://localhost:8088/api/content.php
- MySQL: localhost:3307 (gebruiker `oudegracht` / `oudegracht_dev`)

De database wordt bij de eerste start gevuld uit `src/database/schema.sql` en `seed.sql`.
Na een wijziging in die bestanden opnieuw opbouwen: `docker compose down -v && docker compose up -d`.

## Lokaal draaien met XAMPP (Windows of Mac)

Werk je liever met XAMPP dan met Docker, dan kan dat ook. Je hebt **XAMPP met PHP 8.2 of hoger** nodig.

**1. Project op de goede plek zetten**

Clone de repo in de map `htdocs` van XAMPP. Hieronder heet de map `oudegracht`; gebruik je een andere naam (bijvoorbeeld `6.1-Het-Utrecht-archief`), vervang `oudegracht` dan overal in de adressen hieronder door die naam.

```bash
# Windows
cd C:\xampp\htdocs
git clone https://github.com/Swistycs/6.1-Het-Utrecht-archief.git oudegracht

# Mac
cd /Applications/XAMPP/htdocs
git clone https://github.com/Swistycs/6.1-Het-Utrecht-archief.git oudegracht
```

**2. XAMPP starten**

Start in het XAMPP Control Panel **Apache** en **MySQL**.

**3. Database aanmaken**

1. Ga naar http://localhost/phpmyadmin
2. Klik op **Nieuw**, vul als naam `oudegracht` in en kies als collatie `utf8mb4_unicode_ci`. Klik op **Aanmaken**.
3. Kies de database `oudegracht`, ga naar **Importeren** en importeer eerst `src/database/schema.sql`, daarna `src/database/seed.sql`.

**4. Config aanmaken**

Kopieer `src/config/config.example.php` naar `src/config/config.php` en zet daarin de standaardgegevens van XAMPP (gebruiker `root`, geen wachtwoord):

```php
<?php
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'oudegracht',
        'user' => 'root',
        'pass' => '',
    ],
    'debug' => false,
];
```

**5. Archiefbeelden en film ophalen**

```bash
# Windows (in de map C:\xampp\htdocs\oudegracht)
C:\xampp\php\php.exe src\database\haal-archiefbeelden.php

# Mac (in de map /Applications/XAMPP/htdocs/oudegracht)
/Applications/XAMPP/bin/php src/database/haal-archiefbeelden.php
```

Voor de film heb je [yt-dlp](https://github.com/yt-dlp/yt-dlp) nodig.

- Windows: `winget install --id yt-dlp.yt-dlp -e --source winget` en daarna **PowerShell sluiten en opnieuw openen** (anders herkent hij `yt-dlp` nog niet). Alleen `winget install yt-dlp` werkt niet: winget vindt dan twee pakketten en installeert niets.
- Mac: `brew install yt-dlp`

Makkelijker: vraag een teamlid die de film al heeft om `oudegracht-1929.mp4` te sturen en zet hem in `src/public/assets/video/`.

Film ophalen (in de projectmap):

```bash
yt-dlp -f hd -o src/public/assets/video/oudegracht-1929.mp4 "https://www.facebook.com/reel/668688640594552"
```

**6. Eigen beheerder aanmaken voor het CMS**

```bash
# Windows
C:\xampp\php\php.exe src\database\create-admin.php "Jouw Naam" jij@voorbeeld.nl

# Mac
/Applications/XAMPP/bin/php src/database/create-admin.php "Jouw Naam" jij@voorbeeld.nl
```

Het script vraagt om een wachtwoord van minstens 12 tekens. Op Windows is het wachtwoord zichtbaar terwijl je typt.

**7. Openen**

- Webapplicatie: http://localhost/oudegracht/src/public/
- CMS: http://localhost/oudegracht/src/public/cms/

**Werkt het niet?**

| Probleem | Oplossing |
|---|---|
| ‘De inhoud kon niet worden geladen’ | Klopt `config.php`? Zijn `schema.sql` én `seed.sql` geïmporteerd? |
| Uploaden in het CMS geeft een fout | Zet in `php.ini` (XAMPP Control Panel → Apache → Config) de regel `extension=fileinfo` aan (zonder `;` ervoor) en herstart Apache. Doe hetzelfde voor `extension=pdo_mysql` als de database niet werkt. |
| Apache start niet | Poort 80 is bezet (bijvoorbeeld door Skype of IIS). Zet Apache in XAMPP op een andere poort, bijvoorbeeld 8080, en open dan http://localhost:8080/oudegracht/src/public/ |
| Archiefbeelden of film ontbreken | Stap 5 opnieuw doen; ze staan niet in Git. |
| Oude versie blijft zichtbaar | Herlaad met Ctrl+Shift+R (Mac: Cmd+Shift+R); de Service Worker bewaart een kopie. |

Let op: in deze opzet staat de hele repo in `htdocs`. Dat is prima om lokaal te werken, maar op een echte server moet alleen `src/public` de webroot zijn (zie hieronder).

## De film

De film staat **niet** in Git (te groot, en het is materiaal van HUA). Haal hem eenmalig op met [yt-dlp](https://github.com/yt-dlp/yt-dlp) (`brew install yt-dlp`):

```bash
yt-dlp -f hd -o src/public/assets/video/oudegracht-1929.mp4 "https://www.facebook.com/reel/668688640594552"
```

Dit is de versie van Facebook (768×576, VP9, 3:03). Als HUA een betere versie aanlevert: bestand in `src/public/assets/video/` zetten en het pad + de lengte aanpassen via **CMS → Instellingen**.
Is `video_file` leeg, dan draait er een nep-klok met lengte `video_duration`, zodat de app ook zonder film werkt.

## Archiefbeelden

De afbeeldingen uit ‘Bronmateriaal en info’ (beeldbank van HUA) staan ook **niet** in Git. Haal ze eenmalig op:

```bash
docker compose exec web php /var/www/database/haal-archiefbeelden.php
```

(Met XAMPP: zie hieronder.)

Ze komen in `src/public/uploads/` en zijn in `seed.sql` gekoppeld aan de punten (max. 3 per locatie, met omschrijving en catalogusnummer als bron).

## Twee manieren van draaien

Bij het opstarten (pagina openen of herladen) kies je één keer hoe de app draait:

- **Automatisch varen**: de film speelt eindeloos in een lus, blijft bij elke stop even liggen (tijd per stop instelbaar in het CMS) en begint aan het eind vanzelf opnieuw. Geen startscherm. Pauzeert een bezoeker en loopt hij weg, dan speelt de film na de idle-tijd vanzelf verder.
- **Zelf varen**: startscherm ‘Tik om te varen’, daarna de intro met ‘Ga varen’. De boot wacht bij elke stop op ‘Verder varen’. Na de idle-tijd zonder aanraking terug naar het startscherm.

## Geluid en offline

- **Geluid**: alle effecten worden in de browser gemaakt met de Web Audio API (geen geluidsbestanden, geen muziek): kabbelend water tijdens het varen en per stop een effect (`water`, `voetstappen`, `paard`, `bel`, `klok`, in te stellen per punt in het CMS). Knop rechtsboven zet het geluid uit; in de attract mode is het stil en na de idle-reset staat het weer aan.
- **Offline**: `sw.js` (Service Worker) bewaart de app, de inhoud, de film, de archiefbeelden en bekeken kaarttegels. Met internet altijd de nieuwste versie (network first), zonder internet de laatst bekende. Werkt alleen via `localhost` of HTTPS.
- **Kaart**: luchtfoto van PDOK (Beeldmateriaal Nederland, CC BY 4.0), eenmalig gedownload voor het gebied rond de route en lokaal opgeslagen in `src/public/assets/kaart/` (zoom 16–20, ca. 13 MB). Geen externe kaartserver nodig, dus geen blokkades en ook offline bruikbaar.
- Leaflet staat lokaal in `vendor/leaflet/`; er worden geen externe lettertypes geladen (Helvetica/Arial, alternatief voor Akzidenz Grotesk volgens de huisstijlmanual).

## CMS

http://localhost:8088/cms/ – maak eerst een beheerder aan (het wachtwoord wordt gevraagd en niet getoond):

```bash
docker compose exec web php /var/www/database/create-admin.php "Jouw Naam" jij@voorbeeld.nl
```

| Pagina | Wat kun je er doen |
|---|---|
| Punten | Overzicht, nieuw punt, bewerken, (de)publiceren |
| Punt bewerken | NL/EN-tekst, tijden met ‘Huidige videotijd gebruiken’, plek kiezen op de kaart, archiefbronnen uploaden (alt-tekst + bron verplicht), verwijderen met bevestiging |
| Route | IJkpunten van de vaarroute (tijd in de film → plek op de kaart) |
| Instellingen | Intro, colofon, idle-tijd, tijd per stop (automatisch verder varen, 0 = wachten), videobestand en lengte |
| Gebruikers | Alleen voor beheerders: redacteuren en beheerders toevoegen/verwijderen |

Beveiliging (TO H6): wachtwoorden met `password_hash`, min. 12 tekens, blokkade na 5 mislukte pogingen (15 min), sessie verloopt na 30 min, CSRF-token op elk formulier, alle uitvoer via `htmlspecialchars`, uploads gecontroleerd op echte bestandsinhoud (max 5 MB, willekeurige naam, geen PHP in `/uploads`), PDO prepared statements, CSP-header.

## Installatie op een server

- Apache 2.4 + HTTPS, PHP 8.2+ (pdo_mysql, fileinfo, mbstring, gd), MySQL 8 / MariaDB 10.6+
- Webroot = `src/public`; `src/config` en `src/includes` staan erbuiten
- Importeer `schema.sql` (en voor een demo `seed.sql`), vul `config.php` in
- Gebruik een databasegebruiker met alleen SELECT, INSERT, UPDATE en DELETE

## Status

- [x] Sprint 1: database + seed, JSON-API, basislayout, videospeler + tijdlijn, Leaflet-kaart met route, synchronisatie video ↔ kaart
- [x] Sprint 2: layout in HUA-huisstijl (3 kolommen), infokolom met bronnen + ‘volgende stop’, attract mode + idle-reset, CMS (login, punten, bronnen, route, instellingen, gebruikers), echte film
- [ ] Nog uit sprint 2: geluidseffecten (audio.js), eerste usability-test
- [ ] Sprint 3: tests (WCAG, browsers, touch, beveiliging, duurtest), NL/EN, testrapport, demovideo

De inhoud in `seed.sql` komt uit ‘Bronmateriaal en info’ van HUA: 8 locaties van net voor de Gaardbrug tot onder de Stadhuisbrug (1, 1a, 1b, 1c, 2, 2a, 3 en 5). De posities komen uit OpenStreetMap; de tijden zijn berekend op afstand langs de gracht en moeten nog worden afgestemd op de film (CMS → Route en Punten). Bij 1b en 1c gaf HUA geen tekst; die korte teksten zijn gebaseerd op de omschrijvingen in de beeldbank.

**Huisstijl:** kleuren en stijl komen uit de CSS van hetutrechtsarchief.nl (rood `#d72f19`, petrolgroen `#247065`, blauw `#455cc7`, `#333` op `#f6f6f6`, strakke hoeken, harde schaduw). Het lettertype van HUA (Akzidenz-Grotesk Next) is een licentiefont; we vallen terug op Archivo. Controleer alles nog tegen `HUA_huisstijlmanual digitaal_2.pdf` (Notion).
