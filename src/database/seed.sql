SET NAMES utf8mb4;

INSERT INTO settings (setting_key, value) VALUES
('video_file',     'assets/video/oudegracht-1929.mp4'),
('video_duration', '182.8'),
('idle_seconds',   '90'),
('intro_nl', 'Vaar mee over de Oudegracht van 1929! Druk op afspelen, of tik op een punt op de kaart om erheen te varen.'),
('intro_en', 'Sail along the Oudegracht in 1929! Press play, or tap a point on the map to sail there.'),
('colofon_nl', 'Deze applicatie is gemaakt door De Werfwebbers (Levi Bhargava en Sem Stil) voor Het Utrechts Archief, bij de tentoonstelling ‘Ontmoet de Oudegracht’ (2027).'),
('colofon_en', 'This application was made by De Werfwebbers (Levi Bhargava and Sem Stil) for Het Utrechts Archief, for the exhibition ‘Meet the Oudegracht’ (2027).');

INSERT INTO route_track (video_time, lat, lng) VALUES
(   0.00, 52.089199, 5.121168),
(  34.28, 52.089800, 5.120780),
(  72.36, 52.090406, 5.120380),
( 106.63, 52.090980, 5.120040),
( 140.91, 52.091552, 5.119702),
( 163.76, 52.091610, 5.119060),
( 182.80, 52.091658, 5.118418);

INSERT INTO points (title_nl, title_en, text_nl, text_en, time_start, time_end, lat, lng, sound, sort_order, is_published) VALUES
('Gaardbrug',    'Gaardbrug',     '[Placeholder] Hier begint de vaartocht uit 1929.', '[Placeholder] This is where the 1929 boat trip begins.',           0.0, 19.0, 52.089199, 5.121168, 'water', 1, 1),
('Werven',       'Wharves',       '[Placeholder] Langs de gracht liggen de werven: kades op waterniveau waar goederen werden gelost.', '[Placeholder] Along the canal are the wharves: quays at water level where goods were unloaded.', 30.5, 53.3, 52.089800, 5.120780, 'stad', 2, 1),
('Maartensbrug', 'Maartensbrug',  '[Placeholder] Tekst over de Maartensbrug volgt.', '[Placeholder] Text about the Maartensbrug to follow.',           64.7, 87.6, 52.090406, 5.120380, 'voetstappen', 3, 1),
('Werfkelders',  'Wharf cellars', '[Placeholder] Achter de werven liggen kelders onder de straat.', '[Placeholder] Behind the wharves, cellars run under the street.', 99.0, 121.9, 52.090980, 5.120040, 'water', 4, 1),
('Stadhuisbrug', 'Stadhuisbrug',  '[Placeholder] Tekst over de Stadhuisbrug volgt.', '[Placeholder] Text about the Stadhuisbrug to follow.',          133.3, 156.1, 52.091552, 5.119702, 'markt', 5, 1),
('Bezembrug',    'Bezembrug',     '[Placeholder] Hier eindigt de film.', '[Placeholder] This is where the film ends.',                              169.1, 182.8, 52.091658, 5.118418, 'water', 6, 1);
