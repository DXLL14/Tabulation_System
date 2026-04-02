<?php $r=__DIR__;$l=$r.'/../license_manager.php';if(!file_exists($l))die('ERR');require_once $l;$x=new LicenseManager();$v=$x->validateLicense();if(!$v['valid'])die(json_encode(['error'=>true,'msg'=>$v['error'],'c'=>$v['code']]));$host='localhost';$dbname='tabdb';$username='root';$password='root';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// MySQLi connection (for scripts that need it)
$mysqli = new mysqli($host, $username, $password, $dbname);
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}
?>