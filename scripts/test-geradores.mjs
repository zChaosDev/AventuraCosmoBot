// Teste simples (sem framework) dos geradores de conta.
// Roda com: npm test   (ou: node scripts/test-geradores.mjs)
//
// Garante que soma/subtração/multiplicação/divisão NUNCA gerem um valor errado
// (ex.: a resposta bater com a conta, divisão exata, opções conterem a resposta).

import {
  gerarRodadas,
  gerarRodadasSoma,
  gerarRodadasSubtracao,
  gerarRodadasMultiplicacao,
  gerarRodadasDivisao,
} from "../src/game/gerarRodadas.js";

let falhas = 0;
function ok(condicao, msg) {
  if (!condicao) {
    falhas++;
    console.error("  ✗ FALHOU:", msg);
  }
}
const REPETICOES = 500;

// Toda rodada deve ter N opções distintas e conter a resposta certa.
function checarOpcoes(r, nome, n = 3) {
  ok(Array.isArray(r.opcoes) && r.opcoes.length === n, `${nome}: deve ter ${n} opções`);
  ok(new Set(r.opcoes).size === r.opcoes.length, `${nome}: opções devem ser distintas`);
  ok(r.opcoes.includes(r.quantidade), `${nome}: opções devem conter a resposta ${r.quantidade}`);
}

console.log("Testando geradores de conta (" + REPETICOES + " repetições cada)...\n");

// ===== Contagem =====
for (let i = 0; i < REPETICOES; i++) {
  for (const r of gerarRodadas(3, 3, 12)) {
    ok(r.quantidade >= 3 && r.quantidade <= 12, `contagem: quantidade ${r.quantidade} fora de [3,12]`);
    checarOpcoes(r, "contagem", 5); // fases de opção agora têm 5 alternativas
  }
}

// ===== Soma =====
for (let i = 0; i < REPETICOES; i++) {
  for (const r of gerarRodadasSoma(3, 2, 7)) {
    ok(r.a >= 2 && r.a <= 7 && r.b >= 2 && r.b <= 7, `soma: a/b fora de [2,7] (${r.a},${r.b})`);
    ok(r.a + r.b === r.quantidade, `soma: ${r.a}+${r.b} != ${r.quantidade}`);
    checarOpcoes(r, "soma");
  }
}

// ===== Subtração =====
for (let i = 0; i < REPETICOES; i++) {
  for (const r of gerarRodadasSubtracao(3, 6, 12)) {
    ok(r.a >= 6 && r.a <= 12, `subtração: a ${r.a} fora de [6,12]`);
    ok(r.b >= 1 && r.b <= r.a - 1, `subtração: b ${r.b} inválido para a ${r.a}`);
    ok(r.a - r.b === r.quantidade, `subtração: ${r.a}-${r.b} != ${r.quantidade}`);
    ok(r.quantidade >= 1, `subtração: resto ${r.quantidade} deve ser >= 1`);
    checarOpcoes(r, "subtração");
  }
}

// ===== Multiplicação (deve ter ao menos 1 conta de 2 dígitos) =====
for (let i = 0; i < REPETICOES; i++) {
  const rodadas = gerarRodadasMultiplicacao(3, 3, 5);
  for (const r of rodadas) {
    ok(r.grupos >= 2 && r.grupos <= 3, `mult: grupos ${r.grupos} fora de [2,3]`);
    ok(r.porGrupo >= 2 && r.porGrupo <= 5, `mult: porGrupo ${r.porGrupo} fora de [2,5]`);
    ok(r.grupos * r.porGrupo === r.quantidade, `mult: ${r.grupos}x${r.porGrupo} != ${r.quantidade}`);
    checarOpcoes(r, "multiplicação");
  }
  ok(rodadas.some((r) => r.quantidade >= 10), "mult: deveria ter ao menos 1 conta de 2 dígitos");
}

// ===== Divisão (exata; deve ter ao menos 1 total de 2 dígitos) =====
// Obs.: o quociente (resposta) fica em `quantidade` (contrato usado pelas cenas).
for (let i = 0; i < REPETICOES; i++) {
  const rodadas = gerarRodadasDivisao(3, 3, 5);
  for (const r of rodadas) {
    ok(r.divisor >= 2 && r.divisor <= 3, `divisão: divisor ${r.divisor} fora de [2,3]`);
    ok(r.quantidade >= 2 && r.quantidade <= 5, `divisão: quociente ${r.quantidade} fora de [2,5]`);
    ok(r.divisor * r.quantidade === r.total, `divisão: ${r.divisor}x${r.quantidade} != total ${r.total}`);
    ok(r.total % r.divisor === 0, `divisão: ${r.total} não é divisível por ${r.divisor} (deve ser exata)`);
    checarOpcoes(r, "divisão");
  }
  ok(rodadas.some((r) => r.total >= 10), "divisão: deveria ter ao menos 1 total de 2 dígitos");
}

if (falhas === 0) {
  console.log("✅ Todos os testes passaram!");
  process.exit(0);
} else {
  console.error(`\n❌ ${falhas} verificação(ões) falharam.`);
  process.exit(1);
}
