<?php
declare(strict_types=1);

namespace Upa\Core;

use RuntimeException;

/** Erro que vira uma resposta HTTP com o status informado (401, 403, 404, 422...). */
class HttpException extends RuntimeException
{
    public function __construct(private int $status, string $mensagem)
    {
        parent::__construct($mensagem, $status);
    }

    public function status(): int
    {
        return $this->status;
    }
}
