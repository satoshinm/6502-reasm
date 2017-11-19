'use strict';

const test = require('tape');
const {dis, formatDis, asm } = require('./');
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

test('relative truncated', (t) => {
  t.equal(dis([0x10])[0].assembly, 'BPL +xx');
  t.deepEqual(asm('BPL +xx'), [0x10]);
  t.end();
});

test('mneumonic aliases', (t) => {
  t.deepEqual(asm('ANE #$00'), asm('XAA #$00'));
  t.deepEqual(asm('XXA #$00'), asm('XAA #$00'));
  t.equal(dis([0x8b])[0].assembly, 'XAA #$xx'); // preferred mneumonic
  t.end();
});

test('no ambiguous mneumonics', (t) => {
  for (let i = 0; i < 256; ++i) {
    const assembly = dis([i])[0].assembly;
    //t.equal(asm(assembly).length, 1); // must handle truncated
    const r = asm(assembly)[0];
    console.log(i, assembly, r);

    if (r != i) {
      console.log(`Ambiguous mneumonic: ${assembly} is 0x${r.toString(16)} and 0x${i.toString(16)}`);
      console.log(ambiguous_opcodes[i]);
      t.equal(ambiguous_opcodes[i] !== undefined, true);
    }
    t.equal(r, i);
  }
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
  for (let i = 0; i < 256; ++i) {
    roundtrip(t, [i]);
  }
  t.end();
});


test('empty', (t) => {
  t.deepEqual(dis([]), []);
  t.equal(formatDis(dis([])).length, 0);
  t.equal(formatDis([]).length, 0);
  t.deepEqual(asm(""), []);
  t.end();
});

test('partial truncated mid-operand', (t) => {
  t.equal(formatDis(dis([0x20, 0xf4])), '00000000    20 f4 xx     JSR $xxf4\n');
  t.deepEqual(asm('JSR $xxf4'), [0x20, 0xf4]);
  t.deepEqual(asm('JSR $80f4'), [0x20, 0xf4, 0x80]);
  t.deepEqual(asm('JSR $xxxx'), [0x20]);
  t.end();
});

test('random', (t) => {
  t.end();return;
  for (let i = 0; i < 100; ++i) {
    //const size = crypto.randomBytes(1)[0];
    const size = 2;
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
