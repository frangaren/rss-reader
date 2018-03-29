function Controller() {
  var feed;

  this.loadFeed = function (url) {
    return null;
  }

  this.renderFeed = function () {
    return null;
  }
}

function View(controller) {
  var feedUrlTextbox = null;
  var mainElement = null;

  window.onload = () => {
    feedUrlTextbox = document.getElementById('feed-url');
    mainElement = document.getElementById('main');
  }

  this.updateFeed = function () {
    if (feedUrlTextbox.checkValidity()) {
      controller.loadFeed(feedUrlTextbox.value);
      var articles = controller.renderFeed();
      for (article of articles) {
        mainElement.appendChild(article);
      }
    }
  }
}

view = new View(new Controller());
