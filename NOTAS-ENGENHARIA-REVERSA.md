# Bang! Bang! — notas da engenharia reversa (BANGBANG.EXE, Win 3.0, 07/out/1990)

Executável NE de 16 bits (MSC 5/6, emulador x87). Tudo abaixo foi lido do desassemblado (objdump i8086) + recursos.

## Recursos (extraídos do .EXE)
- 21 bitmaps (Sun, Cloud1-3, Bird, GreenFlag, RedFlag, Bang, Kaboom, Cannon, Rubble, CannonBall + máscaras). Máscara: preto = opaco (SRCAND 0x8800C6 + SRCPAINT 0xEE0086); Kaboom/Rubble = SRCCOPY.
- Menus: File(Open 105, Save 106, Exit 101) · Game(New 102, Stop 109, Configure 104) · Aim! 103 · Help(107, 108, About 100).
- Diálogos: About → Shareware (em sequência), Fire Control, End of Game, Configure, Open/Save. Strings de erro em tabela.

## Campo
- Área 512×391 (linhas 0..390), céu ciano, terreno verde (0,128,0) com contorno preto 1 px. Alturas armazenadas como LINHAS (390 − h).
- Nova partida: time inicial = rand()%2; vento = rand()%101−50 (0 se opção Wind off); borda esquerda L=rand()%116+78, direita R=rand()%116+318; alturas dos platôs rand()%216+8; x dos canhões rand()%(L−63)+32 e rand()%(448−R)+R+32; pico em rand()%(R−L−75)+L+38 com altura rand()%223+78; rampas = meio-cosseno (π=3.141592).
- rand() = MSC (seed·214013+2531011, >>16 & 0x7FFF). 12 entidades (nuvens/pássaros) sorteadas; sol fixo em (100,40).

## Tiro
- vx = |v|·cos(a·0.0174532889)·(±1)·0.01 ; vy = |v|·sen(a)·0.01 ; x0 = boca do canhão (x±16), y0 = altura da base + 32.
- Por passo: y+=vy; vy−=0.01; x+=vx; vento = vento_kmh·0.0001 somado a vx (se a bola está acima do ponto mais baixo do terreno, ou se o vento a favor).
- Fim do voo: |x| fora de [8,504], y>800, ou terreno ≥ linha da bola. Impacto: sprite Bang 300 ms.
- Acerto: |x − x_inimigo| ≤ tolerância (Fine 4 / Medium 8 / Coarse 16). Só testa o eixo X.
- Divots: cratera de 16 colunas com perfil [1,4,6,7,7,8,8,8,9,8,8,8,7,7,6,4], limite de linha 380, poupando ±32 px em volta do canhão inimigo.
- Acerto → Kaboom 500 ms → Rubble → diálogo de vitória (vence quem atirou). Senão alterna o time (exceto "1 Player").
- Limites: ângulo 0–95°, velocidade 50–900 km/h; passos 0.1 / 1 / 10; padrão 45° e 180 km/h; padrão Medium, Wind e Divots ligados.

## Arquivo .SAV
1114 bytes (0x45A) = dump de DS:0x1184..0x15DE: terreno (int16 ×521 incl. 8 de folga; time atual/outro em índices −2/−1), vento, precisão, velocidades/ângulos (double), passos, flags e registros dos dois canhões. O motor lê/escreve exatamente esse layout (Export/Import compatível).

## Não verificado / aproximações
- Velocidade da animação (o original dependia do hardware): controle deslizante.
- Visual do Win 3.x em CSS; textos do Help (o .HLP não está no .EXE) resumidos.
- Preenchimento do terreno por coluna (original usava FloodFill).
