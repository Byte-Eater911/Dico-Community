<?php
require __DIR__ . '/db.php';

$method = hrm_require_method(array('GET', 'PATCH', 'PUT', 'POST'));
hrm_guard_data_mode();

$statuses = array('Pending', 'Approved', 'Rejected');
$aliases  = array('menunggu' => 'Pending', 'disetujui' => 'Approved', 'ditolak' => 'Rejected');
$types    = array('Tahunan', 'Sakit', 'Izin');
$annualQuota = 12;

/** Calculate leave days: weekends are excluded except for sick leave. */
function leave_days($start, $end, $type)
{
    $d = DateTime::createFromFormat('!Y-m-d', $start);
    $e = DateTime::createFromFormat('!Y-m-d', $end);
    if (!$d || !$e || $e < $d) {
        return 0;
    }
    $n = 0;
    while ($d <= $e) {
        $w = (int) $d->format('w'); // 0 = Minggu, 6 = Sabtu
        if ($type === 'Sakit' || ($w !== 0 && $w !== 6)) {
            $n++;
        }
        $d->modify('+1 day');
    }
    return $n;
}

/** Calculate annual leave days used in given year. */
function leave_used_quota(array $rows, $name, $year, $skipId = 0)
{
    $sum = 0;
    foreach ($rows as $r) {
        if (strcasecmp($r['employee_name'], $name) === 0 && $r['leave_type'] === 'Tahunan' && $r['status'] !== 'Rejected'
            && (int) $r['id'] !== (int) $skipId && substr($r['start_date'], 0, 4) === (string) $year) {
            $sum += leave_days($r['start_date'], $r['end_date'], $r['leave_type']);
        }
    }
    return $sum;
}

if ($method === 'GET') {
    $filter = null;
    if (isset($_GET['status']) && $_GET['status'] !== '') {
        $filter = hrm_canonical($_GET['status'], $statuses, $aliases);
        if ($filter === null) {
            hrm_validation_fail(400, array('status' => 'Status harus salah satu dari: Pending, Approved, Rejected.'));
        }
    }

    $rows = HrmMockStore::all('leaves');
    if ($filter !== null) {
        $rows = array_filter($rows, function ($r) use ($filter) {
            return $r['status'] === $filter;
        });
    }
    $rows = array_values($rows);
    foreach ($rows as $i => $r) {
        $rows[$i]['days'] = leave_days($r['start_date'], $r['end_date'], $r['leave_type']);
    }
    usort($rows, function ($a, $b) {
        $c = strcmp($b['created_at'], $a['created_at']);
        return $c !== 0 ? $c : $b['id'] - $a['id'];
    });

    hrm_ok(
        $rows ? 'Data pengajuan cuti (mock) berhasil diambil.' : 'Belum ada pengajuan cuti (mock).',
        array('items' => $rows, 'total' => count($rows), 'annual_quota' => $annualQuota)
    );
}

$in = hrm_json_body();

if ($method === 'POST' && !array_key_exists('id', $in)) {
    $errors = array();

    $name   = hrm_text($in, 'employee_name', $errors, 'Nama karyawan', true, 2, 100);
    $start  = hrm_text($in, 'start_date', $errors, 'Tanggal mulai', true, 0, 10);
    $end    = hrm_text($in, 'end_date', $errors, 'Tanggal selesai', true, 0, 10);
    $reason = hrm_text($in, 'reason', $errors, 'Alasan', true, 3, 500, true);

    $type = hrm_canonical(isset($in['leave_type']) ? $in['leave_type'] : null, $types);
    if ($type === null) {
        $errors['leave_type'] = 'Jenis cuti harus salah satu dari: ' . implode(', ', $types) . '.';
    }
    if ($start !== '' && !isset($errors['start_date']) && !hrm_valid_date($start)) {
        $errors['start_date'] = 'Tanggal mulai harus berformat YYYY-MM-DD dan valid.';
    }
    if ($end !== '' && !isset($errors['end_date']) && !hrm_valid_date($end)) {
        $errors['end_date'] = 'Tanggal selesai harus berformat YYYY-MM-DD dan valid.';
    }
    if (!isset($errors['start_date']) && !isset($errors['end_date']) && $start !== '' && $end !== '') {
        if ($end < $start) {
            $errors['end_date'] = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
        } elseif ($type !== null && leave_days($start, $end, $type) === 0) {
            $errors['start_date'] = 'Rentang tanggal hanya berisi akhir pekan.';
        }
    }

    // Karyawan harus terdaftar dan tidak Nonaktif; pakai penulisan nama dari data karyawan.
    if (!isset($errors['employee_name'])) {
        $found = null;
        foreach (HrmMockStore::all('employees') as $e) {
            if (strcasecmp($e['name'], $name) === 0) {
                $found = $e;
                break;
            }
        }
        if ($found === null) {
            $errors['employee_name'] = 'Karyawan tidak ditemukan di data karyawan.';
        } elseif ($found['status'] === 'Nonaktif') {
            $errors['employee_name'] = 'Karyawan berstatus Nonaktif tidak dapat mengajukan cuti.';
        } else {
            $name = $found['name'];
        }
    }

    if ($errors) {
        hrm_validation_fail(400, $errors);
    }

    $days = leave_days($start, $end, $type);

    $created = HrmMockStore::transact('leaves', function (array &$doc) use ($name, $type, $start, $end, $reason, $days, $annualQuota) {
        // Check date conflict & quota
        foreach ($doc['rows'] as $r) {
            if (strcasecmp($r['employee_name'], $name) === 0 && $r['status'] !== 'Rejected'
                && $r['start_date'] <= $end && $r['end_date'] >= $start) {
                throw new HrmApiException(409, 'Validasi gagal: ' . $name . ' sudah punya pengajuan cuti pada rentang tanggal tersebut.',
                    array('start_date' => $name . ' sudah punya pengajuan cuti pada rentang tanggal tersebut.'));
            }
        }
        if ($type === 'Tahunan') {
            $left = $annualQuota - leave_used_quota($doc['rows'], $name, substr($start, 0, 4));
            if ($days > $left) {
                $msg = 'Kuota cuti tahunan tidak cukup (sisa ' . max(0, $left) . ' hari, diajukan ' . $days . ' hari).';
                throw new HrmApiException(409, 'Validasi gagal: ' . $msg, array('end_date' => $msg));
            }
        }
        $row = HrmMockStore::insert($doc, array(
            'employee_name' => $name,
            'leave_type'    => $type,
            'start_date'    => $start,
            'end_date'      => $end,
            'reason'        => $reason,
            'status'        => 'Pending',
            'review_note'   => '',
            'created_at'    => date('Y-m-d H:i:s'),
        ));
        return $row;
    });
    $created['days'] = $days;

    hrm_ok('Pengajuan cuti dicatat di penyimpanan sementara (mock). Data belum permanen dan tidak masuk MySQL.', $created, 201);
}

$errors = array();

$id = hrm_id(isset($in['id']) ? $in['id'] : null);
if ($id === null) {
    $errors['id'] = 'ID pengajuan wajib berupa bilangan bulat positif.';
}

$status = hrm_canonical(isset($in['status']) ? $in['status'] : null, $statuses, $aliases);
if ($status === null) {
    $errors['status'] = 'Status harus salah satu dari: Pending, Approved, Rejected.';
}

$note = hrm_text($in, 'review_note', $errors, 'Catatan HRM', false, 0, 255, true);
if ($status === 'Rejected' && $note === '' && !isset($errors['review_note'])) {
    $errors['review_note'] = 'Alasan penolakan wajib diisi.';
} elseif ($status === 'Rejected' && $note !== '' && hrm_len($note) < 3 && !isset($errors['review_note'])) {
    $errors['review_note'] = 'Alasan penolakan minimal 3 karakter.';
}

if ($errors) {
    hrm_validation_fail(400, $errors);
}

$updated = HrmMockStore::transact('leaves', function (array &$doc) use ($id, $status, $note) {
    foreach ($doc['rows'] as $i => $r) {
        if ((int) $r['id'] === $id) {
            $now = date('Y-m-d H:i:s');
            $doc['rows'][$i]['status'] = $status;
            $doc['rows'][$i]['review_note'] = $note;
            $doc['rows'][$i]['reviewed_at'] = $status === 'Pending' ? '' : $now;
            $doc['rows'][$i]['updated_at'] = $now;
            return $doc['rows'][$i];
        }
    }
    throw new HrmApiException(404, 'Pengajuan cuti dengan ID tersebut tidak ditemukan.');
});
$updated['days'] = leave_days($updated['start_date'], $updated['end_date'], $updated['leave_type']);

hrm_ok('Status pengajuan cuti diperbarui di penyimpanan sementara (mock). Perubahan belum permanen dan tidak masuk MySQL.', $updated);