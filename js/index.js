/**
 * @author Julian Rabe <julian@deltaeight.de>
 */

const Hashtag = require("./Hashtag.js");

Hashtag.getHashtag("piano", (err, hashtag) => {
    if(!err) {
        console.log(hashtag);
    } else {
        console.error(err);
    }
})
