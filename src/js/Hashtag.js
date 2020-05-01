const https = require("https");
const cheerio = require("cheerio");

const Hashtag = function (rawData) {
    this.name = rawData.entry_data.TagPage[0].graphql.hashtag.name;
    this.weight = rawData.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.count;

    this.related = [];
    for (const rel of rawData.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_related_tags.edges) {
        this.related.push(rel.node.name);
    }
}

function getHashtag(hashtag) {

    return new Promise((resolve, reject) => {

        https.get("https://www.instagram.com/explore/tags/" + hashtag + "/", res => {

            let chunks = [];

            if(res.statusCode !== 200) {
                if(res.statusCode === 429) {
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

                if(dataObject !== undefined) {
                    resolve(new Hashtag(dataObject));
                } else {
                    reject("Something went wrong while fetching #" + hashtag);
                }
            });
        }).on("error", err => reject(err)).end();
    });
}

exports.getHashtagsRecursively = function (startingHashtag, depth) {

    let hashtags = new Map();

    function recurse(hashtag, level) {

        return new Promise((resolve, reject) => {

            let promises = [];

            getHashtag(hashtag)
                .then(hashtag => {
                    hashtags.set(hashtag.name, hashtag);

                    if (++level <= depth) {
                        for (const rel of hashtag.related) {
                            if (!hashtags.has(rel)) {
                                promises.push(recurse(rel, level));
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
                .catch(reason => reject(reason));
        });
    }

    return new Promise((resolve, reject) => {
        recurse(startingHashtag, 0)
            .then(result => resolve(Array.from(result.values())))
            .catch(reason => reject(reason));
    });
}

exports.getHashtag = getHashtag;
