const https = require("https");
const cheerio = require("cheerio");

const MINIMUM_WAITTIME = 1000;
const MAXIMUM_WAITTIME = 3000;

let requests = [];
let stopQueueWorker = false;
let requestCounter = null;
let expectedReq = null;

const Hashtag = function (rawData) {
    this.name = rawData.entry_data.TagPage[0].graphql.hashtag.name;
    this.weight = rawData.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.count;

    this.related = [];
    for (const rel of rawData.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_related_tags.edges) {
        this.related.push(rel.node.name);
    }
}

function resolveRequest(hashtag, resolve, reject) {

    https.get("https://www.instagram.com/explore/tags/" + hashtag + "/", res => {

        let chunks = [];

        if (res.statusCode !== 200) {
            if (res.statusCode === 429) {
                reject("Too many requests! Instagram locked us out!");
            } else {
                reject("Received HTTP Status " + res.statusCode + " when fetching hashtags!");
            }
            return;
        }

        res.on("data", data => {
            chunks += data;
        });

        res.on("end", () => {

            const $$ = cheerio.load(chunks);
            const scripts = $$("script");
            let dataObject;
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].children !== undefined && scripts[i].children.length > 0) {
                    if (scripts[i].children[0].data.startsWith("window._sharedData")) {
                        dataObject = JSON.parse(scripts[i].children[0].data
                            .substring(0, scripts[i].children[0].data.length - 1)
                            .replace("window._sharedData = ", ""));
                    }
                }
            }

            if (dataObject !== undefined) {
                resolve(new Hashtag(dataObject));
            } else {
                reject("Something went wrong while fetching #" + hashtag);
            }
        });
    }).on("error", err => reject(err)).end();
}

function getHashtagWithQueue(hashtag) {
    return new Promise((resolve, reject) => {
        requests.push(() => resolveRequest(hashtag, resolve, reject));
    });
}

function getHashtag(hashtag) {
    return new Promise((resolve, reject) => {
        resolveRequest(hashtag, resolve, reject);
    });
}

function getRandomIdleTime() {
    return Math.floor(Math.random() * MAXIMUM_WAITTIME) + MINIMUM_WAITTIME;
}

function workOnQueue() {
    if (requests.length > 0) {
        requests.shift()();
    }
    if (stopQueueWorker) {
        stopQueueWorker = false;
        requests = [];
    } else {
        setTimeout(() => workOnQueue(), getRandomIdleTime());
    }
}

exports.getHashtagsRecursively = function (startingHashtag, depth, counter, expected) {

    expectedReq = expected;
    requestCounter = counter;
    let hashtags = new Map();

    function recurse(hashtag, level) {

        return new Promise((resolve, reject) => {

            let promises = [];

            getHashtagWithQueue(hashtag)
                .then(hashtag => {
                    hashtags.set(hashtag.name, hashtag);

                    if (++level <= depth) {

                        if(hashtag.related.length < 10 && expectedReq !== null) {
                            expectedReq.substract(10 - hashtag.related.length);
                        }

                        for (const rel of hashtag.related) {
                            if (!hashtags.has(rel)) {
                                promises.push(recurse(rel, level));
                            } else if(expectedReq !== null) {
                                expectedReq.decrement();
                            }
                        }
                        Promise.all(promises)
                            .then(() => {
                                resolve(hashtags)
                            })
                            .catch(reason => reject(reason));
                    } else {
                        resolve(hashtags);
                    }
                })
                .catch(reason => reject(reason))
                .then(() => {
                    if (requestCounter != null) {
                        requestCounter.increment();
                    }
                });
        });
    }

    return new Promise((resolve, reject) => {
        recurse(startingHashtag, 0)
            .then(result => resolve(Array.from(result.values())))
            .catch(reason => reject(reason))
            .then(() => stopQueueWorker = true);

        setTimeout(() => workOnQueue(), getRandomIdleTime());
    });
}

exports.getHashtag = getHashtag;
