# 6502-reasm

6502 disassembler and (re)assembler

Allows disassembling any sequence of bytes to a unique disassembly text, and
reassembling the assembly text to the same bytes (fully roundtrippable). Includes
support for illegal opcodes with multiple mneumonic aliases, and truncated operands
represented by `xx`.

Intended for disassembling a ROM (or a part of a ROM), editing the assembly to
patch it, and reassembling with the changes.  See also: [nes-game-genie](https://www.npmjs.com/package/nes-game-genie) and [nes-file](https://www.npmjs.com/package/nes-file).

Example:

```js
    const {disasm, formatDisasm, reasm} = require('6502-reasm');

    // returns an array, one element per instruction
    const lines = disasm([0x78, 0xd8, 0xa9, 0x10, 0x8d, 0x00, 0x20, 0xa2, 0xff, 0x9a, 0xad, 0x02, 0x20, 0x10, 0xfb, 0xad]);

    // returns a verbosely formatted text string, same as passed below
    const formattedDisassembly = formatDisasm(lines);

    // returns an array of bytes, identical as passed to disasm() above
    reasm(`\
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
```

## License

MIT

