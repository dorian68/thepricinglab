// Keep a control completely visible when asynchronous result layout and a sticky
// header would otherwise leave only a thin clickable strip beneath the header.
export function uncoverFormControl(root,header=document.querySelector('header.nav')){
 if(!root||!header)return;
 const edge=header.getBoundingClientRect().bottom;
 if(edge<=0)return;
 const controls=[...root.querySelectorAll('input,select,textarea,button')].filter(node=>node.getClientRects().length);
 const covered=controls.find(node=>{const box=node.getBoundingClientRect();return box.top<edge&&box.bottom>edge&&box.top>=0;});
 if(covered)window.scrollBy({top:covered.getBoundingClientRect().top-edge-16,behavior:'instant'});
}
