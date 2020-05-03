const humanizeDuration = require("humanize-duration");
const Hashtag = require("./Hashtag.js");

/*
 * Constants
 */

const BUCKET_RANGES = [
    { name: "up to 100000 uses", pick: 0.6, criteria: weight => weight <= 100000 },
    { name: "up to 1000000 uses", pick: 0.3, criteria: weight => 100000 < weight && weight <= 1000000 },
    { name: "more than 1000000 uses", pick: 0.1, criteria: weight => 1000000 < weight }
];
const RESULTING_HASHTAGS = 10; // TODO Make changeable

const urlParams = new URLSearchParams(window.location.search);

/*
 * Variables
 */

let buckets = BUCKET_RANGES;
let startingHashtag;

/*
 * Internal functions
 */

function getBucketHtml(bucketId) {

    let result = "<div id='bucket" + bucketId + "' class='card'>" +
        "<div class='card-header'>" + buckets[bucketId].name + "</div>" +
        "<div class='card-body'>";

    if(buckets[bucketId].bucket.length > 0) {
        for (const hashtag of buckets[bucketId].bucket) {
            result += "#" + hashtag.name + "<br>";
        }
    } else {
        result += "<i>none</i>";
    }

    return result + "</div></div>";
}

function createBuckets(hashtags) {

    hashtags.sort((a, b) => a.weight < b.weight ? 1 : -1);

    for (const bucket of buckets) {

        bucket.bucket = [];

        for (const hashtag of hashtags) {
            if(bucket.criteria(hashtag.weight)) {
                bucket.bucket.push(hashtag);
            }
        }
    }
}

function expectedRequestsWithoutDuplicates(depth) {
    if (depth < 0) {
        return 0;
    } else if (depth === 0) {
        return 1;
    }
    return 10 * Math.pow(9, depth - 1) + expectedRequestsWithoutDuplicates(depth - 1);
}

function populateResultPage(hashtags) {

    createBuckets(hashtags);

    let bucketHtml = "";
    for (let i = 0; i < buckets.length; i++) {
        bucketHtml += getBucketHtml(i);
    }

    $("#buckets").html(bucketHtml);

    exports.pickHashtags();
}

function shuffle(array) {
    let j = 0;
    let temp = null;

    for (let i = array.length - 1; i > 0; i -= 1) {

        j = Math.floor(Math.random() * (i + 1));

        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function postClipboardMessage(message, clazz) {
    let clipboardMessage = $("#clipboardMessage");
    clipboardMessage
        .text(message)
        .addClass(clazz);
    setTimeout(() => {
        clipboardMessage.fadeOut("slow", () => {
            clipboardMessage
                .text(null)
                .removeClass(clazz)
                .show();
        });
    }, 5000);
}

/*
 * Exposed functions
 */

exports.expectedRequests = function(depth) {
    return depth >= 0 ? Math.pow(10, depth) + exports.expectedRequests(depth - 1) : 0;
}

exports.gotoResultPage = function(startingHashtag, results) {
    this.startingHashtag = startingHashtag;
    populateResultPage(results);
    this.hide($("#inputForm, #progressBarContainer"));
    this.show($("#result, #inputFormSubmit"));
    $("#hashtag").val(null);
}

exports.pickHashtags = function() {
    for (const bucket of buckets) {
        shuffle(bucket.bucket);
    }

    let hashtags = ["#" + this.startingHashtag];
    for (const bucket of buckets) {
        for (let i = 0; i < Math.round(RESULTING_HASHTAGS * bucket.pick); i++) {
            let randomHashtag = bucket.bucket[i];
            if(randomHashtag !== undefined) {
                hashtags.push("#" + randomHashtag.name);
            } else {
                break;
            }
        }
    }

    $("#resultingHashtags").html(hashtags.join("\n"));
}

exports.updateApproximations = function () {
    let depth = parseInt($("#recursionDepth").val());
    let expectedRequests = expectedRequestsWithoutDuplicates(depth);
    $("#maximumRequests").html(expectedRequests);
    $("#duration").html(humanizeDuration(Hashtag.MINIMUM_WAITTIME * expectedRequests) + " up to " +
        humanizeDuration(Hashtag.MAXIMUM_WAITTIME * expectedRequests));
}

exports.setProgressBar = function (value) {
    $("#progressBar")
        .attr("aria-valuenow", value)
        .css("width", value > 0 ? value + "%" : "0")
        .html(value + "%");
}

exports.hide = function (elements) {
    elements.addClass("d-none");
}

exports.show = function (elements) {
    elements.removeClass("d-none");
}

exports.showError = function (message) {

    console.error(message);

    let error = "<div class=\"alert alert-danger alert-dismissible\" role=\"alert\" id=\"errorBar\">" +
        "<strong>Error!</strong> " + message +
        "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
        "<span aria-hidden=\"true\">&times;</span></button></div>";

    $("#errorMessage").html(error);
}

exports.checkDebug = function () {
    if (urlParams.get("skipRequests") !== null) {
        $.getJSON("hashtags.json", results => {
            console.log("[DEBUG] Skipping requests...");
            this.gotoResultPage(results[0].name, results);
        }).fail(err => console.err("Error loading hashtags.json from server: " + err));
    }
}

exports.attachClipboardMessageHandlers = function(clipboard) {
    clipboard
        .on("success", () => postClipboardMessage("Copied!", "text-success"))
        .on("error", () => postClipboardMessage("Copy failed!", "text-danger"));
}
