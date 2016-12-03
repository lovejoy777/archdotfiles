The jQuery dependency was added when including support for nested menus.
The reason for this being that jQuery has logic to calculate an element's
offset top and left relative to the document.body, vs just the parent element.