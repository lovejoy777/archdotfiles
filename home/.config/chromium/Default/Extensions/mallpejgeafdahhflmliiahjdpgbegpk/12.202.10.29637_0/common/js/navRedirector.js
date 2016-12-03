var NavRedirector = {
    samePage: window.location.href + '#',
    redirectNavigation: function() {
        var self = this;
        var anchors = document.getElementsByTagName('a');
        for (var i = 0; i < anchors.length; i++) {
            this.redirectAnchor(anchors[i]);
        }

        var forms = document.getElementsByTagName('form');
        for (var j = 0; j < forms.length; j++) {
            this.redirectForm(forms[j]);
        }

        document.addEventListener('DOMNodeInserted', function(event) {
            var type = event.target.type;
            if (type == 'a') {
                self.redirectAnchor(event.target);
            } else if (type == 'form') {
                self.redirectForm(event.target);
            }
        });
    },

    redirectAnchor: function(anchor) {
		var isEmpty = function (v) {
			return typeof(v) === 'undefined' || v === null || v.length == 0;
		};

        //If it links to an external page (there are cases where the # could be later, but it is much harder to deal with)
        if (anchor.href && anchor.href.indexOf(this.samePage) != 0) {
            var target = anchor.target;
            if (isEmpty(target) || target == '_self') {
                anchor.target = '_top';
            }
        }
    },

    redirectForm: function(form) {
        form.target = '_top';
    }

};
