const https = require("https");
const cheerio = require("cheerio");

const Hashtag = function(rawData) {
    this.weight = rawData.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.count;

    this.related = [];
    for (const rel of rawData.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_related_tags.edges) {
        this.related.push(rel.node.name);
    }
}

exports.getHashtag = function(hashtag, callback) {

    https.get("https://www.instagram.com/explore/tags/" + hashtag + "/", {}, res => {

        let chunks = [];

        res.on("data", data => {
            chunks += data;
        });

        res.on("end", () => {

            const $$ = cheerio.load(chunks);
            const scripts = $$("script");
            let dataObject;
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].children !== undefined && scripts[i].children.length > 0) {
                    if(scripts[i].children[0].data.startsWith("window._sharedData")) {
                        dataObject = JSON.parse(scripts[i].children[0].data
                            .substring(0, scripts[i].children[0].data.length - 1)
                            .replace("window._sharedData = ", ""));
                    }
                }
            }

            callback(null, new Hashtag(dataObject));
        });
    }).on("error", err => callback(err));
}
