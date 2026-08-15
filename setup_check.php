<?php
/**
 * SandS CamGuard - Deployment Checker (TEMPORARY DEBUG TOOL)
 *
 * Open once in your browser:  https://remote.sandslab.com/webcam/setup_check.php
 * Shows which PIN source config.php can find - WITHOUT revealing the PIN.
 *
 * !!! DELETE this file from the server once the site is working. !!!
 */

header('Content-Type: text/plain; charset=utf-8');

echo "SandS CamGuard Setup Check\n";
echo str_repeat('=', 44) . "\n\n";

echo 'PHP version        : ' . PHP_VERSION . "\n";
echo 'PHP SAPI           : ' . PHP_SAPI . "\n";
echo 'Script location    : ' . __DIR__ . "\n\n";

echo "PIN SOURCES (values hidden):\n";
$sources = [
    'getenv("CAMGUARD_PIN")'      => getenv('CAMGUARD_PIN'),
    '$_ENV["CAMGUARD_PIN"]'       => $_ENV['CAMGUARD_PIN'] ?? null,
    '$_SERVER["CAMGUARD_PIN"]'    => $_SERVER['CAMGUARD_PIN'] ?? null,
];
foreach ($sources as $label => $value) {
    $found = (is_string($value) && trim($value) !== '');
    echo sprintf("  %-28s : %s\n", $label, $found ? 'FOUND' : 'not set');
}

$pinFile = __DIR__ . '/data/pin.php';
echo "\ndata/pin.php file:\n";
if (is_file($pinFile)) {
    echo '  exists   : yes' . "\n";
    echo '  readable : ' . (is_readable($pinFile) ? 'yes' : 'NO!') . "\n";
    $size = filesize($pinFile);
    echo '  size     : ' . $size . " bytes\n";
    if ($size > 0) {
        $head = @file_get_contents($pinFile, false, null, 0, 6);
        echo '  first 6  : ' . var_export($head, true) . '  ' .
            ($head === '<?php' ? '(OK)' : '(WARNING - must start with <?php, no BOM/spaces)') . "\n";
    } else {
        echo '  WARNING  : file is EMPTY' . "\n";
    }
} else {
    echo '  exists   : NO - create it (copy data/pin.php.example)' . "\n";
}

echo "\ndata/ directory   : writable = " . (is_writable(__DIR__ . '/data') ? 'yes' : 'NO - check permissions') . "\n";
echo 'data/.htaccess   : ' . (is_file(__DIR__ . '/data/.htaccess') ? 'present (blocks direct web access)' : 'MISSING - upload it') . "\n";

echo "\nDONE. Remember to delete setup_check.php from the server after setup.\n";