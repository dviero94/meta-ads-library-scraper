const { Actor } = require('apify');

Actor.main(async () => {
    const input = await Actor.getInput(); // Ottieni l'input
    const url = input.url; // URL fornito come input

    const browser = await Actor.launchPuppeteer();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll per caricare più ads (opzionale)
    await page.evaluate(async () => {
        for (let i = 0; i < 3; i++) {
            window.scrollBy(0, 2000);
            await new Promise(r => setTimeout(r, 2000));
        }
    });

    // Attendi che gli annunci si carichino
    await page.waitForSelector('[data-testid="ad"]', { timeout: 30000 });

    const ads = await page.$$eval('[data-testid="ad"]', (nodes) => {
        return nodes.map(ad => {
            const text = ad.innerText;
            const imgElement = ad.querySelector('img');
            const img = imgElement ? imgElement.src : null;
            const dateMatch = text.match(/Started running on (.*)/);
            const startDate = dateMatch ? dateMatch[1] : null;

            return {
                text,
                image: img,
                startDate,
                status: text.includes('Active') ? 'Active' : 'Inactive'
            };
        });
    });

    await browser.close();

    await Actor.setValue('OUTPUT', { ads }); // Restituisce i dati degli ads
});
