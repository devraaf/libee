Campos (E-mail / Usuário e Senha)
E-mail/Usuário:

[ x] Remover espaços em branco automaticamente nas extremidades (trim()).

[ ] Forçar conversão para minúsculas (se aplicável) para evitar erros de case-sensitive.

[x ] Definir o tipo correto do input (type="email" ou type="text") para acionar o teclado adequado no mobile.

[ ] Senha:

[ x] Ocultar os caracteres por padrão (type="password").

[ x] Adicionar um botão de "Mostrar/Ocultar senha" (ícone de olho) para facilitar a usabilidade.

[ ] Desabilitar o recurso de autofill agressivo do navegador apenas se houver conflito visual crítico (geralmente é bom manter para facilitar).

Tratamento de Erros e Validação Básica
[x ] Validação em tempo real ou ao sair do campo (Blur):

[ x] Avisar se o e-mail está em um formato inválido (ex: falta o @ ou o domínio).

[x ] Avisar se algum campo obrigatório estiver vazio ao tentar submeter.



[ ] Tratar erros de conexão/servidor indisponível (ex: "Erro ao conectar com o servidor. Tente novamente mais tarde.").

Comportamento de Envio (Submit)
[ ] Feedback visual de carregamento (Loading): Desabilitar o botão de entrar e mostrar um spinner ou alterar o texto para "Entrando..." para evitar cliques duplos.

[ ] Atalho de teclado: Permitir que o usuário envie o formulário pressionando Enter estando em qualquer campo.

2. Tela de Cadastro (Sign Up)
Campos e Limitações (Inputs)
[ x] Nome Completo:

[ ] Limitar o número máximo de caracteres (ex: 100 caracteres).

[ ] Bloquear números e caracteres especiais inadequados, se necessário (permitir apenas letras e acentos).

[ ] E-mail:

[ ] Validar o formato estrutural do e-mail via Regex básica ou nativa do HTML5.

[ ] Limitar o tamanho máximo (ex: 254 caracteres, padrão RFC).

[ ] Senha e Confirmação de Senha:

[ ] Requisitos mínimos visuais: Mostrar uma lista de validação em tempo real (ex: mínimo de 8 caracteres, uma letra maiúscula, um número, um caractere especial).

[ ] Comparação: Validar se o campo "Confirmar Senha" é exatamente igual ao campo "Senha" (exibir erro se divergirem).

[ ] Campos Específicos (Telefone, CPF, CEP, etc. - se houver):

[ ] Aplicar máscaras automáticas enquanto o usuário digita (ex: (00) 00000-0000).

[ ] Restringir a digitação apenas a números nos campos que exigem isso.

Tratamento de Erros
[ ] Validação Preventiva: Impedir que o botão de cadastro seja habilitado/enviado se houver erros críticos nos campos.

[ ] Erros Inline (Abaixo do campo): Exibir mensagens claras e vermelhas logo abaixo do campo afetado (ex: "Este e-mail já está cadastrado" retornado pela API).

[ ] Termos de Uso: Garantir que o checkbox de aceitação dos Termos de Uso e Política de Privacidade seja obrigatório, com alerta caso o usuário tente avançar sem marcar.

Comportamento de Envio (Submit)
[ ] Prevenção de múltiplos cliques: Desativar o botão de cadastro e exibir estado de carregamento durante a requisição.

[ ] Sucesso: Redirecionar o usuário para a tela de login com uma mensagem de sucesso (ex: "Cadastro realizado com sucesso! Faça seu login.") ou logá-lo automaticamente.