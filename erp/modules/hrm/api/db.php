<?php
/**
 * DICO ERP - HRM API: bootstrap bersama (di-require oleh semua endpoint).
 *
 * MODE DATA: "mock" (file JSON sementara) atau "mysql" (database MySQL; lihat HrmMysqlStore di bawah).
 * Untuk memakai MySQL: jalankan hrm_mysql_migration.sql, lalu buat api/db.local.php (contoh: db.local.php.sample).
 *
 * CATATAN LAMA (Tahap A): database MySQL belum tersedia.
 *   - Mode default "mock": data disimpan SEMENTARA di file JSON pada folder
 *     temp server (lihat HrmMockStore). Ini hanya untuk pengembangan lokal,
 *     BUKAN database dan BUKAN untuk produksi.
 *   - Mode "mysql" sengaja belum mengeksekusi query apa pun karena skema tabel
 *     belum ada. Endpoint menjawab HTTP 501 bila mode ini dipilih.
 *   - hrm_get_pdo() hanya menyiapkan koneksi PDO untuk Tahap B. Ia tidak
 *     dipanggil oleh endpoint mana pun saat ini.
 *
 * KONFIGURASI (urutan prioritas, yang belakang menimpa yang depan):
 *   1. Nilai bawaan di bawah (tanpa kredensial apa pun).
 *   2. File opsional api/db.local.php (JANGAN di-commit) yang me-return array.
 *   3. Environment variable.
 *
 *   Environment variable:
 *     HRM_DATA_MODE   mock | mysql        (bawaan: mock)
 *     HRM_TIMEZONE    mis. Asia/Jakarta    (bawaan: Asia/Jakarta)
 *     HRM_MOCK_DIR    folder data mock     (bawaan: <temp>/dico_hrm_mock)
 *     HRM_DB_HOST, HRM_DB_PORT, HRM_DB_NAME, HRM_DB_USER, HRM_DB_PASS, HRM_DB_CHARSET
 *
 *   Contoh api/db.local.php:
 *     <?php return ['mode' => 'mock', 'mysql' => ['host' => '...', 'name' => '...', 'user' => '...', 'pass' => '...']];
 *
 * Kompatibel PHP 7.4+. Memerlukan ekstensi json; pdo_mysql hanya untuk Tahap B.
 */

// Akses langsung ke file ini tidak diizinkan.
if (PHP_SAPI !== 'cli' && isset($_SERVER['SCRIPT_FILENAME']) && @realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('success' => false, 'message' => 'Akses langsung ke file ini tidak diizinkan.'));
    exit;
}

class HrmApiException extends RuntimeException
{
    /** @var int */
    private $status;
    /** @var array */
    private $errors;

    public function __construct($status, $message, array $errors = array())
    {
        parent::__construct($message);
        $this->status = (int) $status;
        $this->errors = $errors;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getErrors()
    {
        return $this->errors;
    }
}

function hrm_config()
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }

    $cfg = array(
        'mode'     => 'mock',
        'timezone' => 'Asia/Jakarta',
        'mock_dir' => rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'dico_hrm_mock',
        'mysql'    => array('host' => '', 'port' => 3306, 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'),
    );

    $local = __DIR__ . '/db.local.php';
    if (is_file($local)) {
        $over = require $local;
        if (is_array($over)) {
            $cfg = array_replace_recursive($cfg, $over);
        }
    }

    $top = array('HRM_DATA_MODE' => 'mode', 'HRM_TIMEZONE' => 'timezone', 'HRM_MOCK_DIR' => 'mock_dir');
    foreach ($top as $env => $key) {
        $v = getenv($env);
        if ($v !== false && $v !== '') {
            $cfg[$key] = $v;
        }
    }
    $db = array(
        'HRM_DB_HOST' => 'host', 'HRM_DB_PORT' => 'port', 'HRM_DB_NAME' => 'name',
        'HRM_DB_USER' => 'user', 'HRM_DB_PASS' => 'pass', 'HRM_DB_CHARSET' => 'charset',
    );
    foreach ($db as $env => $key) {
        $v = getenv($env);
        if ($v !== false && $v !== '') {
            $cfg['mysql'][$key] = $v;
        }
    }

    $cfg['mode'] = strtolower(trim((string) $cfg['mode']));
    return $cfg;
}

function hrm_send($status, array $payload)
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    if ($json === false) {
        $status = 500;
        $json = '{"success":false,"message":"Gagal menyusun respons."}';
    }
    if (!headers_sent()) {
        http_response_code((int) $status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
    }
    echo $json;
    exit;
}

/** Keterangan sumber data. */
function hrm_meta()
{
    if (hrm_config()['mode'] === 'mysql') {
        return array(
            'source'  => 'mysql',
            'storage' => 'database MySQL',
            'note'    => 'Data tersimpan permanen di database MySQL.',
        );
    }
    return array(
        'source'  => 'mock',
        'storage' => 'file JSON sementara di server pengembangan (bukan MySQL)',
        'note'    => 'Data sementara untuk pengembangan frontend; bukan data produksi dan dapat hilang kapan saja.',
    );
}

/** Strip mock-specific wording from messages when in MySQL mode. */
function hrm_clean_message($m)
{
    if (hrm_config()['mode'] !== 'mysql') {
        return $m;
    }
    $m = preg_replace('/\s+(Data|Perubahan) belum[^.]*MySQL\./u', '', $m);
    $m = str_replace('penyimpanan sementara (mock)', 'database MySQL', $m);
    return str_replace(' (mock)', '', $m);
}

function hrm_ok($message, $data = null, $status = 200)
{
    $payload = array('success' => true, 'message' => hrm_clean_message((string) $message));
    if ($data !== null) {
        $payload['data'] = $data;
    }
    $payload['meta'] = hrm_meta();
    hrm_send($status, $payload);
}

function hrm_fail($status, $message, array $errors = array())
{
    $payload = array('success' => false, 'message' => (string) $message);
    if ($errors) {
        $payload['errors'] = $errors;
    }
    hrm_send($status, $payload);
}

/** Pesan untuk validasi gagal. */
function hrm_validation_fail($status, array $errors)
{
    hrm_fail($status, 'Validasi gagal: ' . implode(' ', array_values($errors)), $errors);
}

function hrm_bootstrap()
{
    ob_start();
    ini_set('display_errors', '0');
    ini_set('html_errors', '0');
    error_reporting(E_ALL);

    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }

    set_error_handler(function ($no, $str, $file, $line) {
        error_log('[HRM API] PHP error ' . $no . ': ' . $str . ' in ' . basename($file) . ':' . $line);
        return true;
    });

    set_exception_handler(function ($e) {
        if ($e instanceof HrmApiException) {
            hrm_fail($e->getStatus(), $e->getMessage(), $e->getErrors());
        }
        error_log('[HRM API] Unhandled ' . get_class($e) . ': ' . $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine());
        hrm_fail(500, 'Terjadi kesalahan pada server.');
    });

    register_shutdown_function(function () {
        $err = error_get_last();
        if ($err && in_array($err['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR), true)) {
            error_log('[HRM API] Fatal: ' . $err['message'] . ' in ' . basename($err['file']) . ':' . $err['line']);
            if (!headers_sent()) {
                hrm_fail(500, 'Terjadi kesalahan pada server.');
            }
        }
    });

    $tz = hrm_config()['timezone'];
    if (!@date_default_timezone_set($tz)) {
        date_default_timezone_set('Asia/Jakarta');
    }
}

function hrm_require_method(array $allowed)
{
    $m = strtoupper(preg_replace('/[^A-Za-z]/', '', isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET'));
    if (!in_array($m, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        hrm_fail(405, 'Metode HTTP ' . $m . ' tidak didukung. Gunakan: ' . implode(', ', $allowed) . '.');
    }
    return $m;
}

/** Guard data mode: only "mock" or "mysql" allowed. */
function hrm_guard_data_mode()
{
    $mode = hrm_config()['mode'];
    if ($mode === 'mock' || $mode === 'mysql') {
        return;
    }
    hrm_fail(500, 'Konfigurasi HRM_DATA_MODE tidak valid (gunakan mock atau mysql).');
}

function hrm_json_body()
{
    $raw = file_get_contents('php://input', false, null, 0, 65537);
    if ($raw === false || trim($raw) === '') {
        hrm_fail(400, 'Body request kosong. Kirim JSON dengan header Content-Type: application/json.');
    }
    if (strlen($raw) > 65536) {
        hrm_fail(413, 'Body request terlalu besar.');
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || ($data !== array() && array_values($data) === $data)) {
        hrm_fail(400, 'Body harus berupa objek JSON yang valid.');
    }
    return $data;
}

/** ID positif dari int atau string digit; selain itu null. */
function hrm_id($v)
{
    if (is_int($v) && $v > 0) {
        return $v;
    }
    if (is_string($v) && ctype_digit($v) && strlen($v) <= 15 && (int) $v > 0) {
        return (int) $v;
    }
    return null;
}

function hrm_len($s)
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}

function hrm_text(array $in, $key, array &$errors, $label, $required, $min = 0, $max = 255, $multiline = false)
{
    $v = array_key_exists($key, $in) ? $in[$key] : null;
    if ($v !== null && !is_string($v) && !is_int($v) && !is_float($v)) {
        $errors[$key] = $label . ' harus berupa teks.';
        return '';
    }
    $v = $v === null ? '' : trim((string) $v);
    if ($v === '') {
        if ($required) {
            $errors[$key] = $label . ' wajib diisi.';
        }
        return '';
    }
    $bad = $multiline ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/';
    if (preg_match($bad, $v)) {
        $errors[$key] = $label . ' mengandung karakter yang tidak valid.';
        return '';
    }
    $len = hrm_len($v);
    if ($len < $min) {
        $errors[$key] = $label . ' minimal ' . $min . ' karakter.';
    } elseif ($len > $max) {
        $errors[$key] = $label . ' maksimal ' . $max . ' karakter.';
    }
    return $v;
}

function hrm_valid_date($s)
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m)) {
        return false;
    }
    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

function hrm_valid_time($s)
{
    return (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $s);
}

/** Cocokkan nilai ke daftar nilai kanonik (case-insensitive); null bila tidak ada. */
function hrm_canonical($value, array $allowed, array $aliases = array())
{
    if (!is_string($value)) {
        return null;
    }
    $k = strtolower(trim($value));
    foreach ($allowed as $a) {
        if (strtolower($a) === $k) {
            return $a;
        }
    }
    return isset($aliases[$k]) ? $aliases[$k] : null;
}

/**
 * Validasi + normalisasi satu record karyawan (dipakai add_employee.php dan update_employee.php).
 */
function hrm_employee_clean(array $in, array &$errors)
{
    $nik        = hrm_text($in, 'nik', $errors, 'NIK', true, 3, 32);
    $name       = hrm_text($in, 'name', $errors, 'Nama lengkap', true, 2, 100);
    $position   = hrm_text($in, 'position', $errors, 'Jabatan', true, 2, 100);
    $email      = hrm_text($in, 'email', $errors, 'Email', true, 5, 150);
    $department = hrm_text($in, 'department', $errors, 'Departemen', false, 0, 100);
    $phone      = hrm_text($in, 'phone', $errors, 'No. telepon', false, 0, 20);
    $joinDate   = hrm_text($in, 'join_date', $errors, 'Tanggal bergabung', false, 0, 10);

    if ($nik !== '' && !isset($errors['nik']) && !preg_match('/^[A-Za-z0-9][A-Za-z0-9.\-]*$/', $nik)) {
        $errors['nik'] = 'NIK hanya boleh berisi huruf, angka, titik, dan strip.';
    }
    if ($email !== '' && !isset($errors['email']) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Format email tidak valid.';
    }
    if ($phone !== '' && !isset($errors['phone']) && !preg_match('/^[0-9+\-\s()]{6,20}$/', $phone)) {
        $errors['phone'] = 'Format nomor telepon tidak valid.';
    }
    if ($joinDate !== '' && !isset($errors['join_date']) && !hrm_valid_date($joinDate)) {
        $errors['join_date'] = 'Tanggal bergabung harus berformat YYYY-MM-DD dan valid.';
    }

    // Gaji pokok: angka >= 0, maks. 2 desimal, muat di DECIMAL(12,2).
    $salary = 0;
    $salaryRaw = array_key_exists('salary', $in) ? $in['salary'] : 0;
    if (is_string($salaryRaw)) {
        $salaryRaw = trim($salaryRaw);
    }
    if ($salaryRaw === null || $salaryRaw === '') {
        $salary = 0;
    } elseif ((is_int($salaryRaw) || is_float($salaryRaw) || (is_string($salaryRaw) && preg_match('/^\d+(\.\d{1,2})?$/', $salaryRaw)))
        && $salaryRaw >= 0 && $salaryRaw <= 9999999999.99) {
        $salary = round((float) $salaryRaw, 2);
        if ($salary == floor($salary)) {
            $salary = (int) $salary;
        }
    } else {
        $errors['salary'] = 'Gaji pokok harus berupa angka tidak negatif (maksimal 9.999.999.999, 2 desimal).';
    }

    $status = 'Aktif';
    if (array_key_exists('status', $in) && $in['status'] !== null && $in['status'] !== '') {
        $status = hrm_canonical($in['status'], array('Aktif', 'Cuti', 'Nonaktif'));
        if ($status === null) {
            $errors['status'] = 'Status harus salah satu dari: Aktif, Cuti, Nonaktif.';
        }
    }

    return array(
        'nik' => $nik, 'name' => $name, 'department' => $department, 'position' => $position,
        'email' => $email, 'phone' => $phone, 'join_date' => $joinDate, 'salary' => $salary, 'status' => $status,
    );
}

function hrm_get_pdo()
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $c = hrm_config()['mysql'];
    if ($c['host'] === '' || $c['name'] === '' || $c['user'] === '') {
        throw new HrmApiException(503, 'Koneksi database belum dikonfigurasi.');
    }
    if (!extension_loaded('pdo_mysql')) {
        throw new HrmApiException(503, 'Ekstensi pdo_mysql tidak tersedia di server.');
    }
    $ports = array((int) $c['port']);
    if ((int) $c['port'] === 3306) {
        $ports[] = 3307; // XAMPP sering memakai 3307 bila 3306 bentrok
    }
    $opts = array(
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    );
    foreach ($ports as $port) {
        $dsn = 'mysql:host=' . $c['host'] . ';port=' . $port . ';dbname=' . $c['name'] . ';charset=' . $c['charset'];
        try {
            $pdo = new PDO($dsn, $c['user'], $c['pass'], $opts);
            break;
        } catch (PDOException $e) {
            error_log('[HRM API] Koneksi MySQL gagal di port ' . $port . ' (kode ' . $e->getCode() . '): ' . $e->getMessage());
        }
    }
    if ($pdo === null) {
        throw new HrmApiException(503, 'Koneksi database gagal. Pastikan MySQL di XAMPP sudah Start dan database sudah di-import.');
    }
    return $pdo;
}

final class HrmFileStore
{
    private static function path($name)
    {
        if (!preg_match('/^[a-z_]+$/', $name)) {
            throw new InvalidArgumentException('Nama koleksi tidak valid.');
        }
        $dir = hrm_config()['mock_dir'];
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            error_log('[HRM API] Tidak dapat membuat folder mock: ' . $dir);
            throw new HrmApiException(500, 'Penyimpanan sementara tidak dapat diakses.');
        }
        return $dir . DIRECTORY_SEPARATOR . $name . '.json';
    }

    /** Seed data (NIK prefixed MOCK- to distinguish from real data). */
    private static function seed($name)
    {
        $now = date('Y-m-d H:i:s');
        $rows = array();
        if ($name === 'employees') {
            $rows = array(
                array('id' => 1, 'nik' => 'MOCK-001', 'name' => 'Andi Pratama', 'department' => '', 'position' => 'HR Officer', 'email' => 'andi@example.com', 'phone' => '', 'join_date' => '', 'status' => 'Aktif', 'created_at' => $now),
                array('id' => 2, 'nik' => 'MOCK-002', 'name' => 'Siti Aminah', 'department' => '', 'position' => 'Administrator', 'email' => 'siti@example.com', 'phone' => '', 'join_date' => '', 'status' => 'Aktif', 'created_at' => $now),
                array('id' => 3, 'nik' => 'MOCK-003', 'name' => 'Budi Santoso', 'department' => '', 'position' => 'Finance Staff', 'email' => 'budi@example.com', 'phone' => '', 'join_date' => '', 'status' => 'Cuti', 'created_at' => $now),
            );
        } elseif ($name === 'leaves') {
            $rows = array(
                array('id' => 1, 'employee_name' => 'Andi Pratama', 'leave_type' => 'Tahunan', 'start_date' => '2026-10-12', 'end_date' => '2026-10-14', 'reason' => 'Keperluan keluarga', 'status' => 'Pending', 'created_at' => '2026-10-09 09:00:00'),
                array('id' => 2, 'employee_name' => 'Siti Aminah', 'leave_type' => 'Sakit', 'start_date' => '2026-10-08', 'end_date' => '2026-10-08', 'reason' => 'Pemulihan kesehatan', 'status' => 'Approved', 'created_at' => '2026-10-07 08:30:00'),
                array('id' => 3, 'employee_name' => 'Budi Santoso', 'leave_type' => 'Tahunan', 'start_date' => '2026-10-20', 'end_date' => '2026-10-21', 'reason' => 'Keperluan pribadi', 'status' => 'Rejected', 'created_at' => '2026-10-06 14:15:00'),
            );
        } elseif ($name === 'events') {
            $rows = array(
                array('id' => 1, 'title' => 'Pelatihan Komunikasi', 'date' => '2026-10-15', 'time' => '', 'location' => '', 'category' => '', 'status' => 'Aktif', 'description' => 'Pelatihan internal untuk meningkatkan komunikasi tim.', 'created_at' => $now),
                array('id' => 2, 'title' => 'Town Hall DICO', 'date' => '2026-10-22', 'time' => '', 'location' => '', 'category' => '', 'status' => 'Aktif', 'description' => 'Pertemuan bulanan dan pembaruan perusahaan.', 'created_at' => $now),
            );
        } elseif ($name === 'registrations') {
            $rows = array(
                array('id' => 1, 'participant_name' => 'Rina Putri', 'email' => 'rina@example.com', 'event_id' => 1, 'status' => 'Terdaftar', 'registered_at' => '2026-10-09 10:00:00'),
            );
        } else {
            throw new InvalidArgumentException('Koleksi tidak dikenal.');
        }
        return array('next_id' => count($rows) + 1, 'rows' => $rows);
    }

    /**
     * Read-modify-write with exclusive lock.
     * $fn receives the document (by reference) and returns a result.
     * If $fn throws, nothing is written.
     */
    public static function transact($name, callable $fn)
    {
        $fh = @fopen(self::path($name), 'c+');
        if (!$fh) {
            throw new HrmApiException(500, 'Penyimpanan sementara tidak dapat diakses.');
        }
        try {
            if (!flock($fh, LOCK_EX)) {
                throw new HrmApiException(500, 'Penyimpanan sementara sedang sibuk. Coba lagi.');
            }
            rewind($fh);
            $raw = stream_get_contents($fh);
            $doc = ($raw === false || trim($raw) === '') ? null : json_decode($raw, true);
            $dirty = false;
            if (!is_array($doc) || !isset($doc['rows'], $doc['next_id']) || !is_array($doc['rows'])) {
                $doc = self::seed($name);
                $dirty = true;
            }
            $before = json_encode($doc);
            $result = $fn($doc);
            if ($dirty || json_encode($doc) !== $before) {
                $out = json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                if ($out === false || !ftruncate($fh, 0) || rewind($fh) === false || fwrite($fh, $out) === false || !fflush($fh)) {
                    throw new HrmApiException(500, 'Data gagal ditulis ke penyimpanan sementara.');
                }
            }
            return $result;
        } finally {
            @flock($fh, LOCK_UN);
            fclose($fh);
        }
    }

    /** Get all rows (seeds initial data if collection doesn't exist). */
    public static function all($name)
    {
        return self::transact($name, function (array &$doc) {
            return $doc['rows'];
        });
    }

    /** Add a row to the document (called inside transact); returns row with new id. */
    public static function insert(array &$doc, array $row)
    {
        $row = array('id' => (int) $doc['next_id']) + $row;
        $doc['next_id'] = (int) $doc['next_id'] + 1;
        $doc['rows'][] = $row;
        return $row;
    }
}

/**
 * MySQL storage (mode "mysql").
 * Same interface as file store (all / transact / insert) so endpoints work without changes.
 */
final class HrmMysqlStore
{
    private static $leaveToDb   = array('Pending' => 'menunggu', 'Approved' => 'disetujui', 'Rejected' => 'ditolak');
    private static $leaveFromDb = array('menunggu' => 'Pending', 'disetujui' => 'Approved', 'ditolak' => 'Rejected');

    private static function nz($v)
    {
        return ($v === null || $v === '') ? null : $v;
    }

    private static function str($v)
    {
        return $v === null ? '' : (string) $v;
    }

    /** DECIMAL from DB -> integer when no fractional part (cleaner JSON). */
    private static function money($v)
    {
        $f = (float) $v;
        return $f == floor($f) ? (int) $f : $f;
    }

    private static function val(array $r, $k, $default = null)
    {
        return isset($r[$k]) ? $r[$k] : $default;
    }

    /** Collection spec: select query, from (DB row -> API row), to (API row -> DB columns). */
    private static function spec($name)
    {
        switch ($name) {
            case 'employees':
                return array(
                    'table'     => 'hrm_employees',
                    'select'    => 'SELECT id, nik, nama_lengkap, departemen, jabatan, email, no_telp, tgl_bergabung, gaji_pokok, status_aktif, created_at, updated_at FROM hrm_employees ORDER BY id',
                    'no_update' => array('created_at'),
                    'from'      => function (array $r) {
                        return array(
                            'id' => (int) $r['id'], 'nik' => $r['nik'], 'name' => $r['nama_lengkap'],
                            'department' => HrmMysqlStore::str($r['departemen']), 'position' => $r['jabatan'],
                            'email' => HrmMysqlStore::str($r['email']), 'phone' => HrmMysqlStore::str($r['no_telp']),
                            'join_date' => HrmMysqlStore::str($r['tgl_bergabung']), 'salary' => HrmMysqlStore::money($r['gaji_pokok']), 'status' => $r['status_aktif'],
                            'created_at' => HrmMysqlStore::str($r['created_at']), 'updated_at' => HrmMysqlStore::str($r['updated_at']),
                        );
                    },
                    'to'        => function (array $r, $pdo, $ins) {
                        return array(
                            'nik' => $r['nik'], 'nama_lengkap' => $r['name'],
                            'departemen' => (string) HrmMysqlStore::val($r, 'department', ''), 'jabatan' => $r['position'],
                            'email' => (string) HrmMysqlStore::val($r, 'email', ''), 'no_telp' => (string) HrmMysqlStore::val($r, 'phone', ''),
                            'tgl_bergabung' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'join_date')),
                            'gaji_pokok' => (float) HrmMysqlStore::val($r, 'salary', 0),
                            'status_aktif' => HrmMysqlStore::val($r, 'status', 'Aktif'),
                            'created_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'created_at')) ?: date('Y-m-d H:i:s'),
                            'updated_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'updated_at')),
                        );
                    },
                );

            case 'leaves':
                return array(
                    'table'     => 'hrm_leaves',
                    'select'    => 'SELECT l.id, e.nama_lengkap AS employee_name, l.tipe_cuti, l.tgl_mulai, l.tgl_selesai, l.alasan, l.status, l.review_note, l.reviewed_at, l.created_at, l.updated_at '
                                 . 'FROM hrm_leaves l JOIN hrm_employees e ON e.id = l.employee_id ORDER BY l.id',
                    // Pengubahan hanya menyangkut status/catatan.
                    'no_update' => array('employee_id', 'tipe_cuti', 'tgl_mulai', 'tgl_selesai', 'alasan', 'created_at'),
                    'from'      => function (array $r) {
                        return array(
                            'id' => (int) $r['id'], 'employee_name' => $r['employee_name'], 'leave_type' => ucfirst((string) $r['tipe_cuti']),
                            'start_date' => $r['tgl_mulai'], 'end_date' => $r['tgl_selesai'], 'reason' => HrmMysqlStore::str($r['alasan']),
                            'status' => isset(HrmMysqlStore::$leaveFromDb[$r['status']]) ? HrmMysqlStore::$leaveFromDb[$r['status']] : 'Pending',
                            'review_note' => HrmMysqlStore::str($r['review_note']), 'reviewed_at' => HrmMysqlStore::str($r['reviewed_at']),
                            'created_at' => HrmMysqlStore::str($r['created_at']), 'updated_at' => HrmMysqlStore::str($r['updated_at']),
                        );
                    },
                    'to'        => function (array $r, $pdo, $ins) {
                        $out = array(
                            'tipe_cuti' => strtolower($r['leave_type']), 'tgl_mulai' => $r['start_date'], 'tgl_selesai' => $r['end_date'],
                            'alasan' => (string) HrmMysqlStore::val($r, 'reason', ''),
                            'status' => isset(HrmMysqlStore::$leaveToDb[$r['status']]) ? HrmMysqlStore::$leaveToDb[$r['status']] : 'menunggu',
                            'review_note' => (string) HrmMysqlStore::val($r, 'review_note', ''),
                            'reviewed_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'reviewed_at')),
                            'created_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'created_at')) ?: date('Y-m-d H:i:s'),
                            'updated_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'updated_at')),
                        );
                        if ($ins) {
                            $st = $pdo->prepare('SELECT id FROM hrm_employees WHERE nama_lengkap = ? ORDER BY id LIMIT 1');
                            $st->execute(array($r['employee_name']));
                            $eid = $st->fetchColumn();
                            if ($eid === false) {
                                throw new HrmApiException(400, 'Validasi gagal: karyawan tidak ditemukan.', array('employee_name' => 'Karyawan tidak ditemukan di data karyawan.'));
                            }
                            $out['employee_id'] = (int) $eid;
                        }
                        return $out;
                    },
                );

            case 'events':
                return array(
                    'table'     => 'hrm_events',
                    'select'    => 'SELECT id, title, event_date, event_time, location, category, status, description, created_at, updated_at FROM hrm_events ORDER BY id',
                    'no_update' => array('created_at'),
                    'from'      => function (array $r) {
                        return array(
                            'id' => (int) $r['id'], 'title' => $r['title'], 'date' => $r['event_date'],
                            'time' => $r['event_time'] === null ? '' : substr((string) $r['event_time'], 0, 5),
                            'location' => HrmMysqlStore::str($r['location']), 'category' => HrmMysqlStore::str($r['category']),
                            'status' => $r['status'], 'description' => HrmMysqlStore::str($r['description']),
                            'created_at' => HrmMysqlStore::str($r['created_at']), 'updated_at' => HrmMysqlStore::str($r['updated_at']),
                        );
                    },
                    'to'        => function (array $r, $pdo, $ins) {
                        $time = HrmMysqlStore::nz(HrmMysqlStore::val($r, 'time'));
                        return array(
                            'title' => $r['title'], 'event_date' => $r['date'], 'event_time' => $time === null ? null : (strlen($time) === 5 ? $time . ':00' : $time),
                            'location' => (string) HrmMysqlStore::val($r, 'location', ''), 'category' => (string) HrmMysqlStore::val($r, 'category', ''),
                            'status' => HrmMysqlStore::val($r, 'status', 'Aktif'), 'description' => (string) HrmMysqlStore::val($r, 'description', ''),
                            'created_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'created_at')) ?: date('Y-m-d H:i:s'),
                            'updated_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'updated_at')),
                        );
                    },
                );

            case 'registrations':
                return array(
                    'table'     => 'hrm_event_registrations',
                    'select'    => 'SELECT id, participant_name, email, event_id, status, registered_at, updated_at FROM hrm_event_registrations ORDER BY id',
                    'no_update' => array('participant_name', 'email', 'event_id', 'registered_at'),
                    'from'      => function (array $r) {
                        return array(
                            'id' => (int) $r['id'], 'participant_name' => $r['participant_name'], 'email' => $r['email'],
                            'event_id' => (int) $r['event_id'], 'status' => $r['status'],
                            'registered_at' => HrmMysqlStore::str($r['registered_at']), 'updated_at' => HrmMysqlStore::str($r['updated_at']),
                        );
                    },
                    'to'        => function (array $r, $pdo, $ins) {
                        return array(
                            'participant_name' => $r['participant_name'], 'email' => $r['email'], 'event_id' => (int) $r['event_id'],
                            'status' => HrmMysqlStore::val($r, 'status', 'Terdaftar'),
                            'registered_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'registered_at')) ?: date('Y-m-d H:i:s'),
                            'updated_at' => HrmMysqlStore::nz(HrmMysqlStore::val($r, 'updated_at')),
                        );
                    },
                );
        }
        throw new InvalidArgumentException('Koleksi tidak dikenal.');
    }

    /** Convert PDO errors to safe API responses (details go to error_log). */
    private static function guard(callable $fn)
    {
        try {
            return $fn();
        } catch (PDOException $e) {
            $code = isset($e->errorInfo[1]) ? (int) $e->errorInfo[1] : 0;
            error_log('[HRM API] MySQL error ' . $e->getCode() . '/' . $code . ': ' . $e->getMessage());
            if ($code === 1146 || $code === 1054) {
                throw new HrmApiException(503, 'Tabel/kolom HRM belum siap. Jalankan file hrm_mysql_migration.sql lewat phpMyAdmin pada database yang dipakai.');
            }
            if ($code === 1062) {
                throw new HrmApiException(409, 'Validasi gagal: data sudah ada (duplikat).');
            }
            if ($code === 1451 || $code === 1452) {
                throw new HrmApiException(409, 'Data tidak dapat diproses karena berkaitan dengan data lain.');
            }
            throw new HrmApiException(500, 'Terjadi kesalahan pada database.');
        }
    }

    private static function load(array $sp)
    {
        $rows = array();
        foreach (hrm_get_pdo()->query($sp['select']) as $r) {
            $rows[] = call_user_func($sp['from'], $r);
        }
        return $rows;
    }

    private static function norm(array $r)
    {
        ksort($r);
        return json_encode($r);
    }

    public static function all($name)
    {
        $sp = self::spec($name);
        return self::guard(function () use ($sp) {
            return HrmMysqlStore::load($sp);
        });
    }

    public static function transact($name, callable $fn)
    {
        $sp = self::spec($name);
        return self::guard(function () use ($name, $sp, $fn) {
            $pdo  = hrm_get_pdo();
            $lock = 'hrm_store_' . $name;
            $st = $pdo->prepare('SELECT GET_LOCK(?, 5)');
            $st->execute(array($lock));
            if ((int) $st->fetchColumn() !== 1) {
                throw new HrmApiException(500, 'Penyimpanan sedang sibuk. Coba lagi.');
            }
            try {
                $pdo->beginTransaction();
                $before = HrmMysqlStore::load($sp);

                // ID berikutnya: lebih besar dari semua ID dan dari penghitung AUTO_INCREMENT.
                $next = 1;
                foreach ($before as $r) {
                    if ($r['id'] >= $next) {
                        $next = $r['id'] + 1;
                    }
                }
                $ai = $pdo->prepare('SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
                $ai->execute(array($sp['table']));
                $auto = (int) $ai->fetchColumn();
                if ($auto > $next) {
                    $next = $auto;
                }

                $doc = array('next_id' => $next, 'rows' => $before);
                $result = $fn($doc);
                HrmMysqlStore::persist($pdo, $sp, $before, $doc['rows']);
                $pdo->commit();
                return $result;
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw $e;
            } finally {
                $rel = $pdo->prepare('SELECT RELEASE_LOCK(?)');
                $rel->execute(array($lock));
            }
        });
    }

    private static function persist(PDO $pdo, array $sp, array $before, array $after)
    {
        $old = array();
        foreach ($before as $r) {
            $old[(int) $r['id']] = $r;
        }
        $new = array();
        foreach ($after as $r) {
            $new[(int) $r['id']] = $r;
        }

        foreach ($old as $id => $r) {
            if (!isset($new[$id])) {
                $pdo->prepare('DELETE FROM ' . $sp['table'] . ' WHERE id = ?')->execute(array($id));
            }
        }
        foreach ($new as $id => $r) {
            if (!isset($old[$id])) {
                $cols = array('id' => $id) + call_user_func($sp['to'], $r, $pdo, true);
                $sql = 'INSERT INTO ' . $sp['table'] . ' (' . implode(', ', array_keys($cols)) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')';
                $pdo->prepare($sql)->execute(array_values($cols));
            } elseif (self::norm($old[$id]) !== self::norm($r)) {
                $cols = call_user_func($sp['to'], $r, $pdo, false);
                foreach ($sp['no_update'] as $c) {
                    unset($cols[$c]);
                }
                if (!$cols) {
                    continue;
                }
                $sets = array();
                foreach ($cols as $c => $v) {
                    $sets[] = $c . ' = ?';
                }
                $pdo->prepare('UPDATE ' . $sp['table'] . ' SET ' . implode(', ', $sets) . ' WHERE id = ?')
                    ->execute(array_merge(array_values($cols), array($id)));
            }
        }
    }
}

/**
 * Pintu masuk yang dipakai semua endpoint (nama kelas dipertahankan agar endpoint tidak perlu diubah).
 * Mode "mock" -> file JSON sementara; mode "mysql" -> database MySQL.
 */
final class HrmMockStore
{
    public static function all($name)
    {
        return hrm_config()['mode'] === 'mysql' ? HrmMysqlStore::all($name) : HrmFileStore::all($name);
    }

    public static function transact($name, callable $fn)
    {
        return hrm_config()['mode'] === 'mysql' ? HrmMysqlStore::transact($name, $fn) : HrmFileStore::transact($name, $fn);
    }

    public static function insert(array &$doc, array $row)
    {
        return HrmFileStore::insert($doc, $row);
    }
}

hrm_bootstrap();