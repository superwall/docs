import Script from 'next/script';

interface GlobalScriptsProps {
  location: 'head' | 'body-start' | 'body-end';
}

const toJsStringLiteral = (value?: string) => (value ? JSON.stringify(value) : 'undefined');

export function GlobalScripts({ location }: GlobalScriptsProps) {
  if (location !== 'head') {
    return null;
  }

  const meshSdkKey = process.env.NEXT_PUBLIC_MESH_SDK_KEY;
  const unifyScriptSrc = process.env.NEXT_PUBLIC_UNIFY_SCRIPT_SRC;
  const unifyApiKey = process.env.NEXT_PUBLIC_UNIFY_API_KEY;
  const rb2bKey = process.env.NEXT_PUBLIC_RB2B_KEY;
  const pylonAppId = process.env.NEXT_PUBLIC_PYLON_APP_ID;

  const scriptContent = `
          (async function () {

            try {
              var response = await fetch('/api/auth/session', { credentials: 'include' });
              var isLoggedIn = true;
              var sessionData = null;
              if (response && response.ok) {
                try {
                  var session = await response.json();
                  isLoggedIn = !!(session && session.isLoggedIn);
                  sessionData = session;
                } catch (_e) {
                  console.error('Failed to authenticate user' + _e);
                  return;
                }
              }
              else {
                console.error('Failed to authenticate user');
                return;
              }
              
              if (isLoggedIn) {
                // Load Pylon widget for logged-in users
                var pylonAppId = ${toJsStringLiteral(pylonAppId)};
                if (pylonAppId && sessionData.userInfo.email) {
                  // Load Pylon widget script
                  (function(){
                    var e=window;
                    var t=document;
                    var n=function(){n.e(arguments)};
                    n.q=[];
                    n.e=function(e){n.q.push(e)};
                    e.Pylon=n;
                    var r=function(){
                      var e=t.createElement("script");
                      e.setAttribute("type","text/javascript");
                      e.setAttribute("async","true");
                      e.setAttribute("src","https://widget.usepylon.com/widget/" + pylonAppId);
                      var n=t.getElementsByTagName("script")[0];
                      n.parentNode.insertBefore(e,n);
                    };
                    if(t.readyState==="complete"){r()}
                    else if(e.addEventListener){e.addEventListener("load",r,false)}
                  })();

                  // Configure Pylon with user data from session
                  var userEmail = sessionData.userInfo.email;
                  var userName = sessionData.userInfo.name;
                  window.pylon = {
                    chat_settings: {
                      app_id: pylonAppId,
                      email: sessionData.userInfo.email,
                      name: sessionData.userInfo.name,
                      email_hash: sessionData.emailHash,
                    }
                  };
                }
              } else {
                var meshSdkKey = ${toJsStringLiteral(meshSdkKey)};
                if (meshSdkKey) {
                  // Avina
                  (function (m, e, s, h, a, i, c) {
                    m[a] = m[a] || function () {
                      (m[a].q = m[a].q || []).push(arguments);
                    };
                    var o = e.createElement(s);
                    o.type = 'text/javascript';
                    o.id = 'mesh-analytics-sdk';
                    o.async = true;
                    o.src = h;
                    o.setAttribute('data-mesh-sdk', i);
                    o.setAttribute('data-mesh-sdk-attributes', JSON.stringify(c));
                    var x = e.getElementsByTagName(s)[0];
                    x.parentNode.insertBefore(o, x);
                  })(window, document, 'script',
                    'https://cdn.jsdelivr.net/npm/@mesh-interactive/mesh-sdk@latest/dist/umd/index.js', 'mesh',
                    meshSdkKey,
                    { useFingerprint: false, track: { session: true, forms: true } });
                }

                var unifyScriptSrc = ${toJsStringLiteral(unifyScriptSrc)};
                var unifyApiKey = ${toJsStringLiteral(unifyApiKey)};
                if (unifyScriptSrc && unifyApiKey) {
                  // Unify
                  (function () {
                    var methods = ["identify", "page", "startAutoPage", "stopAutoPage", "startAutoIdentify", "stopAutoIdentify"];
                    function factory(queue) {
                      return Object.assign([], methods.reduce(function (acc, name) {
                        acc[name] = function () { return queue.push([name, [].slice.call(arguments)]), queue; };
                        return acc;
                      }, {}));
                    }
                    window.unify || (window.unify = factory(window.unify));
                    window.unifyBrowser || (window.unifyBrowser = factory(window.unifyBrowser));
                    var script = document.createElement('script');
                    script.async = true;
                    script.setAttribute('src', unifyScriptSrc);
                    script.setAttribute('data-api-key', unifyApiKey);
                    script.setAttribute('id', 'unifytag');
                    (document.body || document.head).appendChild(script);
                  })();
                }

                var rb2bKey = ${toJsStringLiteral(rb2bKey)};
                if (rb2bKey) {
                  // RB2B
                  (function(key) {
                    if (window.reb2b) return;
                    window.reb2b = { loaded: true };
                    var s = document.createElement("script");
                    s.async = true;
                    s.src = "https://b2bjsstore.s3.us-west-2.amazonaws.com/b/" + key + "/" + key + ".js.gz";
                    document.getElementsByTagName("script")[0].parentNode.insertBefore(s, document.getElementsByTagName("script")[0]);
                  })(rb2bKey);
                }

                // CR-Relay
                (function() {
                  if (typeof window === 'undefined') return;
                  if (typeof window.signals !== 'undefined') return;
                  var script = document.createElement('script');
                  script.src = 'https://cdn.cr-relay.com/v1/site/4917ccd3-ed29-4d67-aac8-31ff4766d046/signals.js';
                  script.async = true;
                  window.signals = Object.assign(
                    [],
                    ['page', 'identify', 'form'].reduce(function (acc, method){
                      acc[method] = function () {
                        signals.push([method, arguments]);
                        return signals;
                      };
                     return acc;
                    }, {})
                  );
                  document.head.appendChild(script);
                })();

              }
            } catch (_err) {
              // On error, assume logged in (do nothing)
            }
          })();
        `;

  return (
    <Script id="auth-tracking-scripts" strategy="afterInteractive">
      {scriptContent}
    </Script>
  );
}
