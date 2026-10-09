// Deterministic recipe ordering: actual recorded fit first, then variety,
// then favourites and speed. No inference of unrecorded ingredients.
export function rankRecipeCandidates(items,{previous=[],favorites=[],usedCategories=[]}={}){
 const recent=new Map();
 for(const id of Array.isArray(previous)?previous:[])
  if(typeof id==='string')recent.set(id,(recent.get(id)||0)+1);
 const fav=new Set(Array.isArray(favorites)?favorites:[]);
 const categorySet=new Set(Array.isArray(usedCategories)?usedCategories:[]);
 function score(item){
  const missing=item.missing?.length||0;
  const unknown=item.unknown?.length||0;
  const sufficient=item.sufficient?.length||0;
  // A recipe with no quantified known ingredients is never "verified" merely
  // because there is nothing to compare against. Deprioritise such recipes.
  return [
   Number(missing===0&&sufficient===0),
   missing+unknown,
   -sufficient,
   missing,
   recent.get(item.recipe.id)||0,
   Number(categorySet.has(item.recipe.category)),
   Number(!fav.has(item.recipe.id)),
   item.recipe.minutes||0
  ];
 }
 const scored=items.map(item=>({item,score:score(item)}));
 scored.sort((a,b)=>{
  for(let i=0;i<a.score.length;i++)if(a.score[i]!==b.score[i])return a.score[i]-b.score[i];
  return a.item.recipe.id.localeCompare(b.item.recipe.id);
 });
 return scored.map(x=>x.item);
}
