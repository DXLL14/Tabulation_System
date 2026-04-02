<?php
class IntegrityChecker {
    private $checksumFile;
    private $baseDir;
    private $criticalFiles = [
        'license_manager.php',
        'check_license.php',
        'db/database.php',
        'login.php',
        'logout.php',
        'adminpanel/indexmain.php',
        'judgepanel/judge.php'
    ];
    
    public function __construct() {
        $this->baseDir = __DIR__;
        $this->checksumFile = $this->baseDir . '/.integrity_check';
    }
    
    public function generateChecksums() {
        $checksums = [];
        
        foreach ($this->criticalFiles as $file) {
            $path = $this->baseDir . '/' . $file;
            if (file_exists($path)) {
                $checksums[$file] = hash_file('sha256', $path);
            }
        }
        
        $data = json_encode($checksums, JSON_PRETTY_PRINT);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', hash('sha256', 'IntegrityCheck_' . getenv('COMPUTERNAME')), 0, substr(hash('sha256', 'IV_CHECK'), 0, 16));
        file_put_contents($this->checksumFile, base64_encode($encrypted));
        chmod($this->checksumFile, 0600);
        
        return true;
    }
    
    public function verifyIntegrity() {
        if (!file_exists($this->checksumFile)) {
            return ['valid' => false, 'error' => 'Integrity file missing', 'code' => 'INTEGRITY_FILE_MISSING'];
        }
        
        $encryptedData = file_get_contents($this->checksumFile);
        $decrypted = @openssl_decrypt(base64_decode($encryptedData), 'AES-256-CBC', hash('sha256', 'IntegrityCheck_' . getenv('COMPUTERNAME')), 0, substr(hash('sha256', 'IV_CHECK'), 0, 16));
        
        if (!$decrypted) {
            return ['valid' => false, 'error' => 'Integrity verification failed', 'code' => 'INTEGRITY_DECRYPT_FAILED'];
        }
        
        $storedChecksums = json_decode($decrypted, true);
        
        foreach ($this->criticalFiles as $file) {
            $path = $this->baseDir . '/' . $file;
            if (file_exists($path)) {
                $currentChecksum = hash_file('sha256', $path);
                if (!isset($storedChecksums[$file]) || $storedChecksums[$file] !== $currentChecksum) {
                    error_log("[INTEGRITY_VIOLATION] File modified: $file at " . date('Y-m-d H:i:s'));
                    return ['valid' => false, 'error' => 'Critical files have been tampered with', 'code' => 'FILES_TAMPERED'];
                }
            }
        }
        
        return ['valid' => true, 'message' => 'Files verified'];
    }
}

if (php_sapi_name() === 'cli' && isset($argv[1]) && $argv[1] === '--generate-checksums') {
    $checker = new IntegrityChecker();
    $checker->generateChecksums();
    echo "✅ File integrity checksums generated\n";
    exit(0);
}
?>
