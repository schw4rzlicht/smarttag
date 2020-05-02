const Hashtag = require("./Hashtag.js");
const ObservableInteger = require("./ObservableInteger.js");
const humanizeDuration = require("humanize-duration");

const recursionDepth = 2;
const recursionDepthElement = $("#recursionDepth");

let buckets = null;

function hide(elements) {
    elements.addClass("d-none");
}

function show(elements) {
    elements.removeClass("d-none");
}

function showError(message) {

    console.error(message);

    let error = "<div class=\"alert alert-danger alert-dismissible\" role=\"alert\" id=\"errorBar\">" +
        "<strong>Error!</strong> " + message +
        "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
        "<span aria-hidden=\"true\">&times;</span></button></div>";

    $("#errorMessage").html(error);
}

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

function populateResultPage(hashtags) {

    let bucketSizes = getBucketSizes(hashtags);
    let bucketHtml = "";

    for (let i = 0; i < bucketSizes.length; i++) {
        bucketHtml += getBucketHtml(bucketSizes[i], i, hashtags);
    }

    $("#buckets").html(bucketHtml);
}

function setProgressBar(value) {
    $("#progressBar")
        .attr("aria-valuenow", value)
        .css("width", value > 0 ? value + "%" : "0")
        .html(value + "%");
}

function expectedRequests(depth) {
    return depth >= 0 ? Math.pow(10, depth) + expectedRequests(depth - 1) : 0;
}

function expectedRequestsWithoutDuplicates(depth) {
    if (depth < 0) {
        return 0;
    } else if (depth === 0) {
        return 1;
    }
    return 10 * Math.pow(9, depth - 1) + expectedRequestsWithoutDuplicates(depth - 1);
}

function updateApproximations() {
    let depth = parseInt(recursionDepthElement.val());
    let expectedRequests = expectedRequestsWithoutDuplicates(depth);
    $("#maximumRequests").html(expectedRequests);
    $("#duration").html(humanizeDuration(Hashtag.MINIMUM_WAITTIME * expectedRequests) + " up to " +
        humanizeDuration(Hashtag.MAXIMUM_WAITTIME * expectedRequests));
}

$("#hashtag").focus();

$("#hashtagSearchForm").submit(event => {
    event.preventDefault();

    $(".alert").alert("close");

    let hashtag = $("#hashtag");

    let sanitizedInput = hashtag.val().trim();
    if (sanitizedInput.substring(0, 1) === "#") {
        sanitizedInput = sanitizedInput.substring(1, sanitizedInput.length + 1);
    }

    if (sanitizedInput === "") {
        showError("You have to define a hashtag to search for!");
        hashtag.val("");
        hashtag.focus();
        return;
    }

    setProgressBar(0);
    hashtag.prop("disabled", true);

    hide($("#inputFormSubmit"));
    show($("#progressBarContainer"));

    let expected = new ObservableInteger(expectedRequests(recursionDepth));
    let requestCounter = new ObservableInteger(0);

    expected.addListener(expected => setProgressBar(Math.round(requestCounter.get() / expected * 100)));
    requestCounter.addListener(current => setProgressBar(Math.round(current / expected.get() * 100)));

    Hashtag.getHashtagsRecursively(sanitizedInput, recursionDepth, requestCounter, expected)   // TODO Make recursive depth changeable
        .then(result => {
            populateResultPage(result);
            hide($("#inputForm, #progressBarContainer"));
            show($("#result, #inputFormSubmit"));
            $("#hashtag").val(null);
        })
        .catch(reason => {
            showError(reason);
            hide($("#progressBarContainer"));
            show($("#inputFormSubmit"));
        })
        .then(() => hashtag.prop("disabled", false));
});

$("#retryButton").click(() => {
    hide($("#result"));
    show($("#inputForm"));
    $("#hashtag").focus();
});

recursionDepthElement.change(() => {
    updateApproximations();
});

updateApproximations();
