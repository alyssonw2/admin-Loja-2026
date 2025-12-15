
# Documentação da API

Base URL: `https://geographical-delays-dramatic-many.trycloudflare.com`

## Autenticação

A maioria das rotas requer um token Bearer JWT.

### Login
**POST** `/db/login/adminlogin`
Body: `{ "email": "...", "password": "..." }`

## Gerenciamento de Tabelas

### Criar Tabela
**POST** `/db/create-table`
Body:
```json
{
  "tableName": "clientes",
  "fields": {
    "nome": "string|required|min:3",
    "email": "email|required|unique",
    "idade": "number",
    "ativo": "boolean|default"
  }
}
```

### Listar Tabelas
**GET** `/db/tabelas`

### Obter Schema
**GET** `/db/schema/:table`

## CRUD de Registros

### Criar Registro
**POST** `/db/:table`
Body: `{ "campo": "valor" }`

### Listar Registros
**GET** `/db/:table`
Params: `?page=1&limit=10&sort=campo:desc&campo_like=valor`

### Atualizar Registro
**PUT** `/db/:table/:id`

### Deletar Registro
**DELETE** `/db/:table/:id`

## Tipos de Campos Suportados
`string`, `number`, `boolean`, `date`, `email`, `cpf`, `cnpj`, `cep`, `telefone`, `celular`, `whatsapp`, `url`, `base64`, `json`, `uuid`.
