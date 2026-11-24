<?php
require __DIR__ . '/db.php';

hrm_require_method(array('PATCH', 'PUT', 'POST'));
hrm_guard_data_mode();

$in = hrm_json_body();

$id = hrm_id(isset($in['id']) ? $in['id'] : null);
if ($id === null) {
    hrm_validation_fail(400, array('id' => 'ID karyawan wajib berupa bilangan bulat positif.'));
}

$fields = array('nik', 'name', 'position', 'email', 'department', 'phone', 'join_date', 'salary', 'status');
$input = array_filter(array_intersect_key($in, array_flip($fields)), function ($v) {
    return $v !== null;
});
if (!$input) {
    hrm_validation_fail(400, array('fields' => 'Tidak ada field yang diubah.'));
}

$updated = HrmMockStore::transact('employees', function (array &$doc) use ($id, $input) {
    foreach ($doc['rows'] as $i => $r) {
        if ((int) $r['id'] !== $id) {
            continue;
        }

        $errors = array();
        $clean = hrm_employee_clean(array_merge($r, $input), $errors);
        if ($errors) {
            throw new HrmApiException(400, 'Validasi gagal: ' . implode(' ', array_values($errors)), $errors);
        }

        // NIK uniqueness check (excluding current employee)
        foreach ($doc['rows'] as $other) {
            if ((int) $other['id'] !== $id && strcasecmp($other['nik'], $clean['nik']) === 0) {
                throw new HrmApiException(409, 'Validasi gagal: NIK sudah dipakai karyawan lain.', array('nik' => 'NIK sudah dipakai karyawan lain.'));
            }
        }

        $doc['rows'][$i] = array_merge($r, $clean, array('updated_at' => date('Y-m-d H:i:s')));
        return $doc['rows'][$i];
    }
    throw new HrmApiException(404, 'Karyawan dengan ID tersebut tidak ditemukan.');
});

hrm_ok('Data karyawan diperbarui di penyimpanan sementara (mock). Perubahan belum permanen dan tidak masuk MySQL.', $updated);