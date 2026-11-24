<?php
require_once __DIR__ . '/_common.php';
fin_require_access();

// 1. Total akun
$stmtAccounts = fin_stmt("SELECT COUNT(*) AS total FROM fin_chart_of_accounts");
$resAccounts = mysqli_stmt_get_result($stmtAccounts);
$rowAccounts = mysqli_fetch_assoc($resAccounts);
$totalAccounts = (int)($rowAccounts['total'] ?? 0);
mysqli_stmt_close($stmtAccounts);

// 2. Total Debit, Kredit, Pendapatan, Beban
$stmtJournal = fin_stmt("
  SELECT 
    SUM(CASE WHEN j.tipe='debit' THEN j.nominal ELSE 0 END) AS total_debit,
    SUM(CASE WHEN j.tipe='kredit' THEN j.nominal ELSE 0 END) AS total_kredit,
    SUM(CASE WHEN a.tipe='pendapatan' AND j.tipe='kredit' THEN j.nominal ELSE 0 END) AS total_pendapatan,
    SUM(CASE WHEN a.tipe='beban' AND j.tipe='debit' THEN j.nominal ELSE 0 END) AS total_beban
  FROM fin_journal_entries j
  JOIN fin_chart_of_accounts a ON a.id = j.account_id
");
$resJournal = mysqli_stmt_get_result($stmtJournal);
$rowJournal = mysqli_fetch_assoc($resJournal);
$totalDebit = (float)($rowJournal['total_debit'] ?? 0);
$totalCredit = (float)($rowJournal['total_kredit'] ?? 0);
$totalPendapatan = (float)($rowJournal['total_pendapatan'] ?? 0);
$totalBeban = (float)($rowJournal['total_beban'] ?? 0);
$netProfit = $totalPendapatan - $totalBeban;
mysqli_stmt_close($stmtJournal);

// 3. Total transaksi
$stmtTx = fin_stmt("SELECT COUNT(*) AS total FROM fin_transactions");
$resTx = mysqli_stmt_get_result($stmtTx);
$rowTx = mysqli_fetch_assoc($resTx);
$totalTransactions = (int)($rowTx['total'] ?? 0);
mysqli_stmt_close($stmtTx);

// 4. Transaksi by sumber modul
$stmtSource = fin_stmt("
  SELECT sumber_modul, COUNT(*) AS count
  FROM fin_transactions
  GROUP BY sumber_modul
  ORDER BY count DESC
");
$resSource = mysqli_stmt_get_result($stmtSource);
$txBySource = [];
while ($row = mysqli_fetch_assoc($resSource)) {
  $txBySource[] = [
    'sumber_modul' => $row['sumber_modul'],
    'count' => (int)$row['count']
  ];
}
mysqli_stmt_close($stmtSource);

// 5. Akun by tipe
$stmtType = fin_stmt("
  SELECT tipe, COUNT(*) AS count 
  FROM fin_chart_of_accounts 
  GROUP BY tipe 
  ORDER BY count DESC
");
$resType = mysqli_stmt_get_result($stmtType);
$accountsByType = [];
while ($row = mysqli_fetch_assoc($resType)) {
  $accountsByType[] = [
    'tipe' => $row['tipe'],
    'count' => (int)$row['count']
  ];
}
mysqli_stmt_close($stmtType);

// 6. Transaksi terbaru (5 data terakhir)
$stmtRecent = fin_stmt("
  SELECT t.id, t.kode_transaksi, t.tgl_transaksi, t.deskripsi, t.sumber_modul,
    COALESCE((SELECT SUM(nominal) FROM fin_journal_entries WHERE transaction_id=t.id AND tipe='debit'), 0) AS nominal
  FROM fin_transactions t
  ORDER BY t.tgl_transaksi DESC, t.id DESC
  LIMIT 5
");
$resRecent = mysqli_stmt_get_result($stmtRecent);
$recentTransactions = [];
while ($row = mysqli_fetch_assoc($resRecent)) {
  $recentTransactions[] = [
    'id' => (int)$row['id'],
    'kode_transaksi' => $row['kode_transaksi'],
    'tgl_transaksi' => $row['tgl_transaksi'],
    'deskripsi' => $row['deskripsi'],
    'sumber_modul' => $row['sumber_modul'],
    'nominal' => (float)$row['nominal']
  ];
}
mysqli_stmt_close($stmtRecent);

fin_json(true, 'Dashboard keuangan lengkap berhasil dimuat', [
  'summary' => [
    'total_accounts' => $totalAccounts,
    'total_debit' => $totalDebit,
    'total_credit' => $totalCredit,
    'total_pendapatan' => $totalPendapatan,
    'total_beban' => $totalBeban,
    'net_profit' => $netProfit,
    'total_transactions' => $totalTransactions
  ],
  'transactions_by_source' => $txBySource,
  'accounts_by_type' => $accountsByType,
  'recent_transactions' => $recentTransactions,
  'generated_at' => date('Y-m-d H:i:s')
]);
