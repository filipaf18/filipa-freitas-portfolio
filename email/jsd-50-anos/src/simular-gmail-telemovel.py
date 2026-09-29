# Simula o Gmail: remove o <style> (descartado ao colar) e mostra num telemóvel de 360 px.
import re, sys
from playwright.sync_api import sync_playwright
d='/home/user/filipa-freitas-portfolio/email/jsd-50-anos/'
out=sys.argv[1] if len(sys.argv)>1 else 'gmail'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args=['--no-sandbox'])
    for f,tag in [('convite-jantar-50-anos.html','geral'),('convite-jantar-50-anos-institucional.html','institucional')]:
        html=re.sub(r'<style>.*?</style>','',open(d+f,encoding='utf-8').read(),flags=re.S)
        pg=b.new_page(viewport={'width':360,'height':800},device_scale_factor=1)
        pg.route(lambda u:u.startswith('http'),lambda r:r.abort())
        pg.set_content(html); pg.wait_for_timeout(300)
        print(tag,'scrollW',pg.evaluate('document.documentElement.scrollWidth'),'altura',pg.evaluate('document.documentElement.scrollHeight'))
        pg.screenshot(path=f'{out}-{tag}.png',full_page=True)
    b.close()
