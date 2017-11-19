'use strict';

const test = require('tape');
const {dis, formatDis, asm} = require('./');
const crypto = require('crypto');

test('disassemble', (t) => {
  const lines = dis([0x78, 0xd8, 0xa9, 0x10, 0x8d, 0x00, 0x20, 0xa2, 0xff, 0x9a, 0xad, 0x02, 0x20, 0x10, 0xfb, 0xad]);
  console.log(lines);

  t.equal(lines.length, 9);
  t.equal(lines[0].assembly, 'SEI');
  t.equal(lines[1].assembly, 'CLD');
  t.equal(lines[2].assembly, 'LDA #$10');
  t.equal(lines[3].assembly, 'STA $2000');
  t.equal(lines[5].assembly, 'TXS');
  t.equal(lines[6].assembly, 'LDA $2002');
  t.equal(lines[7].assembly, 'BPL -5');
  t.equal(lines[8].assembly, 'LDA $xxxx');

  t.end();
});

test('disassemble format', (t) => {
  const lines = dis([0x78, 0xd8, 0xa9, 0x10, 0x8d, 0x00, 0x20, 0xa2, 0xff, 0x9a, 0xad, 0x02, 0x20, 0x10, 0xfb, 0xad]);
  const formattedDisassembly = formatDis(lines);

  console.log(formattedDisassembly);

  t.equal(formattedDisassembly, `\
00000000    78           SEI
00000001    d8           CLD
00000002    a9 10        LDA #$10
00000004    8d 00 20     STA $2000
00000007    a2 ff        LDX #$ff
00000009    9a           TXS
0000000a    ad 02 20     LDA $2002
0000000d    10 fb        BPL -5
0000000f    ad xx xx     LDA $xxxx
`);
  t.end();
});

test('reassemble', (t) => {
  const text = `\
00000000    78           SEI
00000001    d8           CLD
00000002    a9 10        LDA #$10
00000004    8d 00 20     STA $2000
00000007    a2 ff        LDX #$ff
00000009    9a           TXS
0000000a    ad 02 20     LDA $2002
0000000d    10 fb        BPL -5
0000000f    ad xx xx     LDA $xxxx
`;
  t.deepEqual(asm(text), [0x78, 0xd8, 0xa9, 0x10, 0x8d, 0x00, 0x20, 0xa2, 0xff, 0x9a, 0xad, 0x02, 0x20, 0x10, 0xfb, 0xad]);
  t.end();
});

test('indirect Y', (t) => {
  t.equal(dis([0xf1, 0x94])[0].assembly, 'SBC ($94),Y');
  t.deepEqual(asm('SBC ($94),Y'), [0xf1, 0x94]);
  t.end();
});

function roundtrip(t, bytes) {
  console.log('disassembling bytes',bytes);
  const d = dis(bytes);
  console.log('disassembly',d);
  const f = formatDis(d);
  console.log('formatDis',f);
  const r = asm(f);
  console.log('reassembled',r);
  t.deepEqual(r, bytes);
}

test('roundtrip single bytes', (t) => {
  t.end();return;
  //TODO
  for (let i = 0; i < 256; ++i) {
    roundtrip(t, [i]);
  }
  t.end();
});

test('random', (t) => {
  t.end();return;

  for (let i = 0; i < 100; ++i) {
    const size = crypto.randomBytes(1)[0];
    const buf = new Uint8Array(crypto.randomBytes(size));

    console.log(size,buf);

    const lines = dis(buf);
    console.log(lines);

    const text = formatDis(lines);
    console.log(text);

    const re = new Uint8Array(asm(text));
    console.log(re);

    t.deepEqual(buf, re);
  }

  t.end();
});
