<?php
class LicenseManager {
    private $licenseFile;
    private $licenseHashFile;
    private $encMethod = 'AES-256-CBC';
    
    public function __construct() {
        $baseDir = __DIR__;
        $this->licenseFile = $baseDir . '/license.key';
        $this->licenseHashFile = $baseDir . '/.license_hash';
    }
    
    private function getSecretKey() {
        return hash('sha256', 'PhilCST_TabSystem_' . hash('sha256', 'RendellGerman_JohnRickPoral'));
    }
    
    private function getIV() {
        return substr(hash('sha256', $this->getSecretKey()), 0, 16);
    }
    
    public function getMacAddress() {
        $mac = '';
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $output = shell_exec('getmac /fo list /v');
            if (preg_match('/Physical Address.*?:\s+([0-9A-F-]+)/i', $output, $matches)) {
                $mac = strtoupper($matches[1]);
            }
        } else {
            $output = shell_exec('ifconfig 2>/dev/null | grep -o "HWaddr .*" | head -1');
            if (preg_match('/HWaddr\s+([0-9A-F:]+)/i', $output, $matches)) {
                $mac = strtoupper($matches[1]);
            }
        }
        return $mac ?: 'UNKNOWN';
    }
    
    public function getHardwareId() {
        return hash('sha256', $this->getMacAddress());
    }
    
    private function jsonEncode($data) {
        return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    
    public function generateLicense() {
        $hwId = $this->getHardwareId();
        $timestamp = date('Y-m-d H:i:s');
        
        $licenseData = [
            'generated' => $timestamp,
            'hardware_id' => $hwId,
            'owner' => 'Rendell German & John Rick Poral',
            'system' => 'PhilCST Tabulation System',
            'expires' => date('Y-m-d', strtotime('+1 year'))
        ];
        
        $jsonData = $this->jsonEncode($licenseData);
        $signature = hash_hmac('sha256', $jsonData, $this->getSecretKey());
        
        $license = [
            'data' => $licenseData,
            'signature' => $signature
        ];
        
        $jsonLicense = $this->jsonEncode($license);
        $encrypted = openssl_encrypt($jsonLicense, $this->encMethod, $this->getSecretKey(), 0, $this->getIV());
        return base64_encode($encrypted);
    }
    
    public function saveLicense($licenseContent) {
        if (file_put_contents($this->licenseFile, $licenseContent)) {
            $hash = hash_file('sha256', $this->licenseFile);
            file_put_contents($this->licenseHashFile, $hash);
            return true;
        }
        return false;
    }
    
    public function validateLicense() {
        if (!file_exists($this->licenseFile)) {
            return ['valid' => false, 'error' => 'License file not found', 'code' => 'LICENSE_MISSING'];
        }
        
        if (!$this->checkIntegrity()) {
            return ['valid' => false, 'error' => 'License tampered', 'code' => 'LICENSE_TAMPERED'];
        }
        
        $licenseJson = file_get_contents($this->licenseFile);
        if (!$licenseJson) {
            return ['valid' => false, 'error' => 'License read failed', 'code' => 'LICENSE_READ_FAILED'];
        }
        
        $decrypted = @openssl_decrypt(base64_decode($licenseJson), $this->encMethod, $this->getSecretKey(), 0, $this->getIV());
        if ($decrypted === false) {
            return ['valid' => false, 'error' => 'Decrypt failed', 'code' => 'LICENSE_DECRYPT_FAILED'];
        }
        
        $license = json_decode($decrypted, true);
        if (!$license || !isset($license['data']) || !isset($license['signature'])) {
            return ['valid' => false, 'error' => 'Invalid format', 'code' => 'LICENSE_FORMAT_INVALID'];
        }
        
        $licenseDataJson = $this->jsonEncode($license['data']);
        $expectedSignature = hash_hmac('sha256', $licenseDataJson, $this->getSecretKey());
        
        if ($license['signature'] !== $expectedSignature) {
            return ['valid' => false, 'error' => 'Signature mismatch', 'code' => 'LICENSE_SIGNATURE_INVALID'];
        }
        
        $currentHwId = $this->getHardwareId();
        if ($license['data']['hardware_id'] !== $currentHwId) {
            return ['valid' => false, 'error' => 'Different computer', 'code' => 'LICENSE_HARDWARE_MISMATCH'];
        }
        
        $expiryDate = strtotime($license['data']['expires']);
        if (time() > $expiryDate) {
            return ['valid' => false, 'error' => 'Expired', 'code' => 'LICENSE_EXPIRED'];
        }
        
        return ['valid' => true, 'message' => 'Valid', 'owner' => $license['data']['owner'], 'expires' => $license['data']['expires']];
    }
    
    private function checkIntegrity() {
        if (!file_exists($this->licenseHashFile)) {
            return false;
        }
        $storedHash = trim(file_get_contents($this->licenseHashFile));
        $currentHash = hash_file('sha256', $this->licenseFile);
        return $storedHash === $currentHash;
    }
}

if (php_sapi_name() === 'cli' && isset($argv[1]) && $argv[1] === '--generate') {
    $manager = new LicenseManager();
    $license = $manager->generateLicense();
    $manager->saveLicense($license);
    echo "✅ License generated\n";
    echo "Hardware ID: " . $manager->getHardwareId() . "\n";
    exit(0);
}
?>

