<?php
require __DIR__ . '/db.php';

hrm_require_method(array('POST'));
hrm_guard_data_mode();

$in = hrm_json_body();
$errors = array();
$clean = hrm_employee_clean($in, $errors);

if ($errors) {
    hrm_validation_fail(400, $errors);
}

$created = HrmMockStore::transact('employees', function (array &$doc) use ($clean) {
    // Check NIK uniqueness
    foreach ($doc['rows'] as $r) {
        if (strcasecmp($r['nik'], $clean['nik']) === 0) {
            throw new HrmApiException(409, 'Validasi gagal: NIK sudah terdaftar.', array('nik' => 'NIK sudah terdaftar.'));
        }
    }
    return HrmMockStore::insert($doc, $clean + array('created_at' => date('Y-m-d H:i:s')));
});

hrm_ok('Karyawan ditambahkan ke penyimpanan sementara (mock). Data belum tersimpan permanen dan tidak masuk MySQL.', $created, 201);
