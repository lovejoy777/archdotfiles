var Common = {
	isNull: function (v) {
		return typeof(v) === 'undefined' || v === null;
	},

    trim: function (s) {
        if (this.isNull(s))
            return null;
        return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
    }
};