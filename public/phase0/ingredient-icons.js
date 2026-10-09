// Kitchen Garden v1.5 — reusable, dependency-free flat, reusable grocery icons.
// SVG is presentation-only. Catalog entries do not imply live inventory support.
export const INGREDIENT_ICON_IDS=Object.freeze(['tomato','egg','bokchoy','carrot','potato','onion','garlic','mushroom','fish','chicken','rice']);
const shell=(body,id)=>`<svg class="kg-food-icon" viewBox="0 0 64 64" width="32" height="32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
const leaf=(x,y)=>`<path d="M${x} ${y}q-12-14-17-3 11 9 17 3Zm0 0q12-14 17-3-11 9-17 3Z" fill="#70B978" stroke="#4B985E" stroke-width="1.2"/>`;
const designs={
tomato:`<path d="M17 20Q7 26 10 42Q14 58 32 58Q50 58 54 42Q57 25 46 20Q32 12 17 20Z" fill="#FF6B5B" stroke="#E65B50" stroke-width="1.5"/><path d="M32 20L20 17 25 25 32 21 39 25 44 17Z" fill="#4F9F62"/><path d="M32 19Q26 9 32 6Q37 9 33 19" fill="#559A53"/><path d="M32 20L17 25 27 26 32 20 37 26 47 25Z" fill="#71BD73"/>`,
egg:`<path d="M32 6C19 6 12 23 12 38C12 51 20 59 32 59S52 51 52 38C52 23 45 6 32 6Z" fill="#F4D6B9" stroke="#E5BDA0" stroke-width="1.4"/>`,
bokchoy:`<path d="M29 55Q14 38 10 18Q19 11 30 30Q29 12 37 7Q46 14 36 32Q49 12 56 20Q53 42 35 56Z" fill="#6EBA72" stroke="#4F9A58" stroke-width="1.4"/><path d="M30 56Q29 35 24 26M33 55Q38 36 42 25" stroke="#D6F0BE" stroke-width="5" stroke-linecap="round" fill="none"/>`,
carrot:`<path d="M26 19Q37 16 43 26Q38 44 19 59Q16 39 26 19Z" fill="#F39A4B" stroke="#DC7839" stroke-width="1.5"/><path d="M29 21Q19 11 25 4Q34 9 33 21Q37 7 46 7Q49 17 35 24" fill="#70B879"/><path d="M27 32l8 3M24 41l7 2" stroke="#DE7D3E" stroke-width="2"/>`,
potato:`<path d="M14 26Q20 9 39 14Q57 20 53 40Q47 58 28 55Q9 51 14 26Z" fill="#D8A66F" stroke="#BB8857" stroke-width="1.5"/><ellipse cx="25" cy="29" rx="2" ry="3" fill="#AD7B53"/><ellipse cx="42" cy="41" rx="2" ry="3" fill="#AD7B53"/><ellipse cx="34" cy="21" rx="2" ry="2" fill="#AD7B53"/>`,
onion:`<path d="M32 7Q27 17 22 22Q10 31 14 44Q17 58 32 59Q47 58 50 44Q54 31 42 22Q37 17 32 7Z" fill="#E9A767" stroke="#C78A53" stroke-width="1.5"/><path d="M32 15Q19 39 32 56M32 15Q45 39 32 56" fill="none" stroke="#F6C28D" stroke-width="2"/>`,
garlic:`<path d="M32 7Q25 17 22 23Q11 27 12 43Q13 57 32 58Q51 57 52 43Q53 27 42 23Q39 16 32 7Z" fill="#F7E9D9" stroke="#D9C7B7" stroke-width="1.5"/><path d="M32 16Q24 35 30 55M32 16Q42 35 35 55" stroke="#D6C5B6" stroke-width="2" fill="none"/>`,
mushroom:`<path d="M25 33H39L41 54Q32 60 23 54Z" fill="#F3DFC5"/><path d="M9 34Q10 11 32 10Q54 11 55 34Q32 43 9 34Z" fill="#B87E56" stroke="#986544" stroke-width="1.5"/><path d="M12 32Q32 41 52 32" fill="none" stroke="#E5B28A" stroke-width="3"/>`,
fish:`<path d="M13 32Q29 9 47 26L58 18V46L47 38Q29 56 13 32Z" fill="#78BBD5" stroke="#529CB9" stroke-width="1.5"/><circle cx="24" cy="29" r="2.5" fill="#263F52"/><path d="M35 22L40 14L45 26M35 41L40 49L45 37" fill="#A0D3E2"/>`,
chicken:`<ellipse cx="32" cy="39" rx="19" ry="20" fill="#FFF9F1" stroke="#E8DFD5" stroke-width="1.3"/><circle cx="31" cy="23" r="13" fill="#FFF9F1"/><path d="M26 11Q23 2 31 5Q37 0 39 11" fill="#F0756A"/><circle cx="27" cy="23" r="2" fill="#33484B"/><circle cx="37" cy="23" r="2" fill="#33484B"/><path d="M32 28l-5 5h10Z" fill="#F4B64C"/><path d="M25 57v4M39 57v4" stroke="#E8AC4D" stroke-width="4"/>`,
rice:`<path d="M11 32Q32 41 53 32L48 55Q32 61 16 55Z" fill="#D2AF87" stroke="#B9926C" stroke-width="1.4"/><ellipse cx="32" cy="31" rx="22" ry="9" fill="#FFF8E8"/><path d="M20 30l5-2m3 6 5-3m5-3 6 3" stroke="#DCCBB0" stroke-width="2" stroke-linecap="round"/>`
};
export function ingredientIconMarkup(id){if(!Object.hasOwn(designs,id))return '';return shell(designs[id],id);}
