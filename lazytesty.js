const request = require("request");
const cheerio = require("cheerio");
const _ = require('lodash');
const puppeteer = require('puppeteer');
var http = require("http");
var BrowserStack = require("browserstack");
var browserStackCredentials = {
    username: "",
    password: ""
};
const download = require('images-downloader').images;

// REST API

// Screenshots API
var screenshotClient = BrowserStack.createScreenshotClient(browserStackCredentials);
const dest = `${__dirname}/screenshots/`;
var screenshots = [];


// browserstack part
/*
screenshotClient.generateScreenshots(
    {
        "url":"https://yvesamabili.be",
        "callback_url": "http://staging.example.com",
        "win_res": "1024x768",
        "mac_res": "1920x1080",
        "quality": "compressed",
        "wait_time": 5,
        "orientation": "portrait",
        "browsers":[
            {
                "os":"Windows",
                "os_version":"XP",
                "browser":"ie",
                "browser_version":"7.0"
            },
            {
                "os":"ios",
                "os_version":"6.0",
                "device":"iPhone 4S (6.0)"
            },
        ]
    },

    (error, job) => {
        console.log(job);
        job.screenshots.map(screenshot => screenshots.push(screenshot));

        var statusLoading = setInterval(()=> {
            screenshotClient.getJob(job['job_id'], (error, job) => {

                // get loaded images
                job.screenshots.map(screenshot => {
                    let screenshotsLoaded = screenshots.filter(screenshot => screenshot.hasOwnProperty('image_url'));
                    screenshotsLoaded.map(screenshotLoaded => screenshots.map(screenshot => {
                        if(screenshot.id === screenshotLoaded.id) screenshot = screenshotLoaded;
                    }))
                });

                // check if all images is loaded
                console.log(job.screenshots.filter(screenshot => !screenshot.hasOwnProperty('image_url:')));
                if(job.screenshots.filter(screenshot => (screenshot['image_url'] === null && !screenshot['image_url'] === '')).length === 0) {
                    var test = [];
                    screenshots.map(screenshot => test.push(screenshot.url));
                    console.log(test);
                    clearInterval(statusLoading);

                    download(test, dest)
                        .then(result => {
                            console.log('Images downloaded', result);
                        })
                        .catch(error => console.log("downloaded error", error))
                }
            })
        }, 5000);

    });*/
// The file will be downloaded to this directory. For example: __dirname + '/mediatheque'


const URL = 'https://yvesamabili.be';
let MAX_PAGES = 1;
let DELAY = 0;

let links = [{text: 'Accueil', url: URL}];
var i = 0;
var currentLink = 0;

let MOBILE = false;
let TABLET = false;

const processing = function() {
    setTimeout(function(){
        if(i <= MAX_PAGES) {
            getPage(i);
            return;
        }
        else {
            takeScreenShot()
        }
    }, DELAY);
};

const getPage = function(i) {
    request({
        uri: links[i].url,
    }, function(error, response, body) {
        console.log(`Connexion to page ${links[i].url}, search for links…`);
        getLinks(error, response, body);

    });
};

const getLinks = function(error, response, body) {

    var $ = cheerio.load(body);

    $("a").each(function() {
        var link = $(this);
        var text = link.text();
        var url = link.attr("href");
        if(url !== undefined) {
            if(url.indexOf(URL) >= 0 || url.charAt(0) === '/' || url.charAt(0) + url.charAt(1) === './' ) {
                if(url.charAt(0) === '/') {
                    url = URL + url.split('/')[1];
                }
                links.push({text: text, url : url});
            }
        }
    });

    removeDuplicateLinks();

    if(links[i+1]) {
        i++;
        processing();
    }

};

const removeDuplicateLinks = () => links = _.uniqBy(links, 'url');

async function takeScreenShot() {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.setViewport({width: 2000, height: 600, deviceScaleFactor : 1});
    await page.goto(links[currentLink].url);
    await page.screenshot({fullPage: true, path: `./screenshots/${currentLink}-${links[currentLink].text}.png`});
    console.log(`Desktop screenshot creation : ./screenshots/${currentLink}-${links[currentLink].text}.png`);

    if(MOBILE) {
        page.setViewport({width: 576, height: 600, deviceScaleFactor : 2});
        await page.screenshot({fullPage: true, path: `./screenshots/${currentLink}-${links[currentLink].text}--mobile.png`});
        console.log(`Mobile screenshot creation : ./screenshots/${currentLink}-${links[currentLink].text}--mobile.png`);
    }
    if(TABLET) {
        page.setViewport({width: 768, height: 480, deviceScaleFactor : 2});
        await page.screenshot({fullPage: true, path: `./screenshots/${currentLink}-${links[currentLink].text}--tablet.png`});
        console.log(`Tablet screenshot creation : ./screenshots/${currentLink}-${links[currentLink].text}--tablet.png`);
    }

    await browser.close();

    if(links[currentLink+1]) {
        currentLink++;
        processing();
    }
};

const init = function() {
    // console.log(process);
    process.argv.forEach((val, index) => {
        if(val === 'mobile') MOBILE = true;
        if(val === 'tablet') TABLET = true;
        if(val.indexOf('limit') > -1) MAX_PAGES = val.split('=')[1] - 1;
        if(val.indexOf('delay') > -1) DELAY = val.split('=')[1];
    });
    processing();
};

console.log('LazyTasty v 0.0.1 - Launching…');

init();



