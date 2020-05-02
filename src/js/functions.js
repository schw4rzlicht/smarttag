const humanizeDuration = require("humanize-duration");
const Hashtag = require("./Hashtag.js");

/*
 * Constants
 */

const BUCKET_RANGES = [
    { name: "up to 100000 uses", criteria: weight => weight <= 100000 },
    { name: "up to 1000000 uses", criteria: weight => 100000 < weight && weight <= 1000000 },
    { name: "above 1000000 uses", criteria: weight => 1000000 < weight }
];
const urlParams = new URLSearchParams(window.location.search);

/*
 * Variables
 */

let buckets = null;

/*
 * Internal functions
 */

function getBucketHtml(bucketId) {

    let result = "<div id='bucket" + bucketId + "' class='card'>" +
        "<div class='card-header' id='headingBucket" + bucketId + "'>" +
        "<h2 class='mb-0'><button class='btn btn-link' type='button' data-toggle='collapse' " +
        "data-target='#collapseBucket" + bucketId + "' aria-expanded='" + (bucketId === 0 ? "true" : "false") +
        "' aria-controls='collapseBucket" + bucketId + "'>" + BUCKET_RANGES[bucketId].name + "</button></h2></div>" +
        "<div id='collapseBucket" + bucketId + "' class='collapse" + (bucketId === 0 ? " show" : "") + "' " +
        "aria-labelledby='headingBucket" + bucketId + "' data-parent='#buckets'><div class='card-body'>";

    if(buckets[bucketId].length > 0) {
        result += "<ul>";
        for (const hashtag of buckets[bucketId]) {
            result += "<li><strong>" + hashtag.name + "</strong> (" + hashtag.weight + ")</li>";
        }
        result += "</ul>";
    } else {
        result += "<i>none</i>";
    }

    return result + "</div></div></div>";
}

function createBuckets(hashtags) {

    hashtags.sort((a, b) => a.weight < b.weight ? 1 : -1);

    buckets = [];
    for (const bucketRange of BUCKET_RANGES) {

        let bucket = [];

        for (const hashtag of hashtags) {
            if(bucketRange.criteria(hashtag.weight)) {
                bucket.push(hashtag);
            }
        }

        buckets.push(bucket);
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
}

/*
 * Internal and exposed functions
 */

exports.expectedRequests = function expectedRequests(depth) {
    return depth >= 0 ? Math.pow(10, depth) + expectedRequests(depth - 1) : 0;
}

exports.gotoResultPage = function gotoResultPage(results) {
    populateResultPage(results);
    this.hide($("#inputForm, #progressBarContainer"));
    this.show($("#result, #inputFormSubmit"));
    $("#hashtag").val(null);
}

/*
 * Exposed functions
 */

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
            this.gotoResultPage(results);
        }).fail(err => console.err("Error loading hashtags.json from server: " + err));
    }
}
