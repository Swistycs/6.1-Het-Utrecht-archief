<?php
declare(strict_types=1);

$beelden = [
    'e154e77cbae1bbade0538f04000a554f.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/45bf8b14-9fbb-5ee3-e367-37bb389da136.jpg',
    '0b35692a2efe5c49924ab82e3b6fea43.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/04bbe625-233d-6fbc-1cf0-80fdf45af226.jpg',
    '17304feb14dd50b580b52031dbdae08c.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/200fa696-de16-1a7b-9ffe-39f4d816e754.jpg',
    'ff48325ff02695b5e0538f04000a4889.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/bab94e7e-2735-9736-19ff-fd6ae697f104.jpg',
    '914585185317b66ce0534701000a4ffb.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/7031d74f-2d2c-380f-827c-200e860b7527.jpg',
    'e7b5ae826b105025ba2d34396da909a1.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/1bc62776-9554-9803-a99e-cad07c40cc99.jpg',
    'fcc5d27d5122834be0538f04000a363d.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/4e7d74fd-ec94-d774-3896-bed862f9cd0e.jpg',
    'c744769e072555d49e2e03e92dbcb604.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/13d36fd9-e198-7c4d-3ec7-8a19b2e9190b.jpg',
    '62665b8ea2525ec3a01eda19075cf809.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/5ff85650-d6df-156b-8847-09ec37cf4534.jpg',
    'b2bd88e3de5b2173e0534701000a486f.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/b1b788e0-8305-3e79-8c04-3d3d508cec04.jpg',
    '72dd2dcb9bac546fbbbcf5c1111cc735.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/1bd5ff65-b4dd-9ad4-46c1-c90205d6073a.jpg',
    '452c4ef2e0f15eda9acadf86f8e57f51.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/e29cbbe4-0136-9b3c-7be8-5d3086733270.jpg',
    'b92f162a1fab12c0e0534701000a2676.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/6a4beb57-13d8-9fbe-2bd1-5e51dfcc26ce.jpg',
    'b92c390a7bf7cb12e0534701000ab712.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/326389fa-ea1e-fc17-7418-1cb844feed51.jpg',
    'aa8056d41ab75229b8d85a70192c714d.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/6fe37b70-546a-32ad-eb7a-7bd61764cbfa.jpg',
    'db73d181f47bbae0e0538f04000ac07c.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/7c7ea0d0-d183-1a9f-1e34-745f7560ae9a.jpg',
    'b92bb223d89518e0e0534701000a7b09.jpg' => 'https://images.memorix.nl/utr/thumb/1000x1000/7c13e223-7096-8232-b06e-4fdefca7077f.jpg',
];

$map = __DIR__ . '/../public/uploads/';
$nieuw = 0;
foreach ($beelden as $bestand => $url) {
    if (is_file($map . $bestand)) {
        continue;
    }
    $data = @file_get_contents($url);
    if ($data === false) {
        fwrite(STDERR, "Kon $bestand niet ophalen\n");
        continue;
    }
    file_put_contents($map . $bestand, $data);
    $nieuw++;
}
echo "Klaar: $nieuw nieuwe archiefbeelden in src/public/uploads/\n";
