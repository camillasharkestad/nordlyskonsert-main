/* Språkvelger for nettsiden.
   Bytter teksten i alle elementer med data-i18n ut fra ordlistene i window.SITE_I18N
   (se lang-index.js og lang-om-marianne.js). Valget lagres i nettleseren og gjelder
   begge sidene. Lenker kan også tvinge et språk med ?lang=de, ?lang=en osv.
   Menyen bygges som en knapp med nedtrekksliste og små flagg (SVG). */
(function () {
  var config = window.SITE_I18N;
  if (!config || !config.strings) {
    return;
  }

  var STORAGE_KEY = "site-lang";
  var FLAGS = {
    no: "<svg viewBox='0 0 22 16' aria-hidden='true'><rect width='22' height='16' fill='#ba0c2f'/><rect x='6' width='4' height='16' fill='#fff'/><rect y='6' width='22' height='4' fill='#fff'/><rect x='7' width='2' height='16' fill='#00205b'/><rect y='7' width='22' height='2' fill='#00205b'/></svg>",
    en: "<svg viewBox='0 0 22 16' aria-hidden='true'><rect width='22' height='16' fill='#012169'/><path d='M0 0l22 16M22 0L0 16' stroke='#fff' stroke-width='3'/><path d='M0 0l22 16M22 0L0 16' stroke='#c8102e' stroke-width='1.2'/><rect x='9' width='4' height='16' fill='#fff'/><rect y='6' width='22' height='4' fill='#fff'/><rect x='10' width='2' height='16' fill='#c8102e'/><rect y='7' width='22' height='2' fill='#c8102e'/></svg>",
    de: "<svg viewBox='0 0 22 16' aria-hidden='true'><rect width='22' height='16' fill='#000'/><rect y='5.33' width='22' height='5.34' fill='#dd0000'/><rect y='10.67' width='22' height='5.33' fill='#ffce00'/></svg>",
    fr: "<svg viewBox='0 0 22 16' aria-hidden='true'><rect width='7.33' height='16' fill='#0055a4'/><rect x='7.33' width='7.34' height='16' fill='#fff'/><rect x='14.67' width='7.33' height='16' fill='#ef4135'/></svg>",
    es: "<svg viewBox='0 0 22 16' aria-hidden='true'><rect width='22' height='16' fill='#aa151b'/><rect y='4' width='22' height='8' fill='#f1bf00'/></svg>"
  };
  var LANGUAGES = [
    { code: "no", label: "Norsk" },
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" }
  ];

  /* Ta vare på originalteksten slik at standardspråket alltid kan gjenopprettes nøyaktig. */
  var originals = [];
  document.querySelectorAll("[data-i18n]").forEach(function (element) {
    originals.push({ element: element, html: element.innerHTML });
  });

  var attributeOriginals = [];
  document.querySelectorAll("[data-i18n-attr]").forEach(function (element) {
    element.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
      var parts = pair.split(":");
      if (parts.length !== 2) {
        return;
      }
      var attribute = parts[0].trim();
      attributeOriginals.push({
        element: element,
        attribute: attribute,
        key: parts[1].trim(),
        value: element.getAttribute(attribute)
      });
    });
  });

  var originalTitle = document.title;
  var descriptionMeta = document.querySelector('meta[name="description"]');
  var originalDescription = descriptionMeta ? descriptionMeta.getAttribute("content") : null;
  var originalLang = document.documentElement.lang;
  var switches = [];

  function isAvailable(code) {
    return code === config.defaultLanguage || Boolean(config.strings[code]);
  }

  function labelFor(code) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].code === code) {
        return LANGUAGES[i].label;
      }
    }
    return code;
  }

  function readStored() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function store(code) {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      /* Lagring kan være blokkert; språket gjelder da bare denne siden. */
    }
  }

  function fromQuery() {
    var match = window.location.search.match(/[?&]lang=([a-z]{2})/i);
    return match ? match[1].toLowerCase() : null;
  }

  function choose() {
    var fromUrl = fromQuery();
    if (fromUrl && isAvailable(fromUrl)) {
      store(fromUrl);
      return fromUrl;
    }
    var stored = readStored();
    if (stored && isAvailable(stored)) {
      return stored;
    }
    return config.defaultLanguage;
  }

  function apply(code) {
    var strings = code === config.defaultLanguage ? null : config.strings[code];

    originals.forEach(function (item) {
      var key = item.element.getAttribute("data-i18n");
      if (strings && strings[key] != null) {
        if (item.element.hasAttribute("data-i18n-html")) {
          item.element.innerHTML = strings[key];
        } else {
          item.element.textContent = strings[key];
        }
      } else {
        item.element.innerHTML = item.html;
      }
    });

    attributeOriginals.forEach(function (item) {
      var value = strings && strings[item.key] != null ? strings[item.key] : item.value;
      item.element.setAttribute(item.attribute, value);
    });

    document.title = strings && strings["meta.title"] ? strings["meta.title"] : originalTitle;
    if (descriptionMeta) {
      descriptionMeta.setAttribute(
        "content",
        strings && strings["meta.description"] ? strings["meta.description"] : originalDescription
      );
    }
    document.documentElement.lang = code === config.defaultLanguage ? originalLang : code;

    switches.forEach(function (item) {
      item.flag.innerHTML = FLAGS[code] || "";
      item.label.textContent = labelFor(code);
      item.options.forEach(function (option) {
        option.setAttribute("aria-selected", option.getAttribute("data-lang") === code ? "true" : "false");
      });
    });
  }

  function closeAll(except) {
    switches.forEach(function (item) {
      if (item !== except) {
        item.list.hidden = true;
        item.button.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll("[data-lang-switch]").forEach(function (holder) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "lang-current";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Språk / Language");

    var flag = document.createElement("span");
    flag.className = "lang-flag";
    var label = document.createElement("span");
    label.className = "lang-label";
    var chevron = document.createElement("span");
    chevron.className = "lang-chevron";
    chevron.setAttribute("aria-hidden", "true");
    button.appendChild(flag);
    button.appendChild(label);
    button.appendChild(chevron);

    var list = document.createElement("ul");
    list.className = "lang-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;

    var options = [];
    LANGUAGES.forEach(function (language) {
      if (!isAvailable(language.code)) {
        return;
      }
      var item = document.createElement("li");
      var option = document.createElement("button");
      option.type = "button";
      option.className = "lang-option";
      option.setAttribute("role", "option");
      option.setAttribute("data-lang", language.code);
      option.innerHTML = '<span class="lang-flag">' + FLAGS[language.code] + "</span><span>" + language.label + "</span>";
      option.addEventListener("click", function () {
        store(language.code);
        apply(language.code);
        closeAll();
        button.focus();
      });
      item.appendChild(option);
      list.appendChild(item);
      options.push(option);
    });

    var entry = { holder: holder, button: button, flag: flag, label: label, list: list, options: options };
    switches.push(entry);

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = list.hidden;
      closeAll(entry);
      list.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && options.length) {
        var selected = options.filter(function (option) {
          return option.getAttribute("aria-selected") === "true";
        })[0];
        (selected || options[0]).focus();
      }
    });

    holder.appendChild(button);
    holder.appendChild(list);
  });

  document.addEventListener("click", function (event) {
    var inside = false;
    switches.forEach(function (item) {
      if (item.holder.contains(event.target)) {
        inside = true;
      }
    });
    if (!inside) {
      closeAll();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAll();
    }
  });

  apply(choose());
})();
