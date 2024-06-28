import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

const app = express();
const server = createServer(app);
const io = new Server(server, {
    transports: ['websocket']
});

app.get('/', (_req, res) => {
    res.sendFile('index.html', {root: __dirname});
});

let browser: any;
let page: any;


(async () => {
    puppeteer.use(StealthPlugin())
    browser = await puppeteer.launch();
    page = await browser.newPage();
    page.setViewport({width: 1280, height: 720})
    await page.goto('https://google.com/');
    page.on('dialog', async (dialog: { accept: () => any; }) => {
        console.log(dialog)
        await dialog.accept();
    });
    page.on('close', async () => {
        io.emit('server-msg', "Page was closed, returning...")

        doScreenshot = false
        await page.goto('https://google.com/');
        await page.waitForSelector('body');
        doScreenshot = true

    })
})();

let quality = 0;

let cursors = {}

io.on('connection', async (socket) => {
    console.log('a user connected');
    //
    //await page.waitForSelector('body');
    //await browser.close();

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on("click", async (pos) => {
        if (!page) return;
        if (pos.button === 0) {
            await page.mouse.click(pos.x, pos.y);
        } else if (pos.button === 2) {
            await page.mouse.click(pos.x, pos.y);
        }


        //await sendImg()
    })
    socket.on("request", async () => {
        if (!page) return;


        await sendImg()
    })
    socket.on("keypress", async (key) => {
        if (!page) return;

        await page.keyboard.press(key);
        console.log(key)

        //await sendImg()
    })
    socket.on("scroll", async (direction) => {
        if (!page) return;

        if (direction === "up") {
            await page.mouse.wheel({deltaX: 0, deltaY: 100});
        } else if (direction === "down") {
            await page.mouse.wheel({deltaX: 0, deltaY: -100});
        }

        //await sendImg()
    })
    socket.on("goto", async (url) => {
        if (!page) return;
        try {
            doScreenshot = false
            await page.goto(url);
            await page.waitForSelector('body');
            doScreenshot = true
        } catch (e) {
            io.emit("server-msg", e)
        }

        //await sendImg()
    })
    socket.on("quality", async (q) => {
        quality = q
        io.emit("quality", q)
    })
    socket.on("mousemove", async (pos) => {
        if (!page) return;

        // @ts-ignore
        cursors[socket.id] = {x:pos.x,y:pos.y,realName: socket.data.name || "idk"}

        await page.mouse.move(pos.x, pos.y);

    })
});


async function sendImg() {
    try {
        const screenshot = await page.screenshot({type: "jpeg", quality: quality});
        io.emit('image', {screenshot: screenshot, timestamp: Date.now().valueOf()});

        //console.log(cursors)
        io.emit('cursors', cursors)
    } catch (e) {
        io.emit("server-msg", e)
    }
}

let doScreenshot = true

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    setInterval(async () => {
        if (!page) {
            console.log("no page")
            return
        }
        if (!doScreenshot) return

        await sendImg()
    }, 10)
});
