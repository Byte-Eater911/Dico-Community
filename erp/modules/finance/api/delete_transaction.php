<?php
require_once __DIR__ . '/_common.php'; fin_require_access(true); $d=fin_read_input();$id=(int)($d['id']??0);
if($id<1)fin_json(false,'ID transaksi tidak valid.',null,422);
$stmt=fin_stmt("DELETE FROM fin_transactions WHERE id=?","i",[$id]);$affected=mysqli_stmt_affected_rows($stmt);mysqli_stmt_close($stmt);
if(!$affected)fin_json(false,'Transaksi tidak ditemukan.',null,404);
fin_json(true,'Transaksi dan entri jurnalnya berhasil dihapus.');
