/*
 *  MODEL
 */
function Item() {
  this.render = function () {
    var article = document.createElement('article');
    var header = document.createElement('header');
    var h2 = document.createElement('h2');
    var titleNode = document.createTextNode(this.title);
    h2.appendChild(titleNode);
    header.appendChild(h2);
    article.append(header);
    var contentSection = document.createElement('section');
    contentSection.innerHTML= this.description;
    article.append(contentSection);
    return article;
  }
}

Item.fromRSS = function (xml) {
  var title = xml.getElementsByTagName('title')[0].firstChild.nodeValue;
  var description = xml.getElementsByTagName('description')[0].firstChild.nodeValue;
  var item = new Item();
  item.title = title;
  item.description = description;
  return item;
}

function Channel(title, description, link) {
  this.title = title;
  this.description = description;
  this.link = link;
  this.items = [];
}

Channel.fromRSS = function (xml) {
  var xchannel = xml.getElementsByTagName('channel')[0];
  var title = xchannel.getElementsByTagName('title')[0].firstChild.nodeValue;
  var description = xchannel.getElementsByTagName('description')[0].firstChild.nodeValue;
  var link = xchannel.getElementsByTagName('link')[0].firstChild.nodeValue;
  var channel = new Channel(title, description, link);
  var items = xchannel.getElementsByTagName('item');
  for (item of items) {
    channel.items.push(Item.fromRSS(item));
  }
  return channel;
}



/*
 *  CONTROLLER
 */
function Controller() {
  var feed = null;

  this.loadFeed = function (url, callback, error_callback) {
    var request = new XMLHttpRequest();
    var controller = this;
    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          controller.parseRSS(this.responseXML);
          callback();
        } else {
          error_callback(this.status);
        }
      }
    };
    request.open('GET', 'https://crossorigin.me/' + url, true);
    request.send();
  }

  this.parseRSS = function (xml) {
    feed = Channel.fromRSS(xml);
  }

  this.renderFeed = function () {
    var articles = [];
    for (item of feed.items) {
      articles.push(item.render());
    }
    return articles;
  }
}



/*
 *  VIEW
 */

function View(controller) {
  var feedUrlTextbox = null;
  var mainElement = null;

  window.onload = () => {
    feedUrlTextbox = document.getElementById('feed-url');
    mainElement = document.getElementById('main');
  }

  this.updateFeed = function () {
    if (feedUrlTextbox.checkValidity()) {
      controller.loadFeed(feedUrlTextbox.value, this.renderFeed,
        this.renderError);
    }
  }

  this.renderFeed = function () {
    while (mainElement.firstChild) {
      mainElement.removeChild(mainElement.firstChild);
    }
    var articles = controller.renderFeed();
    for (article of articles) {
      mainElement.appendChild(article);
    }
  }

  this.renderError = function (error) {

  }
}

view = new View(new Controller());