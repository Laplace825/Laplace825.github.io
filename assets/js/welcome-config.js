// Welcome page social links configuration generated from Hugo config
window.welcomeSocialConfig = {
  {{ range $key, $value := .Site.Params.socials }}
  {{ $parts := split $value " || " }}
  {{ if eq (len $parts) 3 }}
  "{{ $key }}": {
    name: {{ index $parts 0 | jsonify }},
    url: {{ if eq (index $parts 0) "E-Mail" }}{{ printf "mailto:%s" (index $parts 1) | jsonify }}{{ else }}{{ index $parts 1 | jsonify }}{{ end }},
    icon: {{ index $parts 2 | jsonify }}
  },
  {{ end }}
  {{ end }}
};

// Welcome page configuration from Hugo config
window.welcomePageConfig = {
  enable: {{ .Site.Params.welcome.enable | default false }},
  title: {{ if .Site.Params.welcome.title }}"{{ .Site.Params.welcome.title }}"{{ else }}"{{ .Site.Title }}"{{ end }},
  subtitle: "{{ .Site.Params.welcome.subtitle | default "欢迎来到我的博客世界 🌟" }}",
  autoHide: {{ .Site.Params.welcome.autoHide | default false }},
  showOnEveryVisit: {{ .Site.Params.welcome.showOnEveryVisit | default true }},
  showSocialLinks: {{ .Site.Params.welcome.showSocialLinks | default true }},
  avatarUrl: "{{ .Site.Params.avatar.url | default "/imgs/AnnaYanami.png" }}"
};
