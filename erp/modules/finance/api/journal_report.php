<?php
require_once __DIR__ . '/_common.php'; fin_require_access();
$sql="SELECT t.tgl_transaksi,t.kode_transaksi,t.deskripsi,a.kode_akun,a.nama_akun,j.tipe,j.nominal
 FROM fin_journal_entries j JOIN fin_transactions t ON t.id=j.transaction_id
 JOIN fin_chart_of_accounts a ON a.id=j.account_id
 ORDER BY t.tgl_transaksi DESC,t.id DESC,j.id ASC";
$stmt=fin_stmt($sql);$res=mysqli_stmt_get_result($stmt);$entries=[];$debit=0;$credit=0;
while($r=mysqli_fetch_assoc($res)){if($r['tipe']==='debit')$debit+=(float)$r['nominal'];else$credit+=(float)$r['nominal'];$entries[]=$r;}
mysqli_stmt_close($stmt);
fin_json(true,'Laporan jurnal berhasil dimuat',['entries'=>$entries,'total_debit'=>$debit,'total_kredit'=>$credit]);
