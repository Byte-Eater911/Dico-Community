<?php
require_once __DIR__ . '/_common.php'; fin_require_access();
$sql="SELECT t.id,t.kode_transaksi,t.tgl_transaksi,t.deskripsi,t.sumber_modul,
 COALESCE(SUM(CASE WHEN j.tipe='debit' THEN j.nominal ELSE 0 END),0) AS total_debit,
 COALESCE(SUM(CASE WHEN j.tipe='kredit' THEN j.nominal ELSE 0 END),0) AS total_kredit
 FROM fin_transactions t LEFT JOIN fin_journal_entries j ON j.transaction_id=t.id
 GROUP BY t.id,t.kode_transaksi,t.tgl_transaksi,t.deskripsi,t.sumber_modul ORDER BY t.tgl_transaksi DESC,t.id DESC";
$stmt=fin_stmt($sql);$res=mysqli_stmt_get_result($stmt);$rows=[];
while($r=mysqli_fetch_assoc($res))$rows[]=$r;
mysqli_stmt_close($stmt);fin_json(true,'Data transaksi berhasil dimuat',['transactions'=>$rows]);
