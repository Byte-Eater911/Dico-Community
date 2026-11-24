<?php
require_once __DIR__ . '/_common.php';
fin_require_access();

/*
 * Saldo normal akun aset = total debit - total kredit.
 * LEFT JOIN memastikan akun tetap muncul walaupun belum memiliki transaksi.
 */
$sql = "SELECT
            a.id,
            a.kode_akun,
            a.nama_akun,
            a.tipe,
            CASE
                WHEN a.tipe = 'aset' THEN
                    COALESCE(SUM(
                        CASE
                            WHEN j.tipe = 'debit' THEN j.nominal
                            WHEN j.tipe = 'kredit' THEN -j.nominal
                            ELSE 0
                        END
                    ), 0)
                ELSE 0
            END AS saldo
        FROM fin_chart_of_accounts a
        LEFT JOIN fin_journal_entries j ON j.account_id = a.id
        GROUP BY a.id, a.kode_akun, a.nama_akun, a.tipe
        ORDER BY a.kode_akun";

$stmt = fin_stmt($sql);
$res = mysqli_stmt_get_result($stmt);
$accounts = [];
while ($row = mysqli_fetch_assoc($res)) {
    $row['saldo'] = (float) $row['saldo'];
    $accounts[] = $row;
}
mysqli_stmt_close($stmt);

fin_json(true, 'Data akun dan saldo berhasil dimuat', ['accounts' => $accounts]);
