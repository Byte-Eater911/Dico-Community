<?php
require __DIR__ . '/db.php';

hrm_require_method(array('GET'));
hrm_guard_data_mode();

$rows = HrmMockStore::all('employees');

usort($rows, function ($a, $b) {
    return strcasecmp($a['name'], $b['name']);
});

hrm_ok(
    $rows ? 'Data karyawan (mock) berhasil diambil.' : 'Belum ada data karyawan (mock).',
    array('items' => array_values($rows), 'total' => count($rows))
);
