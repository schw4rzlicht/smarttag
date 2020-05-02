const humanizeDuration = require("humanize-duration");
const Hashtag = require("./Hashtag.js");

let buckets = null;

/*
 * Internal functions
 */

function getBucketHtml(bucketSize, bucketId, hashtags) {

    let result = "<div id=\"bucket" + bucketId + "\" class=\"bucket\">" +
        "Min: " + bucketSize.minWeight + ", max: " + bucketSize.maxWeight + "<ul>";

    for (const hashtag of hashtags) {
        if (bucketSize.minWeight <= hashtag.weight && hashtag.weight <= bucketSize.maxWeight) {
            result += "<li><strong>" + hashtag.name + "</strong> (" + hashtag.weight + ")</li>";
        }
    }

    return result + "</ul></div>";
}

function getBucketSizes(hashtags) {

    // TODO Find better distribution

    let minWeight = -1;
    let maxWeight = -1;

    for (const hashtag of hashtags) {
        if (hashtag.weight < minWeight || minWeight < 0) {
            minWeight = hashtag.weight;
        }
        if (hashtag.weight > maxWeight) {
            maxWeight = hashtag.weight;
        }
    }

    let bucketSize = Math.floor((maxWeight - minWeight) / 3);

    if (bucketSize > 0) {
        return [
            {minWeight: minWeight, maxWeight: minWeight + bucketSize},
            {minWeight: minWeight + bucketSize + 1, maxWeight: minWeight + 2 * bucketSize},
            {minWeight: minWeight + 2 * bucketSize + 1, maxWeight: maxWeight}
        ];
    } else {
        return [
            {minWeight: minWeight, maxWeight: maxWeight}
        ];
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

/*
 * Internal and exposed functions
 */

exports.expectedRequests = function expectedRequests(depth) {
    return depth >= 0 ? Math.pow(10, depth) + expectedRequests(depth - 1) : 0;
}

/*
 * Exposed functions
 */

exports.updateApproximations = function() {
    let depth = parseInt($("#recursionDepth").val());
    let expectedRequests = expectedRequestsWithoutDuplicates(depth);
    $("#maximumRequests").html(expectedRequests);
    $("#duration").html(humanizeDuration(Hashtag.MINIMUM_WAITTIME * expectedRequests) + " up to " +
        humanizeDuration(Hashtag.MAXIMUM_WAITTIME * expectedRequests));
}

exports.populateResultPage = function(hashtags) {

    let bucketSizes = getBucketSizes(hashtags);
    let bucketHtml = "";

    for (let i = 0; i < bucketSizes.length; i++) {
        bucketHtml += getBucketHtml(bucketSizes[i], i, hashtags);
    }

    $("#buckets").html(bucketHtml);
}

exports.setProgressBar = function(value) {
    $("#progressBar")
        .attr("aria-valuenow", value)
        .css("width", value > 0 ? value + "%" : "0")
        .html(value + "%");
}

exports.hide = function(elements) {
    elements.addClass("d-none");
}

exports.show = function(elements) {
    elements.removeClass("d-none");
}

exports.showError = function(message) {

    console.error(message);

    let error = "<div class=\"alert alert-danger alert-dismissible\" role=\"alert\" id=\"errorBar\">" +
        "<strong>Error!</strong> " + message +
        "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
        "<span aria-hidden=\"true\">&times;</span></button></div>";

    $("#errorMessage").html(error);
}