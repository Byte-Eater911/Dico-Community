<?php
require_once __DIR__ . '/_common.php'; fin_require_access(true); $d=fin_read_input();
$date=trim($d['tgl_transaksi']??'');$desc=trim($d['deskripsi']??'');$source=$d['sumber_modul']??'manual';
$debitAccount=(int)($d['debit_account_id']??0);$creditAccount=(int)($d['kredit_account_id']??0);
$debit=(float)($d['debit_nominal']??0);$credit=(float)($d['kredit_nominal']??0);
$sources=['manual','event','hrm_payroll','crm_invoice'];
$dt=DateTime::createFromFormat('!Y-m-d',$date);
if(!$dt||$dt->format('Y-m-d')!==$date||$desc===''||!in_array($source,$sources,true))fin_json(false,'Tanggal, deskripsi, atau sumber transaksi tidak valid.',null,422);
if($debitAccount<1||$creditAccount<1||$debitAccount===$creditAccount||$debit<=0||$credit<=0)fin_json(false,'Pilih dua akun berbeda dan nominal harus lebih dari nol.',null,422);
if(abs($debit-$credit)>0.009)fin_json(false,'Total debit dan kredit harus seimbang.',null,422);
$check=fin_stmt("SELECT COUNT(*) AS n FROM fin_chart_of_accounts WHERE id IN (?,?)","ii",[$debitAccount,$creditAccount]);$n=mysqli_fetch_assoc(mysqli_stmt_get_result($check))['n'];mysqli_stmt_close($check);
if((int)$n!==2)fin_json(false,'Akun debit atau kredit tidak ditemukan.',null,422);
global $koneksi;mysqli_begin_transaction($koneksi);
try{
 $code='FIN-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));
 $uid=(int)$_SESSION['user_id'];
 $stmt=fin_stmt("INSERT INTO fin_transactions(kode_transaksi,tgl_transaksi,deskripsi,sumber_modul,created_by) VALUES(?,?,?,?,?)","ssssi",[$code,$date,$desc,$source,$uid]);$tid=mysqli_insert_id($koneksi);mysqli_stmt_close($stmt);
 $stmt=fin_stmt("INSERT INTO fin_journal_entries(transaction_id,account_id,tipe,nominal) VALUES(?,?,'debit',?)","iid",[$tid,$debitAccount,$debit]);mysqli_stmt_close($stmt);
 $stmt=fin_stmt("INSERT INTO fin_journal_entries(transaction_id,account_id,tipe,nominal) VALUES(?,?,'kredit',?)","iid",[$tid,$creditAccount,$credit]);mysqli_stmt_close($stmt);
 mysqli_commit($koneksi);fin_json(true,'Transaksi berhasil ditambahkan',['id'=>$tid,'kode_transaksi'=>$code]);
}catch(Throwable $e){mysqli_rollback($koneksi);error_log('[FINANCE ADD TRANSACTION] '.$e->getMessage());fin_json(false,'Transaksi gagal disimpan. Tidak ada perubahan yang diterapkan.',null,500);}
