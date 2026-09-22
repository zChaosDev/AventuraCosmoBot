// Geradores de rodadas — JavaScript puro (sem Phaser), para poderem ser
// testados isoladamente com Node (ver scripts/test-geradores.mjs).

// Inteiro aleatório entre min e max (inclusive).
function entre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Prende um valor no intervalo [min, max].
function limitar(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Embaralha uma lista (ordem aleatória).
function embaralhar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = entre(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Gera 3 opções: a resposta certa + 2 "quase certas", tudo dentro de [min, max].
// "espalhar" controla a distância máxima dos distratores (padrão 2). Em fases
// com números maiores (multiplicação/divisão) um espalhamento maior deixa as
// alternativas menos "coladas".
function gerarOpcoes(correta, min, max, espalhar = 2, quantas = 3) {
  const set = new Set([correta]);
  // Alarga o teto o suficiente para caber "quantas" valores distintos.
  const teto = Math.max(max, min + quantas - 1);
  let tentativas = 0;
  while (set.size < quantas && tentativas < 80) {
    tentativas++;
    let d = correta + entre(-espalhar, espalhar);
    d = limitar(d, min, teto);
    if (d !== correta) set.add(d);
  }
  // Garante SEMPRE "quantas" opções, mesmo em intervalos apertados onde o sorteio
  // não achou distratores suficientes: completa com os vizinhos disponíveis.
  for (let d = min; set.size < quantas && d <= teto; d++) {
    if (d !== correta) set.add(d);
  }
  return embaralhar([...set]);
}

// Gera N rodadas com quantidades ALEATÓRIAS entre min e max (padrão 1 a 10).
// Evita repetir a mesma quantidade em rodadas seguidas. Como é chamada toda
// vez que a fase começa, o jogo é SEMPRE diferente a cada partida.
export function gerarRodadas(n = 3, min = 1, max = 10) {
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let q;
    do {
      q = entre(min, max);
    } while (q === anterior);
    anterior = q;
    // Fases de opção mostram 5 alternativas.
    rodadas.push({ quantidade: q, opcoes: gerarOpcoes(q, min, max, 3, 5) });
  }
  return rodadas;
}

// Gera N rodadas de SOMA (Fase 2): dois grupos "a" e "b" (cada um de min a max)
// e a resposta é a soma. Ex.: min=1, max=5 => somas de 2 a 10. As opções ficam
// dentro do intervalo possível das somas. Evita repetir a mesma soma seguida.
export function gerarRodadasSoma(n = 3, min = 1, max = 5) {
  const somaMin = min * 2;
  const somaMax = max * 2;
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let a, b, soma;
    do {
      a = entre(min, max);
      b = entre(min, max);
      soma = a + b;
    } while (soma === anterior);
    anterior = soma;
    rodadas.push({ a, b, quantidade: soma, opcoes: gerarOpcoes(soma, somaMin, somaMax) });
  }
  return rodadas;
}

// Gera N rodadas de SUBTRAÇÃO (Planeta 3 — "Lua Minguante"): mostra um total de
// cristais e alguns "se apagam". A resposta é quantos continuam acesos.
// "a" = total de cristais, "b" = quantos se apagam, "quantidade" = a - b.
// Ex.: min=5, max=12 => totais de 5 a 12, resultado sempre >= 1.
export function gerarRodadasSubtracao(n = 3, min = 5, max = 12) {
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let a, b, resto;
    do {
      a = entre(min, max);
      b = entre(1, a - 1); // sobra pelo menos 1 aceso
      resto = a - b;
    } while (resto === anterior);
    anterior = resto;
    rodadas.push({ a, b, quantidade: resto, opcoes: gerarOpcoes(resto, 1, max) });
  }
  return rodadas;
}

// Gera N rodadas de MULTIPLICAÇÃO (Planeta 4 — "Nebulosa dos Grupos"): mostra
// "grupos" grupos IGUAIS com "porGrupo" cristais cada. A resposta é o total.
// Modelo de ARRANJO (fileiras iguais), ótimo para introduzir a multiplicação.
// Ex.: maxGrupos=4, maxPorGrupo=5 => até 4 x 5 = 20 cristais.
export function gerarRodadasMultiplicacao(n = 3, maxGrupos = 4, maxPorGrupo = 5) {
  const produtoMax = maxGrupos * maxPorGrupo;
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let grupos, porGrupo, produto;
    do {
      grupos = entre(2, maxGrupos);
      porGrupo = entre(2, maxPorGrupo);
      produto = grupos * porGrupo;
    } while (produto === anterior);
    anterior = produto;
    rodadas.push({
      grupos,
      porGrupo,
      quantidade: produto,
      opcoes: gerarOpcoes(produto, 2, produtoMax, 3),
    });
  }
  // Garante ao menos UMA conta de 2 dígitos (>= 10) quando o intervalo permite.
  if (produtoMax >= 10 && !rodadas.some((r) => r.quantidade >= 10)) {
    let grupos, porGrupo, produto;
    do {
      grupos = entre(2, maxGrupos);
      porGrupo = entre(2, maxPorGrupo);
      produto = grupos * porGrupo;
    } while (produto < 10);
    rodadas[rodadas.length - 1] = { grupos, porGrupo, quantidade: produto, opcoes: gerarOpcoes(produto, 2, produtoMax, 3) };
  }
  return rodadas;
}

// Gera N rodadas de DIVISÃO (Planeta 5 — "Portal Compartilhar"): reparte um
// total de cristais igualmente entre "divisor" robôs. A resposta é quantos
// cristais cada robô recebe (divisão EXATA, sem resto).
// "total" = cristais, "divisor" = robôs, "quantidade" = total / divisor.
// Ex.: maxDivisor=4, maxQuociente=5 => totais de 4 a 20, sempre exatos.
export function gerarRodadasDivisao(n = 3, maxDivisor = 4, maxQuociente = 5) {
  const rodadas = [];
  let anterior = null;
  for (let i = 0; i < n; i++) {
    let divisor, quociente, total;
    do {
      divisor = entre(2, maxDivisor);
      quociente = entre(2, maxQuociente);
      total = divisor * quociente;
    } while (quociente === anterior);
    anterior = quociente;
    rodadas.push({
      total,
      divisor,
      quantidade: quociente,
      opcoes: gerarOpcoes(quociente, 1, maxQuociente, 2),
    });
  }
  // Garante ao menos UM total de 2 dígitos (>= 10) quando o intervalo permite.
  const totalMax = maxDivisor * maxQuociente;
  if (totalMax >= 10 && !rodadas.some((r) => r.total >= 10)) {
    let divisor, quociente, total;
    do {
      divisor = entre(2, maxDivisor);
      quociente = entre(2, maxQuociente);
      total = divisor * quociente;
    } while (total < 10);
    rodadas[rodadas.length - 1] = { total, divisor, quantidade: quociente, opcoes: gerarOpcoes(quociente, 1, maxQuociente, 2) };
  }
  return rodadas;
}
