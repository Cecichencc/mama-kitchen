// Kitchen Garden unit contract: stock is stored as integer base units.
// Never convert packs/bunches to grams without an explicit package weight.
export const UNIT_OPTIONS=Object.freeze({
 piece:Object.freeze([{id:'piece',factor:1,en:'piece',zh:'个'}]),
 g:Object.freeze([{id:'g',factor:1,en:'g',zh:'克'},{id:'kg',factor:1000,en:'kg',zh:'千克'}]),
 ml:Object.freeze([{id:'ml',factor:1,en:'ml',zh:'毫升'},{id:'l',factor:1000,en:'L',zh:'升'}]),
 bunch:Object.freeze([{id:'bunch',factor:1,en:'bunch',zh:'把'}]),
 pack:Object.freeze([{id:'pack',factor:1,en:'pack',zh:'包'}])
});
export function unitOptions(base){if(!UNIT_OPTIONS[base])throw Error('Unknown base unit');return UNIT_OPTIONS[base];}
export function toBase(value,unit,base){
 const opt=unitOptions(base).find(x=>x.id===unit);
 if(!opt||!Number.isFinite(value)||value<=0)throw Error('Invalid grocery amount or unit');
 const result=Math.round(value*opt.factor);
 if(Math.abs(result-value*opt.factor)>1e-8||result<1||result>99999)throw Error('Quantity must resolve to whole base units (maximum 99999)');
 return result;
}
export function displayAmount(value,base,locale='en'){
 const options=unitOptions(base);
 const preferred=options.find(x=>x.factor===1000&&value>=1000&&value%100===0);
 const chosen=preferred||options[0];
 return `${value/chosen.factor} ${locale==='zh-CN'?chosen.zh:chosen.en}`;
}
