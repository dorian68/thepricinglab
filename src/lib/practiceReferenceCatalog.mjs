let pending;
export async function loadPracticeReference(exerciseId){
 pending ||= import('../data/practiceReferences.json').catch(error=>{pending=null;throw error;});
 const module=await pending;
 return module.default.references.find(item=>item.id===exerciseId)||null;
}
