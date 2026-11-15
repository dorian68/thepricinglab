import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Tiny original fixtures test selection and lesson parsing, never content quality.
// Refuse a real course directory even if a credential filename was supplied.
export async function prepareQaLanguageFixtures(credentialPath,{wideMath=false}={}){
 const credentials=JSON.parse(await readFile(credentialPath,'utf8'));
 if(credentials.fixture!==true)throw new Error('Original QA course text requires an explicit learner fixture.');
 const folder=path.dirname(path.resolve(credentialPath));
 await readFile(path.join(folder,'.tpl-learner-fixture'),'utf8');
 const scripts=path.join(folder,'private-course-fixtures');
 await mkdir(path.join(scripts,'en'),{recursive:true});
 const make=(language,count,greeks=false)=>`# Original QA language contract\n\n## ${language==='en'?'Written course':'Cours redige'}\n\n`+Array.from({length:count},(_,index)=>`### ${language==='en'?'Lesson':'Leçon'} ${index+1} — ${language==='en'?'QA English lesson':greeks?'QA Sensibilité':'QA Français leçon'} ${index+1}\n\n${language==='en'?'This original QA lesson verifies English rendering and the published language selector. It is not a reviewed curriculum or a textbook excerpt. Use the same option ticket and inspect its units before interpreting a hedge.':'Cette leçon QA originale vérifie le rendu en français et le choix de langue. Ce texte de test ne constitue pas un cours validé ni un extrait de manuel. Conserver le ticket et préciser les unités avant de commenter un hedge.'}\n\n`).join('');
 const equation=String.raw`\frac{(S_1-K_1)^2}{1+r_1T_1}+\frac{(S_2-K_2)^2}{1+r_2T_2}+\frac{(S_3-K_3)^2}{1+r_3T_3}+\frac{(S_4-K_4)^2}{1+r_4T_4}`;
 const mathBlock=wideMath?`\n\nOriginal synthetic QA equation for keyboard scrolling, not a reviewed pricing model.\n\n$$\n${equation}\n$$\n\n\`\`\`uiblock\ntype: equation\ntitle: Original QA scroll equation\nparams: ${JSON.stringify({latex:equation})}\n\`\`\`\n\n`:'';
 const english=make('en',8).replace('### Lesson 2',()=>`${mathBlock}### Lesson 2`);
 await writeFile(path.join(scripts,'en','vanilla-options-quote.md'),english,'utf8');
 await writeFile(path.join(scripts,'vanilla-options-quote.md'),make('fr',8),'utf8');
 await writeFile(path.join(scripts,'options-book-greeks-pnl.md'),make('fr',9,true),'utf8');
 await writeFile(path.join(scripts,'en','_index.json'),JSON.stringify({schema_version:'tpl.course.language-index.v1',approval_basis:'synthetic_test_fixture_only',courses:[{slug:'vanilla-options-quote',sha256:createHash('sha256').update(english).digest('hex'),status:'accepted_98_and_independent_review',approval_basis:'synthetic_test_fixture_only'}]},null,2),'utf8');
}
