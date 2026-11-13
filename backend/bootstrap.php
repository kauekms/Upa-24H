<?php
/**
 * Inicialização comum aos pontos de entrada (api.php e relatorio.php):
 * autoload das classes (namespace Upa\ → backend/src/) e fuso horário.
 */
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

spl_autoload_register(static function (string $classe): void {
    $prefixo = 'Upa\\';
    if (strncmp($classe, $prefixo, strlen($prefixo)) !== 0) {
        return;
    }
    $relativo = str_replace('\\', DIRECTORY_SEPARATOR, substr($classe, strlen($prefixo)));
    $arquivo = __DIR__ . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . $relativo . '.php';
    if (is_file($arquivo)) {
        require $arquivo;
    }
});
