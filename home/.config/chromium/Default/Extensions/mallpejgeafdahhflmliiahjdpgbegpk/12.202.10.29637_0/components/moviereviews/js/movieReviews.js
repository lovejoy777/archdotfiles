var MovieReview = {
    name: '',

    init: function() {
		addEvtListener(document.getElementById("close-button"), "click", MovieReview.closeWindow);
		addEvtListener(document.getElementById("selectFeed0"), "click", function(event) {
			MovieReview.selectFeed(0);
		});
		addEvtListener(document.getElementById("selectFeed1"), "click", function(event) {
			MovieReview.selectFeed(1);
		});
		addEvtListener(document.getElementById("feedLink"), "click", function(event) {
			return MovieReview.handleFeedLinkClick('http://rottentomatoes.com');
		});

        this.name = window.location.search.substr(1);
        this.selectFeed(0);

		$('#mainContent').on("click", ".handleLinkClick", function(event) {
			var url = $(this).data('url');
			return MovieReview.handleFeedLinkClick(url);
		});
    },

    topMoviesFeed : {
        url:"http://www.rottentomatoes.com/syndication/rss/top_movies.xml",
        items: new Array(),
        render: function() {
            document.getElementById("topFeeds").innerHTML = "";
            var myDiv = "";
            var len = (this.items.length > 5) ? 5 : this.items.length;
            for (var i = 0; i < len; i++) {
                myDiv += MovieReview.renderRawFeeds("topFeeds", this.items[i]);
            }
            document.getElementById("topFeeds").innerHTML = "<div class='feedLeftTitle'>Top Box Office</div>" + myDiv;
        }
    },
    openingMoviesFeed : {
        url:"http://www.rottentomatoes.com/syndication/rss/opening.xml",
        items: new Array(),
        render: function() {
            document.getElementById("openFeeds").innerHTML = "";
            var myDiv = "";
            var len = (this.items.length > 5) ? 5 : this.items.length;
            for (var i = 0; i < len; i++) {
                myDiv += MovieReview.renderRawFeeds("openFeeds", this.items[i]);
            }
            document.getElementById("openFeeds").innerHTML = "<div class='feedRightTitle'>Opening This Week</div>" + myDiv;
        }
    },
    freshMovieFeed : {
        url:"http://www.rottentomatoes.com/syndication/rss/movie_certified_fresh.xml",
        items: new Array(),
        render: function() {
            document.getElementById("frmovieFeeds").innerHTML = "";
            var len = (this.items.length > 1) ? 1 : this.items.length;
            var myDiv = "";
            for (var i = 0; i < len; i++) {
                myDiv += MovieReview.renderfrFeeds("frmovieFeeds", this.items[i]);
            }
            document.getElementById("frmovieFeeds").innerHTML = "<div class='certFreshDiv' style='width:470px;'><div class='floatLeft' style='width:70px;height:60px;margin:5px;'><img src='http://ak.imgfarm.com/images/toolbar/filmfan/reviews/cf_70x60.gif' width='70px' height='60px' border='0' /></div>" + "<div class='floatLeft' style='width:380px;'><div class='feedBottomTitle' style='vertical-align:top; width:100%; margin-top:0;margin-bottom:-20px'>Certified Fresh Pick of the Week</div><br />" + myDiv + "</div>";
        }
    },
    newDvdsFeed : {
        url:"http://www.rottentomatoes.com/syndication/rss/new_releases.xml",
        items: new Array(),
        render: function() {
            document.getElementById("newvidFeeds").innerHTML = "";
            var myDiv = "";
            var len = (this.items.length > 5) ? 5 : this.items.length;
            for (var i = 0; i < len; i++) {
                myDiv += MovieReview.renderRawFeeds("newvidFeeds", this.items[i]);
            }
            document.getElementById("newvidFeeds").innerHTML = "<div class='feedLeftTitle'>New DVD Releases</div>" + myDiv;
        }
    },
    topDvdsFeed : {
        url:"http://www.rottentomatoes.com/syndication/rss/top_dvds.xml",
        items: new Array(),
        render: function() {
            document.getElementById("topdvdFeeds").innerHTML = "";
            var myDiv = "";
            var len = (this.items.length > 5) ? 5 : this.items.length;
            for (var i = 0; i < len; i++) {
                myDiv += MovieReview.renderRawFeeds("topdvdFeeds", this.items[i]);

            }
            document.getElementById("topdvdFeeds").innerHTML = "<div class='feedRightTitle'>Top DVD Rentals</div>" + myDiv;
        }

    },
    freshDvdsFeed : {
        url:"http://www.rottentomatoes.com/syndication/rss/video_certified_fresh.xml",
        items: new Array(),
        render: function() {
            document.getElementById("frvidFeeds").innerHTML = "";
            var myDiv = "";
            var len = (this.items.length > 1) ? 1 : this.items.length;
            for (var i = 0; i < len; i++) {
                myDiv += MovieReview.renderfrFeeds("frvidFeeds", this.items[i]);
            }
            document.getElementById("frvidFeeds").innerHTML = "<div class='certFreshDiv' style='width:470px;'><div class='floatLeft' style='width:70px;height:60px;margin:5px;'><img src='http://ak.imgfarm.com/images/toolbar/filmfan/reviews/cf_70x60.gif' width='70px' height='60px' border='0' /></div>" + "<div class='floatLeft' style='width:380px;'><div class='feedBottomTitle' style='vertical-align:top; width:100%; margin-top:0;margin-bottom:-20px'>Certified Fresh Pick of the Week</div><br />" + myDiv + "</div>";
        }
    },

    getFileAsync: function(config) {
        chrome.extension.sendRequest({name: this.name, cmd: 'feed', url: config.feed.url}, function(response) {
            if (response.success) {
                var result = {
                    feed: config.feed,
                    text: response.text,
                    xml: new DOMParser().parseFromString(response.text, "text/xml")
                };
                config.success.apply(null, [result]);
            } else {
                config.error.apply(null, [
                    {text: response.text}
                ]);
            }
        });
    },

    rssLoadSuccess: function(response) {
        var feed = response.feed;
        var xmlDoc = response.xml;

        feed.items = xmlDoc.getElementsByTagName("item");
        feed.render();
    },

    rssLoadError: function(response) {
        alert('RSS load error: ' + response.text);
    },

    loadRssFeed: function(feed) {
        if (feed.items && feed.items.length > 0) {
            return;
        }
        this.getFileAsync({feed: feed, success: MovieReview.rssLoadSuccess, error: MovieReview.rssLoadError});
    },

    formatfrmovieFeedDesc: function(s) {
        var token = "Read More ></a>";
        var pos = s.search(token);
        if (pos >= 0) {
            s = s.substring(0, pos + token.length);
        }

        //remove "Read More >" links
        s = s.replace(/<a\b[^>]*>Read More ><\/a>/, "");
        //remove image from the description
        return Common.trim(s.replace(/<img[^>]*>/, ""));

    },

    formatFeedTitle: function(s, url) {
        var token = "% ";
        var percent = "";
        var words = "";
        var pos = s.search(token);
        if (pos >= 0) {
            percent = Common.trim(s.substring(0, pos + token.length));
            words = Common.trim(s.substring(pos + token.length, s.length));
            s = "<div class='perCent'>" + percent + "&nbsp;</div><div style='float:left; width:180px'><a href='#' class='handleLinkClick' data-url='" + url + "'>" + words + "</a></div>";
        } else {
            words = s;
            s = "<div class='perCent'>&nbsp;&mdash;&nbsp;</div><div style='float:left; width:180px'><a href='#' class='handleLinkClick' data-url='" + url + "'>" + words + "</a></div>";
        }
        return s;
    },

    formatFeedDesc: function(s) {
        var token = "Read more</a>";

        var pos = s.search(token);
        if (pos >= 0) {
            s = s.substring(0, pos + token.length);
        }

        //remove "Filed under..."
        s = s.replace(/<p\b[^>]*>(.*?)<\/p>/, "");
        //remove space line
        s = s.replace(/<br \/>/, "");
        //remove read more links
        s = s.replace(/<a\b[^>]*>Read more<\/a>/, "");
        //remove image from the description
        return Common.trim(s.replace(/<img[^>]*>/, ""));
    },

    loadMovieFeeds: function() {
        this.loadRssFeed(this.topMoviesFeed);
        this.loadRssFeed(this.openingMoviesFeed);
        this.loadRssFeed(this.freshMovieFeed);
    },

    loadVideoFeeds: function() {
        this.loadRssFeed(this.newDvdsFeed);
        this.loadRssFeed(this.topDvdsFeed);
        this.loadRssFeed(this.freshDvdsFeed);
    },

    selectFeed: function(i) {
        this.updateSelection(i);
        switch (i) {
            case 0:
                this.loadMovieFeeds();
                break;
            case 1:
                this.loadVideoFeeds();
                break;

        }
    },

    updateSelection: function(i) {
        document.getElementById("movie_item").style.backgroundImage = "";
        document.getElementById("video_item").style.backgroundImage = "";
        document.getElementById("a_movie").style.color = "#333333";
        document.getElementById("a_video").style.color = "#333333";
        document.getElementById("movieFeeds").style.display = "none";
        document.getElementById("videoFeeds").style.display = "none";
        document.getElementById("movie_item").style.borderBottomWidth = 1;
        document.getElementById("video_item").style.borderBottomWidth = 1;

        switch (i) {
            case 0:
                document.getElementById("movie_item").style.backgroundImage = "url('http://ak.imgfarm.com/images/toolbar/filmfan/tab_bg_red2.png')";
                document.getElementById("a_movie").style.color = "#ffffff";
                document.getElementById("movieFeeds").style.display = "block";
                document.getElementById("movie_item").style.borderBottomWidth = 0;
                break;
            case 1:
                document.getElementById("video_item").style.backgroundImage = "url('http://ak.imgfarm.com/images/toolbar/filmfan/tab_bg_red2.png')";
                document.getElementById("a_video").style.color = "#ffffff";
                document.getElementById("videoFeeds").style.display = "block";
                document.getElementById("video_item").style.borderBottomWidth = 0;
                break;

        }
    },

    renderfrFeeds: function(div_id, feedNode) {
        var tomatoRate = "";
        tomatoRate = this.getFreshSplat(div_id, feedNode);

        var url = this.getNodeValue(feedNode.getElementsByTagName("link")[0]);
        return  "<div class='feedBlockFr' >" +
                "<div class='feedTitleFr floatLeft'>" + tomatoRate +
                this.formatFeedTitle(this.getNodeValue(feedNode.getElementsByTagName("title")[0]), url) +
                "</div>" +
                "<div class='feedDescFr floatLeft'>" + this.formatfrmovieFeedDesc(this.getNodeValue(feedNode.getElementsByTagName("description")[0])) + "</div>" +
                "</div><div class='space floatLeft'></div>";
    },

    getFreshSplat: function(div_id, feedNode) {
        var tomatoRate = "";
        var myRate = "";

        var nodes = feedNode.getElementsByTagNameNS("http://www.rottentomatoes.com/xmlns/rtmovie/", "tomatometer_percent");

        if (nodes.length) {
            myRate = this.getNodeValue(nodes[0]);
        }

        if (myRate > 0) {
            if (myRate > 50) {
                tomatoRate = '<div class="tomatoRate floatLeft" style="width:18px;float:left;"><img src="http://ak.imgfarm.com/images/toolbar/filmfan/reviews/fresh.png" alt="fresh" width="16" height="14" border="none"/></div>';
            } else {
                tomatoRate = '<div class="tomatoRate floatLeft" style="width:18px;float:left;"><img src="http://ak.imgfarm.com/images/toolbar/filmfan/reviews/splat.png" alt="splat" width="16" height="14" border="none"/></div>';
            }
        } else {
            tomatoRate = '<div class="tomatoRate floatLeft" style="width:18px;float:left;">&nbsp;</div>';
        }


        return tomatoRate;
    },

    handleFeedLinkClick: function(url) {
        chrome.extension.sendRequest({name: this.name, cmd: 'navigate', url: url});
    },

    closeWindow: function() {
        chrome.extension.sendRequest({name: MovieReview.name, cmd: 'close'});
    },

    renderRawFeeds: function(div_id, feedNode) {
        var tomatoRate = "";

        tomatoRate = this.getFreshSplat(div_id, feedNode);
        var url = this.getNodeValue(feedNode.getElementsByTagName("link")[0]);
        return  "<div class='feedBlock floatLeft' >" +
                "<div class='feedTitle floatLeft'>" + tomatoRate +
                this.formatFeedTitle(this.getNodeValue(feedNode.getElementsByTagName("title")[0]), url) +
                "</div></div>";
    },

    getNodeValue: function(node) {
        if (node && node.firstChild) {
            return Common.trim(node.firstChild.nodeValue);
        } else {
            return null;
        }
    }
};

addEvtListener(window, 'load', function() {MovieReview.init()});