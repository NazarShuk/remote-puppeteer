import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import * as puppeteer from 'puppeteer';
import bufferToDataUrl from "buffer-to-data-url"

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get('/', (_req, res) => {
    res.sendFile('index.html', {root: __dirname});
});

let browser : puppeteer.Browser;
let page : puppeteer.Page;

(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('https://youtube.com');
})();

let quality = 10;

io.on('connection', async (socket) => {
    console.log('a user connected');
    //
    //await page.waitForSelector('body');
    //await browser.close();

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on("click", async(pos) => {
        if (!page) return;
        await page.mouse.click(pos.x,pos.y);


        await sendImg()
    })
    socket.on("request", async() => {
        if (!page) return;


        await sendImg()
    })
    socket.on("keypress", async(key) => {
        if (!page) return;

        await page.keyboard.press(key);
        console.log(key)

        await sendImg()
    })
    socket.on("scroll", async(direction) => {
        if (!page) return;

        if(direction === "up"){
            await page.mouse.wheel({deltaX: 0, deltaY: 100});
        }
        else if(direction === "down"){
            await page.mouse.wheel({deltaX: 0, deltaY: -100});
        }

        await sendImg()
    })
    socket.on("goto", async(url) => {
        if (!page) return;

        await page.goto(url);

        await sendImg()
    })
    socket.on("quality", async(q) => {
        quality = q
    })
});

async function sendImg() {
    const screenshot = await page.screenshot({type:"jpeg", quality:quality});
    io.emit('image', {screenshot:bufferToDataUrl("image/png", screenshot), timestamp: Date.now().valueOf()});
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});