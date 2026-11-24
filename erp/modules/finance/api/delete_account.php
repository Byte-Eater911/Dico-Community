<?php
require_once __DIR__ . '/_common.php'; fin_require_access(true); $d=fin_read_input(); $id=(int)($d['id']??0);
if($id<1) fin_json(false,'ID akun tidak valid.',null,422);
$check=fin_stmt("SELECT COUNT(*) AS jumlah FROM fin_journal_entries WHERE account_id=?","i",[$id]);$row=mysqli_fetch_assoc(mysqli_stmt_get_result($check));mysqli_stmt_close($check);
if((int)$row['jumlah']>0) fin_json(false,'Akun tidak dapat dihapus karena sudah digunakan dalam jurnal.',null,409);
$stmt=fin_stmt("DELETE FROM fin_chart_of_accounts WHERE id=?","i",[$id]);$affected=mysqli_stmt_affected_rows($stmt);mysqli_stmt_close($stmt);
if(!$affected)fin_json(false,'Akun tidak ditemukan.',null,404);
fin_json(true,'Akun berhasil dihapus.');
