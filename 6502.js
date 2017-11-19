'use strict'; 
// http://www.oxyron.de/html/opcodes02.html
const mneumonics = [
// x0   x1    x2    x3    x4    x5    x6    x7    x8    x9    xA    xB    xC    xD    xE    xF
  'BRK','ORA','KIL','SLO','NOP','ORA','ASL','SLO','PHP','ORA','ASL','ANC','NOP','ORA','ASL','SLO', // 0x
  'BPL','ORA','KIL','SLO','NOP','ORA','ASL','SLO','CLC','ORA','NOP','SLO','NOP','ORA','ASL','SLO', // 1x
  'JSR','AND','KIL','RLA','BIT','AND','ROL','RLA','PLP','AND','ROL','ANC','BIT','AND','ROL','RLA', // 2x
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
  'CPX','SBC','NOP','ISC','CPX','SBC','INC','ISC','INX','SBC','NOP','SBC','CPX','SBC','INC','ISC', // Ex
  'BEQ','SBC','KIL','ISC','NOP','SBC','INC','ISC','SED','SBC','NOP','ISC','NOP','SBC','INC','ISC', // Fx
];

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

function dis1(buf) {
  const opcode = buf[0];
  const mneumonic = mneumonics[opcode];
  const addrmode = addrmodes[opcode];

  let operand;
  let size = 0;

  function toHex(n) {
    if (n === undefined) return 'xx';
    if (n < 0x10) return '0' + n.toString(16);
    return n.toString(16);
  }

  function readByte() {
    size = 1;
    return '$' + toHex(buf[1]);
  }

  function readSignedByte() {
    size = 1;
    if (buf[1] > 0x7f) {
      return '-' + -(buf[1] - 0x100);
    } else {
      return '+' + buf[1];
    }
  }
 
  function readWord() {
    size = 2;
    return '$' + toHex(buf[1]) + toHex(buf[2]);
  }

  switch (addrmode) {
    case imp: operand = ''; break;
    case imm: operand = '#' + readWord(); break;
    case zp: operand = readByte(); break;
    case zpx: operand = readByte() + ',X'; break;
    case zpy: operand = readByte() + ',Y'; break;
    case izx: operand = '(' + readByte() + ',X)'; break;
    case izy: operand = '(' + readByte() + ',Y)'; break;
    case abs: operand = readWord(); break;
    case abx: operand = readWord() + ',X'; break;
    case aby: operand = readWord() + ',Y'; break;
    case ind: operand = '(' + readWord() + ')'; break;
    case rel: operand = readSignedByte(); break;
    default: throw Error(`invalid addressing mode ${addrmode} in opcode ${opcode} of buffer ${buf[0]}`);
  }

  const bytesRead = 1 + size;
  const instruction  = mneumonic + (operand.length !== 0 ? ' ' + operand : '');

  return { bytesRead, instruction };
}

function dis(buf) {
  let pc = 0;

  while (pc < buf.length) {
    const { bytesRead, instruction } = dis1(buf.slice(pc));
    
    console.log(instruction);

    pc += bytesRead;
  }
}

module.exports = { dis };
