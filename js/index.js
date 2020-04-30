/**
 * @author Julian Rabe <julian@deltaeight.de>
 */

const Hashtag = require("./Hashtag.js");

// Hashtag.getHashtag("piano")
//     .then(result => console.log(result))
//     .catch(err => console.error(err));

Hashtag.getHashtagsRecursively("piano", 2)
    .then(result => {
        console.log(result.length);
        console.log(result);
    })
    .catch(err => console.error("oof: " + err));
