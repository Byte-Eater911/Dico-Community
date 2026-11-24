<?php
/**
 * Konfigurasi lokal HRM (letakkan di erp/modules/hrm/api/db.local.php).
 * JANGAN di-commit ke Git. Mengaktifkan penyimpanan ke database MySQL.
 *
 * Kembali ke data sementara: ubah 'mode' menjadi 'mock' (atau hapus file ini).
 */
return array(
    'mode'  => 'mysql',
    'mysql' => array(
        'host' => 'localhost',
        'port' => 3306,            // bila bentrok, db.php otomatis mencoba 3307
        'name' => 'dico_community',
        'user' => 'root',
        'pass' => '',              // isi bila MySQL kamu memakai password
    ),
);
