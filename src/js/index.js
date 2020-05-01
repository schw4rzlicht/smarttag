const Hashtag = require("./Hashtag.js");
const ObservableInteger = require("./ObservableInteger.js");

const recursionDepth = 2;

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

function populateResultPage(results) {

    let content = "";
    for (const result of results) {

        let related = "<i>none</i>";
        if (result.related !== undefined && result.related.length > 0) {
            related = result.related.join(", ");
        }

        content += "<p><strong>" + result.name + "</strong><br>" +
            "Weight: " + result.weight + "<br>" +
            "Related: " + related +
            "</ul></p>";
    }

    if (content === "") {
        content = "<i>none</i>";
    }

    $("#hashtagListing").html(content);
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

$("#hashtag").focus();

$("#hashtagSearchForm").submit(event => {
    event.preventDefault();

    setProgressBar(0);

    let hashtag = $("#hashtag");
    hashtag.prop("disabled", true);

    hide($("#inputFormSubmit"));
    show($("#progressBarContainer"));

    let sanitizedInput = hashtag.val();
    if (sanitizedInput.substring(0, 1) === "#") {
        sanitizedInput = sanitizedInput.substring(1, sanitizedInput.length + 1);
    }

    let expected = new ObservableInteger(expectedRequests(recursionDepth));
    let requestCounter = new ObservableInteger();

    expected.addListener(expected => setProgressBar(Math.round(requestCounter.get() / expected * 100)));
    requestCounter.addListener(current => setProgressBar(Math.round(current / expected.get() * 100)));

    console.log("Expecting " + expected.get() + " requests.");

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
