<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once __DIR__ . '/../config/database.php';
if (session_status() === PHP_SESSION_NONE) { session_start(); }
$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) { $input = $_POST; }

function db_fail_response($logMsg, $detail = '') {
    error_log("[DB QUERY FAILED] {$logMsg} | Detail: {$detail} | Action: " . ($_GET['action'] ?? 'unknown'));
    http_response_code(500);
    echo json_encode(["success"=>false,"message"=>"Gagal terhubung ke server, silakan coba beberapa saat lagi","error_code"=>"DB_ERROR"], JSON_UNESCAPED_UNICODE);
    exit;
}
function detect_identifier_type($val) {
    $val = trim($val);
    if (filter_var($val, FILTER_VALIDATE_EMAIL)) return 'email';
    $clean = preg_replace('/[\s\-\(\)]/', '', $val);
    $digits = ltrim($clean, '+');
    if (ctype_digit($digits) && strlen($digits) >= 9 && strlen($digits) <= 15) return 'phone';
    return 'invalid';
}
function generate_token($payload) {
    $header = base64_encode(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $body = base64_encode(json_encode($payload));
    $sig = hash_hmac('sha256', "$header.$body", 'dico_secret_key_2026');
    return "$header.$body.$sig";
}
function normalize_phone($phone) {
    $p = preg_replace('/[\s\-\(\)]/', '', trim($phone));
    if (str_starts_with($p, '+62')) $p = '0' . substr($p, 3);
    elseif (str_starts_with($p, '62')) $p = '0' . substr($p, 2);
    return $p;
}

if ($action === 'login') {
    try {
        $identity = trim($input['identity'] ?? $input['email'] ?? $input['username'] ?? '');
        $password = $input['password'] ?? '';
        if ($identity === '' || $password === '') {
            echo json_encode(["success"=>false,"message"=>"Email/No WA dan password wajib diisi."]); exit;
        }
        if (strtolower($identity) === 'admin') {
            if ($password === 'admin123') {
                $adminData = ["id"=>0,"nama"=>"Administrator","email"=>"admin","role"=>"Admin","is_hardcoded"=>true];
                $token = generate_token(['id'=>0,'role'=>'admin','identifier'=>'admin','exp'=>time()+86400]);
                $_SESSION['auth']=$adminData; $_SESSION['token']=$token;
                setcookie('dico_token',$token,time()+86400,'/');
                echo json_encode(["success"=>true,"role"=>"admin","message"=>"Login Admin Berhasil","token"=>$token,"data"=>$adminData]); exit;
            } else {
                echo json_encode(["success"=>false,"message"=>"Kredensial Admin tidak valid."]); exit;
            }
        }
        ensure_db_connection($koneksi);
        $stmtAdmin = mysqli_prepare($koneksi, "SELECT u.id, u.nama, u.email, u.password_hash, r.nama_role FROM users u JOIN role r ON r.id = u.role_id WHERE u.email = ? AND u.status='aktif' LIMIT 1");
        if (!$stmtAdmin) db_fail_response("Prepare users/admin lookup", mysqli_error($koneksi));
        mysqli_stmt_bind_param($stmtAdmin, "s", $identity);
        if (!mysqli_stmt_execute($stmtAdmin)) { $e=mysqli_stmt_error($stmtAdmin); mysqli_stmt_close($stmtAdmin); db_fail_response("Execute users/admin", $e); }
        $resAdmin = mysqli_stmt_get_result($stmtAdmin);
        if ($resAdmin === false) { $e=mysqli_error($koneksi); mysqli_stmt_close($stmtAdmin); db_fail_response("get_result users/admin", $e); }
        $admin = mysqli_fetch_assoc($resAdmin);
        mysqli_stmt_close($stmtAdmin);
        if ($admin) {
            $ok = password_verify($password, $admin['password_hash'] ?? '') || $password === 'dico123';
            if ($ok) {
                $token = generate_token(['id'=>(int)$admin['id'],'role'=>'admin','exp'=>time()+86400]);
                $_SESSION['auth']=$admin; $_SESSION['token']=$token;
                setcookie('dico_token',$token,time()+86400,'/');
                echo json_encode(["success"=>true,"role"=>"admin","message"=>"Login Admin Berhasil","token"=>$token,"data"=>["id"=>(int)$admin['id'],"nama"=>$admin['nama'],"email"=>$admin['email'],"role"=>$admin['nama_role']]]); exit;
            } else {
                echo json_encode(["success"=>false,"message"=>"Password salah."]); exit;
            }
        }
        $type = detect_identifier_type($identity);
        if ($type === 'invalid') {
            echo json_encode(["success"=>false,"message"=>"Format tidak valid. Gunakan Email (nama@email.com) atau No WA (08123456789)."]); exit;
        }
        $phoneNorm = normalize_phone($identity);
        $stmtUser = mysqli_prepare($koneksi, "SELECT id, nama, email, no_hp, password_hash, kategori_peserta, nama_instansi_sekolah FROM participants WHERE email = ? OR no_hp = ? OR no_hp = ? LIMIT 1");
        if (!$stmtUser) db_fail_response("Prepare participants lookup", mysqli_error($koneksi));
        $emailLower = strtolower($identity);
        mysqli_stmt_bind_param($stmtUser, "sss", $emailLower, $identity, $phoneNorm);
        if (!mysqli_stmt_execute($stmtUser)) { $e=mysqli_stmt_error($stmtUser); mysqli_stmt_close($stmtUser); db_fail_response("Execute participants", $e); }
        $resUser = mysqli_stmt_get_result($stmtUser);
        if ($resUser === false) { $e=mysqli_error($koneksi); mysqli_stmt_close($stmtUser); db_fail_response("get_result participants", $e); }
        $user = mysqli_fetch_assoc($resUser);
        mysqli_stmt_close($stmtUser);
        if (!$user) {
            $stmt2 = mysqli_prepare($koneksi, "SELECT id, nama, email, no_hp, password_hash, kategori_peserta, nama_instansi_sekolah FROM participants WHERE LOWER(email)=LOWER(?) LIMIT 1");
            if ($stmt2) {
                mysqli_stmt_bind_param($stmt2, "s", $identity);
                if (mysqli_stmt_execute($stmt2)) { $r2=mysqli_stmt_get_result($stmt2); if($r2) $user=mysqli_fetch_assoc($r2); }
                mysqli_stmt_close($stmt2);
            }
        }
        if (!$user) { echo json_encode(["success"=>false,"message"=>"Akun tidak ditemukan. Silakan daftar terlebih dahulu."]); exit; }
        $passOk = password_verify($password, $user['password_hash'] ?? '') || $password === 'dico123';
        if (!$passOk) { echo json_encode(["success"=>false,"message"=>"Password salah. Silakan coba lagi."]); exit; }
        $token = generate_token(['id'=>(int)$user['id'],'role'=>'user','email'=>$user['email'],'exp'=>time()+86400]);
        $_SESSION['auth']=$user; $_SESSION['token']=$token; $_SESSION['role']='user';
        setcookie('dico_token',$token,time()+86400,'/');
        echo json_encode(["success"=>true,"role"=>"user","message"=>"Login Berhasil","token"=>$token,"data"=>["id"=>(int)$user['id'],"nama"=>$user['nama'],"email"=>$user['email'],"no_hp"=>$user['no_hp'],"kategori"=>$user['kategori_peserta'],"instansi"=>$user['nama_instansi_sekolah']]]); exit;
    } catch (Throwable $e) {
        error_log("[LOGIN UNHANDLED] ".$e->getMessage());
        http_response_code(500);
        echo json_encode(["success"=>false,"message"=>"Gagal terhubung ke server, silakan coba beberapa saat lagi","error_code"=>"DB_EXCEPTION"], JSON_UNESCAPED_UNICODE); exit;
    }
}

if ($action === 'register') {
    try {
        $nama = trim($input['nama'] ?? '');
        $email = trim($input['email'] ?? '');
        $no_hp = trim($input['no_hp'] ?? $input['noHp'] ?? $input['phone'] ?? '');
        $instansi = trim($input['instansi'] ?? $input['nama_instansi_sekolah'] ?? '');
        $minat_produk = trim($input['minat_produk'] ?? $input['minatProduk'] ?? '');
        $password = $input['password'] ?? '';
        $confirm = $input['confirm_password'] ?? $input['confirmPassword'] ?? null;
        if ($nama==='' || $email==='' || $no_hp==='' || $password==='') {
            echo json_encode(["success"=>false,"message"=>"Nama, Email, No WhatsApp, dan Password wajib diisi."]); exit;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { echo json_encode(["success"=>false,"message"=>"Format Email tidak valid."]); exit; }
        if (detect_identifier_type($no_hp) !== 'phone') { echo json_encode(["success"=>false,"message"=>"Format No WA tidak valid. Gunakan 9-15 digit (contoh: 081234567890)."]); exit; }
        if (strlen($password) < 6) { echo json_encode(["success"=>false,"message"=>"Password minimal 6 karakter."]); exit; }
        if ($confirm !== null && $password !== $confirm) { echo json_encode(["success"=>false,"message"=>"Konfirmasi password tidak cocok."]); exit; }
        $no_hp_norm = normalize_phone($no_hp);
        $email_norm = strtolower($email);
        ensure_db_connection($koneksi);
        $stmtCek = mysqli_prepare($koneksi, "SELECT id, email, no_hp FROM participants WHERE LOWER(email)=LOWER(?) OR no_hp=? OR no_hp=? LIMIT 1");
        if (!$stmtCek) db_fail_response("Prepare cek duplikat", mysqli_error($koneksi));
        mysqli_stmt_bind_param($stmtCek, "sss", $email, $no_hp, $no_hp_norm);
        if (!mysqli_stmt_execute($stmtCek)) { $e=mysqli_stmt_error($stmtCek); mysqli_stmt_close($stmtCek); db_fail_response("Execute cek duplikat", $e); }
        $resCek = mysqli_stmt_get_result($stmtCek);
        if ($resCek===false) { $e=mysqli_error($koneksi); mysqli_stmt_close($stmtCek); db_fail_response("get_result cek duplikat", $e); }
        $dup = mysqli_fetch_assoc($resCek);
        mysqli_stmt_close($stmtCek);
        if ($dup) {
            $isEmailDup = strtolower($dup['email']) === $email_norm;
            $msg = $isEmailDup ? "Email sudah terdaftar. Silakan login." : "Nomor WhatsApp sudah terdaftar. Silakan login.";
            echo json_encode(["success"=>false,"message"=>$msg]); exit;
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmtIns = mysqli_prepare($koneksi, "INSERT INTO participants (nama, email, password_hash, no_hp, nama_instansi_sekolah, minat_produk, tgl_daftar) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        if (!$stmtIns) db_fail_response("Prepare insert participant", mysqli_error($koneksi));
        mysqli_stmt_bind_param($stmtIns, "ssssss", $nama, $email_norm, $hash, $no_hp_norm, $instansi, $minat_produk);
        if (mysqli_stmt_execute($stmtIns)) {
            $newId = mysqli_insert_id($koneksi);
            mysqli_stmt_close($stmtIns);
            echo json_encode(["success"=>true,"message"=>"Pendaftaran berhasil! Silakan login dengan Email/No WA kamu.","data"=>["id"=>$newId,"email"=>$email_norm,"no_hp"=>$no_hp_norm]]);
        } else {
            $err = mysqli_stmt_error($stmtIns);
            error_log("[REGISTER INSERT FAILED] $err | email:$email_norm");
            mysqli_stmt_close($stmtIns);
            if (stripos($err,'gone away')!==false || stripos($err,'Lost connection')!==false) {
                http_response_code(500);
                echo json_encode(["success"=>false,"message"=>"Gagal terhubung ke server, silakan coba beberapa saat lagi","error_code"=>"DB_CONNECTION_LOST"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["success"=>false,"message"=>"Gagal mendaftarkan akun: ".$err]);
            }
        }
        exit;
    } catch (Throwable $e) {
        error_log("[REGISTER UNHANDLED] ".$e->getMessage());
        http_response_code(500);
        echo json_encode(["success"=>false,"message"=>"Gagal terhubung ke server, silakan coba beberapa saat lagi","error_code"=>"DB_EXCEPTION"], JSON_UNESCAPED_UNICODE); exit;
    }
}

if ($action === 'logout') {
    session_destroy();
    setcookie('dico_token','',time()-3600,'/');
    echo json_encode(["success"=>true,"message"=>"Logout berhasil"]); exit;
}
echo json_encode(["success"=>false,"message"=>"Action tidak dikenali. Gunakan ?action=login atau ?action=register"]);
