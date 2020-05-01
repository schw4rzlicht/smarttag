const Hashtag = require("./Hashtag.js");

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
        if(result.related !== undefined && result.related.length > 0) {
            related = result.related.join(", ");
        }

        content += "<p><strong>" + result.name + "</strong><br>" +
            "Weight: " + result.weight + "<br>" +
            "Related: " + related +
            "</ul></p>";
    }

    if(content === "") {
        content = "<i>none</i>";
    }

    $("#hashtagListing").html(content);
}

$("#hashtag").focus();

$("#hashtagSearchForm").submit(event => {
    hide($("#inputFormSubmit"));
    show($("#inputFormSpinner"));
    event.preventDefault();

    let sanitizedInput = $("#hashtag").val();
    if(sanitizedInput.substring(0, 1) === "#") {
        sanitizedInput = sanitizedInput.substring(1, sanitizedInput.length + 1);
    }

    Hashtag.getHashtagsRecursively(sanitizedInput, 2, 1000)   // TODO Make recursive depth changeable
        .then(result => {
            populateResultPage(result);
            hide($("#inputForm, #inputFormSpinner"));
            show($("#result, #inputFormSubmit"));
            $("#hashtag").val(null);
        })
        .catch(reason => {
            showError(reason);
            hide($("#inputFormSpinner"));
            show($("#inputFormSubmit"));
        });
});

$("#retryButton").click(() => {
    hide($("#result"));
    show($("#inputForm"));
    $("#hashtag").focus();
});
