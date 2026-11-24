<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';

$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        echo json_encode(['success' => false, 'message' => 'Email dan password wajib diisi']);
        exit;
    }

    if (!$koneksi) {
        echo json_encode(['success' => false, 'message' => 'Koneksi database gagal']);
        exit;
    }

    $sql = "SELECT u.id, u.role_id, u.nama, u.email, u.password_hash, r.nama_role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ? AND u.status = 'aktif' 
            LIMIT 1";
    $stmt = mysqli_prepare($koneksi, $sql);
    mysqli_stmt_bind_param($stmt, "s", $email);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role_id'] = $user['role_id'];
        $_SESSION['role_name'] = $user['nama_role'];
        $_SESSION['nama'] = $user['nama'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['is_staff'] = true;

        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil',
            'is_staff' => true,
            'redirect' => '../erp/#dashboard',
            'user' => [
                'id' => $user['id'],
                'nama' => $user['nama'],
                'email' => $user['email'],
                'role_name' => $user['nama_role']
            ]
        ]);
        exit;
    }

    $sql2 = "SELECT id, nama, email, no_hp, password_hash FROM crm_customers WHERE email = ? LIMIT 1";
    $stmt2 = mysqli_prepare($koneksi, $sql2);
    mysqli_stmt_bind_param($stmt2, "s", $email);
    mysqli_stmt_execute($stmt2);
    $result2 = mysqli_stmt_get_result($stmt2);
    $customer = mysqli_fetch_assoc($result2);
    mysqli_stmt_close($stmt2);

    if ($customer && password_verify($password, $customer['password_hash'])) {
        $_SESSION['customer_id'] = $customer['id'];
        $_SESSION['nama'] = $customer['nama'];
        $_SESSION['email'] = $customer['email'];
        $_SESSION['no_hp'] = $customer['no_hp'];
        $_SESSION['is_staff'] = false;

        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil',
            'is_staff' => false,
            'redirect' => 'index.html',
            'user' => [
                'id' => $customer['id'],
                'nama' => $customer['nama'],
                'email' => $customer['email']
            ]
        ]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
    exit;
}

if ($action === 'register') {
    $nama = trim($_POST['nama'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $wa = trim($_POST['wa'] ?? '');
    $instansi = trim($_POST['instansi'] ?? '');
    $minat_produk = trim($_POST['minat_produk'] ?? '');
    $password = $_POST['password'] ?? '';
    $password2 = $_POST['password2'] ?? '';

    if ($nama === '' || $email === '' || $wa === '' || $password === '') {
        echo json_encode(['success' => false, 'message' => 'Semua field wajib diisi']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Format email tidak valid']);
        exit;
    }

    if (strlen($password) < 8) {
        echo json_encode(['success' => false, 'message' => 'Password minimal 8 karakter']);
        exit;
    }

    if ($password !== $password2) {
        echo json_encode(['success' => false, 'message' => 'Password tidak sama']);
        exit;
    }

    $cek1 = mysqli_prepare($koneksi, "SELECT id FROM users WHERE email = ? LIMIT 1");
    mysqli_stmt_bind_param($cek1, 's', $email);
    mysqli_stmt_execute($cek1);
    $r1 = mysqli_stmt_get_result($cek1);
    $cek2 = mysqli_prepare($koneksi, "SELECT id FROM crm_customers WHERE email = ? LIMIT 1");
    mysqli_stmt_bind_param($cek2, 's', $email);
    mysqli_stmt_execute($cek2);
    $r2 = mysqli_stmt_get_result($cek2);

    if (mysqli_fetch_assoc($r1) || mysqli_fetch_assoc($r2)) {
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar']);
        exit;
    }
    mysqli_stmt_close($cek1);
    mysqli_stmt_close($cek2);

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $sql = "INSERT INTO crm_customers (nama, email, no_hp, instansi, minat_produk, password_hash, tipe, status_prospek) VALUES (?, ?, ?, ?, ?, ?, 'lead', 'cold')";
    $stmt = mysqli_prepare($koneksi, $sql);
    mysqli_stmt_bind_param($stmt, 'ssssss', $nama, $email, $wa, $instansi, $minat_produk, $hash);

    if (mysqli_stmt_execute($stmt)) {
        $newId = mysqli_insert_id($koneksi);

        $_SESSION['customer_id'] = $newId;
        $_SESSION['nama'] = $nama;
        $_SESSION['email'] = $email;
        $_SESSION['no_hp'] = $wa;
        $_SESSION['is_staff'] = false;

        echo json_encode([
            'success' => true,
            'message' => 'Akun berhasil dibuat',
            'is_staff' => false,
            'redirect' => 'index.html',
            'user' => ['id' => $newId, 'nama' => $nama, 'email' => $email]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal membuat akun: ' . mysqli_error($koneksi)]);
    }
    mysqli_stmt_close($stmt);
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logout berhasil', 'redirect' => '../web/login.html']);
    exit;
}

if ($action === 'me') {
    if (isset($_SESSION['is_staff']) && $_SESSION['is_staff']) {
        echo json_encode([
            'success' => true,
            'is_staff' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'nama' => $_SESSION['nama'],
                'email' => $_SESSION['email'],
                'role_name' => $_SESSION['role_name']
            ]
        ]);
    } elseif (isset($_SESSION['customer_id'])) {
        echo json_encode([
            'success' => true,
            'is_staff' => false,
            'user' => [
                'id' => $_SESSION['customer_id'],
                'nama' => $_SESSION['nama'],
                'email' => $_SESSION['email']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Belum login']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Action tidak valid']);
