'use strict'; 
// http://www.oxyron.de/html/opcodes02.html
const mneumonics = [
// x0   x1    x2    x3    x4    x5    x6    x7    x8    x9    xA    xB    xC    xD    xE    xF
  'BRK','ORA','KIL','SLO','NOP','ORA','ASL','SLO','PHP','ORA','ASL','ANC','NOP','ORA','ASL','SLO', // 0x
  'BPL','ORA','KIL','SLO','NOP','ORA','ASL','SLO','CLC','ORA','NOP','SLO','NOP','ORA','ASL','SLO', // 1x
  'JSR','AND','KIL','RLA','BIT','AND','ROL','RLA','PLP','AND','ROL','ANT','BIT','AND','ROL','RLA', // 2x
  'BMI','AND','KIL','RLA','NOP','AND','ROL','RLA','SEC','AND','NOP','RLA','NOP','AND','ROL','RLA', // 3x
  'RTI','EOR','KIL','SRE','NOP','EOR','LSR','SRE','PHA','EOR','LSR','ALR','JMP','EOR','LSR','SRE', // 4x
  'BVC','EOR','KIL','SRE','NOP','EOR','LSR','SRE','CLI','EOR','NOP','SRE','NOP','EOR','LSR','SRE', // 5x
  'RTS','ADC','KIL','RRA','NOP','ADC','ROR','RRA','PLA','ADC','ROR','ARR','JMP','ADC','ROR','RRA', // 6x
  'BVS','ADC','KIL','RRA','NOP','ADC','ROR','RRA','SEI','ADC','NOP','RRA','NOP','ADC','ROR','RRA', // 7x
  'NOP','STA','NOP','SAX','STY','STA','STX','SAX','DEY','NOP','TXA','XAA','STY','STA','STX','SAX', // 8x
  'BCC','STA','KIL','AHX','STY','STA','STX','SAX','TYA','STA','TXS','TAS','SHY','STA','SHX','AHX', // 9x
  'LDY','LDA','LDX','LAX','LDY','LDA','LDX','LAX','TAY','LDA','TAX','LAX','LDY','LDA','LDX','LAX', // Ax
  'BCS','LDA','KIL','LAX','LDY','LDA','LDX','LAX','CLV','LDA','TSX','LAS','LDY','LDA','LDX','LAX', // Bx
  'CPY','CMP','NOP','DCP','CPY','CMP','DEC','DCP','INY','CMP','DEX','AXS','CPY','CMP','DEC','DCP', // Cx
  'BNE','CMP','KIL','DCP','NOP','CMP','DEC','DCP','CLD','CMP','NOP','DCP','NOP','CMP','DEC','DCP', // Dx
  'CPX','SBC','NOP','ISC','CPX','SBC','INC','ISC','INX','SBC','NOP','SBD','CPX','SBC','INC','ISC', // Ex
  'BEQ','SBC','KIL','ISC','NOP','SBC','INC','ISC','SED','SBC','NOP','ISC','NOP','SBC','INC','ISC', // Fx
];

const mneumonic_aliases = {
  // http://www.oxyron.de/html/opcodes02.html 'Aliases used in other illegal opcode sources'
  ASO: 'SLO',
  LSE: 'SRE',
  ISB: 'ISC',
  ASR: 'ALR',
  AII: 'SHX',
  LAR: 'LAS',
  JAM: 'KIL', HLT: 'KIL', STP: 'KIL',

  // http://nesdev.com/undocumented_opcodes.txt
  AAC: 'ANC',
  AAX: 'SAX',
  ATX: 'LAX', LXA: 'LAX', OAL: 'LAX',
  AXA: 'AHX', SHA: 'AHX', AXA: 'AHX',
  SBX: 'AXS',
  DCM: 'DCP',
  DOP: 'NOP', SKB: 'NOP', // double no-op; skip byte
  INS: 'ISC',
  LAE: 'LAS',
  // note: SBC is legal opcode $E9, but also illegal $EB - renamed to SBD to disambiguate (not SBX)
  XAS: 'SHX', SXA: 'SHX',
  SYA: 'SHY', SAY: 'SHY',
  TOP: 'NOP', SKW: 'NOP', // triple no-op; skip word
  ANE: 'XAA', XXA: 'XAA',
  SHS: 'TAS', XAS: 'TAS',
};

const ambiguous_opcodes = {
  // KIL
  0x02: '', // arbitrarily selecting this one
  0x12: '.B',
  0x22: '.C',
  0x32: '.D',
  0x42: '.E',
  0x52: '.F',
  0x62: '.G',
  0x72: '.H',
  0x92: '.I',
  0xb2: '.J',
  0xd2: '.K',
  0xf2: '.L',

  // NOP
  0x1a: '.I',
  0x3a: '.A',
  0x5a: '.B',
  0x7a: '.C',
  0xda: '.D',
  0xea: '', // official
  0xfa: '.F',

  // NOP #$
  0x80: '',
  0x82: '.B',
  0x89: '.C',
  0xc2: '.D',
  0xe2: '.E',

  // NOP $
  0x04: '',
  0x44: '.B',
  0x64: '.C',

  // NOP $xx,X
  0x14: '',
  0x34: '.B',
  0x54: '.C',
  0x74: '.D',
  0xd4: '.E',
  0xf4: '.F',

  // NOP $xxxx,X
  0x1c: '',
  0x3c: '.B',
  0x5c: '.C',
  0x7c: '.D',
  0xdc: '.E',
  0xfc: '.F',
};

const imp = 0
const imm = 1;
const zp =  2;
const zpx = 3;
const zpy = 4;
const izx = 5;
const izy = 6;
const abs = 7;
const abx = 8;
const aby = 9;
const ind = 10;
const rel = 11;

const addrmodes = [
// x0 x1  x2  x3  x4  x5  x6  x7  x8  x9  xA  xB  xC  xD  xE  xF
  imp,izx,imp,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,abs,abs,abs,abs, // 0x
  rel,izy,imp,izy,zpx,zpx,zpx,zpx,imp,aby,imp,aby,abx,abx,abx,abx, // 1x
  abs,izx,imp,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,abs,abs,abs,abs, // 2x
  rel,izy,imp,izy,zpx,zpx,zpx,zpx,imp,aby,imp,aby,abx,abx,abx,abx, // 3x
  imp,izx,imp,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,abs,abs,abs,abs, // 4x
  rel,izy,imp,izy,zpx,zpx,zpx,zpx,imp,aby,imp,aby,abx,abx,abx,abx, // 5x
  imp,izx,imp,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,ind,abs,abs,abs, // 6x
  rel,izy,imp,izy,zpx,zpx,zpx,zpx,imp,aby,imp,aby,abx,abx,abx,abx, // 7x
  imm,izx,imm,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,abs,abs,abs,abs, // 8x
  rel,izy,imp,izy,zpx,zpx,zpy,zpy,imp,aby,imp,aby,abx,abx,aby,aby, // 9x
  imm,izx,imm,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,abs,abs,abs,abs, // Ax
  rel,izy,imp,izy,zpx,zpx,zpy,zpy,imp,aby,imp,aby,abx,abx,aby,aby, // Bx
  imm,izx,imm,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,abs,abs,abs,abs, // Cx
  rel,izy,imp,izy,zpx,zpx,zpx,zpx,imp,aby,imp,aby,abx,abx,abx,abx, // Dx
  imm,izx,imm,izx,zp ,zp ,zp ,zp ,imp,imm,imp,imm,abs,abs,abs,abs, // Ex
  rel,izy,imp,izy,zpx,zpx,zpx,zpx,imp,aby,imp,aby,abx,abx,abx,abx, // Fx
];

function hexByte(n) {
  if (n === undefined) return 'xx';
  if (n < 0x10) return '0' + n.toString(16);
  return n.toString(16);
}

function getOperandSize(addrmode) {
  switch (addrmode) {
    case imp: return 0;
    case imm: return 1;
    case zp:  return 1;
    case zpx: return 1;
    case zpy: return 1;
    case izx: return 1;
    case izy: return 1;
    case abs: return 2;
    case abx: return 2;
    case aby: return 2;
    case ind: return 2;
    case rel: return 1;
    default: throw Error(`invalid addressing mode ${addrmode}`);
  }
}

function disasm1(buf) {
  const opcode = buf[0];
  const mneumonic = mneumonics[opcode];
  const addrmode = addrmodes[opcode];

  let operand;
  let bytes = [opcode];

  function readByte() {
    bytes[1] = buf[1];
    return '$' + hexByte(buf[1]);
  }

  function readSignedByte() {
    bytes[1] = buf[1];
    if (buf[1] === undefined) return '+xx';
    if (buf[1] > 0x7f) {
      return '-' + -(buf[1] - 0x100);
    } else {
      return '+' + buf[1];
    }
  }
 
  function readWord() {
    bytes[1] = buf[1];
    bytes[2] = buf[2];
    return '$' + hexByte(buf[2]) + hexByte(buf[1]);
  }

  switch (addrmode) {
    case imp: operand = ''; break;
    case imm: operand = '#' + readByte(); break;
    case zp: operand = readByte(); break;
    case zpx: operand = readByte() + ',X'; break;
    case zpy: operand = readByte() + ',Y'; break;
    case izx: operand = '(' + readByte() + ',X)'; break;
    case izy: operand = '(' + readByte() + '),Y'; break;
    case abs: operand = readWord(); break;
    case abx: operand = readWord() + ',X'; break;
    case aby: operand = readWord() + ',Y'; break;
    case ind: operand = '(' + readWord() + ')'; break;
    case rel: operand = readSignedByte(); break;
    default: throw Error(`invalid addressing mode ${addrmode} in opcode ${opcode} of buffer ${buf[0]}`);
  }

  const bytesRead = 1 + getOperandSize(addrmode);
  const disambiguation_suffix = ambiguous_opcodes[opcode] || '';
  const assembly = mneumonic + disambiguation_suffix + (operand.length !== 0 ? ' ' + operand : '');

  return { bytesRead, assembly, bytes };
}

function disasm(buf, origin=0) {
  const lines = [];
  let pc = 0;

  while (pc < buf.length) {
    const { bytesRead, assembly, bytes } = disasm1(buf.slice(pc));

    lines.push({
      address: origin + pc,
      assembly: assembly,
      bytes: bytes,
    });

    pc += bytesRead;
  }

  return lines;
}

function hexAddress(n) {
  const s = n.toString(16);
  return '00000000'.substring(0, 8 - s.length) + s;
}

function formatDisasm(lines) {
  let text = '';

  lines.forEach((line) => {
    let s = hexAddress(line.address) + '    ';
    for (let i = 0; i < 3; ++i) {
      if (i >= line.bytes.length) s += '  ';
      else s += hexByte(line.bytes[i]);
      
      s += ' ';
    }
    s += '    ' + line.assembly;

    text += s + '\n';
  });

  return text;
}

function parseOperand(s) {
  let operandBytes, addrmode;

  if (s.length == 0) {
    operandBytes = [];
    addrmode = imp;
  } else if (s.startsWith('#')) {
    operandBytes = parseValue(s.substring(1));
    addrmode = imm;
  } else if (s.endsWith(',X)')) {
    operandBytes = parseValue(s.substring(1, s.length - 3));
    addrmode = izx;
  } else if (s.endsWith('),Y')) {
    operandBytes = parseValue(s.substring(1, s.length - 3));
    addrmode = izy;
  } else if (s.endsWith(')')) {
    operandBytes = parseValue(s.substring(1, s.length - 1));
    addrmode = ind;
  } else if (s.endsWith(',X')) {
    operandBytes = parseValue(s.substring(0, s.length - 2));
    if (operandBytes.length === 1) {
      addrmode = zpx;
    } else {
      addrmode = abx;
    }
  } else if (s.endsWith(',Y')) {
    operandBytes = parseValue(s.substring(0, s.length - 2));
    if (operandBytes.length === 1) {
      addrmode = zpy;
    } else {
      addrmode = aby;
    }
  } else if (s.startsWith('-') || s.startsWith('+')) {
    operandBytes = parseValue(s);
    addrmode = rel;
  } else {
    operandBytes = parseValue(s);
    if (operandBytes.length === 1) {
      addrmode = zp;
    } else {
      addrmode = abs;
    }
  }

  return { operandBytes, addrmode };
}

function parseValue(s) {
  let value;
  if (s.startsWith('-') || s.startsWith('+')) {
    if (s === '+xx') return [undefined];
    value = parseInt(s, 10);
    if (value < 0) value = 0x100 + value;
    return [value];
  }

  let match = s.match(/([$%]?)([0-9a-fA-Fx]+)/);
  if (match) {
    let radix = 10;
    if (match[1] === '$') radix = 16;
    else if (match[1] === '&') radix = 10;
    else if (match[1] === '%') radix = 2;

    if (match[2] === 'xx') {
      return [undefined];
    } else if (match[2] === 'xxxx') {
      return [undefined, undefined];
    } else if (match[2].startsWith('xx')) {
      value = parseInt(match[2].substring(2), radix);
      return [value, undefined];
    } else {
      value = parseInt(match[2], radix);
      if (match[2].length <= 2) {
        return [value];
      } else {
        return [value & 0xff, value >> 8];
      }
    }
  }

  throw Error(`bad operand value: ${s}`);
}

function reasm1(mneumonic, addrmode) {
  if (mneumonic_aliases[mneumonic] !== undefined) {
    return reasm1(mneumonic_aliases[mneumonic], addrmode);
  }

  for (let opcode = 0; opcode < mneumonics.length; ++opcode) {
    if (mneumonics[opcode] === mneumonic && addrmodes[opcode] === addrmode && ambiguous_opcodes[opcode] === undefined) {
      return opcode;
    }
  }

  for (let opcode = 0; opcode < mneumonics.length; ++opcode) {
    if (mneumonics[opcode] + ambiguous_opcodes[opcode] === mneumonic && addrmodes[opcode] === addrmode) {
      return opcode;
    }
  }
}

function reasm(text) {
  const lines = text.split('\n');
  let bytes = [];
  lines.forEach((line) => {
    if (line.match(/^\s*$/)) return;
    if (line.startsWith(';')) return;

    const match = line.match(/([A-Za-z.]{3,}) ?(\S*)/)
    if (!match) throw Error(`assembly line bad format: ${line}`);

    const mneumonic = match[1];
    const operandText = match[2];

    const { operandBytes, addrmode } = parseOperand(operandText);
    const opcode = reasm1(mneumonic, addrmode);
    if (opcode === undefined) throw Error(`no mneumonic ${mneumonic} found for addrmode ${addrmode} in ${line}`);

    bytes.push(opcode);
    bytes = bytes.concat(operandBytes);
  });

  // trailing bytes undefined = truncated
  while (bytes.length > 0 && bytes[bytes.length - 1] === undefined) {
    bytes = bytes.slice(0, bytes.length - 1);
  }

  return bytes;
}

module.exports = { disasm, formatDisasm, reasm };
