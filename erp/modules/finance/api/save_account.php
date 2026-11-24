<?php
require_once __DIR__ . '/_common.php'; fin_require_access(true); $d=fin_read_input();
$id=(int)($d['id']??0); $code=trim($d['kode_akun']??''); $name=trim($d['nama_akun']??''); $type=$d['tipe']??'';
$valid=['aset','liabilitas','ekuitas','pendapatan','beban'];
if($code===''||$name===''||!in_array($type,$valid,true)) fin_json(false,'Kode, nama, dan tipe akun wajib diisi.',null,422);
if($id>0){
 $stmt=fin_stmt("UPDATE fin_chart_of_accounts SET kode_akun=?,nama_akun=?,tipe=? WHERE id=?","sssi",[$code,$name,$type,$id]);
 if(mysqli_stmt_affected_rows($stmt)===0){$check=fin_stmt("SELECT id FROM fin_chart_of_accounts WHERE id=?","i",[$id]);$exists=mysqli_stmt_get_result($check);$found=mysqli_fetch_assoc($exists);mysqli_stmt_close($check);if(!$found){mysqli_stmt_close($stmt);fin_json(false,'Akun tidak ditemukan.',null,404);}}
 mysqli_stmt_close($stmt); fin_json(true,'Akun berhasil diperbarui.');
}else{
 $stmt=fin_stmt("INSERT INTO fin_chart_of_accounts(kode_akun,nama_akun,tipe) VALUES(?,?,?)","sss",[$code,$name,$type]);$newId=mysqli_insert_id($koneksi);mysqli_stmt_close($stmt);fin_json(true,'Akun berhasil ditambahkan',['id'=>$newId]);
}
