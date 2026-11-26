// Run after prepare-figures.R. No packages or network required.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const course=path.resolve(here,'../..');
const lecture=process.argv[2]?path.resolve(process.argv[2]):path.join(course,'docs/lecture08');
const directory=path.join(lecture,'assets/figures');
const figures=Object.fromEntries(fs.readdirSync(directory).filter(f=>f.endsWith('.svg')).sort().map(f=>[path.basename(f,'.svg'),fs.readFileSync(path.join(directory,f),'utf8')]));
const ink=JSON.parse(fs.readFileSync(path.join(directory,'ink-templates.json'),'utf8'));
fs.writeFileSync(path.join(lecture,'assets/figures.js'),'/* Generated in R. See scripts/lecture08/prepare-figures.R and annotations.R. */\nwindow.LectureFigures = '+JSON.stringify(figures)+';\nwindow.LectureInk = '+JSON.stringify(ink)+';\n');
const fonts=path.join(lecture,'assets/fonts');fs.mkdirSync(fonts,{recursive:true});
for(const f of ['STIXTwoMath-Regular.otf','OFL.txt'])if(!fs.existsSync(path.join(fonts,f)))fs.copyFileSync(path.join(course,'docs/lecture07/assets/fonts',f),path.join(fonts,f));
fs.writeFileSync(path.join(lecture,'.nojekyll'),'');
console.log(`Bundled ${Object.keys(figures).length} R figures; local fonts copied.`);
