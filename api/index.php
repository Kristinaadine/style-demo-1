<?php
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=bra_running_style;charset=utf8mb4', 'bra_app', 'bra_app_local', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'Database XAMPP tidak dapat dihubungi.']);
    exit;
}

function scalarValue($value, $fallback = null) {
    if ($value === null || $value === '') return $fallback;
    return is_scalar($value) ? (string)$value : $fallback;
}

function buyerId(PDO $pdo, $name) {
    $name = trim((string)$name);
    if ($name === '') return null;
    $stmt = $pdo->prepare('INSERT INTO buyers (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)');
    $stmt->execute([$name]);
    $find = $pdo->prepare('SELECT id FROM buyers WHERE name = ?');
    $find->execute([$name]);
    return (int)$find->fetchColumn();
}

$action = $_GET['action'] ?? 'status';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $action === 'status') {
    $tables = ['buyers', 'styles', 'folders', 'files', 'import_batches'];
    $counts = [];
    foreach ($tables as $table) {
        $counts[$table] = (int)$pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
    }
    $state = $pdo->query('SELECT COUNT(*) FROM app_state')->fetchColumn();
    echo json_encode(['ok' => true, 'database' => 'bra_running_style', 'configured' => true, 'has_state' => (int)$state > 0, 'counts' => $counts], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'GET' && $action === 'relations') {
    $rows = $pdo->query("SELECT s.article_style, b.name AS buyer, s.brand, s.description, s.week, s.product_group, COUNT(DISTINCT f.id) AS folders, COUNT(DISTINCT ff.file_id) AS files FROM styles s LEFT JOIN buyers b ON b.id=s.buyer_id LEFT JOIN folders f ON f.style_id=s.article_style LEFT JOIN folder_files ff ON ff.folder_id=f.id GROUP BY s.article_style,b.name,s.brand,s.description,s.week,s.product_group ORDER BY s.article_style")->fetchAll();
    echo json_encode(['ok' => true, 'rows' => $rows], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'GET' && $action === 'state') {
    $row = $pdo->query('SELECT state_json, updated_at FROM app_state WHERE id = 1')->fetch();
    echo json_encode(['ok' => true, 'state' => $row ? json_decode($row['state_json'], true) : null, 'updated_at' => $row['updated_at'] ?? null], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST' && $action === 'state') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body) || !isset($body['version']) || !is_array($body['styles'])) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Format state aplikasi tidak valid.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $json = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare('INSERT INTO app_state (id, state_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)');
        $stmt->execute([$json]);

        $pdo->exec('DELETE FROM folder_files');
        $pdo->exec('DELETE FROM folders');
        $pdo->exec('DELETE FROM files');
        $pdo->exec('DELETE FROM styles');

        $buyerCache = [];
        $insertStyle = $pdo->prepare('INSERT INTO styles (article_style,buyer_id,brand,description,product_group,week,development_status,production_status,sample_status,mc_ratio,pic_pattern,pic_mdmkt,pic_ie,pic_prod,pic_qa,extra_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        foreach ($body['styles'] as $style) {
            $article = trim((string)($style['id'] ?? ''));
            if ($article === '') continue;
            $buyerName = scalarValue($style['buyer'] ?? null);
            $key = strtolower($buyerName ?: '');
            if ($buyerName !== null && !isset($buyerCache[$key])) $buyerCache[$key] = buyerId($pdo, $buyerName);
            $buyerId = $buyerName !== null ? ($buyerCache[$key] ?? null) : null;
            $pic = is_array($style['pic'] ?? null) ? $style['pic'] : [];
            $mc = isset($style['mc']) && is_numeric(str_replace(',', '.', (string)$style['mc'])) ? (float)str_replace(',', '.', (string)$style['mc']) : null;
            $insertStyle->execute([
                $article, $buyerId, scalarValue($style['brand'] ?? null), scalarValue($style['desc'] ?? null),
                scalarValue($style['group'] ?? null), scalarValue($style['week'] ?? null), scalarValue($style['dev'] ?? null),
                scalarValue($style['prod'] ?? null), scalarValue($style['sample'] ?? null), $mc,
                scalarValue($pic['pattern'] ?? null), scalarValue($pic['mdmkt'] ?? null), scalarValue($pic['ie'] ?? null),
                scalarValue($pic['prod'] ?? null), scalarValue($pic['qa'] ?? null), json_encode($style, JSON_UNESCAPED_UNICODE)
            ]);
        }

        $insertFolder = $pdo->prepare('INSERT INTO folders (style_id,name) VALUES (?,?)');
        $findFolder = $pdo->prepare('SELECT id FROM folders WHERE style_id=? AND name=?');
        foreach (($body['styleFolders'] ?? []) as $styleId => $names) {
            $articleExists = $pdo->prepare('SELECT 1 FROM styles WHERE article_style=?');
            $articleExists->execute([$styleId]);
            if (!$articleExists->fetchColumn()) continue;
            foreach ((array)$names as $name) {
                $name = trim((string)$name);
                if ($name === '') continue;
                try { $insertFolder->execute([$styleId, $name]); } catch (PDOException $error) {}
            }
        }

        $insertFile = $pdo->prepare('INSERT INTO files (id,style_id,name,original_name,mime_type,size_bytes,blob_id,file_type,extra_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        foreach (($body['workspaceFiles'] ?? []) as $file) {
            $fileId = scalarValue($file['id'] ?? null, '');
            if ($fileId === '') continue;
            $styleId = scalarValue($file['styleId'] ?? null);
            $insertFile->execute([
                $fileId, $styleId, scalarValue($file['name'] ?? null, 'Berkas tanpa nama'), scalarValue($file['name'] ?? null),
                scalarValue($file['type'] ?? null), isset($file['size']) ? (int)$file['size'] : 0, scalarValue($file['blobId'] ?? null),
                'workspace', json_encode($file, JSON_UNESCAPED_UNICODE), scalarValue($file['uploadedAt'] ?? null), scalarValue($file['uploadedAt'] ?? null)
            ]);
            foreach ((array)($file['folders'] ?? []) as $folderName) {
                $findFolder->execute([$styleId, trim((string)$folderName)]);
                $folderId = $findFolder->fetchColumn();
                if (!$folderId) continue;
                $link = $pdo->prepare('INSERT IGNORE INTO folder_files (folder_id,file_id) VALUES (?,?)');
                $link->execute([$folderId, $fileId]);
            }
        }
        foreach (($body['plannerFiles'] ?? []) as $file) {
            $fileId = scalarValue($file['id'] ?? null, '');
            if ($fileId === '') continue;
            $insertFile->execute([
                $fileId, null, scalarValue($file['name'] ?? null, 'Berkas Planner'), scalarValue($file['name'] ?? null),
                scalarValue($file['type'] ?? null), isset($file['size']) ? (int)$file['size'] : 0, scalarValue($file['blobId'] ?? null),
                'planner', json_encode($file, JSON_UNESCAPED_UNICODE), scalarValue($file['receivedAt'] ?? null), scalarValue($file['receivedAt'] ?? null)
            ]);
        }

        $insertBatch = $pdo->prepare('INSERT INTO import_batches (id,source_name,imported_by,rows_count,created_count,updated_count,skipped_count,created_at) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE source_name=VALUES(source_name),imported_by=VALUES(imported_by),rows_count=VALUES(rows_count),created_count=VALUES(created_count),updated_count=VALUES(updated_count),skipped_count=VALUES(skipped_count),created_at=VALUES(created_at)');
        foreach (($body['indexImports'] ?? []) as $batch) {
            $id = scalarValue($batch['id'] ?? null, '');
            if ($id === '') continue;
            $insertBatch->execute([$id, scalarValue($batch['fileName'] ?? $batch['source'] ?? null, ''), scalarValue($batch['by'] ?? $batch['importedBy'] ?? null, ''), isset($batch['rows']) ? (int)$batch['rows'] : 0, isset($batch['created']) ? (int)$batch['created'] : 0, isset($batch['updated']) ? (int)$batch['updated'] : 0, isset($batch['skipped']) ? (int)$batch['skipped'] : (isset($batch['excluded']) ? (int)$batch['excluded'] : 0), scalarValue($batch['at'] ?? null, date('Y-m-d H:i:s'))]);
        }

        $pdo->commit();
        echo json_encode(['ok' => true, 'message' => 'State dan relasi tersimpan ke XAMPP/MariaDB.', 'counts' => ['styles' => count($body['styles']), 'folders' => count($body['styleFolders'] ?? []), 'workspace_files' => count($body['workspaceFiles'] ?? []), 'planner_files' => count($body['plannerFiles'] ?? [])]], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Relasi database gagal disimpan: ' . $error->getMessage()]);
    }
    exit;
}

http_response_code(404);
echo json_encode(['ok' => false, 'message' => 'Aksi API tidak ditemukan.']);
