/*
 * Imports
 */

const _ = require("./functions.js");
const ObservableInteger = require("./ObservableInteger.js");
const Hashtag = require("./Hashtag.js");

/*
 * Constants
 */

const recursionDepth = 2;

/*
 * Script
 */

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
        _.showError("You have to define a hashtag to search for!");
        hashtag.val("");
        hashtag.focus();
        return;
    }

    _.setProgressBar(0);
    hashtag.prop("disabled", true);

    _.hide($("#inputFormSubmit"));
    _.show($("#progressBarContainer"));

    let expected = new ObservableInteger(_.expectedRequests(recursionDepth));
    let requestCounter = new ObservableInteger(0);

    expected.addListener(expected => _.setProgressBar(Math.round(requestCounter.get() / expected * 100)));
    requestCounter.addListener(current => _.setProgressBar(Math.round(current / expected.get() * 100)));

    Hashtag.getHashtagsRecursively(sanitizedInput, recursionDepth, requestCounter, expected)
        .then(results => _.gotoResultPage(sanitizedInput, results))
        .catch(reason => {
            _.showError(reason);
            _.hide($("#progressBarContainer"));
            _.show($("#inputFormSubmit"));
        })
        .then(() => hashtag.prop("disabled", false));
});

$("#retryButton").click(() => {
    $(".alert").alert("close");
    _.hide($("#result"));
    _.show($("#inputForm"));
    $("#hashtag").focus();
});

$("#shuffleButton").click(() => _.pickHashtags());
$("#recursionDepth").change(() => _.updateApproximations());

_.updateApproximations();
_.checkDebug();
