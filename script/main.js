/*
 *  MODEL
 */
function Item(channel) {
  var detailsRegExp = new RegExp(/^((?:.|\n)*)<!--more-->((?:.|\n)*)$/gi);

  this.channel = channel;

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
    var authorshipP = document.createElement('p');
    authorshipP.appendChild(document.createTextNode('Publicado en '));
    authorshipP.appendChild(this.channel.renderLink());
    if (this.date) {
      authorshipP.appendChild(document.createTextNode(' el '));
      var dateText = document.createTextNode(this.date.toDateString());
      authorshipP.appendChild(dateText);
    }
    if (this.creator) {
      authorshipP.appendChild(document.createTextNode(' por '));
      authorshipP.appendChild(document.createTextNode(this.creator));
    }
    header.appendChild(authorshipP);
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
    if (this.categories) {
      var tagsSection = document.createElement('section');
      tagsSection.setAttribute('class', 'tags');
      var tagsP = document.createElement('p');
      tagsSection.appendChild(tagsP);
      tagsP.appendChild(document.createTextNode('Tags: '));
      for (var category of this.categories) {
        var tagSpan = document.createElement('span');
        tagSpan.setAttribute('class', 'tag');
        tagSpan.appendChild(document.createTextNode(category));
        tagsP.appendChild(tagSpan);
        tagsP.appendChild(document.createTextNode(' '));
      }
      article.append(tagsSection);
    }
    return article;
  }
}

Item.fromRSS = function (channel, xml) {
  var item = new Item(channel);
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
  var xauthor = xml.getElementsByTagName('author');
  if (xauthor.length > 0) {
    item.author = xauthor[0].firstChild.nodeValue;
  }
  var xcategories = xml.getElementsByTagName('category');
  if (xcategories.length > 0) {
    item.categories = [];
    for (var xcategory of xcategories) {
      item.categories.push(xcategory.firstChild.nodeValue);
    }
  }
  var xpubDate = xml.getElementsByTagName('pubDate');
  if (xpubDate.length > 0) {
    item.date = new Date(xpubDate[0].firstChild.nodeValue);
  }
  return item;
}

function Channel(title, description, link) {
  this.title = title;
  this.description = description;
  this.link = link;
  this.items = [];

  this.renderLink = function () {
    var a = document.createElement('a');
    a.setAttribute('href', this.link);
    a.setAttribute('target', '__blank');
    a.appendChild(document.createTextNode(this.title));
    return a;
  }
}

Channel.fromRSS = function (xml) {
  if (!xml) return null;
  var xchannel = xml.getElementsByTagName('channel')[0];
  var title = xchannel.getElementsByTagName('title')[0].firstChild.nodeValue;
  var description = xchannel.getElementsByTagName('description')[0].firstChild.nodeValue;
  var link = xchannel.getElementsByTagName('link')[0].firstChild.nodeValue;
  var channel = new Channel(title, description, link);
  var items = xchannel.getElementsByTagName('item');
  for (var item of items) {
    channel.items.push(Item.fromRSS(channel, item));
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
    for (var item of feed.items) {
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
    this.renderHelp();
  }

  this.updateFeed = function () {
    if (feedUrlTextbox.checkValidity()) {
      controller.loadFeed(feedUrlTextbox.value, this.renderFeed,
        this.renderError);
    } else {
      if (!/[a-zA-Z]:\/\/.*/gi.exec(feedUrlTextbox.value)) {
        feedUrlTextbox.value = 'http://' + feedUrlTextbox.value;
        if (feedUrlTextbox.checkValidity()) {
          controller.loadFeed(feedUrlTextbox.value, this.renderFeed,
            this.renderError);
        }
      }
    }
  }

  this.renderFeed = function () {
    while (mainElement.firstChild) {
      mainElement.removeChild(mainElement.firstChild);
    }
    var articles = controller.renderFeed();
    for (var article of articles) {
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

  this.renderHelp = function () {
    controller.loadFeed(helpFeed, this.renderFeed, this.renderError);
  }
}

view = new View(new Controller());
