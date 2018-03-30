/*
 *  MODEL
 */
function Item() {
  var detailsRegExp = new RegExp(/^((?:.|\n)*)<!--more-->((?:.|\n)*)$/gi);
  this.render = function () {
    var article = document.createElement('article');
    var header = document.createElement('header');
    if (this.title) {
      var h2 = document.createElement('h2');
      var titleNode = document.createTextNode(this.title);
      if (this.link) {
        var a = document.createElement('a');
        a.setAttribute('href', this.link);
        a.setAttribute('target', '__blank');
        a.appendChild(titleNode);
        h2.appendChild(a);
      } else {
        h2.appendChild(titleNode);
      }
      header.appendChild(h2);
    }
    if (this.creator) {
      var creatorP = document.createElement('p');
      creatorP.appendChild(document.createTextNode('Por '));
      creatorP.appendChild(document.createTextNode(this.creator));
      header.appendChild(creatorP);
    }
    article.append(header);
    if (this.description) {
      var contentSection = document.createElement('section');
      var descriptionParts = detailsRegExp.exec(this.description);
      if (descriptionParts) {
        var details = document.createElement('details');
        var summary = document.createElement('summary');
        summary.innerHTML = descriptionParts[1];
        details.appendChild(summary);
        var moreSection = document.createElement('section');
        moreSection.innerHTML = descriptionParts[2];
        details.appendChild(moreSection);
        contentSection.appendChild(details);
      } else {
        contentSection.innerHTML = this.description;
      }
      article.append(contentSection);
    }
    return article;
  }
}

Item.fromRSS = function (xml) {
  var item = new Item();
  var xtitle = xml.getElementsByTagName('title');
  if (xtitle.length > 0) {
    item.title = xtitle[0].firstChild.nodeValue;
  }
  var xdescription = xml.getElementsByTagName('description');
  if (xdescription.length > 0) {
    xdescription = xdescription[0].firstChild;
    var description = '';
    do {
      description += xdescription.nodeValue;
      xdescription = xdescription.nextSibling;
    } while (xdescription);
    item.description = description;
  }
  var xlink = xml.getElementsByTagName('link');
  if (xlink.length > 0) {
    item.link = xlink[0].firstChild.nodeValue;
  }
  var xcreator = xml.getElementsByTagName('dc:creator');
  if (xcreator.length > 0) {
    item.creator = xcreator[0].firstChild.nodeValue;
  }
  return item;
}

function Channel(title, description, link) {
  this.title = title;
  this.description = description;
  this.link = link;
  this.items = [];
}

Channel.fromRSS = function (xml) {
  if (!xml) return null;
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
          if (controller.parseRSS(this.responseXML)) {
            callback();
          } else {
            error_callback('Vaya, no puedo entender el formato de ese feed.');
          }
        } else {
          error_callback(this.status);
        }
      }
    };
    //A cross-origin proxy is needed to do AJAX to a different host. See CORS.
    request.open('GET', 'https://crossorigin.me/' + url, true);
    request.send();
  }

  this.parseRSS = function (xml) {
    feed = Channel.fromRSS(xml);
    return feed != null;
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
  var helpFeed = document.location + 'help.xml';

  window.onload = () => {
    feedUrlTextbox = document.getElementById('feed-url');
    mainElement = document.getElementById('main');
    controller.loadFeed(helpFeed, this.renderFeed, this.renderError);
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
    while (mainElement.firstChild) {
      mainElement.removeChild(mainElement.firstChild);
    }
    var p = document.createElement('p');
    p.setAttribute('class', 'big-message');
    var errorString = '¡Ups! No hay nada por aquí.';
    if (typeof error === 'string') {
      errorString = error;
    } else {
      switch (error) {
        case 404:
          errorString = 'No he encontrado nada en esa dirección.';
          break;
        case 403:
          errorString = '¡No tienes permiso para hacer eso!';
          break;
      }
    }
    p.appendChild(document.createTextNode(errorString));
    mainElement.appendChild(p);
  }
}

view = new View(new Controller());
