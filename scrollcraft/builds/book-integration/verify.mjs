import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const output = new URL('./checks/', import.meta.url);
fs.mkdirSync(output, {recursive:true});
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
try {
  const originalHTML=execFileSync('git',['show','3f7f444:index.html'],{encoding:'utf8'});
  const originalLinks=[...originalHTML.matchAll(/href="([^"]+)"/g)].map(x=>x[1]).filter(x=>x.startsWith('https://')&&!x.includes('fonts.')).sort();
  for (const config of [
    {name:'desktop',width:1440,height:900},
    {name:'tablet',width:768,height:1024},
    {name:'mobile',width:390,height:844},
    {name:'small-mobile',width:320,height:740},
    {name:'reduced',width:390,height:844,reducedMotion:'reduce'},
    {name:'no-js',width:390,height:844,javaScriptEnabled:false}
  ]) {
    const context=await browser.newContext({viewport:{width:config.width,height:config.height},reducedMotion:config.reducedMotion,javaScriptEnabled:config.javaScriptEnabled});
    await context.addInitScript(()=>{
      Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled for verification'));
      Element.prototype.setPointerCapture=()=>{};
      Element.prototype.releasePointerCapture=()=>{};
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    const response=await page.goto('http://localhost:4500',{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    if(config.javaScriptEnabled!==false){
      await page.waitForSelector('html.sc-ready');
      const decline=page.getByRole('button',{name:'Agora não',exact:true});
      if(await decline.isVisible()) await decline.click();
    }
    await page.evaluate(()=>document.fonts.ready);
    for(const img of await page.locator('img').all()){
      await img.scrollIntoViewIfNeeded();
      await page.waitForFunction(el=>el.complete&&el.naturalWidth>0, await img.elementHandle());
      assert.equal(await img.evaluate(el=>getComputedStyle(el).objectFit), (await img.getAttribute('src')).includes('perfil')?'cover':'contain');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,config.name+' horizontal overflow');
    const links=await page.locator('a[href^="https://"]').evaluateAll(els=>els.map(el=>el.getAttribute('href')).sort());
    assert.deepEqual(links,originalLinks,config.name+' links preserved');
    if(config.width<=850&&config.javaScriptEnabled!==false){
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      const toggle=page.locator('#menuToggle');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
      await toggle.click();
      await page.locator('#mainNav a[href="#materiais"]').click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      await page.waitForTimeout(900);
      const pos=await page.locator('#materiais').boundingBox();
      assert.ok(pos.y>=0&&pos.y<130,config.name+' anchor offset');
    }
    for(const [name,selector] of []){
      await page.locator(selector).evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
      await page.waitForTimeout(850);
      await page.screenshot({path:path.join(output.pathname,config.name+'-'+name+'.png')});
    }
    if(config.reducedMotion){
      assert.equal(await page.locator('.connection-trace').first().evaluate(el=>getComputedStyle(el).strokeDashoffset),'0px');
      assert.equal(await page.locator('.hero-book-shell').evaluate(el=>getComputedStyle(el).transform),'none');
    }
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.keyboard.press('Tab');
    assert.equal(errors.length,0,errors.join('\n'));
    results.push({name:config.name,images:5,noOverflow:true,linksPreserved:true,runtimeErrors:errors});
    await context.close();
    console.log('PASS '+config.name);
  }
  for(const [n,file] of [[1,'os-dois-iguais'],[2,'descubra-os-sentidos'],[3,'nao-era-falta-de-amor']]){
    const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    assert.equal(digest(`/private/tmp/margareth-book-assets/book/${n}.png`),digest(`image/${file}-book.png`));
  }
  fs.writeFileSync(new URL('results.json',output),JSON.stringify({results,originalAssetHashesMatch:true},null,2));
} finally {await browser.close();}
