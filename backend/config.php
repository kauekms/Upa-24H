<?php
/**
 * Configuração do backend (XAMPP).
 * Padrão do XAMPP: usuário "root" sem senha. Em uma publicação efetiva, crie
 * um usuário próprio no MySQL com acesso apenas ao banco "upa24h".
 */
return [
    'db' => [
        'host'    => '127.0.0.1',
        'porta'   => 3306,
        'banco'   => 'upa24h',
        'usuario' => 'root',
        'senha'   => '',
    ],
    'sessao' => [
        'nome'            => 'UPA24H_SESSAO',
        'expira_minutos'  => 60,
    ],
    'versao' => '4.0.0',
];
