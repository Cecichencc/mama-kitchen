// Reusable flat vector recipe illustrations; all artwork is code, no binary files.
// Each plate is assembled from shared SVG ingredient shapes and tableware.
const tomato='<path d="M-13-9Q0-18 13-9Q21 3 11 13Q0 18-11 12Q-20 3-13-9Z" fill="#F07864"/><path d="M-7-11L0-17 7-11 0-8Z" fill="#66AB76"/>';
const egg='<path d="M-17 0Q-12-13 0-9Q15-18 18-1Q22 13 4 12Q-14 19-17 0Z" fill="#F7CD76"/><path d="M-12-1Q-4-9 6-3" fill="none" stroke="#FFE5A4" stroke-width="4" stroke-linecap="round"/>';
const leaf='<path d="M0 13Q-22-3-8-19Q4-14 0 13Z" fill="#5EA777"/><path d="M0 13Q20-4 8-19Q-4-12 0 13Z" fill="#8CC58B"/>';
const rice='<ellipse rx="12" ry="6" fill="#F7EDDC"/><path d="M-8-2l5-3M2 2l5-3" stroke="#E0D4BE" stroke-width="2"/>';
const mushroom='<path d="M-5 0H5L6 13H-6Z" fill="#F7E8D3"/><path d="M-14 1Q-12-15 0-15Q13-15 14 1Z" fill="#A9795C"/>';
const salmon='<path d="M-18-8Q0-15 20-6L15 11Q0 18-18 8Z" fill="#F4A58E"/><path d="M-12-3Q0 0 15-2M-12 5Q0 8 12 5" stroke="#FFE1CF" stroke-width="3" fill="none"/>';
const pumpkin='<path d="M-17-11Q0-19 17-11Q24 2 12 14Q0 20-12 14Q-24 2-17-11Z" fill="#EFB366"/><path d="M0-14V15M-9-11Q-15 2-7 13M9-11Q15 2 7 13" stroke="#D9974C" stroke-width="2" fill="none"/>';
const chicken='<path d="M-16-10Q0-19 17-9Q22 7 5 15Q-17 18-19 2Z" fill="#D9A27D"/><path d="M-11-6Q0-12 10-5" stroke="#F5C9A7" stroke-width="4" fill="none"/>';
const parts={tomato,egg,leaf,rice,mushroom,salmon,pumpkin,chicken};
const at=(kind,x,y,scale=1,rotate=0)=>`<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})">${parts[kind]}</g>`;
const dish=(content,bowl=false)=>`<svg class="kg-recipe-svg" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" role="presentation" aria-hidden="true"><ellipse cx="160" cy="197" rx="112" ry="18" fill="#DCE4D6"/><ellipse cx="160" cy="133" rx="116" ry="77" fill="#E2D6C4"/><ellipse cx="160" cy="126" rx="112" ry="75" fill="${bowl?'#E7D8BD':'#FFFCF7'}" stroke="#DCCEBB" stroke-width="5"/><ellipse cx="160" cy="126" rx="91" ry="56" fill="${bowl?'#F6E7CE':'#FFF9EE'}"/>${content}</svg>`;
const scatter=(kind,points)=>points.map(([x,y,s,r])=>at(kind,x,y,s,r)).join('');
const designs={
 'tomato-egg':dish(scatter('egg',[[109,111,1.65,-25],[177,100,1.5,18],[203,145,1.6,-8],[133,158,1.4,25]])+scatter('tomato',[[103,147,1.25,-12],[153,120,1.15,40],[211,116,1.15,-20]])+at('leaf',176,156,.55,30)),
 'bokchoy-garlic':dish(scatter('leaf',[[108,112,1.5,-30],[158,102,1.6,10],[204,133,1.4,35],[132,152,1.3,-12],[180,159,1.2,-28]])+scatter('rice',[[118,130,.42,0],[176,125,.42,0],[207,111,.4,0]])),
 'mushroom-rice':dish(scatter('rice',[[113,113,1.6,10],[152,100,1.6,25],[198,120,1.6,-15],[143,150,1.5,30],[188,151,1.3,0]])+scatter('chicken',[[116,145,1.1,-25],[178,113,1.1,15]])+scatter('mushroom',[[142,115,.85,-10],[199,144,.9,25]])),
 'salmon-bowl':dish(scatter('rice',[[107,120,1.4,0],[134,143,1.4,30],[165,105,1.3,0]])+scatter('salmon',[[178,124,1.6,-18],[202,146,1.1,30]])+scatter('leaf',[[108,150,.9,-20],[202,99,.9,20]]),true),
 'pumpkin-soup':dish('<ellipse cx="160" cy="128" rx="88" ry="53" fill="#E9AC5D"/><path d="M99 130Q151 100 208 134" fill="none" stroke="#F9D28A" stroke-width="8" stroke-linecap="round"/>'+at('pumpkin',164,127,.85,0)+at('leaf',201,144,.55,30),true),
 'egg-breakfast':dish(scatter('egg',[[119,125,1.6,0],[178,126,1.6,20]])+at('leaf',151,156,.55,30)),
 'steamed-egg':dish('<ellipse cx="160" cy="128" rx="88" ry="53" fill="#F4D58D"/><path d="M106 128Q160 112 211 128" stroke="#FFF0BB" stroke-width="6" fill="none"/>',true),
 'tomato-soup':dish('<ellipse cx="160" cy="128" rx="88" ry="53" fill="#E99079"/>'+scatter('tomato',[[135,117,.9,0],[185,136,.85,35]])+at('leaf',170,109,.65,15),true)
};
export const RECIPE_ART_IDS=Object.freeze(Object.keys(designs));
export function recipeArtMarkup(id){return Object.hasOwn(designs,id)?designs[id]:dish(at('leaf',160,128,1.8));}
