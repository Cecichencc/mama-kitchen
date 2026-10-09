// Recipe-selection basket. No holds, expiry, stock deduction, or cooking transactions.
export const SELECTION_KEY='kitchen-garden.recipe-selection.v1';
export function emptySelection(){return {lines:[]};}
export function sanitizeSelection(raw,batches){
 const input=raw?.lines; if(!Array.isArray(input))return emptySelection();
 const seen=new Set(),lines=[];
 for(const line of input){
  const b=batches.find(x=>x.id===line.batchId);
  if(!b||seen.has(b.id)||!Number.isSafeInteger(line.quantity)||line.quantity<1)continue;
  seen.add(b.id);lines.push({batchId:b.id,quantity:Math.min(line.quantity,b.onHand)});
 }
 return {lines:lines.filter(x=>x.quantity>0)};
}
export function selectQuantity(selection,batches,batchId,quantity){
 if(!Number.isSafeInteger(quantity)||quantity<0||quantity>9999)throw Error('Invalid selection quantity.');
 const batch=batches.find(b=>b.id===batchId);
 if(!batch)throw Error('Unknown batch.');
 if(quantity>batch.onHand)throw Error('Not enough physical stock.');
 return {lines:[...selection.lines.filter(x=>x.batchId!==batchId),...(quantity?[{batchId,quantity}]:[])]};
}
export function selectedQuantity(selection,batches,ingredientId){
 return selection.lines.reduce((sum,line)=>sum+(batches.find(b=>b.id===line.batchId)?.ingredientId===ingredientId?line.quantity:0),0);
}
export function selectionReadiness(selection,batches){
 const tomato=selectedQuantity(selection,batches,'tomato'),egg=selectedQuantity(selection,batches,'egg');
 return {tomato,egg,possible:tomato>=2&&egg>=3};
}
