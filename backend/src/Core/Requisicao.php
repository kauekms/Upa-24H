<?php
declare(strict_types=1);

namespace Upa\Core;

/** Representa a requisição HTTP recebida (método, rota, corpo JSON e query). */
final class Requisicao
{
    private ?array $corpo = null;

    public function __construct(
        private string $metodo,
        private string $rota,
        private array $query,
        private string $corpoBruto
    ) {
    }

    public static function atual(): self
    {
        $rota = $_SERVER['PATH_INFO'] ?? ($_GET['rota'] ?? '/');
        $rota = '/' . trim((string) $rota, '/');
        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            $rota,
            $_GET,
            (string) file_get_contents('php://input')
        );
    }

    public function metodo(): string
    {
        return $this->metodo;
    }

    public function rota(): string
    {
        return $this->rota;
    }

    public function query(string $chave, ?string $padrao = null): ?string
    {
        $valor = $this->query[$chave] ?? null;
        return is_string($valor) && trim($valor) !== '' ? trim($valor) : $padrao;
    }

    /** Corpo JSON decodificado. Lança 400 se o JSON for inválido. */
    public function corpo(): array
    {
        if ($this->corpo === null) {
            if (trim($this->corpoBruto) === '') {
                $this->corpo = [];
            } else {
                $dados = json_decode($this->corpoBruto, true);
                if (!is_array($dados)) {
                    throw new HttpException(400, 'Corpo da requisição não é um JSON válido.');
                }
                $this->corpo = $dados;
            }
        }
        return $this->corpo;
    }

    public function ip(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? 'local');
    }
}
